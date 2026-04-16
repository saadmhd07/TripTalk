import { supabase } from './supabase';
import { getCachedToken, cacheToken } from './auth-cache';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1';

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (supabase) {
    // Try to get token from cache first
    let token = getCachedToken();

    // If not cached or expired, fetch from Supabase
    if (!token) {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        token = session.access_token;

        // Cache the token with its expiry time
        if (session.expires_at) {
          cacheToken(token, session.expires_at);
        }
      }
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });
}
