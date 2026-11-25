import { parseISO, subDays, addDays, format, startOfWeek } from 'date-fns';
import type { Task, DailyRecord } from '../types';
import { today } from './dates';

export interface DayActivity {
  date: string; // YYYY-MM-DD
  dayLabel: string; // Mon, Tue, ...
  completedCount: number;
  dailyGoal: number;
  isToday: boolean;
  isFuture: boolean;
  isQualified: boolean;
  status: 'completed' | 'missed' | 'today' | 'future';
}

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  todayCompleted: number;
  todayCompletedCount: number;
  dailyGoal: number;
  isTodayQualified: boolean;
  todayQualified: boolean;
  streakMaintained: boolean;
  weeklyCalendar: DayActivity[];
  weeklyActivity: Array<{
    date: string;
    dayName: string;
    completedCount: number;
    isQualified: boolean;
    isToday: boolean;
  }>;
  flameIntensity: 'cold' | 'warm' | 'blazing' | 'super';
}

export const DEFAULT_DAILY_MISSION_GOAL = 3;

function toLocalDateStr(iso: string): string {
  try {
    const parsed = parseISO(iso);
    return Number.isNaN(parsed.getTime()) ? iso.slice(0, 10) : format(parsed, 'yyyy-MM-dd');
  } catch {
    return iso.slice(0, 10);
  }
}

/**
 * Calculates completed task count for a specific calendar date (YYYY-MM-DD).
 * Checks both Task records (by completedAt or assigned date) and DailyRecord logs.
 */
export function getCompletedTaskCountForDate(
  dateStr: string,
  tasks: Task[],
  dailyRecords: DailyRecord[] = []
): number {
  const fromTasks = tasks.filter((t) => {
    if (t.isDeleted || t.status !== 'completed') return false;
    if (t.completedAt) {
      return toLocalDateStr(t.completedAt) === dateStr;
    }
    const assigned = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
    return assigned === dateStr;
  }).length;

  const record = dailyRecords.find((r) => r.date === dateStr);
  const fromRecord = record ? record.tasksCompleted : 0;

  return Math.max(fromTasks, fromRecord);
}

/**
 * Determines whether a specific date met the user's daily completion goal.
 */
export function isDateQualified(
  dateStr: string,
  tasks: Task[],
  dailyRecords: DailyRecord[] = [],
  dailyGoal: number = DEFAULT_DAILY_MISSION_GOAL
): boolean {
  return getCompletedTaskCountForDate(dateStr, tasks, dailyRecords) >= Math.max(1, dailyGoal);
}

/**
 * Calculates accurate Snapchat-style daily streaks:
 * - Local calendar-day consecutive runs
 * - Only counts if daily goal (e.g. 3 tasks) was achieved
 * - Multiple completions on same day count as 1 qualified day
 * - Streak maintained if yesterday was qualified or today is qualified
 * - Best-ever streak never decreases
 */
