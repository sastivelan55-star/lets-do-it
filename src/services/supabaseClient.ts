import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV, isSupabaseConfigured } from '../config/env';

let supabaseClient: SupabaseClient | null = null;

function migrateLegacySupabaseToken(): void {
  if (typeof window === 'undefined') return;
  try {
    const current = localStorage.getItem('lifeos_supabase_auth_token');
    if (current) return;

    // Check for legacy sb-*-auth-token keys and migrate seamlessly
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const val = localStorage.getItem(key);
        if (val) {
          localStorage.setItem('lifeos_supabase_auth_token', val);
          break;
        }
      }
    }
  } catch {}
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }
  if (!supabaseClient) {
    migrateLegacySupabaseToken();
    supabaseClient = createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
      auth: {
        storageKey: 'lifeos_supabase_auth_token',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseClient;
}

// Export pre-initialized client (or null if not configured)
export const supabase = getSupabase();
