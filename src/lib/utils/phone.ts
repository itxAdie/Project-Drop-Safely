/**
 * Canonicalize a Pakistani phone number to a single storage format.
 *
 * Accepts any of: 03XXXXXXXXX, 3XXXXXXXXX, +923XXXXXXXXX, 923XXXXXXXXX,
 * with or without spaces/dashes/parens/dots. Always returns 03XXXXXXXXX.
 * Unique account lookups (users collection) rely on this single format
 * so the same number can never map to two different accounts.
 */
export function normalizePhone(phone: string): string {
  let cleaned = (phone || "").replace(/[\s\-\(\)\.]/g, "").trim();

  if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);

  if (cleaned.startsWith("92") && cleaned.length === 12 && cleaned[2] === "3") {
    cleaned = "0" + cleaned.slice(2);
  } else if (cleaned.length === 10 && cleaned.startsWith("3")) {
    cleaned = "0" + cleaned;
  }

  return cleaned;
}