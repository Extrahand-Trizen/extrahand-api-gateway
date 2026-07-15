export type WalletRole = 'poster' | 'tasker';
export type ReferralChannel = 'poster' | 'tasker';

const POSTER_ALIASES = new Set(['poster', 'customer', 'requester']);

function normalizeRoleToken(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : '';
}

export function parseWalletRole(raw: unknown, defaultRole: WalletRole = 'tasker'): WalletRole {
  const token = normalizeRoleToken(raw);
  if (POSTER_ALIASES.has(token)) return 'poster';
  if (token === 'tasker' || token === 'helper' || token === 'performer') return 'tasker';
  return defaultRole;
}

export function parseReferralChannel(
  raw: unknown,
  defaultChannel?: ReferralChannel
): ReferralChannel | undefined {
  if (raw === undefined || raw === null || raw === '') {
    return defaultChannel;
  }
  return parseWalletRole(raw, defaultChannel ?? 'tasker');
}
