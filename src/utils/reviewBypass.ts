/**
 * Demo / Play-review bypass — keep in sync with extrahand-user-service/src/utils/reviewBypass.ts
 */

function parseList(raw: string | undefined): string[] {
  if (!raw || !String(raw).trim()) return [];
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizePhoneDigits(phone: string | undefined | null): string | null {
  if (phone == null || typeof phone !== 'string') return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits.length > 0 ? digits : null;
}

const BUILTIN_DEMO_PHONE_LAST10 = new Set([
  '9999999999',
  '8888888888',
  '9876543210',
  '9876543211',
]);

export function isReviewBypassUid(uid: string | undefined | null): boolean {
  if (uid == null || String(uid).trim() === '') return false;
  const trimmed = String(uid).trim();
  if (trimmed.startsWith('local-test-')) return true;
  const allow = new Set(parseList(process.env.PLAY_REVIEW_BYPASS_UIDS));
  return allow.has(trimmed);
}

export function isReviewBypassPhone(phone: string | undefined | null): boolean {
  const n = normalizePhoneDigits(phone);
  if (!n) return false;
  if (BUILTIN_DEMO_PHONE_LAST10.has(n)) return true;
  for (const entry of parseList(process.env.PLAY_REVIEW_BYPASS_PHONES)) {
    const e = normalizePhoneDigits(entry);
    if (e && e === n) return true;
  }
  return false;
}

export function isReviewBypassUser(
  uid: string | undefined | null,
  phone?: string | undefined | null,
): boolean {
  return isReviewBypassUid(uid) || isReviewBypassPhone(phone);
}
