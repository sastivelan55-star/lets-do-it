// LifeMap — Cloud Daily Records Service (Supabase PostgreSQL with RLS + Offline IndexedDB Mirroring)
import { getSupabase } from './supabaseClient';
import type { DailyRecord } from '../types';
import { logSafeError, extractErrorInfo } from '../utils/errorUtils';
import { getAllDailyRecords, saveDailyRecord as saveLocalDailyRecord } from '../db/storage';

export interface DbDailyRecordRow {
  id: string;
  user_id: string;
  date: string;
  tasks_completed: number;
  tasks_total: number;
  minutes_spent: number;
  reflection_note: string | null;
  mood: number | null;
  saved_at: string;
  created_at: string;
  updated_at: string;
}

export function dbRowToDailyRecord(row: DbDailyRecordRow): DailyRecord {
  return {
    date: row.date,
    tasksCompleted: row.tasks_completed ?? 0,
    tasksTotal: row.tasks_total ?? 0,
    minutesSpent: row.minutes_spent ?? 0,
    reflectionNote: row.reflection_note ?? undefined,
    mood: (row.mood as DailyRecord['mood']) ?? undefined,
    savedAt: row.saved_at || row.updated_at || row.created_at,
  };
}

export function dailyRecordToDbRow(record: DailyRecord, userId: string): Partial<DbDailyRecordRow> {
  return {
    id: `${userId}_${record.date}`,
    user_id: userId,
    date: record.date,
    tasks_completed: record.tasksCompleted ?? 0,
    tasks_total: record.tasksTotal ?? 0,
    minutes_spent: record.minutesSpent ?? 0,
    reflection_note: record.reflectionNote || null,
    mood: record.mood || null,
    saved_at: record.savedAt || new Date().toISOString(),
  };
}

// ── CRUD Operations ──────────────────────────────────────────────────────────

export async function fetchUserDailyRecords(userId: string): Promise<{ records: DailyRecord[]; isCloud: boolean }> {
  const local = await getAllDailyRecords();

  const supabase = getSupabase();
  if (!supabase || !userId) {
    return { records: local, isCloud: false };
  }

  try {
    const { data, error } = await supabase
      .from('daily_records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      const info = extractErrorInfo(error, 'Fetch daily records');
      if (info.isSchemaMissing) {
        return { records: local, isCloud: false };
      }
      logSafeError('Fetch daily records', error);
      return { records: local, isCloud: false };
    }

    if (data && data.length > 0) {
      const cloudRecords = (data as DbDailyRecordRow[]).map(dbRowToDailyRecord);
      for (const cr of cloudRecords) {
        await saveLocalDailyRecord(cr);
      }
      return { records: cloudRecords, isCloud: true };
    }

    return { records: local, isCloud: true };
  } catch (err) {
    logSafeError('Fetch daily records catch', err);
    return { records: local, isCloud: false };
  }
}

export async function saveCloudDailyRecord(record: DailyRecord, userId: string): Promise<DailyRecord> {
  await saveLocalDailyRecord(record);

  const supabase = getSupabase();
  if (!supabase || !userId) {
    return record;
  }

  try {
    const payload = dailyRecordToDbRow(record, userId);
    const { data, error } = await supabase
      .from('daily_records')
      .upsert(payload, { onConflict: 'user_id,date' })
      .select()
      .single();

    if (!error && data) {
      const saved = dbRowToDailyRecord(data as DbDailyRecordRow);
      await saveLocalDailyRecord(saved);
      return saved;
    }
  } catch (err) {
    logSafeError('saveCloudDailyRecord', err);
  }

  return record;
}

// ── Realtime Subscription ────────────────────────────────────────────────────

export function subscribeToUserDailyRecords(userId: string, onChange: () => void): () => void {
  const supabase = getSupabase();
  if (!supabase || !userId) return () => {};

  const channel = supabase
    .channel(`realtime:daily_records:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'daily_records',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        onChange();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
