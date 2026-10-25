// Cloud Task Service (Supabase PostgreSQL with RLS)
import { getSupabase } from './supabaseClient';
import type { Task, LifeArea, TaskPriority, TaskStatus } from '../types';
import { formatSafeErrorMessage, logSafeError } from '../utils/errorUtils';

export interface DbTaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  area: LifeArea;
  project_id: string | null;
  due_date: string | null;
  planned_start: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  priority: TaskPriority;
  status: TaskStatus;
  recurring_rule: string | null;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  parent_id?: string | null;
  order_index?: number | null;
  is_deleted?: boolean | null;
  deleted_at?: string | null;
}

export function dbRowToTask(row: DbTaskRow): Task {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    lifeArea: row.area,
    projectId: row.project_id ?? undefined,
    dueDate: row.due_date ?? new Date().toISOString().slice(0, 10),
    plannedStartTime: row.planned_start ?? undefined,
    priority: row.priority,
    status: row.status,
    estimatedMinutes: row.estimated_minutes ?? undefined,
    actualMinutes: row.actual_minutes ?? undefined,
    notes: row.notes ?? undefined,
    recurring: (row.recurring_rule as Task['recurring']) ?? undefined,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    parentId: row.parent_id ?? undefined,
    orderIndex: row.order_index ?? 0,
    isDeleted: Boolean(row.is_deleted),
    deletedAt: row.deleted_at ?? undefined,
  };
}

export function taskToDbRow(task: Partial<Task>, userId: string): Partial<DbTaskRow> {
  const row: Partial<DbTaskRow> = {
    user_id: userId,
  };

  if (task.id !== undefined) row.id = task.id;
  if (task.title !== undefined) row.title = task.title.trim();
  if (task.description !== undefined) row.description = task.description || null;
  if (task.lifeArea !== undefined) row.area = task.lifeArea;
  if (task.projectId !== undefined) row.project_id = task.projectId || null;
  if (task.dueDate !== undefined) row.due_date = task.dueDate || null;
  if (task.plannedStartTime !== undefined) row.planned_start = task.plannedStartTime || null;
  if (task.estimatedMinutes !== undefined) {
    row.estimated_minutes = typeof task.estimatedMinutes === 'number' && !isNaN(task.estimatedMinutes)
      ? Math.max(0, Math.round(task.estimatedMinutes))
      : null;
  }
  if (task.actualMinutes !== undefined) {
    row.actual_minutes = typeof task.actualMinutes === 'number' && !isNaN(task.actualMinutes)
      ? Math.max(0, Math.round(task.actualMinutes))
      : null;
  }
  if (task.priority !== undefined) row.priority = task.priority;
  if (task.status !== undefined) {
    row.status = task.status;
    if (task.status === 'completed') {
      row.completed_at = task.completedAt || new Date().toISOString();
    } else {
      row.completed_at = null;
    }
  } else if (task.completedAt !== undefined) {
    row.completed_at = task.completedAt || null;
  }
  if (task.recurring !== undefined) row.recurring_rule = task.recurring || null;
  if (task.notes !== undefined) row.notes = task.notes || null;
  if (task.parentId !== undefined) row.parent_id = task.parentId || null;
  if (task.orderIndex !== undefined) row.order_index = task.orderIndex ?? 0;
  if (task.isDeleted !== undefined) row.is_deleted = task.isDeleted;
  if (task.deletedAt !== undefined) row.deleted_at = task.deletedAt || null;

  return row;
}

// ── CRUD Operations ──────────────────────────────────────────────────────────

export async function fetchUserTasks(userId: string): Promise<Task[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    logSafeError('Fetch tasks', error);
    throw new Error(formatSafeErrorMessage(error, 'Failed to fetch tasks'));
  }

  return (data as DbTaskRow[]).map(dbRowToTask);
}

export async function createCloudTask(
  taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> | Task,
  userId: string
): Promise<Task> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const insertPayload = taskToDbRow(taskData, userId);
  // Ensure non-UUID client ids (e.g. from local nanoid) are stripped so Postgres generates a valid UUID
  if (insertPayload.id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(insertPayload.id)) {
    delete insertPayload.id;
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    logSafeError('Create task', error);
    if (error.message?.includes('parent_id') || error.message?.includes('order_index')) {
      throw new Error(
        "Database migration required: 'parent_id' or 'order_index' column is missing in Supabase. Run the SQL migration in supabase/migrations/20261023000000_add_task_hierarchy_and_order.sql."
      );
    }
    throw new Error(formatSafeErrorMessage(error, 'Failed to create task'));
  }

  return dbRowToTask(data as DbTaskRow);
}

export async function updateCloudTask(task: Task, userId: string): Promise<Task> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const updatePayload = taskToDbRow(task, userId);
  delete updatePayload.id; // Primary key should not be in update set

  const { data, error } = await supabase
    .from('tasks')
    .update(updatePayload)
    .eq('id', task.id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    logSafeError('Update task', error);
    if (error.message?.includes('parent_id') || error.message?.includes('order_index')) {
      throw new Error(
        "Database migration required: 'parent_id' or 'order_index' column is missing in Supabase. Run the SQL migration in supabase/migrations/20261023000000_add_task_hierarchy_and_order.sql."
      );
    }
    throw new Error(formatSafeErrorMessage(error, 'Failed to update task'));
  }

  return dbRowToTask(data as DbTaskRow);
}

