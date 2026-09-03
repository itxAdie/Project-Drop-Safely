/**
 * Escape special RegExp characters to prevent ReDoS attacks.
 */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Format amount as Pakistani Rupees
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format Pakistani phone number to standard format
 * Input: 03001234567 or +923001234567 or 3001234567
 * Output: +92 300 1234567
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, "");

  if (cleaned.startsWith("+92")) {
    const num = cleaned.slice(3);
    return `+92 ${num.slice(0, 3)} ${num.slice(3)}`;
  }

  if (cleaned.startsWith("0")) {
    const num = cleaned.slice(1);
    return `+92 ${num.slice(0, 3)} ${num.slice(3)}`;
  }

  return `+92 ${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string, locale = "en-PK"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/**
 * Format time from HH:MM string to 12-hour format
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}
