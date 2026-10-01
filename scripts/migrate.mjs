import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

const migrationsDirectory = fileURLToPath(new URL("../migrations/", import.meta.url));
const migrationLock = 91723411;

export function databaseConfig(env = process.env) {
  if (!env.DATABASE_URL && !env.PGHOST) throw new Error("DATABASE_NOT_CONFIGURED");
  return {
    ...(env.DATABASE_URL ? { connectionString: env.DATABASE_URL } : {}),
    max: 1,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
    query_timeout: 35_000,
    statement_timeout: 30_000,
    lock_timeout: 5_000,
    allowExitOnIdle: true,
  };
}

export async function loadMigrations(directory = migrationsDirectory) {
  const names = (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort();
  if (!names.length) throw new Error("MIGRATIONS_EMPTY");
  return Promise.all(
    names.map(async (name) => {
      if (!/^\d{3}_[a-z0-9_]+\.sql$/.test(name)) throw new Error("MIGRATION_NAME_INVALID");
      const sql = await readFile(resolve(directory, name), "utf8");
      return { name, sql, checksum: createHash("sha256").update(sql).digest("hex") };
    }),
  );
}

// Applied migrations must be an unchanged prefix, never a subset with holes.
export function validateLedger(migrations, rows) {
  const names = new Set();
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (names.has(row.name)) throw new Error("LEDGER_DUPLICATE");
    names.add(row.name);
    const file = migrations.find((migration) => migration.name === row.name);
    if (!file) throw new Error("LEDGER_FILE_MISSING");
    if (file.checksum !== row.checksum) throw new Error("LEDGER_CHECKSUM_MISMATCH");
    if (migrations[index]?.name !== row.name) throw new Error("LEDGER_OUT_OF_ORDER");
  }
  return migrations.slice(rows.length);
}

export async function readLedger(client) {
  return (
    await client.query("select name, checksum from public.app_migrations order by applied_at, name")
  ).rows;
}

export function createDatabasePool(config) {
  const pool = new pg.Pool(config);
  pool.on("error", () => console.error("PostgreSQL idle connection failed."));
  return pool;
}

export async function runMigrations(pool, migrations) {
  let client;
  let locked = false;
  try {
    client = await pool.connect();
    // statement_timeout also bounds the complete advisory-lock statement.
    await client.query("select pg_advisory_lock($1)", [migrationLock]);
    locked = true;
    await client.query(`
      create table if not exists public.app_migrations (
        name text primary key,
        checksum text not null,
        applied_at timestamptz not null default now()
      )
    `);
    const pending = validateLedger(migrations, await readLedger(client));
    for (const migration of pending) {
      await client.query("begin");
      try {
        await client.query(migration.sql);
        await client.query("insert into public.app_migrations (name, checksum) values ($1, $2)", [
          migration.name,
          migration.checksum,
        ]);
        await client.query("commit");
        console.log(`Applied migration: ${migration.name}`);
      } catch (error) {
        await client.query("rollback").catch(() => undefined);
        throw error;
      }
    }
    console.log(`Migration ledger OK; applied=${migrations.length}; pending=0.`);
  } finally {
    if (client) {
      try {
        if (locked) {
          await client
            .query("select pg_advisory_unlock($1)", [migrationLock])
            .catch(() => undefined);
        }
      } finally {
        // Destroy even after timeout/failed rollback: never reuse uncertain session state.
        client.release(true);
      }
    }
    await pool.end();
  }
}

export function reportDatabaseFailure(error) {
  const allowed = new Set([
    "DATABASE_NOT_CONFIGURED",
    "MIGRATIONS_EMPTY",
    "MIGRATION_NAME_INVALID",
    "LEDGER_DUPLICATE",
    "LEDGER_FILE_MISSING",
    "LEDGER_CHECKSUM_MISMATCH",
    "LEDGER_OUT_OF_ORDER",
  ]);
  console.error(allowed.has(error?.message) ? error.message : "DATABASE_OPERATION_FAILED");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const migrations = await loadMigrations();
    await runMigrations(createDatabasePool(databaseConfig()), migrations);
  } catch (error) {
    reportDatabaseFailure(error);
    process.exitCode = 1;
  }
}
