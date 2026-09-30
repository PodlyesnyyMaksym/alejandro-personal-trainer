import "server-only";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const entries = new Map<string, RateLimitEntry>();

export function isRateLimited(identifier: string) {
  const now = Date.now();
  const entry = entries.get(identifier);

  if (!entry || entry.resetAt <= now) {
    entries.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}
