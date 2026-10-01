import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

import ts from "typescript";

import {
  databaseConfig,
  loadMigrations,
  reportDatabaseFailure,
  runMigrations,
  validateLedger,
} from "../scripts/migrate.mjs";
import {
  catalogQueries,
  expectedSchema,
  normalizeExpression,
  validateSchema,
  verifyDatabase,
} from "../scripts/verify-database.mjs";

const migrations = [
  { name: "001_first.sql", checksum: "a", sql: "FIRST" },
  { name: "002_second.sql", checksum: "b", sql: "SECOND" },
];

test("ledger accepts only unchanged chronological prefixes", () => {
  assert.deepEqual(validateLedger(migrations, []), migrations);
  assert.deepEqual(validateLedger(migrations, [migrations[0]]), [migrations[1]]);
  assert.deepEqual(validateLedger(migrations, migrations), []);
  for (const [rows, error] of [
    [[{ name: "000_deleted.sql", checksum: "x" }], /LEDGER_FILE_MISSING/],
    [[{ ...migrations[0], checksum: "changed" }], /LEDGER_CHECKSUM_MISMATCH/],
    [[migrations[1]], /LEDGER_OUT_OF_ORDER/],
    [[migrations[1], migrations[0]], /LEDGER_OUT_OF_ORDER/],
    [[migrations[0], migrations[0]], /LEDGER_DUPLICATE/],
  ]) {
    assert.throws(() => validateLedger(migrations, rows), error);
  }
  const insertedBefore = [{ name: "000_inserted.sql", checksum: "x" }, ...migrations];
  assert.throws(() => validateLedger(insertedBefore, migrations), /LEDGER_OUT_OF_ORDER/);
});

test("configuration bounds each wait independently without overriding provider TLS", () => {
  assert.throws(() => databaseConfig({}), /DATABASE_NOT_CONFIGURED/);
  const config = databaseConfig({ PGHOST: "provider" });
  assert.equal("ssl" in config, false);
  assert.equal("connectionString" in config, false);
  assert.ok(config.lock_timeout < config.statement_timeout);
  assert.ok(config.statement_timeout < config.query_timeout);
  assert.equal(config.connectionTimeoutMillis, 5000);
});

test("existing migration can be loaded offline", async () => {
  const files = await loadMigrations();
  assert.equal(files[0].name, "001_create_events.sql");
  assert.match(files[0].checksum, /^[a-f0-9]{64}$/);
  assert.equal(files[1].name, "002_create_contacts.sql");
  assert.match(files[1].checksum, /^[a-f0-9]{64}$/);
});

