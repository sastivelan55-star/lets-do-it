// Life OS — Habit Streak Engine
// Computes individual, consecutive daily streaks for recurring habits and tasks
// based on real historical daily completion records.

import { format, subDays, parseISO } from 'date-fns';
import type { DailyTaskCompletion, Task } from '../types';
import { today } from './dates';

export interface HabitStreakInfo {
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate?: string;
  isCompletedToday: boolean;
  completionRate7Days: number;
}

/**
 * Calculates the consecutive streak for a specific recurring task or habit.
 * Strictly adheres to non-destructive, non-fabricating rules:
 * - Day counts only if is_completed === true
 * - If today's occurrence is pending, preserves existing streak until day ends
 * - Missing an applicable day breaks the streak
 * - Future dates never break the streak
 */
export function calculateHabitStreak(
  task: Task,
  completions: DailyTaskCompletion[],
  targetDate: string = today()
): HabitStreakInfo {
  // Filter completions for this specific task
  const taskCompletions = completions.filter(
    (c) => c.taskId === task.id && c.isCompleted && c.occurrenceDate <= targetDate
  );

  if (taskCompletions.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      lastCompletedDate: undefined,
      isCompletedToday: false,
      completionRate7Days: 0,
    };
  }

  // Create a fast lookup set of completed dates: 'YYYY-MM-DD'
  const completedDatesSet = new Set<string>();
  let latestCompletedDate: string | undefined = undefined;

  for (const c of taskCompletions) {
    const d = c.occurrenceDate.slice(0, 10);
    completedDatesSet.add(d);
    if (!latestCompletedDate || d > latestCompletedDate) {
      latestCompletedDate = d;
    }
  }

  const isCompletedToday = completedDatesSet.has(targetDate);

  // ── CURRENT STREAK CALCULATION ─────────────────────────────────────────────
  // Start checking from targetDate or yesterday if today is not completed yet
  let currentStreak = 0;

  if (isCompletedToday) {
    currentStreak++;
    // Continue counting backwards from yesterday
    let prev = format(subDays(parseISO(targetDate), 1), 'yyyy-MM-dd');
    while (completedDatesSet.has(prev)) {
      currentStreak++;
      prev = format(subDays(parseISO(prev), 1), 'yyyy-MM-dd');
    }
  } else {
    // If today is not completed, check if yesterday was completed (preserve existing streak until day ends)
    let prev = format(subDays(parseISO(targetDate), 1), 'yyyy-MM-dd');
    while (completedDatesSet.has(prev)) {
      currentStreak++;
      prev = format(subDays(parseISO(prev), 1), 'yyyy-MM-dd');
    }
  }

  // ── BEST STREAK CALCULATION ────────────────────────────────────────────────
  // Find the longest run of consecutive completed dates in history
  const sortedDates = Array.from(completedDatesSet).sort();
  let bestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const currDate = parseISO(dateStr);
    if (!lastDate) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    lastDate = currDate;
    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }
  }

  if (currentStreak > bestStreak) {
    bestStreak = currentStreak;
  }

  // ── 7-DAY COMPLETION RATE ──────────────────────────────────────────────────
  let completedInLast7 = 0;
  for (let i = 0; i < 7; i++) {
    const d = format(subDays(parseISO(targetDate), i), 'yyyy-MM-dd');
    if (completedDatesSet.has(d)) {
      completedInLast7++;
    }
  }
  const completionRate7Days = Math.round((completedInLast7 / 7) * 100);

  return {
    currentStreak,
    bestStreak,
    lastCompletedDate: latestCompletedDate,
    isCompletedToday,
    completionRate7Days,
  };
}
