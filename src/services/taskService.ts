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
  roadmap_month?: number | null;
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
  is_starred?: boolean | null;
  list_id?: string | null;
  recurrence_start_date?: string | null;
  reminder_date?: string | null;
  reminder_time?: string | null;
  reminder_enabled?: boolean | null;
  inline_subtasks?: any;
}

export function dbRowToTask(row: DbTaskRow): Task {
  const assignedDate = row.due_date ?? new Date().toISOString().slice(0, 10);
  
  // Safely extract metadata if encoded in notes
  let parentRecurringId: string | undefined = undefined;
  let isStarred: boolean = Boolean(row.is_starred);
  let listId: string | undefined = row.list_id ?? undefined;
  let recurrenceStartDate: string | undefined = row.recurrence_start_date ?? undefined;
  let reminderDate: string | undefined = row.reminder_date ?? undefined;
  let reminderTime: string | undefined = row.reminder_time ?? undefined;
  let reminderEnabled: boolean = Boolean(row.reminder_enabled);
  let inlineSubtasks: { id: string; title: string; completed: boolean }[] | undefined =
    Array.isArray(row.inline_subtasks) ? row.inline_subtasks : undefined;

  let cleanNotes = row.notes ?? undefined;

  let isRoutine: boolean | undefined = undefined;
  let isRoutineActive: boolean | undefined = undefined;
  let lastCompletedDate: string | undefined = undefined;

  if (row.notes) {
    if (row.notes.includes('[recur_parent:')) {
      const match = row.notes.match(/\[recur_parent:([^\]]+)\]/);
      if (match) {
        parentRecurringId = match[1];
        cleanNotes = cleanNotes?.replace(/\[recur_parent:[^\]]+\]\s?/, '');
      }
    }
    if (row.notes.includes('[starred:true]')) {
      isStarred = true;
      cleanNotes = cleanNotes?.replace(/\[starred:true\]\s?/, '');
    }
    if (row.notes.includes('[list:')) {
      const match = row.notes.match(/\[list:([^\]]+)\]/);
      if (match) {
        listId = match[1];
        cleanNotes = cleanNotes?.replace(/\[list:[^\]]+\]\s?/, '');
      }
    }
    if (row.notes.includes('[recur_start:')) {
      const match = row.notes.match(/\[recur_start:([^\]]+)\]/);
      if (match) {
        recurrenceStartDate = match[1];
        cleanNotes = cleanNotes?.replace(/\[recur_start:[^\]]+\]\s?/, '');
      }
    }
    if (row.notes.includes('[reminder:')) {
      const match = row.notes.match(/\[reminder:([^:]+):([^\]]+)\]/);
      if (match) {
        reminderDate = match[1];
        reminderTime = match[2];
        reminderEnabled = true;
        cleanNotes = cleanNotes?.replace(/\[reminder:[^\]]+\]\s?/, '');
      }
    }
    if (row.notes.includes('[routine:true]')) {
      isRoutine = true;
      cleanNotes = cleanNotes?.replace(/\[routine:true\]\s?/, '');
    }
    if (row.notes.includes('[routine_active:false]')) {
      isRoutineActive = false;
      cleanNotes = cleanNotes?.replace(/\[routine_active:false\]\s?/, '');
    }
    if (row.notes.includes('[last_done:')) {
      const match = row.notes.match(/\[last_done:([^\]]+)\]/);
      if (match) {
        lastCompletedDate = match[1];
        cleanNotes = cleanNotes?.replace(/\[last_done:[^\]]+\]\s?/, '');
      }
    }
    if (cleanNotes) {
      cleanNotes = cleanNotes.trim() || undefined;
    }
  }

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    lifeArea: row.area,
    projectId: row.project_id ?? undefined,
    roadmapMonth: typeof row.roadmap_month === 'number' ? row.roadmap_month : undefined,
    dueDate: assignedDate,
    targetDate: assignedDate,
    scheduledDate: assignedDate,
    plannedStartTime: row.planned_start ?? undefined,
    startTime: row.planned_start ?? undefined,
    timetablePosition: row.order_index ?? undefined,
    priority: row.priority,
    status: row.status,
    estimatedMinutes: row.estimated_minutes ?? undefined,
    actualMinutes: row.actual_minutes ?? undefined,
    notes: cleanNotes,
    recurring: (row.recurring_rule as Task['recurring']) ?? undefined,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    parentId: row.parent_id ?? undefined,
    parentRecurringId: parentRecurringId,
    orderIndex: row.order_index ?? 0,
    isDeleted: Boolean(row.is_deleted),
    deletedAt: row.deleted_at ?? undefined,
    isStarred,
    listId,
    recurrenceStartDate,
    reminderDate,
    reminderTime,
    reminderEnabled,
    inlineSubtasks,
    isRoutine,
    isRoutineActive,
    lastCompletedDate,
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
  if (task.roadmapMonth !== undefined) row.roadmap_month = typeof task.roadmapMonth === 'number' ? task.roadmapMonth : null;
  const assignedDate = task.scheduledDate || task.targetDate || task.dueDate;
  if (assignedDate !== undefined) row.due_date = assignedDate || null;
  const start = task.startTime !== undefined ? task.startTime : task.plannedStartTime;
  if (start !== undefined) row.planned_start = start || null;
  if (task.timetablePosition !== undefined) row.order_index = task.timetablePosition;
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
  
  // Combine notes and metadata tags
  let finalNotes = task.notes || '';
  if (task.parentRecurringId && !finalNotes.includes(`[recur_parent:${task.parentRecurringId}]`)) {
    finalNotes = `[recur_parent:${task.parentRecurringId}] ${finalNotes}`.trim();
  }
  if (task.isStarred && !finalNotes.includes('[starred:true]')) {
    finalNotes = `[starred:true] ${finalNotes}`.trim();
  }
  if (task.listId && !finalNotes.includes(`[list:${task.listId}]`)) {
    finalNotes = `[list:${task.listId}] ${finalNotes}`.trim();
  }
  if (task.recurrenceStartDate && !finalNotes.includes(`[recur_start:${task.recurrenceStartDate}]`)) {
    finalNotes = `[recur_start:${task.recurrenceStartDate}] ${finalNotes}`.trim();
  }
  if (task.reminderEnabled && task.reminderDate && task.reminderTime && !finalNotes.includes(`[reminder:${task.reminderDate}:${task.reminderTime}]`)) {
    finalNotes = `[reminder:${task.reminderDate}:${task.reminderTime}] ${finalNotes}`.trim();
  }
  if (task.isRoutine && !finalNotes.includes('[routine:true]')) {
    finalNotes = `[routine:true] ${finalNotes}`.trim();
  }
  if (task.isRoutineActive === false && !finalNotes.includes('[routine_active:false]')) {
    finalNotes = `[routine_active:false] ${finalNotes}`.trim();
  }
  if (task.lastCompletedDate && !finalNotes.includes(`[last_done:${task.lastCompletedDate}]`)) {
    finalNotes = `[last_done:${task.lastCompletedDate}] ${finalNotes}`.trim();
  }
  row.notes = finalNotes || null;

  if (task.parentId !== undefined) row.parent_id = task.parentId || null;
  if (task.orderIndex !== undefined) row.order_index = task.orderIndex ?? 0;
  if (task.isDeleted !== undefined) row.is_deleted = task.isDeleted;
  if (task.deletedAt !== undefined) row.deleted_at = task.deletedAt || null;
  if (task.isStarred !== undefined) row.is_starred = task.isStarred;
  if (task.listId !== undefined) row.list_id = task.listId || null;
  if (task.recurrenceStartDate !== undefined) row.recurrence_start_date = task.recurrenceStartDate || null;
  if (task.reminderDate !== undefined) row.reminder_date = task.reminderDate || null;
  if (task.reminderTime !== undefined) row.reminder_time = task.reminderTime || null;
  if (task.reminderEnabled !== undefined) row.reminder_enabled = task.reminderEnabled;
  if (task.inlineSubtasks !== undefined) row.inline_subtasks = task.inlineSubtasks;

  return row;
}

