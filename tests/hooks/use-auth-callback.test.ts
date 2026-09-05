import { describe, it, expect, vi } from 'vitest';

// Module-level imports of the hook file pull in next-auth/react + next/navigation — mock both.
vi.mock('next-auth/react', () => ({ signIn: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { resolveCallbackUrl } from '@/hooks/useAuth';

describe('resolveCallbackUrl (post-login redirect)', () => {
  it('falls back to the profile page when no callbackUrl is provided', () => {
    expect(resolveCallbackUrl(null)).toBe('/dashboard/profile');
    expect(resolveCallbackUrl('')).toBe('/dashboard/profile');
  });

  it('accepts same-origin relative paths (with or without query string)', () => {
    expect(resolveCallbackUrl('/shared/trip/ABC123TOKEN4567890')).toBe('/shared/trip/ABC123TOKEN4567890');
    expect(resolveCallbackUrl('/dashboard/trips?tab=completed')).toBe('/dashboard/trips?tab=completed');
  });

  it('rejects protocol-relative and absolute URLs (open-redirect guard)', () => {
    expect(resolveCallbackUrl('//evil.com/x')).toBe('/dashboard/profile');
    expect(resolveCallbackUrl('https://evil.com')).toBe('/dashboard/profile');
    expect(resolveCallbackUrl('javascript:alert(1)')).toBe('/dashboard/profile');
  });
});
