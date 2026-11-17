// Occurrence Engine — Pure Logic Service (no DB calls, no React)
// Computes which tasks appear on a given date, merges completion state,
// and produces the daily execution summary.
import { shouldRunOnDate } from '../utils/recurringEngine';
import type { Task, DailyTaskCompletion, DailyTaskOccurrence, DailyExecutionSummary } from '../types';

/**
 * Given the full task list and all completion records already fetched for
 * `targetDate`, return the list of DailyTaskOccurrence items to display.
 *
 * Rules:
 * - Deleted tasks (isDeleted === true) are excluded.
 * - Recurring tasks (recurring set and not 'none'):
 *     • Included only if shouldRunOnDate() returns true for targetDate.
 *     • Completion state comes exclusively from the completions table.
 * - One-time tasks (no recurring, or recurring === 'none'):
 *     • Included only when scheduledDate || targetDate || dueDate matches targetDate.
 *     • Completion state: completion record first, fall back to task.status === 'completed'.
 */
export function getTasksForDate(
  tasks: Task[],
  completions: DailyTaskCompletion[],
  targetDate: string
): DailyTaskOccurrence[] {
  const occurrences: DailyTaskOccurrence[] = [];

  // Build a quick lookup: taskId → completion record for targetDate
  const completionMap = new Map<string, DailyTaskCompletion>();
  for (const c of completions) {
    if (c.occurrenceDate.slice(0, 10) === targetDate) {
      completionMap.set(c.taskId, c);
    }
  }

  for (const task of tasks) {
    // Skip soft-deleted tasks
    if (task.isDeleted) continue;

    const isRecurring = task.recurring && task.recurring !== 'none';

    let include = false;

    if (isRecurring) {
      // If recurrenceStartDate is configured, do not repeat prior to that date
      if (task.recurrenceStartDate && targetDate < task.recurrenceStartDate) {
        continue;
      }
      // For recurring tasks use shouldRunOnDate against the template's own scheduled date
      const templateDate =
        (task.scheduledDate || task.targetDate || task.dueDate || '').slice(0, 10) || undefined;
      include = shouldRunOnDate(
        task.recurring as 'daily' | 'weekly' | 'weekdays',
        targetDate,
        templateDate
      );
    } else {
      // One-time task: match if any of its date fields equal targetDate
      const taskDate = (task.scheduledDate || task.targetDate || task.dueDate || '').slice(0, 10);
      include = taskDate === targetDate;
    }

    if (!include) continue;

    // Determine completion state
    const completionRecord = completionMap.get(task.id);

    let isCompleted: boolean;
    let completedAt: string | undefined;
    let completionId: string | undefined;

    if (completionRecord) {
      // Authoritative completion record exists
      isCompleted = completionRecord.isCompleted;
      completedAt = completionRecord.completedAt;
      completionId = completionRecord.id;
    } else if (isRecurring) {
      // No completion record for recurring → not done yet
      isCompleted = false;
      completedAt = undefined;
      completionId = undefined;
    } else {
      // One-time task with no completion record — fall back to task.status
      isCompleted = task.status === 'completed';
      completedAt = task.completedAt;
      completionId = undefined;
    }

    occurrences.push({
      taskId: task.id,
      title: task.title,
      lifeArea: task.lifeArea,
      priority: task.priority,
      recurring: task.recurring,
      startTime: task.startTime,
      endTime: task.endTime,
      estimatedMinutes: task.estimatedMinutes,
      notes: task.notes,
      projectId: task.projectId,
      occurrenceDate: targetDate,
      isCompleted,
      completedAt,
      completionId,
      originalTask: task,
    });
  }

  return occurrences;
}

/**
 * Compute high-level daily stats from the occurrence list.
 * Supports both signatures:
 * - computeDailySummary(occurrences, date?)
 * - computeDailySummary(date, occurrences)
 */
export function computeDailySummary(
  arg1: DailyTaskOccurrence[] | string,
  arg2?: DailyTaskOccurrence[] | string
): DailyExecutionSummary {
  let date: string;
  let occurrences: DailyTaskOccurrence[];

  if (typeof arg1 === 'string') {
    date = arg1;
    occurrences = Array.isArray(arg2) ? arg2 : [];
  } else {
    occurrences = Array.isArray(arg1) ? arg1 : [];
    date =
      typeof arg2 === 'string'
        ? arg2
        : occurrences.length > 0
        ? occurrences[0].occurrenceDate
        : new Date().toISOString().slice(0, 10);
  }

  const total = occurrences.length;
  const completed = occurrences.filter((o) => o.isCompleted).length;
  const pending = total - completed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { date, total, completed, pending, percentage };
}

/**
 * Identify overdue one-time tasks:
 * - scheduled date is strictly before targetDate
 * - status is NOT completed and NOT rescheduled
 * - not deleted and not recurring
 */
export function getOverdueTasksForDate(tasks: Task[], targetDate: string): Task[] {
  return tasks.filter((t) => {
    if (t.isDeleted) return false;
    if (t.recurring && t.recurring !== 'none') return false;
    if (t.status === 'completed' || t.status === 'rescheduled') return false;
    const taskDate = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
    return taskDate !== '' && taskDate < targetDate;
  });
}

/**
 * Identify unscheduled backlog tasks:
 * - no date set or empty
 * - not completed, not deleted, not recurring
 */
export function getUnscheduledTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => {
    if (t.isDeleted) return false;
    if (t.recurring && t.recurring !== 'none') return false;
    if (t.status === 'completed') return false;
    const taskDate = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
    return !taskDate;
  });
}

/**
 * Identify upcoming tasks scheduled after targetDate:
 */
export function getUpcomingTasksForDate(tasks: Task[], targetDate: string): Task[] {
  return tasks
    .filter((t) => {
      if (t.isDeleted) return false;
      if (t.recurring && t.recurring !== 'none') return false;
      const taskDate = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
      return taskDate !== '' && taskDate > targetDate;
    })
    .sort((a, b) => {
      const da = (a.scheduledDate || a.targetDate || a.dueDate || '').slice(0, 10);
      const db = (b.scheduledDate || b.targetDate || b.dueDate || '').slice(0, 10);
      return da.localeCompare(db);
    });
}
