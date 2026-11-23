// useDailyExecution — React hook for the Daily Execution Dashboard
// Fetches completions for a given date, merges with the task list via the
// occurrence engine, and exposes toggle + realtime refresh capabilities.
import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  fetchCompletionsForDate,
  upsertTaskCompletion,
  subscribeToUserCompletions,
} from '../services/dailyCompletionService';
import { getTasksForDate, computeDailySummary } from '../services/occurrenceEngine';
import type { DailyTaskCompletion, DailyTaskOccurrence, DailyExecutionSummary } from '../types';
import { formatSafeErrorMessage, logSafeError } from '../utils/errorUtils';

export function useDailyExecution(selectedDate: string): {
  occurrences: DailyTaskOccurrence[];
  summary: DailyExecutionSummary;
  completions: DailyTaskCompletion[];
  isLoading: boolean;
  error: string | null;
  toggleCompletion: (taskId: string, currentlyCompleted: boolean) => Promise<void>;
  refresh: () => void;
} {
  const { tasks, completeTask } = useApp();
  const { user } = useAuth();
  const effectiveUserId = user?.id || 'guest';

  const [completions, setCompletions] = useState<DailyTaskCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A counter we can increment to force a re-fetch
  const [refreshTick, setRefreshTick] = useState(0);

  // Keep a ref to the unsubscribe function so we can clean up
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // ── Load completions ──────────────────────────────────────────────────────
  const loadCompletions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const rows = await fetchCompletionsForDate(effectiveUserId, selectedDate);
      setCompletions(rows);
    } catch (err) {
      logSafeError('useDailyExecution.loadCompletions', err);
      setError(formatSafeErrorMessage(err, 'Failed to load daily completions'));
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId, selectedDate]);

  // Re-load whenever the selected date, tasks or refresh tick changes
  useEffect(() => {
    void loadCompletions();
  }, [loadCompletions, tasks, refreshTick]);

  // ── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    // Unsubscribe from any previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const unsub = subscribeToUserCompletions(user.id, () => {
      // Realtime fired — refresh completion data
      setRefreshTick((t) => t + 1);
    });
    unsubscribeRef.current = unsub;

    return () => {
      unsub();
      unsubscribeRef.current = null;
    };
  }, [user?.id]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const occurrences = getTasksForDate(tasks, completions, selectedDate);
  const summary = computeDailySummary(occurrences);

  // ── Toggle completion ─────────────────────────────────────────────────────
  const toggleCompletion = useCallback(
    async (taskId: string, currentlyCompleted: boolean) => {
      const newCompleted = !currentlyCompleted;

      // Optimistic update
      setCompletions((prev) => {
        const existing = prev.find(
          (c) => c.taskId === taskId && c.occurrenceDate === selectedDate
        );
        if (existing) {
          return prev.map((c) =>
            c.taskId === taskId && c.occurrenceDate === selectedDate
              ? {
                  ...c,
                  isCompleted: newCompleted,
                  completedAt: newCompleted ? new Date().toISOString() : undefined,
                }
              : c
          );
        }
        // No record yet — add a provisional one
        return [
          ...prev,
          {
            id: `optimistic-${taskId}-${selectedDate}`,
            taskId,
            userId: effectiveUserId,
            occurrenceDate: selectedDate,
            isCompleted: newCompleted,
            completedAt: newCompleted ? new Date().toISOString() : undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
      });

      try {
        // Always persist the completion record
        const saved = await upsertTaskCompletion(effectiveUserId, taskId, selectedDate, newCompleted);

        // Replace optimistic record with the real one
        setCompletions((prev) =>
          prev.map((c) =>
            (c.taskId === taskId && c.occurrenceDate === selectedDate) ||
            c.id === `optimistic-${taskId}-${selectedDate}`
              ? saved
              : c
          )
        );

        // For one-time (non-recurring) tasks also sync the task's own status field
        const task = tasks.find((t) => t.id === taskId);
        const isRecurring = task?.recurring && task.recurring !== 'none';
        if (!isRecurring) {
          await completeTask(taskId, newCompleted);
        }
      } catch (err) {
        logSafeError('useDailyExecution.toggleCompletion', err);
        setError(formatSafeErrorMessage(err, 'Failed to update task completion'));
        // Roll back optimistic update
        void loadCompletions();
      }
    },
    [effectiveUserId, selectedDate, tasks, completeTask, loadCompletions]
  );

  // ── Public refresh ────────────────────────────────────────────────────────
  const refresh = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  return { occurrences, summary, completions, isLoading, error, toggleCompletion, refresh };
}
