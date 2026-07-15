/**
 * Short-TTL in-memory cache: Firebase uid → MongoDB profileId.
 * Used when JWT lacks `pid` (Firebase tokens, legacy sessions).
 */

const DEFAULT_TTL_MS = 60_000;
const MAX_ENTRIES = 10_000;

const cache = new Map<string, { profileId: string; expiresAt: number }>();

function pruneExpired(now: number): void {
  if (cache.size <= MAX_ENTRIES) return;
  for (const [uid, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(uid);
    }
    if (cache.size <= MAX_ENTRIES * 0.9) break;
  }
}

export function getCachedProfileId(uid: string): string | undefined {
  const entry = cache.get(uid);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(uid);
    return undefined;
  }
  return entry.profileId;
}

export function setCachedProfileId(
  uid: string,
  profileId: string,
  ttlMs: number = DEFAULT_TTL_MS,
): void {
  if (!uid || !profileId) return;
  pruneExpired(Date.now());
  cache.set(uid, { profileId, expiresAt: Date.now() + ttlMs });
}

export function invalidateCachedProfileId(uid: string): void {
  cache.delete(uid);
}
