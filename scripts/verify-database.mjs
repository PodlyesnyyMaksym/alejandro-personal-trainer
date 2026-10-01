import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createDatabasePool,
  databaseConfig,
  loadMigrations,
  readLedger,
  reportDatabaseFailure,
  validateLedger,
} from "./migrate.mjs";

// Expected contract of 001, 002 and the runner ledger. No application rows are read.
const column = (name, type, required = true, defaultExpression = null) => ({
  name,
  type,
  required,
  defaultExpression,
});
export const expectedSchema = {
  events: {
    columns: [
      column("id", "uuid", true, "gen_random_uuid()"),
      column("client_event_id", "uuid"),
      column("event_type", "text"),
      column("source", "text"),
      column("session_id", "uuid"),
      ...["source", "medium", "campaign", "content", "term"].map((name) =>
        column(`utm_${name}`, "text", false),
      ),
      column("landing_path", "text"),
      column("created_at", "timestamp with time zone", true, "now()"),
    ],
    constraints: [
      { kind: "p", columns: ["id"] },
      { kind: "u", columns: ["client_event_id"] },
      { kind: "c", expression: "(event_type = ANY (ARRAY['page_view', 'whatsapp_click']))" },
      {
        kind: "c",
        expression:
          "(((event_type = 'page_view') AND (source = 'landing')) OR ((event_type = 'whatsapp_click') AND (source = ANY (ARRAY['hero_primary', 'hero_secondary', 'floating_whatsapp', 'final_cta']))))",
      },
    ],
    indexes: [
      { columns: ["id"], unique: true, primary: true },
      { columns: ["client_event_id"], unique: true, primary: false },
      ...[
        ["created_at"],
        ["session_id"],
        ["event_type", "created_at"],
        ["utm_source", "created_at"],
      ].map((columns) => ({ columns, unique: false, primary: false })),
    ],
  },
  analytics_rate_limits: {
    columns: [
      column("bucket", "text"),
      column("window_started_at", "timestamp with time zone"),
      column("request_count", "integer"),
    ],
    constraints: [
      { kind: "p", columns: ["bucket"] },
      { kind: "c", expression: "(request_count > 0)" },
    ],
    indexes: [
      { columns: ["bucket"], unique: true, primary: true },
      { columns: ["window_started_at"], unique: false, primary: false },
    ],
  },
  contacts: {
    columns: [
      column("client_submission_id", "uuid"),
      column("name", "text"),
      column("phone", "text"),
      column("consent_notice_version", "text"),
      column("consent_at", "timestamp with time zone", true, "now()"),
      column("created_at", "timestamp with time zone", true, "now()"),
    ],
    constraints: [
      { kind: "p", columns: ["client_submission_id"] },
      {
        kind: "c",
        expression:
          "((char_length(name) >= 1) AND (char_length(name) <= 100) AND (name = btrim(name)) AND (name !~ '[[:cntrl:]]') AND (name !~ '[\u007f-\u009f]'))",
      },
      { kind: "c", expression: "(phone ~ '^\\+?[0-9]{10,15}$')" },
      { kind: "c", expression: "(consent_notice_version = 'contact-v1')" },
    ],
    indexes: [{ columns: ["client_submission_id"], unique: true, primary: true }],
  },
  app_migrations: {
    columns: [
      column("name", "text"),
      column("checksum", "text"),
      column("applied_at", "timestamp with time zone", true, "now()"),
    ],
    constraints: [{ kind: "p", columns: ["name"] }],
    indexes: [{ columns: ["name"], unique: true, primary: true }],
  },
};

// Normalize only catalog formatting of this closed expression set; preserve literals.
export function normalizeExpression(expression) {
  if (expression == null) return null;
  return expression.replace(/'(?:[^']|'')*'|::text(?:\[\])?|pg_catalog\.|\s+/g, (match) =>
    match.startsWith("'") ? match : "",
  );
}

