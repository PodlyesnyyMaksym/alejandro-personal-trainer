import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createDatabasePool, databaseConfig, reportDatabaseFailure } from "./migrate.mjs";

// Reserved deployment probe only. Never delete by phone/name alone or touch real leads.
export async function cleanupContactProbe(pool) {
  try {
    const result = await pool.query(
      `delete from public.contacts
       where client_submission_id=$1 and name=$2 and phone=$3`,
      ["00000000-0000-4000-8000-000000000002", "PRUEBA DE DEPLOY - NO ES UN CLIENTE", "0000000000"],
    );
    console.log(`Synthetic deployment contact cleanup: ${result.rowCount} row(s).`);
    return result.rowCount;
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await cleanupContactProbe(createDatabasePool(databaseConfig()));
  } catch (error) {
    reportDatabaseFailure(error);
    process.exitCode = 1;
  }
}
