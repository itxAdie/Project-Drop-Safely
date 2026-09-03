// ===== Clustering & Route Engine =====
export const CLUSTER_RADIUS_KM = 3;
export const MIN_STUDENTS_PER_ROUTE = 7;
export const MAX_TIME_SLOTS = 3;

// ===== Billing & Payments =====
export const DEFAULT_COMMISSION = 15; // percent
export const DEFAULT_PLATFORM_FEE = 100; // PKR
export const PAYMENT_REMINDER_DAYS_BEFORE = 3;

// ===== Auth & OTP =====
export const OTP_EXPIRY_MINUTES = 5;
export const OTP_MAX_ATTEMPTS = 3;
export const OTP_LENGTH = 6;

// ===== Pagination =====
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ===== GPS =====
export const GPS_TTL_HOURS = 24;
export const LOCATION_UPDATE_INTERVAL_SECONDS = 30;

// ===== Notifications =====
export const NOTIFICATION_TTL_DAYS = 30;

// ===== Trips =====
export const TRIP_DELAY_THRESHOLD_MINUTES = 10;

// ===== File Upload =====
export const MAX_FILE_SIZE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
