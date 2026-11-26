/**
 * Fixed-window rate limiter.
 *
 * This is an in-process limiter: it protects a single server instance and is
 * a speed bump for abuse, not a distributed guarantee. On serverless hosts
 * each instance keeps its own counters, so treat it as defence in depth and
 * keep per-request work cheap (which is why the public music routes avoid it).
 *
 * Entries are swept lazily so the map cannot grow without bound.
 */

type Bucket = { count: number; resetTime: number };

const buckets = new Map<string, Bucket>();

/** Sweep at most this often, rather than on every request. */
const SWEEP_INTERVAL_MS = 60_000;
const MAX_TRACKED_KEYS = 10_000;

let lastSweep = 0;

function sweep(now: number): void {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;

  for (const [key, bucket] of buckets) {
    if (now > bucket.resetTime) buckets.delete(key);
  }

  // Hard cap: if the sweep did not free anything, drop the oldest entries so
  // a flood of unique keys cannot exhaust memory.
  if (buckets.size > MAX_TRACKED_KEYS) {
    const excess = buckets.size - MAX_TRACKED_KEYS;
    let removed = 0;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (++removed >= excess) break;
    }
  }
}

/**
 * Record a request and report whether it is allowed.
 *
 * @param key - Identity to limit (usually an IP or route + IP)
 * @param maxRequests - Requests allowed per window
 * @param windowMs - Window length in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxRequests = 10,
  windowMs = 60_000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetTime) {
    buckets.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: Math.max(0, maxRequests - 1) };
  }

  if (bucket.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: Math.max(0, maxRequests - bucket.count) };
}

/**
 * Best-effort client identity.
 *
 * `x-forwarded-for` is only trusted behind a proxy that overwrites it (Vercel,
 * Cloudflare). We take the left-most entry, which is the client as seen by the
 * first trusted hop, and fall back to a constant for direct local requests.
 */
export function getClientKey(request: Request): string {
  const headers = request.headers;

  const platformIp =
    headers.get("cf-connecting-ip") || headers.get("x-real-ip") || "";
  if (platformIp.trim()) return platformIp.trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return "unknown";
}
