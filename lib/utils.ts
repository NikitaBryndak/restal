import { countriesAssociations } from "@/data";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function chooseRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export const getCurrentDate = (): string => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

const isLeapYear = (year: number): boolean =>
    year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

const getMaxDays = (month: number, year: number): number =>
    month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1];

/**
 * Validates a date string in DD/MM/YYYY format.
 * Returns null if valid, error message string if invalid.
 */
export const validateDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    if (dateStr.length !== 10) return 'Date must be in DD/MM/YYYY format.';

    const parts = dateStr.split('/');
    if (parts.length !== 3) return 'Invalid date format.';

    const [day, month, year] = parts.map(p => parseInt(p, 10));

    if (isNaN(day) || isNaN(month) || isNaN(year)) return 'Invalid date format.';
    if (month < 1 || month > 12) return 'Month must be between 01 and 12.';
    if (day < 1 || day > 31) return 'Day must be between 01 and 31.';
    if (year < 1940 || year > 2050) return 'Year must be between 1940 and 2050.';

    const maxDays = getMaxDays(month, year);
    if (day > maxDays) {
        return `${MONTH_NAMES[month - 1]} ${year} only has ${maxDays} days.`;
    }

    return null;
};

// Alias for backwards compatibility with form-input component
export const getDateErrorMessage = validateDate;
