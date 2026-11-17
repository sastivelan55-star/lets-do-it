import { describe, it, expect } from 'vitest';
import { calculateHabitStreak } from '../utils/habitStreakEngine';
import type { Task, DailyTaskCompletion } from '../types';

describe('Habit Streak Engine', () => {
  const dummyTask: Task = {
    id: 'habit-1',
    title: 'Morning Exercise',
    lifeArea: 'health',
    priority: 'high',
    status: 'not-started',
    dueDate: '2026-11-17',
    recurring: 'daily',
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-01T08:00:00Z',
  };

  it('returns 0 streak when no completion history exists (Rule 7 & 8)', () => {
    const result = calculateHabitStreak(dummyTask, [], '2026-11-17');
    expect(result.currentStreak).toBe(0);
    expect(result.bestStreak).toBe(0);
    expect(result.lastCompletedDate).toBeUndefined();
    expect(result.isCompletedToday).toBe(false);
  });

  it('increments streak when completed on consecutive days including today (Rule 1 & 2)', () => {
    const completions: DailyTaskCompletion[] = [
      { id: '1', taskId: 'habit-1', userId: 'u1', occurrenceDate: '2026-11-17', isCompleted: true, createdAt: '', updatedAt: '' },
      { id: '2', taskId: 'habit-1', userId: 'u1', occurrenceDate: '2026-11-16', isCompleted: true, createdAt: '', updatedAt: '' },
      { id: '3', taskId: 'habit-1', userId: 'u1', occurrenceDate: '2026-11-15', isCompleted: true, createdAt: '', updatedAt: '' },
    ];
    const result = calculateHabitStreak(dummyTask, completions, '2026-11-17');
    expect(result.currentStreak).toBe(3);
    expect(result.bestStreak).toBe(3);
    expect(result.isCompletedToday).toBe(true);
    expect(result.lastCompletedDate).toBe('2026-11-17');
  });

  it('preserves yesterday streak when today task is still pending (Rule 5)', () => {
    const completions: DailyTaskCompletion[] = [
      { id: '1', taskId: 'habit-1', userId: 'u1', occurrenceDate: '2026-11-16', isCompleted: true, createdAt: '', updatedAt: '' },
      { id: '2', taskId: 'habit-1', userId: 'u1', occurrenceDate: '2026-11-15', isCompleted: true, createdAt: '', updatedAt: '' },
      { id: '3', taskId: 'habit-1', userId: 'u1', occurrenceDate: '2026-11-14', isCompleted: true, createdAt: '', updatedAt: '' },
    ];
    const result = calculateHabitStreak(dummyTask, completions, '2026-11-17');
    expect(result.currentStreak).toBe(3);
    expect(result.isCompletedToday).toBe(false);
    expect(result.lastCompletedDate).toBe('2026-11-16');
  });

  it('breaks streak when yesterday was missed and today is pending (Rule 3)', () => {
    const completions: DailyTaskCompletion[] = [
      { id: '1', taskId: 'habit-1', userId: 'u1', occurrenceDate: '2026-11-15', isCompleted: true, createdAt: '', updatedAt: '' },
    ];
    const result = calculateHabitStreak(dummyTask, completions, '2026-11-17');
    expect(result.currentStreak).toBe(0);
    expect(result.bestStreak).toBe(1);
    expect(result.lastCompletedDate).toBe('2026-11-15');
  });

  it('computes historical best streak correctly across gaps', () => {
    const completions: DailyTaskCompletion[] = [
      // 5-day streak in past
      { id: '1', taskId: 'habit-1', userId: 'u1', occurrenceDate: '2026-11-01', isCompleted: true, createdAt: '', updatedAt: '' },
      { id: '2', taskId: 'habit-1', userId: 'u1', occurrenceDate: '2026-11-02', isCompleted: true, createdAt: '', updatedAt: '' },
      { id: '3', taskId: 'habit-1', userId: 'u1', occurrenceDate: '2026-11-03', isCompleted: true, createdAt: '', updatedAt: '' },
      { id: '4', taskId: 'habit-1', userId: 'u1', occurrenceDate: '2026-11-04', isCompleted: true, createdAt: '', updatedAt: '' },
      { id: '5', taskId: 'habit-1', userId: 'u1', occurrenceDate: '2026-11-05', isCompleted: true, createdAt: '', updatedAt: '' },
      // gap: 11-06 missed
      // 2-day streak currently
      { id: '6', taskId: 'habit-1', userId: 'u1', occurrenceDate: '2026-11-16', isCompleted: true, createdAt: '', updatedAt: '' },
      { id: '7', taskId: 'habit-1', userId: 'u1', occurrenceDate: '2026-11-17', isCompleted: true, createdAt: '', updatedAt: '' },
    ];
    const result = calculateHabitStreak(dummyTask, completions, '2026-11-17');
    expect(result.currentStreak).toBe(2);
    expect(result.bestStreak).toBe(5);
  });
});
