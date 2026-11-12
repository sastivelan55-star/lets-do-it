// LifeMap — Cloud User Settings Service (Supabase PostgreSQL with RLS + Offline IndexedDB Mirroring)
import { getSupabase } from './supabaseClient';
import type { AppSettings } from '../types';
import { logSafeError, extractErrorInfo } from '../utils/errorUtils';
import { getSettings as getLocalSettings, saveSettings as saveLocalSettings, getDefaultSettings } from '../db/storage';

export interface DbUserSettingsRow {
  user_id: string;
  settings: AppSettings;
  created_at: string;
  updated_at: string;
}

// ── CRUD Operations ──────────────────────────────────────────────────────────

export async function fetchUserSettings(userId: string): Promise<{ settings: AppSettings; isCloud: boolean }> {
  let local = await getLocalSettings();
  if (!local) {
    local = getDefaultSettings();
    await saveLocalSettings(local);
  }

  const supabase = getSupabase();
  if (!supabase || !userId) {
    return { settings: local, isCloud: false };
  }

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      const info = extractErrorInfo(error, 'Fetch settings');
      if (info.isSchemaMissing) {
        return { settings: local, isCloud: false };
      }
      logSafeError('Fetch user settings', error);
      return { settings: local, isCloud: false };
    }

    if (data && data.settings) {
      const cloudSettings = { ...local, ...data.settings };
      await saveLocalSettings(cloudSettings);
      return { settings: cloudSettings, isCloud: true };
    }

    // Cloud has no settings row yet — push local settings to seed cloud row
    await saveCloudSettings(local, userId);
    return { settings: local, isCloud: true };
  } catch (err) {
    logSafeError('Fetch settings catch', err);
    return { settings: local, isCloud: false };
  }
}

export async function saveCloudSettings(settings: AppSettings, userId: string): Promise<AppSettings> {
  await saveLocalSettings(settings);

  const supabase = getSupabase();
  if (!supabase || !userId) {
    return settings;
  }

  try {
    const payload = {
      user_id: userId,
      settings,
      updated_at: new Date().toISOString(),
    };
    await supabase
      .from('user_settings')
      .upsert(payload, { onConflict: 'user_id' });
  } catch (err) {
    logSafeError('saveCloudSettings', err);
  }

  return settings;
}

// ── Realtime Subscription ────────────────────────────────────────────────────

export function subscribeToUserSettings(userId: string, onChange: (settings: AppSettings) => void): () => void {
  const supabase = getSupabase();
  if (!supabase || !userId) return () => {};

  const channel = supabase
    .channel(`realtime:settings:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_settings',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new && (payload.new as any).settings) {
          onChange((payload.new as any).settings as AppSettings);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
