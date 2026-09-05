// ─── Site ───────────────────────────────────────────────────────────
export const BASE_URL = "https://restal.in.ua";

// ─── Business ───────────────────────────────────────────────────────
export const CASHBACK_RATE = 0.02;

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
/** Strict email format (TLD ≥ 2 chars) — account email changes */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Basic email format — registration + client-side form validation */
export const EMAIL_REGEX_BASIC = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_EMAIL_LENGTH = 254; // RFC 5321 max addr-spec length

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

// ─── AI / Chat ──────────────────────────────────────────────────────
export const AI_DAILY_RATE_LIMIT = 120;  // Max AI chat requests per IP per day
// ─── Rate limits ────────────────────────────────────────────────────
/**
 * Per-namespace rate limit presets for checkRateLimit() (max requests per window).
 * Keys MUST match the namespace strings passed to checkRateLimit() — they are
 * also the in-memory store keys.
 */
export const RATE_LIMITS = {
    // Auth flows (per IP)
    "login":               { max: 10, windowMs: 15 * 60_000 },
    "register":            { max: 5,  windowMs: 60 * 60_000 },
    "send-otp":            { max: 3,  windowMs: 15 * 60_000 },
    "verify-otp":          { max: 10, windowMs: 15 * 60_000 },
    "forgot-password":     { max: 3,  windowMs: 15 * 60_000 },
    "reset-password":      { max: 5,  windowMs: 15 * 60_000 },
    "userExists":          { max: 10, windowMs: 15 * 60_000 },
    // Account changes (per phone)
    "change-email":        { max: 5,  windowMs: 15 * 60_000 },
    "change-password":     { max: 5,  windowMs: 15 * 60_000 },
    "change-username":     { max: 5,  windowMs: 15 * 60_000 },
    "update-preferences":  { max: 10, windowMs: 60_000 },
    // Analytics (per phone)
    "analytics":           { max: 30, windowMs: 5 * 60_000 },
    "analytics-bonuses":   { max: 20, windowMs: 5 * 60_000 },
    "analytics-referrals": { max: 20, windowMs: 5 * 60_000 },
    "analytics-requests":  { max: 20, windowMs: 5 * 60_000 },
    "manager-perf":        { max: 20, windowMs: 5 * 60_000 },
    "managers-list":       { max: 20, windowMs: 60_000 },
    "manage-trips-list":   { max: 30, windowMs: 60_000 },
    // Misc (per IP)
    "referral-validate":   { max: 10, windowMs: 15 * 60_000 },
    // Reviews (per phone)
    "reviews":             { max: 20, windowMs: 60_000 },
    // Admin dashboards (per phone)
    "cron-runs":           { max: 30, windowMs: 5 * 60_000 },
} as const;

export type RateLimitNamespace = keyof typeof RATE_LIMITS;

/** Contact form limiter (DB-based, not checkRateLimit): max submissions per IP within the window */
export const CONTACT_FORM_MAX_REQUESTS = 5;
export const CONTACT_FORM_WINDOW_MS = 60 * 60_000; // 1 hour

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
/** Allowed period values (derived from PERIOD_OPTIONS) */
export const ALLOWED_PERIODS: readonly Period[] = PERIOD_OPTIONS.map((o) => o.value);

// ─── Notifications ──────────────────────────────────────────────────
export const NOTIFICATION_RECIPIENTS = [
    "nikitabryndak@gmail.com",
    "eleonstrevel@gmail.com",
];
// ─── Security headers ───────────────────────────────────────────────
/** Response headers for analytics endpoints serving sensitive data */
export const SECURITY_HEADERS = {
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "Pragma": "no-cache",
    "X-Content-Type-Options": "nosniff",
} as const;

// ─── Date ───────────────────────────────────────────────────────────
export const MIN_YEAR = 1940;
export const MAX_YEAR = 2050;
// ─── Telegram bot ───────────────────────────────────────────────────
export const TELEGRAM_REQUEST_TIMEOUT_MS = 15_000; // HTTP request abort (client.ts)
/** getUpdates long-poll timeout — must stay below TELEGRAM_REQUEST_TIMEOUT_MS or every poll dies as "aborted" */
export const TELEGRAM_POLL_TIMEOUT_SEC = 10;
export const TELEGRAM_RETRY_DELAY_MS = 3_000; // Poller retry backoff
/** Per-chat cooldown so an unbound chat isn't spammed with the register prompt on every message */
export const TELEGRAM_REGISTER_PROMPT_COOLDOWN_MS = 10 * 60_000;
/** Registration link sent to unregistered users — always the production site, tagged for attribution */
export const TELEGRAM_REGISTER_URL = `${BASE_URL}/register?utm_source=telegram&utm_medium=bot&utm_campaign=register_prompt`;