export function calculateStreak(
  tasks: Task[],
  dailyRecords: DailyRecord[] = [],
  dailyGoal: number = DEFAULT_DAILY_MISSION_GOAL,
  bestStreakSaved: number = 0,
  referenceDateStr: string = today()
): StreakData {
  const goal = Math.max(1, dailyGoal);
  const refDate = parseISO(referenceDateStr);

  const todayCompleted = getCompletedTaskCountForDate(referenceDateStr, tasks, dailyRecords);
  const isTodayQualified = todayCompleted >= goal;

  // 1. Calculate current consecutive streak backwards
  const yesterdayStr = format(subDays(refDate, 1), 'yyyy-MM-dd');
  const isYesterdayQualified = isDateQualified(yesterdayStr, tasks, dailyRecords, goal);

  let pastStreak = 0;
  // If yesterday was qualified, count consecutive days before today
  if (isYesterdayQualified) {
    let checkDate = subDays(refDate, 1);
    while (true) {
      const dStr = format(checkDate, 'yyyy-MM-dd');
      if (isDateQualified(dStr, tasks, dailyRecords, goal)) {
        pastStreak += 1;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }
  }

  let currentStreak = 0;
  let streakMaintained = false;

  if (isTodayQualified) {
    currentStreak = pastStreak + 1;
    streakMaintained = true;
  } else if (isYesterdayQualified) {
    // Today not yet finished, streak is preserved from yesterday
    currentStreak = pastStreak;
    streakMaintained = true;
  } else {
    // Both today and yesterday missed -> streak reset to 0
    currentStreak = 0;
    streakMaintained = false;
  }

  // 2. Calculate best-ever streak across all recorded calendar dates
  // Collect all unique dates with activity
  const dateSet = new Set<string>();
  tasks.forEach((t) => {
    if (t.status === 'completed') {
      if (t.completedAt) dateSet.add(toLocalDateStr(t.completedAt));
      const assigned = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
      if (assigned) dateSet.add(assigned);
    }
  });
  dailyRecords.forEach((r) => {
    if (r.tasksCompleted >= goal) dateSet.add(r.date);
  });
  dateSet.add(referenceDateStr);

  const sortedDates = Array.from(dateSet)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();

  let maxStreakFound = 0;
  let runningStreak = 0;
  let lastDate: Date | null = null;

  for (const dStr of sortedDates) {
    if (isDateQualified(dStr, tasks, dailyRecords, goal)) {
      const dObj = parseISO(dStr);
      if (lastDate) {
        const expectedNext = format(addDays(lastDate, 1), 'yyyy-MM-dd');
        if (dStr === expectedNext) {
          runningStreak += 1;
        } else {
          runningStreak = 1;
        }
      } else {
        runningStreak = 1;
      }
      lastDate = dObj;
      if (runningStreak > maxStreakFound) {
        maxStreakFound = runningStreak;
      }
    } else {
      runningStreak = 0;
      lastDate = null;
    }
  }

  const bestStreak = Math.max(bestStreakSaved, maxStreakFound, currentStreak);

  // 3. Weekly Activity Calendar (Current Week Mon-Sun)
  const monday = startOfWeek(refDate, { weekStartsOn: 1 });
  const weeklyCalendar: DayActivity[] = [];

  for (let i = 0; i < 7; i++) {
    const dayDate = addDays(monday, i);
    const dayStr = format(dayDate, 'yyyy-MM-dd');
    const dayLabel = format(dayDate, 'EEE');
    const count = getCompletedTaskCountForDate(dayStr, tasks, dailyRecords);
    const isToday = dayStr === referenceDateStr;
    const isFuture = dayStr > referenceDateStr;
    const isQualified = count >= goal;

    let status: DayActivity['status'] = 'future';
    if (isToday) {
      status = isQualified ? 'completed' : 'today';
    } else if (isFuture) {
      status = 'future';
    } else {
      status = isQualified ? 'completed' : 'missed';
    }

    weeklyCalendar.push({
      date: dayStr,
      dayLabel,
      completedCount: count,
      dailyGoal: goal,
      isToday,
      isFuture,
      isQualified,
      status,
    });
  }

  // 4. Flame intensity
  let flameIntensity: StreakData['flameIntensity'] = 'cold';
  if (currentStreak >= 7) flameIntensity = 'super';
  else if (currentStreak >= 3) flameIntensity = 'blazing';
  else if (currentStreak >= 1) flameIntensity = 'warm';

  const weeklyActivity = weeklyCalendar.map((d) => ({
    date: d.date,
    dayName: d.dayLabel,
    completedCount: d.completedCount,
    isQualified: d.isQualified,
    isToday: d.isToday,
  }));

  return {
    currentStreak,
    bestStreak,
    todayCompleted,
    todayCompletedCount: todayCompleted,
    dailyGoal: goal,
    isTodayQualified,
    todayQualified: isTodayQualified,
    streakMaintained,
    weeklyCalendar,
    weeklyActivity,
    flameIntensity,
  };
}