// ── Schema Fallback Helpers ──────────────────────────────────────────────────

const EXTENSION_COLUMNS: ReadonlyArray<keyof DbTaskRow> = [
  'parent_id',
  'order_index',
  'is_deleted',
  'deleted_at',
  'is_starred',
  'list_id',
  'recurrence_start_date',
  'reminder_date',
  'reminder_time',
  'reminder_enabled',
  'inline_subtasks',
];

function isMissingColumnError(error: { message?: string; code?: string }): boolean {
  const msg = (error.message || '').toLowerCase();
  return (
    error.code === 'PGRST204' ||
    error.code === '42703' ||
    msg.includes('column') ||
    msg.includes('schema cache')
  );
}

function stripExtensionColumns(payload: Partial<DbTaskRow>): Partial<DbTaskRow> {
  const stripped = { ...payload };
  for (const col of EXTENSION_COLUMNS) {
    delete stripped[col];
  }
  return stripped;
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
    if (isMissingColumnError(error)) {
      const fallbackPayload = stripExtensionColumns(insertPayload);
      const { data: retryData, error: retryError } = await supabase
        .from('tasks')
        .insert(fallbackPayload)
        .select()
        .single();

      if (!retryError && retryData) {
        return dbRowToTask(retryData as DbTaskRow);
      }
      logSafeError('Create task (fallback)', retryError || error);
      throw new Error(formatSafeErrorMessage(retryError || error, 'Failed to create task'));
    }
    logSafeError('Create task', error);
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
    if (isMissingColumnError(error)) {
      const fallbackPayload = stripExtensionColumns(updatePayload);
      const { data: retryData, error: retryError } = await supabase
        .from('tasks')
        .update(fallbackPayload)
        .eq('id', task.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (!retryError && retryData) {
        return dbRowToTask(retryData as DbTaskRow);
      }
      logSafeError('Update task (fallback)', retryError || error);
      throw new Error(formatSafeErrorMessage(retryError || error, 'Failed to update task'));
    }
    logSafeError('Update task', error);
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

// ── Custom Task Lists CRUD (Cloud + Local Fallback) ──────────────────────────

import type { CustomTaskList } from '../types';

const LOCAL_CUSTOM_LISTS_KEY = 'lifeos.custom_task_lists.v1';

export const DEFAULT_CUSTOM_LISTS: CustomTaskList[] = [
  { id: 'list-personal', name: 'Personal', color: '#ec4899', icon: 'User', orderIndex: 0 },
  { id: 'list-college', name: 'College & Academics', color: '#38bdf8', icon: 'GraduationCap', orderIndex: 1 },
  { id: 'list-projects', name: 'Projects', color: '#6366f1', icon: 'FolderGit2', orderIndex: 2 },
  { id: 'list-learning', name: 'Learning & Skills', color: '#10b981', icon: 'BookOpen', orderIndex: 3 },
  { id: 'list-health', name: 'Health & Routines', color: '#f59e0b', icon: 'Heart', orderIndex: 4 },
];

function getStoredCustomLists(): CustomTaskList[] {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_LISTS_KEY);
    if (!raw) return DEFAULT_CUSTOM_LISTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CUSTOM_LISTS;
  } catch {
    return DEFAULT_CUSTOM_LISTS;
  }
}

