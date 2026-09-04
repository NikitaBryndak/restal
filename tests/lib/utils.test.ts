import { describe, it, expect, vi, afterEach } from 'vitest';
import { cn, chooseRandomItem, getCurrentDate, validateDate, getDateErrorMessage } from '@/lib/utils';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('cn', () => {
  it('merges tailwind classes with later classes winning', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('keeps non-conflicting classes and handles falsy inputs', () => {
    expect(cn('text-red-500', false, null, undefined, 'font-bold', { 'underline': true })).toBe(
      'text-red-500 font-bold underline'
    );
  });

  it('returns empty string for no args', () => {
    expect(cn()).toBe('');
  });
});

describe('chooseRandomItem', () => {
  it('always returns an item from the array (crypto path)', () => {
    const items = ['a', 'b', 'c'];
    for (let i = 0; i < 20; i++) {
      expect(items).toContain(chooseRandomItem(items));
    }
  });

  it('falls back to Math.random when crypto.getRandomValues is unavailable', () => {
    vi.stubGlobal('crypto', {}); // typeof crypto !== 'undefined' but no getRandomValues
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    expect(chooseRandomItem([10, 20])).toBe(20);
    expect(spy).toHaveBeenCalled();
  });
});

describe('getCurrentDate', () => {
  it('formats as DD/MM/YYYY with zero padding', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 3)); // Sep 3 2026 (month is 0-indexed)
    expect(getCurrentDate()).toBe('03/09/2026');

    vi.setSystemTime(new Date(2024, 0, 15));
    expect(getCurrentDate()).toBe('15/01/2024');
  });
});

describe('validateDate', () => {
  it('returns null for empty string (no date provided)', () => {
    expect(validateDate('')).toBeNull();
  });

  it('rejects strings that are not 10 chars long', () => {
    expect(validateDate('1/1/2026')).toMatch(/ДД\/ММ\/РРРР/);
    expect(validateDate('31/12/20261')).toMatch(/ДД\/ММ\/РРРР/);
  });
  it('rejects strings without exactly three slash-separated parts', () => {
    expect(validateDate('31-12-2026')).toBe('Невірний формат дати.'); // 10 chars, one part
  });

  it('rejects non-numeric parts', () => {
    expect(validateDate('ab/cd/efgh')).toBe('Невірний формат дати.'); // 10 chars, three parts, NaN
  });

  it('rejects month outside 1..12', () => {
    expect(validateDate('01/00/2026')).toMatch(/Місяць/);
    expect(validateDate('01/13/2026')).toMatch(/Місяць/);
  });

  it('rejects day outside 1..31', () => {
    expect(validateDate('00/05/2026')).toMatch(/День/);
    expect(validateDate('32/05/2026')).toMatch(/День/);
  });

  it('rejects year outside 1940..2050', () => {
    expect(validateDate('01/01/1939')).toMatch(/Рік/);
    expect(validateDate('01/01/2051')).toMatch(/Рік/);
  });

  it('rejects a day beyond the month length', () => {
    expect(validateDate('31/04/2026')).toBe('квітень 2026 має лише 30 днів.');
    expect(validateDate('30/02/2026')).toBe('лютий 2026 має лише 28 днів.');
  });

  it('accepts Feb 29 in leap years and rejects it in common years', () => {
    expect(validateDate('29/02/2024')).toBeNull(); // 2024 divisible by 4
    expect(validateDate('31/12/2000')).toBeNull(); // century year divisible by 400
    expect(validateDate('29/02/1900')).toBe('Рік має бути від 1940 до 2050.'); // year range checked before day-in-month
  });

  it('accepts valid dates', () => {
    expect(validateDate('31/01/2026')).toBeNull();
    expect(validateDate('15/06/1940')).toBeNull();
    expect(validateDate('31/12/2050')).toBeNull();
  });

  it('getDateErrorMessage is an alias of validateDate', () => {
    expect(getDateErrorMessage).toBe(validateDate);
  });
});
