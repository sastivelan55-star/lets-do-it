// LifeMap — Cloud Project Service (Supabase PostgreSQL with RLS + Offline IndexedDB Mirroring)
import { getSupabase } from './supabaseClient';
import type { Project, ProjectStatus, ProjectTask, ProjectMilestone, TaskPriority } from '../types';
import { logSafeError, extractErrorInfo } from '../utils/errorUtils';
import { getAllProjects, saveProject as saveLocalProject, deleteProject as deleteLocalProject } from '../db/storage';

export interface DbProjectRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  goals: string[] | null;
  tasks: ProjectTask[] | null;
  milestones: ProjectMilestone[] | null;
  technologies: string[] | null;
  notes: string | null;
  repo_url: string | null;
  next_action: string | null;
  start_date: string | null;
  target_date: string | null;
  priority: TaskPriority | null;
  created_at: string;
  updated_at: string;
}

export function dbRowToProject(row: DbProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    status: row.status,
    goals: Array.isArray(row.goals) ? row.goals : [],
    tasks: Array.isArray(row.tasks) ? row.tasks : [],
    milestones: Array.isArray(row.milestones) ? row.milestones : [],
    technologies: Array.isArray(row.technologies) ? row.technologies : [],
    notes: row.notes ?? undefined,
    repoUrl: row.repo_url ?? undefined,
    nextAction: row.next_action ?? undefined,
    startDate: row.start_date ?? undefined,
    targetDate: row.target_date ?? undefined,
    priority: row.priority ?? 'medium',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function projectToDbRow(project: Partial<Project>, userId: string): Partial<DbProjectRow> {
  const row: Partial<DbProjectRow> = {
    user_id: userId,
  };

  if (project.id !== undefined) row.id = project.id;
  if (project.name !== undefined) row.name = project.name.trim();
  if (project.description !== undefined) row.description = project.description || '';
  if (project.status !== undefined) row.status = project.status;
  if (project.goals !== undefined) row.goals = project.goals;
  if (project.tasks !== undefined) row.tasks = project.tasks;
  if (project.milestones !== undefined) row.milestones = project.milestones;
  if (project.technologies !== undefined) row.technologies = project.technologies;
  if (project.notes !== undefined) row.notes = project.notes || null;
  if (project.repoUrl !== undefined) row.repo_url = project.repoUrl || null;
  if (project.nextAction !== undefined) row.next_action = project.nextAction || null;
  if (project.startDate !== undefined) row.start_date = project.startDate || null;
  if (project.targetDate !== undefined) row.target_date = project.targetDate || null;
  if (project.priority !== undefined) row.priority = project.priority || 'medium';

  return row;
}

// ── CRUD Operations ──────────────────────────────────────────────────────────

export async function fetchUserProjects(userId: string): Promise<{ projects: Project[]; isCloud: boolean }> {
  const local = await getAllProjects();

  const supabase = getSupabase();
  if (!supabase || !userId) {
    return { projects: local, isCloud: false };
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      const info = extractErrorInfo(error, 'Fetch projects');
      if (info.isSchemaMissing) {
        return { projects: local, isCloud: false };
      }
      logSafeError('Fetch user projects', error);
      return { projects: local, isCloud: false };
    }

    if (data && data.length > 0) {
      const cloudProjects = (data as DbProjectRow[]).map(dbRowToProject);
      // Mirror to local IndexedDB safely
      for (const cp of cloudProjects) {
        await saveLocalProject(cp);
      }
      return { projects: cloudProjects, isCloud: true };
    }

    // Cloud has no projects yet: if local has projects, keep them and they will sync up
    return { projects: local, isCloud: true };
  } catch (err) {
    logSafeError('Fetch projects catch', err);
    return { projects: local, isCloud: false };
  }
}

export async function createCloudProject(project: Project, userId: string): Promise<Project> {
  // 1. Mirror locally first
  await saveLocalProject(project);

  const supabase = getSupabase();
  if (!supabase || !userId) {
    return project;
  }

  try {
    const payload = projectToDbRow(project, userId);
    const { data, error } = await supabase
      .from('projects')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (!error && data) {
      const saved = dbRowToProject(data as DbProjectRow);
      await saveLocalProject(saved);
      return saved;
    }
  } catch (err) {
    logSafeError('createCloudProject', err);
  }

  return project;
}

export async function updateCloudProject(project: Project, userId: string): Promise<Project> {
  const updated: Project = { ...project, updatedAt: new Date().toISOString() };
  await saveLocalProject(updated);

  const supabase = getSupabase();
  if (!supabase || !userId) {
    return updated;
  }

  try {
    const payload = projectToDbRow(updated, userId);
    delete payload.id;
    await supabase
      .from('projects')
      .update(payload)
      .eq('id', updated.id)
      .eq('user_id', userId);
  } catch (err) {
    logSafeError('updateCloudProject', err);
  }

  return updated;
}

export async function deleteCloudProject(id: string, userId: string): Promise<void> {
  await deleteLocalProject(id);

  const supabase = getSupabase();
  if (!supabase || !userId) return;

  try {
    await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
  } catch (err) {
    logSafeError('deleteCloudProject', err);
  }
}

// ── Realtime Subscription ────────────────────────────────────────────────────

export function subscribeToUserProjects(userId: string, onChange: () => void): () => void {
  const supabase = getSupabase();
  if (!supabase || !userId) return () => {};

  const channel = supabase
    .channel(`realtime:projects:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'projects',
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
