// Tiny nanoid replacement using Web Crypto API
export function nanoid(size = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('');
}
