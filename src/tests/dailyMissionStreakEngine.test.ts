import { describe, it, expect } from 'vitest';
import {
  calculateStreak,
  isDateQualified,
  getCompletedTaskCountForDate,
} from '../utils/streakEngine';
import {
  shouldRunOnDate,
  hasOccurrenceForDate,
  getMissingRecurringOccurrences,
  getOverdueTasks,
} from '../utils/recurringEngine';
import { taskToDbRow, dbRowToTask } from '../services/taskService';
import type { Task } from '../types';

function createMockTask(overrides: Partial<Task>): Task {
  return {
    id: overrides.id || 'task-' + Math.random().toString(36).slice(2, 9),
    title: overrides.title || 'Mock Task',
    status: overrides.status || 'not-started',
    priority: overrides.priority || 'medium',
    lifeArea: overrides.lifeArea || 'growth',
    dueDate: overrides.dueDate || '2026-11-16',
    createdAt: overrides.createdAt || '2026-11-01T00:00:00Z',
    updatedAt: overrides.updatedAt || '2026-11-01T00:00:00Z',
    ...overrides,
  };
}

describe('Intelligent Streak Engine', () => {
  it('qualifies a date when completed task count meets or exceeds daily goal', () => {
    const tasks: Task[] = [
      createMockTask({
        id: 't1',
        title: 'Task 1',
        status: 'completed',
        completedAt: '2026-11-15T10:00:00.000Z',
      }),
      createMockTask({
        id: 't2',
        title: 'Task 2',
        status: 'completed',
        completedAt: '2026-11-15T14:00:00.000Z',
      }),
    ];

    expect(getCompletedTaskCountForDate('2026-11-15', tasks)).toBe(2);
    expect(isDateQualified('2026-11-15', tasks, [], 2)).toBe(true);
    expect(isDateQualified('2026-11-15', tasks, [], 3)).toBe(false);
  });

  it('increments streak across consecutive qualified calendar days', () => {
    const tasks: Task[] = [
      createMockTask({ id: '1', title: 'Task', status: 'completed', completedAt: '2026-11-13T10:00:00Z' }),
      createMockTask({ id: '2', title: 'Task', status: 'completed', completedAt: '2026-11-14T10:00:00Z' }),
      createMockTask({ id: '3', title: 'Task', status: 'completed', completedAt: '2026-11-15T10:00:00Z' }),
    ];

    const result = calculateStreak(tasks, [], 1, 0, '2026-11-15');
    expect(result.currentStreak).toBe(3);
    expect(result.todayQualified).toBe(true);
    expect(result.bestStreak).toBe(3);
  });

  it('keeps streak alive on current day even before today is qualified (grace period)', () => {
    const tasks: Task[] = [
      createMockTask({ id: '1', title: 'Task', status: 'completed', completedAt: '2026-11-15T10:00:00Z' }),
    ];

    const result = calculateStreak(tasks, [], 1, 0, '2026-11-16');
    expect(result.currentStreak).toBe(1);
    expect(result.todayQualified).toBe(false);
  });

  it('resets current streak to 0 if yesterday was missed and today is not qualified', () => {
    const tasks: Task[] = [
      createMockTask({ id: '1', title: 'Task', status: 'completed', completedAt: '2026-11-13T10:00:00Z' }),
    ];

    const result = calculateStreak(tasks, [], 1, 5, '2026-11-16');
    expect(result.currentStreak).toBe(0);
    // All-time best streak must NEVER decrease
    expect(result.bestStreak).toBe(5);
    expect(result.flameIntensity).toBe('cold');
  });

  it('never decreases all-time best streak when current streak resets or is lower', () => {
    const tasks: Task[] = [
      createMockTask({ id: '1', title: 'Task', status: 'completed', completedAt: '2026-11-16T10:00:00Z' }),
    ];

    const result = calculateStreak(tasks, [], 1, 12, '2026-11-16');
    expect(result.currentStreak).toBe(1);
    expect(result.bestStreak).toBe(12);
  });

  it('updates best streak when current streak surpasses previous record', () => {
    const tasks: Task[] = [
      createMockTask({ id: '1', title: 'Task', status: 'completed', completedAt: '2026-11-14T10:00:00Z' }),
      createMockTask({ id: '2', title: 'Task', status: 'completed', completedAt: '2026-11-15T10:00:00Z' }),
      createMockTask({ id: '3', title: 'Task', status: 'completed', completedAt: '2026-11-16T10:00:00Z' }),
    ];

    const result = calculateStreak(tasks, [], 1, 2, '2026-11-16');
    expect(result.currentStreak).toBe(3);
    expect(result.bestStreak).toBe(3);
  });

  it('calculates proper flame intensities based on streak length', () => {
    expect(calculateStreak([], [], 1, 0, '2026-11-16').flameIntensity).toBe('cold');

    // 1-2 days -> warm
    const oneDay: Task[] = [createMockTask({ id: '1', title: 'T', status: 'completed', completedAt: '2026-11-16T10:00:00Z' })];
    expect(calculateStreak(oneDay, [], 1, 0, '2026-11-16').flameIntensity).toBe('warm');

    // 3-6 days -> blazing
    const threeDays: Task[] = [
      createMockTask({ id: '1', title: 'T', status: 'completed', completedAt: '2026-11-14T10:00:00Z' }),
      createMockTask({ id: '2', title: 'T', status: 'completed', completedAt: '2026-11-15T10:00:00Z' }),
      createMockTask({ id: '3', title: 'T', status: 'completed', completedAt: '2026-11-16T10:00:00Z' }),
    ];
    expect(calculateStreak(threeDays, [], 1, 0, '2026-11-16').flameIntensity).toBe('blazing');
  });

  it('generates a 7-day weekly activity array with correct Monday-Sunday calendar pills', () => {
    const tasks: Task[] = [
      createMockTask({ id: '1', title: 'Task', status: 'completed', completedAt: '2026-11-16T10:00:00Z' }),
    ];

    const result = calculateStreak(tasks, [], 1, 0, '2026-11-16');
    expect(result.weeklyActivity).toHaveLength(7);
    const todayPill = result.weeklyActivity.find((d) => d.date === '2026-11-16');
    expect(todayPill).toBeDefined();
    expect(todayPill?.isToday).toBe(true);
    expect(todayPill?.isQualified).toBe(true);
  });
});

