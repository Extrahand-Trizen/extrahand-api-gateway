/**
 * Product surface that completed auth. Orthogonal to clientType (web|mobile).
 * Only meaningful for mobile apps; gateway strips this for web clients.
 */
export type AuthChannel = 'customer_app' | 'helper_app';

export function parseAuthChannel(raw: unknown): AuthChannel | undefined {
  if (raw == null) return undefined;
  const value = String(raw).trim().toLowerCase().replace(/-/g, '_');
  if (value === 'customer_app' || value === 'customerapp') return 'customer_app';
  if (value === 'helper_app' || value === 'helperapp') return 'helper_app';
  return undefined;
}
