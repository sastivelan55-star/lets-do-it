import { describe, it, expect } from 'vitest';
import { getTasksForDate, computeDailySummary } from '../services/occurrenceEngine';
import type { Task, DailyTaskCompletion } from '../types';

// ── Factories ────────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: 'task-1',
    title: 'Test Task',
    lifeArea: 'technical',
    priority: 'medium',
    status: 'not-started',
    dueDate: '2026-11-17',
    targetDate: '2026-11-17',
    scheduledDate: '2026-11-17',
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
    ...overrides,
  };
}

function makeCompletion(overrides: Partial<DailyTaskCompletion>): DailyTaskCompletion {
  return {
    id: 'comp-1',
    taskId: 'task-1',
    userId: 'user-1',
    occurrenceDate: '2026-11-17',
    isCompleted: true,
    createdAt: '2026-11-17T00:00:00Z',
    updatedAt: '2026-11-17T00:00:00Z',
    ...overrides,
  };
}

// Date reference:
//   2026-11-15 = Sunday (weekend)
//   2026-11-16 = Monday  (weekday, day-of-week index 1)
//   2026-11-17 = Tuesday (weekday, day-of-week index 2)
//   2026-11-18 = Wednesday
//   2026-11-22 = Sunday

// ── 1. Daily recurring tasks ─────────────────────────────────────────────────

describe('daily recurring tasks', () => {
  it('should appear on the target date', () => {
    const task = makeTask({ id: 'daily-1', recurring: 'daily', dueDate: '2026-11-01' });
    const result = getTasksForDate([task], [], '2026-11-17');
    expect(result).toHaveLength(1);
    expect(result[0].taskId).toBe('daily-1');
  });

  it('should appear even if the original dueDate is different', () => {
    // dueDate is in the past; daily tasks still show every day
    const task = makeTask({ id: 'daily-2', recurring: 'daily', dueDate: '2026-10-01' });
    const result = getTasksForDate([task], [], '2026-11-17');
    expect(result).toHaveLength(1);
  });

  it('should be pending when no completion record exists', () => {
    const task = makeTask({ id: 'daily-3', recurring: 'daily' });
    const result = getTasksForDate([task], [], '2026-11-17');
    expect(result[0].isCompleted).toBe(false);
  });

  it('should be completed when a completion record for that date exists', () => {
    const task = makeTask({ id: 'daily-4', recurring: 'daily' });
    const completion = makeCompletion({ taskId: 'daily-4', occurrenceDate: '2026-11-17', isCompleted: true });
    const result = getTasksForDate([task], [completion], '2026-11-17');
    expect(result[0].isCompleted).toBe(true);
  });

  it('should be pending on a new date even if completed on a previous date', () => {
    const task = makeTask({ id: 'daily-5', recurring: 'daily' });
    // Completed yesterday (2026-11-16), querying today (2026-11-17)
    const prevCompletion = makeCompletion({ taskId: 'daily-5', occurrenceDate: '2026-11-16', isCompleted: true });
    const result = getTasksForDate([task], [prevCompletion], '2026-11-17');
    expect(result[0].isCompleted).toBe(false);
  });

  it('should NOT use the task status=completed for recurring completion state', () => {
    // Even if task.status is 'completed', recurring occurrences use completions table
    const task = makeTask({ id: 'daily-6', recurring: 'daily', status: 'completed' });
    // No completion record for today
    const result = getTasksForDate([task], [], '2026-11-17');
    expect(result).toHaveLength(1);
    expect(result[0].isCompleted).toBe(false);
  });
});

// ── 2. Weekly recurring tasks ────────────────────────────────────────────────

describe('weekly recurring tasks', () => {
  // dueDate 2026-11-17 is a Tuesday → weekly task appears every Tuesday
  it('should appear on the matching weekday', () => {
    const task = makeTask({ id: 'weekly-1', recurring: 'weekly', dueDate: '2026-11-17' });
    // 2026-11-17 is Tuesday; next Tuesday is 2026-11-24
    const result17 = getTasksForDate([task], [], '2026-11-17');
    expect(result17).toHaveLength(1);
    const result24 = getTasksForDate([task], [], '2026-11-24');
    expect(result24).toHaveLength(1);
  });

  it('should NOT appear on a different weekday', () => {
    const task = makeTask({ id: 'weekly-2', recurring: 'weekly', dueDate: '2026-11-17' }); // Tuesday template
    // 2026-11-16 is Monday → should not appear
    const result = getTasksForDate([task], [], '2026-11-16');
    expect(result).toHaveLength(0);
  });

  it('should maintain separate completion state per occurrence date', () => {
    const task = makeTask({ id: 'weekly-3', recurring: 'weekly', dueDate: '2026-11-17' });
    // Mark completed on 2026-11-17 but not on 2026-11-24
    const comp = makeCompletion({ taskId: 'weekly-3', occurrenceDate: '2026-11-17', isCompleted: true });
    const result17 = getTasksForDate([task], [comp], '2026-11-17');
    expect(result17[0].isCompleted).toBe(true);
    const result24 = getTasksForDate([task], [comp], '2026-11-24');
    expect(result24[0].isCompleted).toBe(false);
  });
});