function persistStoredCustomLists(lists: CustomTaskList[]): void {
  try {
    localStorage.setItem(LOCAL_CUSTOM_LISTS_KEY, JSON.stringify(lists));
  } catch {
    // ignore
  }
}

export async function fetchUserCustomLists(userId?: string): Promise<CustomTaskList[]> {
  const local = getStoredCustomLists();
  const supabase = getSupabase();
  if (!supabase || !userId) return local;

  try {
    const { data, error } = await supabase
      .from('custom_task_lists')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (error) {
      logSafeError('Fetch custom lists', error);
      return local;
    }

    if (data && data.length > 0) {
      const cloudLists: CustomTaskList[] = data.map((d: any) => ({
        id: d.id,
        name: d.name,
        color: d.color,
        icon: d.icon,
        orderIndex: d.order_index,
        userId: d.user_id,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
      persistStoredCustomLists(cloudLists);
      return cloudLists;
    }

    return local;
  } catch {
    return local;
  }
}

export async function saveUserCustomList(list: CustomTaskList, userId?: string): Promise<CustomTaskList> {
  const current = getStoredCustomLists();
  const existingIdx = current.findIndex((l) => l.id === list.id);
  const updatedList = { ...list, updatedAt: new Date().toISOString() };
  if (existingIdx >= 0) {
    current[existingIdx] = updatedList;
  } else {
    current.push(updatedList);
  }
  persistStoredCustomLists(current);

  const supabase = getSupabase();
  if (supabase && userId) {
    try {
      const payload: any = {
        id: list.id,
        user_id: userId,
        name: list.name,
        color: list.color,
        icon: list.icon || 'ListTodo',
        order_index: list.orderIndex ?? 0,
      };
      await supabase.from('custom_task_lists').upsert(payload);
    } catch (err) {
      logSafeError('Save custom list cloud', err);
    }
  }

  return updatedList;
}

export async function deleteUserCustomList(listId: string, userId?: string): Promise<void> {
  const current = getStoredCustomLists();
  const filtered = current.filter((l) => l.id !== listId);
  persistStoredCustomLists(filtered);

  const supabase = getSupabase();
  if (supabase && userId) {
    try {
      await supabase.from('custom_task_lists').delete().eq('id', listId).eq('user_id', userId);
    } catch (err) {
      logSafeError('Delete custom list cloud', err);
    }
  }
}
