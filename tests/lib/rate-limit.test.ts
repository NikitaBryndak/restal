import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { checkRateLimit, getServerIp } from '@/lib/rate-limit';

afterEach(() => {
  vi.useRealTimers();
});

describe('checkRateLimit', () => {
  it('allows requests up to the maximum within a window', () => {
    const ns = 'test-allow';
    expect(checkRateLimit(ns, 'ip1', 3, 60_000)).toEqual({ allowed: true });
    expect(checkRateLimit(ns, 'ip1', 3, 60_000)).toEqual({ allowed: true });
    expect(checkRateLimit(ns, 'ip1', 3, 60_000)).toEqual({ allowed: true });
  });

  it('rejects requests beyond the maximum with a positive retryAfterMs', () => {
    const ns = 'test-deny';
    checkRateLimit(ns, 'ip2', 2, 60_000);
    checkRateLimit(ns, 'ip2', 2, 60_000);
    const denied = checkRateLimit(ns, 'ip2', 2, 60_000);
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterMs).toBeGreaterThan(0);
    // Denied requests must not increment the counter further
    expect(checkRateLimit(ns, 'ip2', 2, 60_000).allowed).toBe(false);
  });

  it('resets the counter after the window expires', () => {
    vi.useFakeTimers();
    const ns = 'test-expiry';
    checkRateLimit(ns, 'ip3', 1, 1000);
    expect(checkRateLimit(ns, 'ip3', 1, 1000).allowed).toBe(false);

    vi.advanceTimersByTime(1500); // past resetAt
    expect(checkRateLimit(ns, 'ip3', 1, 1000)).toEqual({ allowed: true });
  });

  it('isolates identifiers and namespaces from each other', () => {
    const ns = 'test-isolation';
    checkRateLimit(ns, 'a', 1, 60_000);
    expect(checkRateLimit(ns, 'b', 1, 60_000).allowed).toBe(true); // different identifier
    expect(checkRateLimit('other-ns', 'a', 1, 60_000).allowed).toBe(true); // different namespace
  });
});

describe('getServerIp', () => {
  const req = (headers: Record<string, string>) =>
    new NextRequest('http://localhost/x', { headers });

  it('prefers the x-real-ip header (Vercel)', () => {
    expect(getServerIp(req({ 'x-real-ip': '1.2.3.4', 'x-forwarded-for': '9.9.9.9' }))).toBe('1.2.3.4');
  });

  it('falls back to the first entry of x-forwarded-for', () => {
    expect(getServerIp(req({ 'x-forwarded-for': '5.6.7.8, 10.0.0.1' }))).toBe('5.6.7.8');
  });

  it('returns "unknown" when no proxy headers are present', () => {
    expect(getServerIp(req({}))).toBe('unknown');
  });
});
