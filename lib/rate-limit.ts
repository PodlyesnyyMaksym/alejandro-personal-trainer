import "server-only";

import { createHmac } from "node:crypto";

import { queryDatabase } from "@/lib/database";

const MAX_REQUESTS = 30;

type RateLimitRow = {
  request_count: number;
};

function createBucket(identifier: string) {
  const secret = process.env.RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("RATE_LIMIT_SECRET must contain at least 32 characters.");
  }

  const minute = Math.floor(Date.now() / 60_000);
  return createHmac("sha256", secret).update(`${identifier}:${minute}`).digest("hex");
}

export async function isRateLimited(identifier: string) {
  const result = await queryDatabase<RateLimitRow>(
    `
      with cleanup as (
        delete from public.analytics_rate_limits
        where window_started_at < now() - interval '1 day'
      ), incremented as (
        insert into public.analytics_rate_limits (bucket, window_started_at, request_count)
        values ($1, date_trunc('minute', now()), 1)
        on conflict (bucket) do update
          set request_count = public.analytics_rate_limits.request_count + 1
        returning request_count
      )
      select request_count from incremented
    `,
    [createBucket(identifier)],
  );

  return (result.rows[0]?.request_count ?? MAX_REQUESTS + 1) > MAX_REQUESTS;
}
