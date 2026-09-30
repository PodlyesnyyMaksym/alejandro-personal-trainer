import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import pg from "pg";

const { Pool } = pg;
const migrationsDirectory = fileURLToPath(new URL("../migrations/", import.meta.url));

if (!process.env.DATABASE_URL && !process.env.PGHOST) {
  throw new Error("PostgreSQL is not configured. Use the Deno Deploy tunnel or DATABASE_URL.");
}

const pool = new Pool({
  ...(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {}),
  max: 1,
});

const client = await pool.connect();

try {
  await client.query("select pg_advisory_lock($1)", [91723411]);
  await client.query(`
    create table if not exists public.app_migrations (
      name text primary key,
      checksum text not null,
      applied_at timestamptz not null default now()
    )
  `);

  const files = (await readdir(migrationsDirectory)).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    const sql = await readFile(`${migrationsDirectory}/${file}`, "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const existing = await client.query(
      "select checksum from public.app_migrations where name = $1",
      [file],
    );

    if (existing.rowCount) {
      if (existing.rows[0].checksum !== checksum) {
        throw new Error(`Migration ${file} changed after it was applied.`);
      }
      continue;
    }

    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into public.app_migrations (name, checksum) values ($1, $2)", [
        file,
        checksum,
      ]);
      await client.query("commit");
      console.log(`Applied migration: ${file}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
} finally {
  await client.query("select pg_advisory_unlock($1)", [91723411]).catch(() => undefined);
  client.release();
  await pool.end();
}
