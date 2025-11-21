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

export const isValidDate = (day: number, month: number, year: number): boolean => {
    // Check month is valid (1-12)
    if (month < 1 || month > 12) return false;

    // Check day is at least 1
    if (day < 1) return false;

    // Days in each month
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // Check for leap year (February can have 29 days)
    if (month === 2 && year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
        return day <= 29;
    }

    // Check day doesn't exceed days in month
    return day <= daysInMonth[month - 1];
};

export const getDateErrorMessage = (dateStr: string): string | null => {
    if (!dateStr) return null; // Empty is valid (handled by required check elsewhere)

    if (dateStr.length !== 10) {
        // If it's not 10 chars, it's incomplete.
        // For strict validation (e.g. on submit), this should be an error.
        // But for live typing, we might want to suppress it?
        // Actually, FormInput calls this on change. If we return error for length < 10, it will show error while typing.
        // That might be annoying.
        // But wait, FormInput logic was: if (dateStr.length !== 10) return null;
        return null;
    }

    const parts = dateStr.split('/');
    if (parts.length !== 3) return 'Invalid date format.';

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Check if numbers are valid
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
        return 'Invalid date format.';
    }

    // Check month range
    if (month < 1 || month > 12) {
        return 'Month must be between 01 and 12.';
    }

    // Check day range
    if (day < 1 || day > 31) {
        return 'Day must be between 01 and 31.';
    }

    // Check year bounds
    if (year < 1940 || year > 2050) {
        return 'Year must be between 1940 and 2050.';
    }

    // Check if date is valid for the specific month
    if (!isValidDate(day, month, year)) {
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let maxDays = daysInMonth[month - 1];

        // Adjust for leap year
        if (month === 2 && year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
            maxDays = 29;
        }

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        return `${monthNames[month - 1]} ${year} only has ${maxDays} days.`;
    }

    return null; // Valid date
};

export const validateDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    if (dateStr.length !== 10) return 'Date must be in DD/MM/YYYY format.';
    return getDateErrorMessage(dateStr);
};
