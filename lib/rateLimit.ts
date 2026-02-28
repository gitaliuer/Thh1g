const buckets = new Map<string, number[]>();

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 10;

export function checkRateLimit(key: string): { ok: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const records = buckets.get(key) ?? [];
  const active = records.filter((ts) => now - ts < WINDOW_MS);

  if (active.length >= LIMIT) {
    const retryAfterSec = Math.ceil((WINDOW_MS - (now - active[0])) / 1000);
    buckets.set(key, active);
    return { ok: false, retryAfterSec };
  }

  active.push(now);
  buckets.set(key, active);
  return { ok: true };
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    "local-dev"
  );
}
