// Daily Completion Service (Supabase PostgreSQL with RLS)
// Manages per-occurrence completion state for the Daily Execution Dashboard.
import { getSupabase } from './supabaseClient';
import type { DailyTaskCompletion } from '../types';
import { extractErrorInfo, logSafeError, formatSafeErrorMessage } from '../utils/errorUtils';

// ── DB Row Shape ─────────────────────────────────────────────────────────────

export interface DbDailyCompletionRow {
  id: string;
  task_id: string;
  user_id: string;
  occurrence_date: string; // DATE — returned as 'YYYY-MM-DD' string by PostgREST
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

export function dbRowToCompletion(row: DbDailyCompletionRow): DailyTaskCompletion {
  return {
    id: row.id,
    taskId: row.task_id,
    userId: row.user_id,
    occurrenceDate: row.occurrence_date.slice(0, 10),
    isCompleted: row.is_completed,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function completionToDbRow(
  c: Partial<DailyTaskCompletion>,
  userId: string
): Partial<DbDailyCompletionRow> {
  const row: Partial<DbDailyCompletionRow> = { user_id: userId };
  if (c.taskId !== undefined) row.task_id = c.taskId;
  if (c.occurrenceDate !== undefined) row.occurrence_date = c.occurrenceDate;
  if (c.isCompleted !== undefined) row.is_completed = c.isCompleted;
  if ('completedAt' in c) row.completed_at = c.completedAt ?? null;
  return row;
}

// ── Local Offline / Mirror Cache ─────────────────────────────────────────────

const LOCAL_STORAGE_KEY = 'lifeos.daily_task_completions.v1';

function getLocalCompletions(): DailyTaskCompletion[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalCompletions(list: DailyTaskCompletion[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore storage quota errors
  }
}

function getLocalCompletionsForDate(userId: string, date: string): DailyTaskCompletion[] {
  const all = getLocalCompletions();
  return all.filter(
    (c) => (c.userId === userId || !userId || c.userId === 'guest') && c.occurrenceDate === date
  );
}

function saveLocalCompletionRecord(record: DailyTaskCompletion): void {
  const all = getLocalCompletions();
  const idx = all.findIndex(
    (c) => c.taskId === record.taskId && c.occurrenceDate === record.occurrenceDate
  );
  if (idx >= 0) {
    all[idx] = record;
  } else {
    all.push(record);
  }
  saveLocalCompletions(all);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns true when the error indicates the table hasn't been migrated yet.
 * In that case callers should return an empty result rather than throwing.
 */
function isSchemaMissing(err: unknown): boolean {
  return Boolean(extractErrorInfo(err, 'DailyCompletion').isSchemaMissing);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch all completion records for a specific user+date.
 * Falls back gracefully to local storage if Supabase is offline, guest mode,
 * or before database migration is applied.
 */
export async function fetchCompletionsForDate(
  userId: string,
  date: string
): Promise<DailyTaskCompletion[]> {
  const localList = getLocalCompletionsForDate(userId, date);
  const supabase = getSupabase();
  if (!supabase || !userId) return localList;

  try {
    const { data, error } = await supabase
      .from('daily_task_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('occurrence_date', date);

    if (error) {
      if (isSchemaMissing(error)) {
        // Migration not yet applied — degrade gracefully to local cache
        return localList;
      }
      logSafeError('fetchCompletionsForDate', error);
      return localList;
    }

    if (data && data.length > 0) {
      const cloudCompletions = (data as DbDailyCompletionRow[]).map(dbRowToCompletion);
      for (const item of cloudCompletions) {
        saveLocalCompletionRecord(item);
      }
      return cloudCompletions;
    }

    return localList;
  } catch {
    return localList;
  }
}

/**
 * Fetch completion history for a single task between two dates (inclusive).
 * Returns [] when Supabase is not configured or the table doesn't exist yet.
 */
export async function fetchCompletionsForTask(
  userId: string,
  taskId: string,
  startDate: string,
  endDate: string
): Promise<DailyTaskCompletion[]> {
  const supabase = getSupabase();
  if (!supabase || !userId) {
    const all = getLocalCompletions();
    return all.filter(
      (c) =>
        c.taskId === taskId &&
        c.occurrenceDate >= startDate &&
        c.occurrenceDate <= endDate
    );
  }

  const { data, error } = await supabase
    .from('daily_task_completions')
    .select('*')
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .gte('occurrence_date', startDate)
    .lte('occurrence_date', endDate)
    .order('occurrence_date', { ascending: true });

  if (error) {
    if (isSchemaMissing(error)) {
      const all = getLocalCompletions();
      return all.filter(
        (c) =>
          c.taskId === taskId &&
          c.occurrenceDate >= startDate &&
          c.occurrenceDate <= endDate
      );
    }
    logSafeError('fetchCompletionsForTask', error);
    throw new Error(formatSafeErrorMessage(error, 'Failed to fetch task completion history'));
  }

  return (data as DbDailyCompletionRow[]).map(dbRowToCompletion);
}

/**
 * Create or update (upsert) a completion record for a task on a given date.
 * Uses the UNIQUE constraint (task_id, occurrence_date) for conflict resolution.
 * Robust fallback to local storage if offline or schema unmigrated.
 */
export async function upsertTaskCompletion(
  userId: string,
  taskId: string,
  date: string,
  isCompleted: boolean
): Promise<DailyTaskCompletion> {
  const completedAt = isCompleted ? new Date().toISOString() : undefined;
  const localRecord: DailyTaskCompletion = {
    id: `local-${taskId}-${date}`,
    taskId,
    userId: userId || 'guest',
    occurrenceDate: date,
    isCompleted,
    completedAt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const supabase = getSupabase();
  if (!supabase || !userId) {
    saveLocalCompletionRecord(localRecord);
    return localRecord;
  }

  try {
    const { data, error } = await supabase
      .from('daily_task_completions')
      .upsert(
        {
          task_id: taskId,
          user_id: userId,
          occurrence_date: date,
          is_completed: isCompleted,
          completed_at: completedAt || null,
        },
        {
          onConflict: 'task_id,occurrence_date',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      if (isSchemaMissing(error)) {
        // Table not yet created in Supabase — gracefully store locally and do not crash UI
        saveLocalCompletionRecord(localRecord);
        return localRecord;
      }
      logSafeError('upsertTaskCompletion', error);
      saveLocalCompletionRecord(localRecord);
      return localRecord;
    }

    const saved = dbRowToCompletion(data as DbDailyCompletionRow);
    saveLocalCompletionRecord(saved);
    return saved;
  } catch {
    saveLocalCompletionRecord(localRecord);
    return localRecord;
  }
}

/**
 * Subscribe to real-time changes on this user's daily_task_completions rows.
 * Returns an unsubscribe function.
 * Falls back gracefully when Supabase is not configured.
 */
export function subscribeToUserCompletions(
  userId: string,
  onChange: () => void
): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`daily_completions:user:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'daily_task_completions',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        onChange();
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        logSafeError('subscribeToUserCompletions', new Error(`Realtime channel error for user ${userId}`));
      }
    });

  return () => {
    supabase.removeChannel(channel).catch(() => {});
  };
}