// ── 3. One-time tasks ────────────────────────────────────────────────────────

describe('one-time tasks', () => {
  it('should appear on their scheduled date', () => {
    const task = makeTask({ id: 'once-1', scheduledDate: '2026-11-17', recurring: undefined });
    const result = getTasksForDate([task], [], '2026-11-17');
    expect(result).toHaveLength(1);
    expect(result[0].taskId).toBe('once-1');
  });

  it('should NOT appear on a different date', () => {
    const task = makeTask({ id: 'once-2', scheduledDate: '2026-11-17', dueDate: '2026-11-17', recurring: undefined });
    const result = getTasksForDate([task], [], '2026-11-18');
    expect(result).toHaveLength(0);
  });

  it('should be completed based on completion record', () => {
    const task = makeTask({ id: 'once-3', scheduledDate: '2026-11-17', recurring: undefined });
    const comp = makeCompletion({ taskId: 'once-3', occurrenceDate: '2026-11-17', isCompleted: true });
    const result = getTasksForDate([task], [comp], '2026-11-17');
    expect(result[0].isCompleted).toBe(true);
  });

  it('should NOT reset daily — it only appears on its scheduled date', () => {
    // A one-time task on 2026-11-17 should not appear on 2026-11-18
    const task = makeTask({ id: 'once-4', scheduledDate: '2026-11-17', dueDate: '2026-11-17', recurring: 'none' });
    const tomorrow = getTasksForDate([task], [], '2026-11-18');
    expect(tomorrow).toHaveLength(0);
    // ...but it appears on its own date
    const today = getTasksForDate([task], [], '2026-11-17');
    expect(today).toHaveLength(1);
  });
});

// ── 4. Deleted tasks ─────────────────────────────────────────────────────────

describe('deleted tasks', () => {
  it('should not appear for any date', () => {
    const task = makeTask({
      id: 'del-1',
      recurring: 'daily',
      isDeleted: true,
      deletedAt: '2026-11-10T10:00:00Z',
    });
    const result = getTasksForDate([task], [], '2026-11-17');
    expect(result).toHaveLength(0);
  });

  it('should not appear even for one-time tasks when deleted', () => {
    const task = makeTask({
      id: 'del-2',
      scheduledDate: '2026-11-17',
      recurring: undefined,
      isDeleted: true,
    });
    const result = getTasksForDate([task], [], '2026-11-17');
    expect(result).toHaveLength(0);
  });
});

// ── 5. Weekdays recurring tasks ──────────────────────────────────────────────

describe('weekdays recurring tasks', () => {
  it('should appear on a Monday (weekday)', () => {
    const task = makeTask({ id: 'wkd-1', recurring: 'weekdays' });
    // 2026-11-16 is Monday
    expect(getTasksForDate([task], [], '2026-11-16')).toHaveLength(1);
  });

  it('should NOT appear on a Sunday (weekend)', () => {
    const task = makeTask({ id: 'wkd-2', recurring: 'weekdays' });
    // 2026-11-15 is Sunday
    expect(getTasksForDate([task], [], '2026-11-15')).toHaveLength(0);
  });

  it('should appear on a Friday', () => {
    const task = makeTask({ id: 'wkd-3', recurring: 'weekdays' });
    // 2026-11-20 is Friday
    expect(getTasksForDate([task], [], '2026-11-20')).toHaveLength(1);
  });

  it('should NOT appear on a Saturday', () => {
    const task = makeTask({ id: 'wkd-4', recurring: 'weekdays' });
    // 2026-11-21 is Saturday
    expect(getTasksForDate([task], [], '2026-11-21')).toHaveLength(0);
  });
});

// ── 6. computeDailySummary ───────────────────────────────────────────────────