test("runtime pool installs a sanitized listener and independent timeouts", async () => {
  const source = await readFile(new URL("../lib/database.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  let config;
  let listener;
  const logs = [];
  const exports = {};
  class Pool {
    constructor(options) {
      config = options;
    }
    on(event, callback) {
      assert.equal(event, "error");
      listener = callback;
    }
    query(text, values) {
      return { text, values };
    }
  }
  runInNewContext(outputText, {
    exports,
    require(name) {
      if (name === "server-only") return {};
      if (name === "pg") return { Pool };
      throw new Error("Unexpected import");
    },
    process: { env: { PGHOST: "mock-provider" } },
    console: { error: (message) => logs.push(message) },
  });
  exports.queryDatabase("select 1");
  assert.equal(config.connectionTimeoutMillis, 5000);
  assert.equal(config.query_timeout, 8000);
  assert.equal(config.statement_timeout, 5000);
  assert.equal(config.lock_timeout, 1000);
  assert.equal("ssl" in config, false);
  listener(new Error("secret credentials and payload"));
  assert.deepEqual(logs, ["PostgreSQL idle connection failed."]);
});

function fixture() {
  const catalog = { columns: [], constraints: [], indexes: [] };
  for (const [table_name, schema] of Object.entries(expectedSchema)) {
    for (const field of schema.columns) {
      catalog.columns.push({
        ...field,
        table_name,
        relkind: "r",
        relpersistence: "p",
        attidentity: "",
        attgenerated: "",
        public_has_privileges: false,
        default_expression: field.defaultExpression,
      });
    }
    for (const constraint of schema.constraints) {
      catalog.constraints.push({
        ...constraint,
        table_name,
        validated: true,
        deferrable: false,
        deferred: false,
      });
    }
    for (const index of schema.indexes) {
      catalog.indexes.push({
        ...index,
        table_name,
        valid: true,
        ready: true,
        live: true,
        method: "btree",
        unfiltered: true,
        plain: true,
        no_include: true,
        standard_keys: true,
      });
    }
  }
  return catalog;
}

test("schema detects structural drift independently of object names", () => {
  assert.deepEqual(validateSchema(fixture()), []);
  const mutations = [
    (c) => (c.columns[0].type = "text"),
    (c) => (c.columns[0].required = false),
    (c) => (c.columns[0].default_expression = "another_uuid()"),
    (c) => (c.columns[0].relkind = "v"),
    (c) => c.columns.pop(),
    (c) => (c.constraints[0].columns = ["session_id"]),
    (c) => (c.constraints[0].deferrable = true),
    (c) => (c.constraints[2].validated = false),
    (c) => (c.constraints[2].expression = "true"),
    (c) => (c.indexes[0].valid = false),
    (c) => (c.indexes[0].unique = false),
    (c) => (c.indexes[0].unfiltered = false),
    (c) => (c.indexes[0].standard_keys = false),
    (c) => (c.indexes[4].columns = ["created_at", "event_type"]),
  ];
  for (const mutate of mutations) {
    const catalog = fixture();
    mutate(catalog);
    assert.ok(validateSchema(catalog).length > 0);
  }
});

test("normalization preserves boolean grouping and quoted payloads", () => {
  assert.equal(normalizeExpression("(event_type = 'page_view'::text)"), "(event_type='page_view')");
  assert.notEqual(normalizeExpression("(a AND b) OR c"), normalizeExpression("a AND (b OR c)"));
  assert.notEqual(normalizeExpression("'page_view::text'"), normalizeExpression("'page_view'"));
});

test("contacts schema detects missing migration, sensitive extra columns and consent drift", () => {
  for (const mutate of [
    (c) => {
      c.columns = c.columns.filter((row) => row.table_name !== "contacts");
    },
    (c) => c.columns.push({ table_name: "contacts", name: "session_id" }),
    (c) => {
      c.columns.find((row) => row.table_name === "contacts").public_has_privileges = true;
    },
    (c) => {
      c.columns.find(
        (row) => row.table_name === "contacts" && row.name === "consent_at",
      ).default_expression = null;
    },
    (c) => {
      c.constraints.find((row) => row.table_name === "contacts" && row.kind === "p").columns = [
        "phone",
      ];
    },
    (c) => {
      c.constraints.find(
        (row) => row.table_name === "contacts" && row.expression?.includes("contact-v1"),
      ).expression = "(consent_notice_version = 'contact-v2')";
    },
  ]) {
    const catalog = fixture();
    mutate(catalog);
    assert.ok(validateSchema(catalog).some((issue) => issue.startsWith("contacts:")));
  }
});

function mockPool(query, connectError) {
  const calls = [];
  const client = {
    async query(sql, params) {
      calls.push(sql);
      return query(sql, params);
    },
    release(destroy) {
      calls.push(destroy ? "DESTROY" : "RELEASE");
    },
  };
  return {
    calls,
    async connect() {
      if (connectError) throw connectError;
      return client;
    },
    async end() {
      calls.push("END");
    },
  };
}

test("runner closes pool on connect failure", async () => {
  const pool = mockPool(() => ({ rows: [] }), new Error("connect failed"));
  await assert.rejects(runMigrations(pool, migrations), /connect failed/);
  assert.deepEqual(pool.calls, ["END"]);
});

test("runner preserves failure even when rollback and unlock fail", async () => {
  const original = new Error("original failure");
  const pool = mockPool((sql) => {
    if (sql === "FIRST") throw original;
    if (sql === "rollback" || sql.includes("pg_advisory_unlock")) throw new Error("cleanup");
    return { rows: [] };
  });
  await assert.rejects(runMigrations(pool, migrations), (error) => error === original);
  assert.ok(pool.calls.includes("rollback"));
  assert.deepEqual(pool.calls.slice(-2), ["DESTROY", "END"]);
  assert.equal(pool.calls.includes("SECOND"), false);
});

test("runner aborts before migration SQL on ledger drift or lock timeout", async () => {
  for (const lockFailure of [false, true]) {
    const pool = mockPool((sql) => {
      if (sql.includes("pg_advisory_lock") && lockFailure) throw new Error("timeout");
      return { rows: sql.includes("select name, checksum") ? [migrations[1]] : [] };
    });
    await assert.rejects(runMigrations(pool, migrations));
    assert.equal(pool.calls.includes("FIRST"), false);
    assert.deepEqual(pool.calls.slice(-2), ["DESTROY", "END"]);
  }
});

test("verification uses read-only snapshot, catalog metadata and ledger only", async () => {
  const catalog = fixture();
  const pool = mockPool((sql) => {
    const key = Object.keys(catalogQueries).find((key) => catalogQueries[key] === sql);
    return { rows: key ? catalog[key] : sql.includes("select name, checksum") ? migrations : [] };
  });
  assert.deepEqual(await verifyDatabase(pool, migrations), { issues: [], pending: 0 });
  assert.equal(pool.calls[0], "begin isolation level repeatable read read only");
  assert.deepEqual(pool.calls.slice(-3), ["rollback", "DESTROY", "END"]);
  assert.equal(
    pool.calls.some((sql) => /from public\.(events|analytics_rate_limits|contacts)/i.test(sql)),
    false,
  );
});

test("verification expects 002 applied, reports old schema and pending contacts migration", async () => {
  const files = await loadMigrations();
  for (const applied of [false, true]) {
    const catalog = fixture();
    if (!applied) {
      for (const key of Object.keys(catalog)) {
        catalog[key] = catalog[key].filter((row) => row.table_name !== "contacts");
      }
    }
    const pool = mockPool((sql) => {
      const key = Object.keys(catalogQueries).find((key) => catalogQueries[key] === sql);
      return {
        rows: key
          ? catalog[key]
          : sql.includes("select name, checksum")
            ? applied
              ? files
              : files.slice(0, 1)
            : [],
      };
    });
    const result = await verifyDatabase(pool, files);
    assert.equal(result.pending, applied ? 0 : 1);
    assert.equal(result.issues.length === 0, applied);
    if (!applied) assert.ok(result.issues.includes("contacts:columns"));
  }
});

test("verification handles missing ledger and cleans up catalog-query failures", async () => {
  const catalog = fixture();
  catalog.columns = catalog.columns.filter((row) => row.table_name !== "app_migrations");
  const missing = mockPool((sql) => {
    const key = Object.keys(catalogQueries).find((key) => catalogQueries[key] === sql);
    if (sql.includes("select name, checksum")) throw new Error("Must not read missing ledger");
    return { rows: key ? catalog[key] : [] };
  });
  const result = await verifyDatabase(missing, migrations);
  assert.equal(result.pending, null);
  assert.ok(result.issues.includes("app_migrations:columns"));
  assert.deepEqual(missing.calls.slice(-3), ["rollback", "DESTROY", "END"]);

  const failure = new Error("catalog error");
  const broken = mockPool((sql) => {
    if (sql === catalogQueries.columns) throw failure;
    if (sql === "rollback") throw new Error("rollback error");
    return { rows: [] };
  });
  await assert.rejects(verifyDatabase(broken, migrations), (error) => error === failure);
  assert.deepEqual(broken.calls.slice(-3), ["rollback", "DESTROY", "END"]);
});

test("errors never print pg details, credentials or arbitrary ledger names", () => {
  const lines = [];
  const previous = console.error;
  console.error = (message) => lines.push(message);
  try {
    reportDatabaseFailure({ message: "postgres://user:secret@host", detail: "payload" });
    reportDatabaseFailure(new Error("LEDGER_FILE_MISSING"));
  } finally {
    console.error = previous;
  }
  assert.deepEqual(lines, ["DATABASE_OPERATION_FAILED", "LEDGER_FILE_MISSING"]);
});
