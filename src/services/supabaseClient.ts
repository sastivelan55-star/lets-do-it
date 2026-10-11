import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV, isSupabaseConfigured } from '../config/env';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }
  if (!supabaseClient) {
    supabaseClient = createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
      auth: {
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
