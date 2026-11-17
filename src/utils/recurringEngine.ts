import { parseISO } from 'date-fns';
import type { Task } from '../types';

/**
 * Checks whether a recurring rule should run on a specific target date.
 * - 'daily': runs every day.
 * - 'weekdays': runs Mon (1) through Fri (5).
 * - 'weekly': runs on the same day of the week as the template's scheduled date.
 */
export function shouldRunOnDate(
  recurringRule: 'daily' | 'weekly' | 'weekdays',
  targetDateStr: string,
  templateDateStr?: string
): boolean {
  if (!targetDateStr) return false;
  const d = parseISO(targetDateStr);
  const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  if (recurringRule === 'daily') return true;
  if (recurringRule === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (recurringRule === 'weekly') {
    if (!templateDateStr) return dayOfWeek === 1; // Default to Monday if not specified
    const tmplDate = parseISO(templateDateStr);
    return dayOfWeek === tmplDate.getDay();
  }
  return false;
}

/**
 * Checks if an occurrence of templateId already exists for targetDate.
 * Avoids duplicate generation.
 */
export function hasOccurrenceForDate(
  tasks: Task[],
  templateId: string,
  targetDate: string
): boolean {
  return tasks.some((t) => {
    if (t.isDeleted) return false;
    const taskDate = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
    if (taskDate !== targetDate) return false;
    return t.parentRecurringId === templateId;
  });
}

/**
 * Scans all recurring task templates in tasks and returns new occurrences that need to be generated for targetDate.
 * Idempotent: Never returns an occurrence if one already exists for targetDate.
 */
export function getMissingRecurringOccurrences(
  tasks: Task[],
  targetDate: string
): Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] {
  // Find recurring root templates (tasks with recurring rule, not a subtask occurrence themselves, not deleted)
  const templates = tasks.filter(
    (t) =>
      !t.isDeleted &&
      !t.parentRecurringId &&
      t.recurring &&
      t.recurring !== 'none'
  );

  const missing: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  for (const tmpl of templates) {
    const tmplDate = (tmpl.scheduledDate || tmpl.targetDate || tmpl.dueDate || '').slice(0, 10);

    // Check if targetDate matches the recurrence rule
    if (tmpl.recurring && tmpl.recurring !== 'none' && shouldRunOnDate(tmpl.recurring, targetDate, tmplDate)) {
      // Check if an occurrence already exists
      if (!hasOccurrenceForDate(tasks, tmpl.id, targetDate)) {
        missing.push({
          title: tmpl.title,
          description: tmpl.description,
          lifeArea: tmpl.lifeArea,
          projectId: tmpl.projectId,
          priority: tmpl.priority,
          status: 'not-started',
          dueDate: targetDate,
          targetDate: targetDate,
          scheduledDate: targetDate,
          plannedStartTime: tmpl.plannedStartTime,
          startTime: tmpl.startTime,
          endTime: tmpl.endTime,
          duration: tmpl.duration,
          estimatedMinutes: tmpl.estimatedMinutes,
          parentRecurringId: tmpl.id,
          recurring: tmpl.recurring,
          notes: tmpl.notes,
          isDeleted: false,
        });
      }
    }
  }

  return missing;
}

/**
 * Identifies overdue one-time tasks:
 * - scheduled date is strictly before targetDate (e.g. yesterday or earlier)
 * - status is NOT completed and NOT rescheduled
 * - not deleted
 */
export function getOverdueTasks(tasks: Task[], targetDate: string): Task[] {
  return tasks.filter((t) => {
    if (t.isDeleted) return false;
    if (t.status === 'completed' || t.status === 'rescheduled') return false;
    const taskDate = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
    return taskDate !== '' && taskDate < targetDate;
  });
}
