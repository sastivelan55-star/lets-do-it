// LifeMap — Cloud Roadmap Milestone Service (Supabase PostgreSQL with RLS + Offline IndexedDB Mirroring)
import { getSupabase } from './supabaseClient';
import type { RoadmapMilestone, MilestoneSubtask, LearningSession } from '../types';
import { logSafeError, extractErrorInfo } from '../utils/errorUtils';
import { getAllMilestones, saveMilestone as saveLocalMilestone } from '../db/storage';

export interface DbMilestoneRow {
  id: string;
  user_id: string;
  month: number;
  title: string;
  description: string | null;
  status: 'not-started' | 'in-progress' | 'completed';
  subtasks: MilestoneSubtask[] | null;
  learning_sessions: LearningSession[] | null;
  notes: string | null;
  start_date: string | null;
  target_date: string | null;
  completed_date: string | null;
  created_at: string;
  updated_at: string;
}

export function dbRowToMilestone(row: DbMilestoneRow): RoadmapMilestone {
  return {
    id: row.id,
    month: row.month,
    title: row.title,
    description: row.description ?? '',
    status: row.status,
    subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
    learningSessions: Array.isArray(row.learning_sessions) ? row.learning_sessions : [],
    notes: row.notes ?? undefined,
    startDate: row.start_date ?? undefined,
    targetDate: row.target_date ?? undefined,
    completedDate: row.completed_date ?? undefined,
  };
}

export function milestoneToDbRow(m: Partial<RoadmapMilestone>, userId: string): Partial<DbMilestoneRow> {
  const row: Partial<DbMilestoneRow> = {
    user_id: userId,
  };

  if (m.id !== undefined) row.id = m.id;
  if (m.month !== undefined) row.month = m.month;
  if (m.title !== undefined) row.title = m.title.trim();
  if (m.description !== undefined) row.description = m.description || '';
  if (m.status !== undefined) row.status = m.status;
  if (m.subtasks !== undefined) row.subtasks = m.subtasks;
  if (m.learningSessions !== undefined) row.learning_sessions = m.learningSessions;
  if (m.notes !== undefined) row.notes = m.notes || null;
  if (m.startDate !== undefined) row.start_date = m.startDate || null;
  if (m.targetDate !== undefined) row.target_date = m.targetDate || null;
  if (m.completedDate !== undefined) row.completed_date = m.completedDate || null;

  return row;
}

// ── CRUD Operations ──────────────────────────────────────────────────────────

export async function fetchUserMilestones(userId: string): Promise<{ milestones: RoadmapMilestone[]; isCloud: boolean }> {
  const local = await getAllMilestones();

  const supabase = getSupabase();
  if (!supabase || !userId) {
    return { milestones: local, isCloud: false };
  }

  try {
    const { data, error } = await supabase
      .from('roadmap_milestones')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: true });

    if (error) {
      const info = extractErrorInfo(error, 'Fetch milestones');
      if (info.isSchemaMissing) {
        return { milestones: local, isCloud: false };
      }
      logSafeError('Fetch user milestones', error);
      return { milestones: local, isCloud: false };
    }

    if (data && data.length > 0) {
      const cloudMilestones = (data as DbMilestoneRow[]).map(dbRowToMilestone);
      for (const cm of cloudMilestones) {
        await saveLocalMilestone(cm);
      }
      return { milestones: cloudMilestones, isCloud: true };
    }

    return { milestones: local, isCloud: true };
  } catch (err) {
    logSafeError('Fetch milestones catch', err);
    return { milestones: local, isCloud: false };
  }
}

export async function saveCloudMilestone(milestone: RoadmapMilestone, userId: string): Promise<RoadmapMilestone> {
  await saveLocalMilestone(milestone);

  const supabase = getSupabase();
  if (!supabase || !userId) {
    return milestone;
  }

  try {
    const payload = milestoneToDbRow(milestone, userId);
    const { data, error } = await supabase
      .from('roadmap_milestones')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (!error && data) {
      const saved = dbRowToMilestone(data as DbMilestoneRow);
      await saveLocalMilestone(saved);
      return saved;
    }
  } catch (err) {
    logSafeError('saveCloudMilestone', err);
  }

  return milestone;
}

// ── Realtime Subscription ────────────────────────────────────────────────────

export function subscribeToUserMilestones(userId: string, onChange: () => void): () => void {
  const supabase = getSupabase();
  if (!supabase || !userId) return () => {};

  const channel = supabase
    .channel(`realtime:milestones:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'roadmap_milestones',
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
