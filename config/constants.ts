// ─── Site ───────────────────────────────────────────────────────────
export const BASE_URL = "https://restal.in.ua";

// ─── Business ───────────────────────────────────────────────────────
export const CASHBACK_RATE = 0.02;

/** Privilege levels (higher = more access) */
export const MANAGER_PRIVILEGE_LEVEL = 2;  // Can manage tours, promo codes, contact requests
export const ADMIN_PRIVILEGE_LEVEL = 3;    // Full admin — analytics, articles, manage any trip

/** Historical trip count offset shown on the homepage counter */
export const TRIP_COUNT_OFFSET = 7860;

// ─── Referral system (UAH) ──────────────────────────────────────────
export const REFERRAL_BONUS_REFEREE = 800;   // Bonus for the referred user when they complete their first trip
export const REFERRAL_BONUS_REFERRER = 2000; // Max bonus for the referrer when friend completes first trip
export const WELCOME_BONUS = 1000;           // Welcome bonus for new users

// ─── Promo codes ────────────────────────────────────────────────────
export const MIN_PROMO_AMOUNT = 100;         // Minimum promo code amount (UAH)
export const MAX_PROMO_AMOUNT = 50000;       // Maximum promo code amount (UAH)
export const PROMO_CODE_EXPIRY_DAYS = 30;    // Days until promo code expires

// ─── Validation ─────────────────────────────────────────────────────
/** Phone number regex — digits only, 10-15 chars, optional leading + */
export const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;  // Bcrypt truncates at 72 bytes; also prevents DoS via expensive hashing
export const MIN_USERNAME_LENGTH = 2;
export const MAX_USERNAME_LENGTH = 100;

// ─── Article field limits ───────────────────────────────────────────
export const ARTICLE_MAX_TITLE_LENGTH = 200;
export const ARTICLE_MAX_DESCRIPTION_LENGTH = 500;
export const ARTICLE_MAX_CONTENT_LENGTH = 50000;
export const ARTICLE_MAX_TAG_LENGTH = 50;
export const ARTICLE_MAX_IMAGE_URL_LENGTH = 2000;

// ─── Auth / Security ────────────────────────────────────────────────
export const BCRYPT_SALT_ROUNDS = 12;
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MS = 10 * 60 * 1000;  // 10 minutes
export const OTP_MAX_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/** Unambiguous charset for generating codes (no 0/O, 1/I/L) */
export const UNAMBIGUOUS_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const MAX_CODE_GEN_RETRIES = 10;

// ─── Trusted third-party origins ────────────────────────────────────
export const TRUSTED_ORIGINS: readonly string[] = [
  "https://www.otpusk.com",
  "https://export.otpusk.com",
];

// ─── UI ─────────────────────────────────────────────────────────────
export const TITLE_FADE_DURATION = 3;

// ─── Analytics ──────────────────────────────────────────────────────

/** Hex colors for tour statuses (used in charts & badges) */
export const TOUR_STATUS_COLORS: Record<string, string> = {
    "In Booking": "#f59e0b",
    "Booked": "#3b82f6",
    "Paid": "#10b981",
    "In Progress": "#8b5cf6",
    "Completed": "#06b6d4",
    "Archived": "#6b7280",
};

/** Palette for pie / bar charts */
export const PIE_COLORS = [
    '#0fa4e6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1',
] as const;

/** Analytics period filter */
export type Period = '7d' | '30d' | '90d' | '12m' | 'all';

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
    { value: '7d', label: '7 днів' },
    { value: '30d', label: '30 днів' },
    { value: '90d', label: '90 днів' },
    { value: '12m', label: '12 місяців' },
    { value: 'all', label: 'Весь час' },
];

// ─── Notifications ──────────────────────────────────────────────────
export const NOTIFICATION_RECIPIENTS = [
    "nikitabryndak@gmail.com",
    "eleonstrevel@gmail.com",
];

// ─── Date ───────────────────────────────────────────────────────────
export const MIN_YEAR = 1940;
export const MAX_YEAR = 2050;
