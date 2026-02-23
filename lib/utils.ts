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
const MONTH_NAMES = ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень',
                     'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'];

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
    if (dateStr.length !== 10) return 'Дата має бути у форматі ДД/ММ/РРРР.';

    const parts = dateStr.split('/');
    if (parts.length !== 3) return 'Невірний формат дати.';

    const [day, month, year] = parts.map(p => parseInt(p, 10));

    if (isNaN(day) || isNaN(month) || isNaN(year)) return 'Невірний формат дати.';
    if (month < 1 || month > 12) return 'Місяць має бути від 01 до 12.';
    if (day < 1 || day > 31) return 'День має бути від 01 до 31.';
    if (year < 1940 || year > 2050) return 'Рік має бути від 1940 до 2050.';

    const maxDays = getMaxDays(month, year);
    if (day > maxDays) {
        return `${MONTH_NAMES[month - 1]} ${year} має лише ${maxDays} днів.`;
    }

    return null;
};

// Alias for backwards compatibility with form-input component
export const getDateErrorMessage = validateDate;
