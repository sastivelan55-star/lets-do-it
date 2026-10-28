// Communication Session Service — Practice and Attendance Tracking
import { getSupabase } from './supabaseClient';
import type { CommunicationSession } from '../types';
import { logSafeError } from '../utils/errorUtils';
import { getAllFromStore, saveToStore, deleteFromStore } from '../db/storage';
import { nanoid } from '../utils/nanoid';

const DB_STORE = 'communicationEntries';

export interface DbCommunicationSessionRow {
  id: string;
  user_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
  activity_type: string;
  topic: string;
  description: string | null;
  notes: string | null;
  attendance_status: string;
  completion_status: string;
  created_at: string;
  updated_at: string;
}

export function dbRowToSession(row: DbCommunicationSessionRow): CommunicationSession {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    startTime: row.start_time ?? undefined,
    endTime: row.end_time ?? undefined,
    durationMinutes: row.duration_minutes ?? 30,
    activityType: (row.activity_type as CommunicationSession['activityType']) || 'speaking',
    topic: row.topic,
    description: row.description ?? undefined,
    notes: row.notes ?? undefined,
    attendanceStatus: (row.attendance_status as CommunicationSession['attendanceStatus']) || 'attended',
    completionStatus: (row.completion_status as CommunicationSession['completionStatus']) || 'completed',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function sessionToDbRow(session: Partial<CommunicationSession>, userId: string): Partial<DbCommunicationSessionRow> {
  const row: Partial<DbCommunicationSessionRow> = {
    user_id: userId,
  };

  if (session.id !== undefined) row.id = session.id;
  if (session.date !== undefined) row.date = session.date;
  if (session.startTime !== undefined) row.start_time = session.startTime || null;
  if (session.endTime !== undefined) row.end_time = session.endTime || null;
  if (session.durationMinutes !== undefined) row.duration_minutes = Math.max(0, session.durationMinutes);
  if (session.activityType !== undefined) row.activity_type = session.activityType;
  if (session.topic !== undefined) row.topic = session.topic.trim();
  if (session.description !== undefined) row.description = session.description || null;
  if (session.notes !== undefined) row.notes = session.notes || null;
  if (session.attendanceStatus !== undefined) row.attendance_status = session.attendanceStatus;
  if (session.completionStatus !== undefined) row.completion_status = session.completionStatus;

  return row;
}

export async function fetchUserCommunicationSessions(userId: string): Promise<CommunicationSession[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return getAllFromStore<CommunicationSession>(DB_STORE);
  }

  try {
    const { data, error } = await supabase
      .from('communication_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      logSafeError('fetchUserCommunicationSessions', error);
      return getAllFromStore<CommunicationSession>(DB_STORE);
    }

    const sessions = (data as DbCommunicationSessionRow[]).map(dbRowToSession);
    // Cache in local IndexedDB
    for (const s of sessions) {
      await saveToStore(DB_STORE, s);
    }
    return sessions;
  } catch (err) {
    logSafeError('fetchUserCommunicationSessions.catch', err);
    return getAllFromStore<CommunicationSession>(DB_STORE);
  }
}

export async function createCommunicationSession(
  session: Omit<CommunicationSession, 'id' | 'createdAt' | 'updatedAt'>,
  userId?: string
): Promise<CommunicationSession> {
  const now = new Date().toISOString();
  const id = nanoid();
  const fullSession: CommunicationSession = {
    ...session,
    id,
    userId,
    createdAt: now,
    updatedAt: now,
  };

  const supabase = getSupabase();
  if (supabase && userId) {
    const dbRow = sessionToDbRow(fullSession, userId);
    const { data, error } = await supabase
      .from('communication_sessions')
      .insert(dbRow)
      .select()
      .single();

    if (!error && data) {
      const created = dbRowToSession(data as DbCommunicationSessionRow);
      await saveToStore(DB_STORE, created);
      return created;
    }
  }

  // Local persistence fallback
  await saveToStore(DB_STORE, fullSession);
  return fullSession;
}

export async function updateCommunicationSession(
  session: CommunicationSession,
  userId?: string
): Promise<CommunicationSession> {
  const updated: CommunicationSession = {
    ...session,
    updatedAt: new Date().toISOString(),
  };

  const supabase = getSupabase();
  if (supabase && userId) {
    const dbRow = sessionToDbRow(updated, userId);
    await supabase
      .from('communication_sessions')
      .update(dbRow)
      .eq('id', session.id)
      .eq('user_id', userId);
  }

  await saveToStore(DB_STORE, updated);
  return updated;
}

export async function deleteCommunicationSession(
  id: string,
  userId?: string
): Promise<void> {
  const supabase = getSupabase();
  if (supabase && userId) {
    await supabase
      .from('communication_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
  }

  await deleteFromStore(DB_STORE, id);
}
