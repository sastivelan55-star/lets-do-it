// Cloud Schedule Service (Supabase PostgreSQL with RLS)
import { getSupabase } from './supabaseClient';
import type { ScheduleEntry } from '../types';

export interface DbScheduleRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  date: string;
  start_time: string;
  end_time: string;
  linked_task_id: string | null;
  created_at: string;
  updated_at: string;
}

export function dbRowToSchedule(row: DbScheduleRow): ScheduleEntry {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    linkedTaskId: row.linked_task_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function scheduleToDbRow(
  schedule: Partial<ScheduleEntry>,
  userId: string
): Partial<DbScheduleRow> {
  const row: Partial<DbScheduleRow> = {
    user_id: userId,
  };

  if (schedule.id !== undefined) row.id = schedule.id;
  if (schedule.title !== undefined) row.title = schedule.title.trim();
  if (schedule.description !== undefined) row.description = schedule.description || null;
  if (schedule.date !== undefined) row.date = schedule.date;
  if (schedule.startTime !== undefined) row.start_time = schedule.startTime;
  if (schedule.endTime !== undefined) row.end_time = schedule.endTime;
  if (schedule.linkedTaskId !== undefined) row.linked_task_id = schedule.linkedTaskId || null;

  return row;
}

// ── CRUD Operations ──────────────────────────────────────────────────────────

export async function fetchUserSchedules(userId: string): Promise<ScheduleEntry[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch schedules: ${error.message}`);
  }

  return (data as DbScheduleRow[]).map(dbRowToSchedule);
}

export async function createCloudSchedule(
  scheduleData: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'> | ScheduleEntry,
  userId: string
): Promise<ScheduleEntry> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const insertPayload = scheduleToDbRow(scheduleData, userId);
  // Ensure non-UUID client ids (e.g. from local nanoid) are stripped so Postgres generates a valid UUID
  if (
    insertPayload.id &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(insertPayload.id)
  ) {
    delete insertPayload.id;
  }

  const { data, error } = await supabase
    .from('schedules')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create schedule: ${error.message}`);
  }

  return dbRowToSchedule(data as DbScheduleRow);
}

export async function updateCloudSchedule(
  schedule: ScheduleEntry,
  userId: string
): Promise<ScheduleEntry> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const updatePayload = scheduleToDbRow(schedule, userId);
  delete updatePayload.id; // Primary key should not be in update set

  const { data, error } = await supabase
    .from('schedules')
    .update(updatePayload)
    .eq('id', schedule.id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update schedule: ${error.message}`);
  }

  return dbRowToSchedule(data as DbScheduleRow);
}

export async function deleteCloudSchedule(scheduleId: string, userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', scheduleId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete schedule: ${error.message}`);
  }
}
