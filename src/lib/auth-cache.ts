/**
 * Token cache to avoid fetching from Supabase on every API call.
 * Tokens are cached in memory with a TTL.
 */

interface CachedToken {
  token: string;
  expiresAt: number;
}

let tokenCache: CachedToken | null = null;

const TOKEN_REFRESH_BUFFER_MS = 60 * 1000; // Refresh 1 minute before expiry

/**
 * Get cached token if valid, otherwise return null
 */
export function getCachedToken(): string | null {
  if (!tokenCache) return null;

  const now = Date.now();
  if (now >= tokenCache.expiresAt) {
    // Token expired
    tokenCache = null;
    return null;
  }

  return tokenCache.token;
}

/**
 * Cache a token with its expiry time
 * @param token - The access token
 * @param expiresAt - Unix timestamp (seconds) when token expires
 */
export function cacheToken(token: string, expiresAt: number): void {
  // Convert seconds to milliseconds and subtract buffer
  const expiryMs = expiresAt * 1000 - TOKEN_REFRESH_BUFFER_MS;

  tokenCache = {
    token,
    expiresAt: expiryMs,
  };
}

/**
 * Clear the token cache (e.g., on logout)
 */
export function clearTokenCache(): void {
  tokenCache = null;
}
