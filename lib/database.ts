import "server-only";

import { Pool, type PoolConfig, type QueryResultRow } from "pg";

import type { AnalyticsEvent } from "@/types/analytics";

const globalForDatabase = globalThis as typeof globalThis & {
  databasePool?: Pool;
};

function createPool() {
  if (!process.env.DATABASE_URL && !process.env.PGHOST) {
    throw new Error("PostgreSQL is not configured.");
  }

  const config: PoolConfig = {
    ...(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {}),
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  };

  return new Pool(config);
}

function getPool() {
  globalForDatabase.databasePool ??= createPool();
  return globalForDatabase.databasePool;
}

export function queryDatabase<Row extends QueryResultRow>(text: string, values: unknown[] = []) {
  return getPool().query<Row>(text, values);
}

export async function insertEvent(event: AnalyticsEvent) {
  await queryDatabase(
    `
      insert into public.events (
        client_event_id,
        event_type,
        source,
        session_id,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        landing_path
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      on conflict (client_event_id) do nothing
    `,
    [
      event.clientEventId,
      event.eventType,
      event.source,
      event.sessionId,
      event.utm.source,
      event.utm.medium,
      event.utm.campaign,
      event.utm.content,
      event.utm.term,
      event.landingPath,
    ],
  );
}