describe('computeDailySummary', () => {
  it('should return 0 percentage when no tasks', () => {
    const summary = computeDailySummary('2026-11-17', []);
    expect(summary.total).toBe(0);
    expect(summary.completed).toBe(0);
    expect(summary.pending).toBe(0);
    expect(summary.percentage).toBe(0);
    expect(summary.date).toBe('2026-11-17');
  });

  it('should compute correct percentage', () => {
    const task1 = makeTask({ id: 't1', recurring: 'daily' });
    const task2 = makeTask({ id: 't2', recurring: 'daily' });
    const task3 = makeTask({ id: 't3', recurring: 'daily' });
    const task4 = makeTask({ id: 't4', recurring: 'daily' });

    const completions = [
      makeCompletion({ taskId: 't1', occurrenceDate: '2026-11-17', isCompleted: true }),
      makeCompletion({ id: 'comp-2', taskId: 't2', occurrenceDate: '2026-11-17', isCompleted: true }),
    ];

    const occurrences = getTasksForDate([task1, task2, task3, task4], completions, '2026-11-17');
    const summary = computeDailySummary('2026-11-17', occurrences);
    expect(summary.total).toBe(4);
    expect(summary.completed).toBe(2);
    expect(summary.pending).toBe(2);
    expect(summary.percentage).toBe(50);
  });

  it('should count completed and pending correctly', () => {
    const tasks = [
      makeTask({ id: 'a1', recurring: 'daily' }),
      makeTask({ id: 'a2', recurring: 'daily' }),
      makeTask({ id: 'a3', recurring: 'daily' }),
    ];
    const completions = [
      makeCompletion({ taskId: 'a1', occurrenceDate: '2026-11-17', isCompleted: true }),
      makeCompletion({ id: 'comp-2', taskId: 'a2', occurrenceDate: '2026-11-17', isCompleted: false }),
    ];
    const occurrences = getTasksForDate(tasks, completions, '2026-11-17');
    const summary = computeDailySummary('2026-11-17', occurrences);
    // a1 → completed, a2 → false (pending), a3 → no record (pending)
    expect(summary.completed).toBe(1);
    expect(summary.pending).toBe(2);
    expect(summary.total).toBe(3);
  });

  it('should return 100 percentage when all tasks are completed', () => {
    const task = makeTask({ id: 'full-1', recurring: 'daily' });
    const comp = makeCompletion({ taskId: 'full-1', occurrenceDate: '2026-11-17', isCompleted: true });
    const occurrences = getTasksForDate([task], [comp], '2026-11-17');
    const summary = computeDailySummary('2026-11-17', occurrences);
    expect(summary.percentage).toBe(100);
    expect(summary.pending).toBe(0);
  });
});

// ── 7. Edge cases ─────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('should handle empty tasks array', () => {
    const result = getTasksForDate([], [], '2026-11-17');
    expect(result).toEqual([]);
  });

  it('should handle empty completions array', () => {
    const task = makeTask({ id: 'edge-1', recurring: 'daily' });
    const result = getTasksForDate([task], [], '2026-11-17');
    expect(result).toHaveLength(1);
    expect(result[0].isCompleted).toBe(false);
  });

  it('should handle tasks with no date set (falls back to dueDate)', () => {
    // A one-time task with no scheduledDate, only dueDate
    const task = makeTask({ id: 'edge-2', scheduledDate: undefined, targetDate: undefined, dueDate: '2026-11-17', recurring: undefined });
    const result = getTasksForDate([task], [], '2026-11-17');
    expect(result).toHaveLength(1);
  });

  it('should handle multiple tasks on the same date with correct isolation', () => {
    const tasks = [
      makeTask({ id: 'm1', recurring: 'daily' }),
      makeTask({ id: 'm2', recurring: 'daily' }),
      makeTask({ id: 'm3', recurring: 'daily' }),
    ];
    const completions = [
      makeCompletion({ taskId: 'm1', occurrenceDate: '2026-11-17', isCompleted: true }),
    ];
    const result = getTasksForDate(tasks, completions, '2026-11-17');
    expect(result).toHaveLength(3);
    expect(result.find(o => o.taskId === 'm1')?.isCompleted).toBe(true);
    expect(result.find(o => o.taskId === 'm2')?.isCompleted).toBe(false);
    expect(result.find(o => o.taskId === 'm3')?.isCompleted).toBe(false);
  });

  it('should set occurrenceDate on each result to the queried targetDate', () => {
    const task = makeTask({ id: 'edge-4', recurring: 'daily', dueDate: '2026-10-01' });
    const result = getTasksForDate([task], [], '2026-11-17');
    expect(result[0].occurrenceDate).toBe('2026-11-17');
  });

  it('should preserve originalTask reference', () => {
    const task = makeTask({ id: 'edge-5', recurring: 'daily' });
    const result = getTasksForDate([task], [], '2026-11-17');
    expect(result[0].originalTask).toEqual(task);
  });
});