describe('Intelligent Recurrence & Daily Mission Generation Engine', () => {
  it('correctly evaluates recurrence rule matches for daily, weekdays, and weekly', () => {
    expect(shouldRunOnDate('daily', '2026-11-16')).toBe(true);
    expect(shouldRunOnDate('weekdays', '2026-11-16')).toBe(true);

    expect(shouldRunOnDate('daily', '2026-11-15')).toBe(true);
    expect(shouldRunOnDate('weekdays', '2026-11-15')).toBe(false);

    expect(shouldRunOnDate('weekly', '2026-11-16', '2026-11-09T08:00:00Z')).toBe(true);
    expect(shouldRunOnDate('weekly', '2026-11-17', '2026-11-09T08:00:00Z')).toBe(false);
  });

  it('detects existing daily occurrences to avoid duplicate generation', () => {
    const existingTasks: Task[] = [
      createMockTask({
        id: 'child-1',
        parentRecurringId: 'template-xyz',
        title: 'Morning Meditation',
        scheduledDate: '2026-11-16',
      }),
    ];

    expect(hasOccurrenceForDate(existingTasks, 'template-xyz', '2026-11-16')).toBe(true);
    expect(hasOccurrenceForDate(existingTasks, 'template-xyz', '2026-11-17')).toBe(false);
  });

  it('generates new task instances idempotently from templates without duplicating existing ones', () => {
    const templates: Task[] = [
      createMockTask({
        id: 'tmpl-1',
        title: 'LeetCode Daily Practice',
        recurring: 'daily',
        priority: 'high',
        startTime: '09:00',
        estimatedMinutes: 45,
      }),
      createMockTask({
        id: 'tmpl-2',
        title: 'Weekday Standup',
        recurring: 'weekdays',
        priority: 'medium',
        startTime: '10:00',
      }),
    ];

    // First run on Monday 2026-11-16
    const newTasks = getMissingRecurringOccurrences(templates, '2026-11-16');
    expect(newTasks).toHaveLength(2);
    expect(newTasks[0].title).toBe('LeetCode Daily Practice');
    expect(newTasks[0].parentRecurringId).toBe('tmpl-1');
    expect(newTasks[0].scheduledDate).toBe('2026-11-16');
    expect(newTasks[0].startTime).toBe('09:00');
    expect(newTasks[0].status).toBe('not-started');

    // Second run with the newly created tasks now included in the task list
    const combinedTasks: Task[] = [
      ...templates,
      ...newTasks.map((t) => createMockTask(t as Partial<Task>)),
    ];
    const secondRun = getMissingRecurringOccurrences(combinedTasks, '2026-11-16');
    // Must be idempotent (0 new tasks created)
    expect(secondRun).toHaveLength(0);
  });

  it('correctly identifies overdue tasks without mutating or deleting them', () => {
    const tasks: Task[] = [
      createMockTask({
        id: 'past-incomplete',
        title: 'Overdue assignment',
        dueDate: '2026-11-14',
        status: 'not-started',
      }),
      createMockTask({
        id: 'past-completed',
        title: 'Completed assignment',
        dueDate: '2026-11-14',
        status: 'completed',
        completedAt: '2026-11-14T12:00:00Z',
      }),
      createMockTask({
        id: 'today-task',
        title: 'Today task',
        dueDate: '2026-11-16',
        status: 'not-started',
      }),
    ];

    const overdue = getOverdueTasks(tasks, '2026-11-16');
    expect(overdue).toHaveLength(1);
    expect(overdue[0].id).toBe('past-incomplete');
  });
});

describe('Database Serialization & Two-Way Sync Safety', () => {
  it('serializes and deserializes parentRecurringId losslessly through notes tagging', () => {
    const task: Task = createMockTask({
      id: 'task-abc',
      userId: 'user-1',
      title: 'Daily Review',
      parentRecurringId: 'tmpl-parent-999',
      description: 'Review my weekly goals',
      status: 'not-started',
      scheduledDate: '2026-11-16',
    });

    const row = taskToDbRow(task, 'user-1');
    expect(row.notes).toContain('[recur_parent:tmpl-parent-999]');

    const reconstructed = dbRowToTask(row as any);
    expect(reconstructed.parentRecurringId).toBe('tmpl-parent-999');
    expect(reconstructed.description).toBe('Review my weekly goals');
  });
});