export async function deleteCloudTask(taskId: string, userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId);

  if (error) {
    logSafeError('Delete task', error);
    throw new Error(formatSafeErrorMessage(error, 'Failed to delete task'));
  }
}

export async function softDeleteCloudTasks(
  taskIds: string[],
  userId: string,
  deletedAt: string
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');
  if (taskIds.length === 0) return;

  const { error } = await supabase
    .from('tasks')
    .update({ is_deleted: true, deleted_at: deletedAt })
    .in('id', taskIds)
    .eq('user_id', userId);

  if (error) {
    logSafeError('Soft delete tasks', error);
    throw new Error(formatSafeErrorMessage(error, 'Failed to move tasks to Recycle Bin'));
  }
}

export async function restoreCloudTasks(
  restores: { id: string; parentId?: string | null }[],
  userId: string
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');
  if (restores.length === 0) return;

  const promises = restores.map((item) => {
    const patch: { is_deleted: boolean; deleted_at: null; parent_id?: string | null } = {
      is_deleted: false,
      deleted_at: null,
    };
    if (item.parentId !== undefined) {
      patch.parent_id = item.parentId;
    }
    return supabase
      .from('tasks')
      .update(patch)
      .eq('id', item.id)
      .eq('user_id', userId);
  });

  const results = await Promise.allSettled(promises);
  for (const res of results) {
    if (res.status === 'rejected') {
      logSafeError('Restore tasks', res.reason);
      throw new Error('Failed to restore tasks from Recycle Bin');
    }
  }
}

export async function permanentDeleteCloudTasks(
  taskIds: string[],
  userId: string
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');
  if (taskIds.length === 0) return;

  const { error } = await supabase
    .from('tasks')
    .delete()
    .in('id', taskIds)
    .eq('user_id', userId);

  if (error) {
    logSafeError('Permanent delete tasks', error);
    throw new Error(formatSafeErrorMessage(error, 'Failed to permanently delete tasks'));
  }
}

export async function emptyCloudRecycleBin(userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('user_id', userId)
    .eq('is_deleted', true);

  if (error) {
    logSafeError('Empty cloud recycle bin', error);
    throw new Error(formatSafeErrorMessage(error, 'Failed to empty Recycle Bin'));
  }
}

export async function updateCloudTaskOrder(
  updates: { id: string; orderIndex: number }[],
  userId: string
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');
  if (updates.length === 0) return;

  const promises = updates.map((u) =>
    supabase
      .from('tasks')
      .update({ order_index: u.orderIndex })
      .eq('id', u.id)
      .eq('user_id', userId)
  );

  const results = await Promise.allSettled(promises);
  for (const res of results) {
    if (res.status === 'rejected') {
      logSafeError('Update task order', res.reason);
      throw new Error('Failed to update task order in cloud');
    }
  }
}

// ── Realtime subscription ────────────────────────────────────────────────────

export function subscribeToUserTasks(userId: string, onChange: () => void): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`realtime:tasks:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
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

// ── Optional Starter Tasks for Onboarding ────────────────────────────────────

export const STARTER_TASKS: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Solve 1 LeetCode medium array/hashmap problem',
    lifeArea: 'technical',
    priority: 'high',
    status: 'not-started',
    dueDate: new Date().toISOString().slice(0, 10),
    plannedStartTime: '06:45',
    estimatedMinutes: 30,
    notes: 'Focus on time & space complexity analysis.',
  },
  {
    title: 'English speaking: record 3-min audio on daily goal',
    lifeArea: 'communication',
    priority: 'medium',
    status: 'not-started',
    dueDate: new Date().toISOString().slice(0, 10),
    plannedStartTime: '06:20',
    estimatedMinutes: 25,
    notes: 'Speak clearly, no filler words, listen to playback.',
  },
  {
    title: 'Work on Temple Management System project backend',
    lifeArea: 'technical',
    priority: 'critical',
    status: 'not-started',
    dueDate: new Date().toISOString().slice(0, 10),
    plannedStartTime: '18:00',
    estimatedMinutes: 90,
    notes: 'Build Spring Boot REST endpoints for devotee booking.',
  },
  {
    title: 'Update GitHub README and push today’s commit',
    lifeArea: 'career',
    priority: 'medium',
    status: 'not-started',
    dueDate: new Date().toISOString().slice(0, 10),
    plannedStartTime: '20:30',
    estimatedMinutes: 20,
    notes: 'Keep the green contribution streak consistent.',
  },
  {
    title: 'Evening reflection & outline tomorrow’s top 3 tasks',
    lifeArea: 'health',
    priority: 'low',
    status: 'not-started',
    dueDate: new Date().toISOString().slice(0, 10),
    plannedStartTime: '21:30',
    estimatedMinutes: 15,
    notes: 'Wind down, 8 hours of sleep tonight.',
  },
];

export async function seedStarterTasks(userId: string): Promise<Task[]> {
  const created: Task[] = [];
  for (const item of STARTER_TASKS) {
    const task = await createCloudTask(item, userId);
    created.push(task);
  }
  return created;
}
