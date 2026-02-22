import { NextRequest } from "next/server";

/**
 * SECURITY: Server-side rate limiter using in-memory store.
 *
 * For production with multiple serverless instances, consider replacing
 * with Redis-backed rate limiting (e.g. @upstash/ratelimit).
 *
 * This is still effective as a first line of defense and works well
 * on single-instance deployments.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(namespace: string): Map<string, RateLimitEntry> {
  if (!rateLimitStores.has(namespace)) {
    rateLimitStores.set(namespace, new Map());
  }
  return rateLimitStores.get(namespace)!;
}

// Periodic cleanup of expired entries to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [, store] of rateLimitStores) {
    for (const [key, entry] of store) {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    }
  }
}, 60_000); // Clean up every minute

/**
 * Check if a request is within the rate limit.
 * Returns { allowed: true } or { allowed: false, retryAfterMs }.
 */
export function checkRateLimit(
  namespace: string,
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs?: number } {
  const store = getStore(namespace);
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true };
}

/**
 * SECURITY: Extract client IP from request headers.
 *
 * In production behind a trusted reverse proxy (Vercel, Cloudflare, etc.),
 * the platform sets these headers reliably.
 *
 * NOTE: x-forwarded-for CAN be spoofed if not behind a trusted proxy.
 * Vercel overwrites x-forwarded-for with the real client IP, making this safe
 * on Vercel deployments. For other platforms, ensure your proxy strips/sets
 * this header.
 */
export function getServerIp(request: NextRequest): string {
  // Vercel-specific header (most reliable on Vercel)
  const vercelIp = request.headers.get("x-real-ip");
  if (vercelIp) return vercelIp;

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take only the first IP (client IP set by the proxy)
    return forwardedFor.split(",")[0].trim();
  }

  return "unknown";
}
