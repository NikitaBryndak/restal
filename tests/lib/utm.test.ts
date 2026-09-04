import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { extractUtm } from '@/lib/utm';

function req(url: string) {
  return new NextRequest(`http://localhost${url}`);
}

describe('extractUtm', () => {
  it('captures all three params from the URL query string', () => {
    const utm = extractUtm(req('/register?utm_source=newsletter&utm_medium=email&utm_campaign=fall'));
    expect(utm).toEqual({ source: 'newsletter', medium: 'email', campaign: 'fall' });
  });

  it('falls back to body fields when absent from the URL', () => {
    const utm = extractUtm(req('/contact'), {
      utm_source: 'bodysrc',
      utm_medium: 'bodymed',
      utm_campaign: 'bodycamp',
    });
    expect(utm).toEqual({ source: 'bodysrc', medium: 'bodymed', campaign: 'bodycamp' });
  });

  it('prefers URL values over body values per key', () => {
    const utm = extractUtm(req('/register?utm_source=urlsrc'), {
      utm_source: 'bodysrc',
      utm_medium: 'bodymed',
    });
    expect(utm).toEqual({ source: 'urlsrc', medium: 'bodymed' });
  });

  it('trims whitespace and caps values at 100 chars', () => {
    const long = 'a'.repeat(150);
    const utm = extractUtm(req(`/register?utm_source=${long}`));
    expect(utm.source).toHaveLength(100);

    const trimmed = extractUtm(req('/register'), { utm_medium: '  paid-search  ' });
    expect(trimmed.medium).toBe('paid-search');
  });

  it('ignores non-string and empty values', () => {
    const utm = extractUtm(req('/register?utm_source='), {
      utm_source: 42,
      utm_medium: null,
      utm_campaign: '   ',
    });
    expect(utm).toEqual({});
  });

  it('returns an empty object when no attribution is present', () => {
    expect(extractUtm(req('/register'))).toEqual({});
    expect(extractUtm(req('/register'), {})).toEqual({});
    expect(extractUtm(req('/register'), undefined)).toEqual({});
  });

  it('captures a partial set (only the keys that are present)', () => {
    const utm = extractUtm(req('/register?utm_source=google'));
    expect(utm).toEqual({ source: 'google' });
    expect('medium' in utm).toBe(false);
  });
});
