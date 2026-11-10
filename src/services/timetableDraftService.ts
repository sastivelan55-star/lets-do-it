import { getSupabase } from './supabaseClient';
import type { LifeArea, TaskPriority } from '../types';
import { logSafeError } from '../utils/errorUtils';

export interface TimetableMissionDraft {
  title: string;
  startTime: string;
  endTime: string;
  area: LifeArea;
  priority: TaskPriority;
  notes: string;
  updatedAt: string;
}

const STORAGE_PREFIX = 'lifeos_timetable_mission_draft';

export function getDraftStorageKey(userId?: string | null): string {
  return userId ? `${STORAGE_PREFIX}_${userId}` : `${STORAGE_PREFIX}_guest`;
}

export const DEFAULT_DRAFT_START_TIME = '08:00';
export const DEFAULT_DRAFT_AREA: LifeArea = 'growth';
export const DEFAULT_DRAFT_PRIORITY: TaskPriority = 'medium';

function getStorage(): Storage | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    return null;
  } catch {
    return null;
  }
}

/**
 * Checks whether the draft contains any non-default, user-entered content.
 */
export function hasDraftContent(draft: Partial<TimetableMissionDraft> | null | undefined): boolean {
  if (!draft) return false;
  const hasTitle = Boolean(draft.title && draft.title.trim().length > 0);
  const hasNotes = Boolean(draft.notes && draft.notes.trim().length > 0);
  const hasEndTime = Boolean(draft.endTime && draft.endTime.trim().length > 0);
  const hasCustomStart = Boolean(draft.startTime && draft.startTime !== DEFAULT_DRAFT_START_TIME);
  const hasCustomArea = Boolean(draft.area && draft.area !== DEFAULT_DRAFT_AREA);
  const hasCustomPriority = Boolean(draft.priority && draft.priority !== DEFAULT_DRAFT_PRIORITY);

  return hasTitle || hasNotes || hasEndTime || hasCustomStart || hasCustomArea || hasCustomPriority;
}

/**
 * Synchronously load draft from localStorage.
 */
export function loadLocalDraft(userId?: string | null): TimetableMissionDraft | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const key = getDraftStorageKey(userId);
    let raw = storage.getItem(key);

    // Fallback: if user just signed in and their user key is empty, check guest key
    if (!raw && userId) {
      raw = storage.getItem(`${STORAGE_PREFIX}_guest`);
    }

    if (!raw) return null;
    const parsed = JSON.parse(raw) as TimetableMissionDraft;
    return hasDraftContent(parsed) ? parsed : null;
  } catch (err) {
    logSafeError('loadLocalDraft', err);
    return null;
  }
}

/**
 * Synchronously save draft to localStorage.
 */
export function saveLocalDraft(draft: TimetableMissionDraft, userId?: string | null): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    const key = getDraftStorageKey(userId);
    if (!hasDraftContent(draft)) {
      storage.removeItem(key);
      return;
    }
    storage.setItem(key, JSON.stringify(draft));

    // If saving for an authenticated user, also keep guest storage in sync or clean
    if (userId) {
      storage.setItem(`${STORAGE_PREFIX}_guest`, JSON.stringify(draft));
    }
  } catch (err) {
    logSafeError('saveLocalDraft', err);
  }
}

/**
 * Fetch draft from Supabase auth user_metadata for authenticated users.
 */
export async function loadCloudDraft(userId?: string | null): Promise<TimetableMissionDraft | null> {
  if (!userId) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return null;
    }

    const cloudDraft = data.user.user_metadata?.timetable_mission_draft as TimetableMissionDraft | undefined;
    return hasDraftContent(cloudDraft) && cloudDraft ? cloudDraft : null;
  } catch (err) {
    logSafeError('loadCloudDraft', err);
    return null;
  }
}

/**
 * Save draft to Supabase auth user_metadata.
 */
export async function saveCloudDraft(
  draft: TimetableMissionDraft,
  userId?: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: true };

  const supabase = getSupabase();
  if (!supabase) return { success: true };

  try {
    const { error } = await supabase.auth.updateUser({
      data: {
        timetable_mission_draft: draft,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    logSafeError('saveCloudDraft', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to sync draft to cloud',
    };
  }
}

/**
 * Unified loader: checks local storage and cloud, selecting the latest valid draft.
 */
export async function loadDraft(userId?: string | null): Promise<TimetableMissionDraft | null> {
  const local = loadLocalDraft(userId);

  if (!userId) {
    return local;
  }

  // Authenticated user: attempt to load from Supabase cloud
  try {
    const cloud = await loadCloudDraft(userId);

    if (!local && cloud) {
      // Found cloud draft on a new device or cleared cache, cache locally
      saveLocalDraft(cloud, userId);
      return cloud;
    }

    if (local && !cloud) {
      // Local exists, queue cloud sync in background
      saveCloudDraft(local, userId).catch(() => {});
      return local;
    }

    if (local && cloud) {
      // Compare updatedAt timestamps
      const localTime = new Date(local.updatedAt || 0).getTime();
      const cloudTime = new Date(cloud.updatedAt || 0).getTime();

      if (cloudTime > localTime) {
        saveLocalDraft(cloud, userId);
        return cloud;
      } else {
        if (localTime > cloudTime) {
          saveCloudDraft(local, userId).catch(() => {});
        }
        return local;
      }
    }
  } catch (err) {
    logSafeError('loadDraft unified', err);
  }

  return local;
}

/**
 * Unified saver: saves locally immediately and to Supabase with cloud sync.
 */
export async function saveDraft(
  draft: TimetableMissionDraft,
  userId?: string | null
): Promise<{ success: boolean; cloudSynced: boolean; error?: string }> {
  // 1. Immediately save locally so data is never lost
  saveLocalDraft(draft, userId);

  // 2. If authenticated, update Supabase user_metadata
  if (userId) {
    const cloudRes = await saveCloudDraft(draft, userId);
    return {
      success: true,
      cloudSynced: cloudRes.success,
      error: cloudRes.error,
    };
  }

  return { success: true, cloudSynced: false };
}

/**
 * Explicitly clear draft from local storage and cloud.
 */
export async function clearAllDrafts(userId?: string | null): Promise<void> {
  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(getDraftStorageKey(userId));
      storage.removeItem(`${STORAGE_PREFIX}_guest`);
    } catch {
      // Ignore storage errors
    }
  }

  if (userId) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.updateUser({
          data: {
            timetable_mission_draft: null,
          },
        });
      } catch {
        // Ignore network errors on cleanup
      }
    }
  }
}