export const catalogQueries = {
  columns: `
    select c.relname as table_name, c.relkind, c.relpersistence,
           a.attname as name, pg_catalog.format_type(a.atttypid, a.atttypmod) as type,
            a.attnotnull as required, a.attidentity, a.attgenerated,
            exists(select 1 from aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) acl
                   where acl.grantee=0) as public_has_privileges,
           pg_catalog.pg_get_expr(d.adbin, d.adrelid) as default_expression
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    join pg_catalog.pg_attribute a on a.attrelid = c.oid
    left join pg_catalog.pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
    where n.nspname = 'public' and c.relname = ANY($1::text[])
      and a.attnum > 0 and not a.attisdropped
    order by c.relname, a.attnum
  `,
  constraints: `
    select c.relname as table_name, con.contype as kind, con.convalidated as validated,
           con.condeferrable as deferrable, con.condeferred as deferred,
           pg_catalog.pg_get_expr(con.conbin, con.conrelid) as expression,
            array(select a.attname::text from unnest(con.conkey) with ordinality k(num, position)
                 join pg_catalog.pg_attribute a on a.attrelid = c.oid and a.attnum = k.num
                 order by k.position) as columns
    from pg_catalog.pg_constraint con
    join pg_catalog.pg_class c on c.oid = con.conrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = ANY($1::text[])
      and con.contype <> 'n'
  `,
  indexes: `
    select c.relname as table_name, i.indisunique as unique, i.indisprimary as primary,
           i.indisvalid as valid, i.indisready as ready, i.indislive as live,
           am.amname as method, i.indpred is null as unfiltered,
           i.indexprs is null as plain, i.indnatts = i.indnkeyatts as no_include,
            array(select a.attname::text from unnest(i.indkey) with ordinality k(num, position)
                 join pg_catalog.pg_attribute a on a.attrelid = c.oid and a.attnum = k.num
                 order by k.position) as columns,
           not exists (
             select 1 from unnest(i.indkey::smallint[], i.indclass::oid[],
                                 i.indcollation::oid[], i.indoption::smallint[])
               as k(num, opclass, coll_oid, options)
             left join pg_catalog.pg_attribute a on a.attrelid = c.oid and a.attnum = k.num
             left join pg_catalog.pg_opclass op on op.oid = k.opclass
             where a.attnum is null or op.oid is null or not op.opcdefault
               or op.opcintype <> a.atttypid or k.coll_oid <> a.attcollation or k.options <> 0
           ) as standard_keys
    from pg_catalog.pg_index i
    join pg_catalog.pg_class c on c.oid = i.indrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    join pg_catalog.pg_class idx on idx.oid = i.indexrelid
    join pg_catalog.pg_am am on am.oid = idx.relam
    where n.nspname = 'public' and c.relname = ANY($1::text[])
  `,
};

const sameColumns = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected);

export function validateSchema(catalog) {
  const issues = [];
  for (const [table, expected] of Object.entries(expectedSchema)) {
    const columns = catalog.columns.filter((row) => row.table_name === table);
    if (columns.length !== expected.columns.length) issues.push(`${table}:columns`);
    for (const field of expected.columns) {
      const actual = columns.find((row) => row.name === field.name);
      if (
        !actual ||
        actual.relkind !== "r" ||
        actual.relpersistence !== "p" ||
        actual.type !== field.type ||
        actual.required !== field.required ||
        actual.attidentity !== "" ||
        actual.attgenerated !== "" ||
        (table === "contacts" && actual.public_has_privileges !== false) ||
        normalizeExpression(actual.default_expression) !==
          normalizeExpression(field.defaultExpression)
      ) {
        issues.push(`${table}:column:${field.name}`);
      }
    }
    const constraints = catalog.constraints.filter((row) => row.table_name === table);
    if (constraints.length !== expected.constraints.length) issues.push(`${table}:constraints`);
    for (const constraint of expected.constraints) {
      if (
        !constraints.some(
          (row) =>
            row.kind === constraint.kind &&
            row.validated &&
            !row.deferrable &&
            !row.deferred &&
            (constraint.kind === "c"
              ? normalizeExpression(row.expression) === normalizeExpression(constraint.expression)
              : sameColumns(row.columns, constraint.columns)),
        )
      ) {
        issues.push(`${table}:constraint:${constraint.kind}`);
      }
    }
    const indexes = catalog.indexes.filter((row) => row.table_name === table);
    for (const index of expected.indexes) {
      if (
        !indexes.some(
          (row) =>
            sameColumns(row.columns, index.columns) &&
            row.unique === index.unique &&
            row.primary === index.primary &&
            row.valid &&
            row.ready &&
            row.live &&
            row.method === "btree" &&
            row.unfiltered &&
            row.plain &&
            row.no_include &&
            row.standard_keys,
        )
      ) {
        issues.push(`${table}:index:${index.columns.join(",")}`);
      }
    }
  }
  return issues;
}

export async function verifyDatabase(pool, migrations) {
  let client;
  try {
    client = await pool.connect();
    await client.query("begin isolation level repeatable read read only");
    const catalog = {};
    for (const [name, query] of Object.entries(catalogQueries)) {
      catalog[name] = (await client.query(query, [Object.keys(expectedSchema)])).rows;
    }
    const issues = validateSchema(catalog);
    // Missing or malformed ledger is a schema failure; do not query it in that case.
    if (issues.some((issue) => issue.startsWith("app_migrations:"))) {
      return { issues, pending: null };
    }
    const pending = validateLedger(migrations, await readLedger(client)).length;
    return { issues, pending };
  } finally {
    if (client) {
      try {
        await client.query("rollback").catch(() => undefined);
      } finally {
        client.release(true);
      }
    }
    await pool.end();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const migrations = await loadMigrations();
    const result = await verifyDatabase(createDatabasePool(databaseConfig()), migrations);
    console.log(`Schema: ${result.issues.length ? "MISMATCH" : "OK"}.`);
    for (const issue of result.issues) console.log(`Mismatch: ${issue}`);
    console.log(`Migration ledger: pending=${result.pending ?? "unknown"}.`);
    if (result.issues.length || result.pending !== 0) process.exitCode = 1;
  } catch (error) {
    reportDatabaseFailure(error);
    process.exitCode = 1;
  }
}
