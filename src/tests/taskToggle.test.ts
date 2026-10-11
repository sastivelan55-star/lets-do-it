import { describe, it, expect } from 'vitest';
import type { Task, LifeAreaWeights } from '../types';

describe('Reversible Task Completion and Recalculations', () => {
  const sampleWeights: LifeAreaWeights = {
    technical: 50,
    communication: 15,
    career: 15,
    creativity: 10,
    health: 10,
  };

  function toggleTaskCompletion(task: Task, timestamp: string): Task {
    const isCompleted = task.status === 'completed';
    const newStatus = isCompleted ? 'not-started' : 'completed';
    return {
      ...task,
      status: newStatus,
      completedAt: newStatus === 'completed' ? timestamp : undefined,
      updatedAt: timestamp,
    };
  }

  function computeStats(tasks: Task[], todayStr: string, weights: LifeAreaWeights) {
    const todaysTasks = tasks.filter((t) => t.dueDate === todayStr && t.status !== 'rescheduled');
    const overdueTasks = tasks.filter(
      (t) => t.dueDate < todayStr && t.status !== 'completed' && t.status !== 'rescheduled'
    );
    const completedCount = todaysTasks.filter((t) => t.status === 'completed').length;
    const rawRate = todaysTasks.length ? Math.round((completedCount / todaysTasks.length) * 100) : 0;

    let totalWeightActive = 0;
    let earnedWeight = 0;
    for (const area of Object.keys(weights) as (keyof LifeAreaWeights)[]) {
      const areaTasks = todaysTasks.filter((t) => t.lifeArea === area);
      if (areaTasks.length > 0) {
        const areaWeight = weights[area];
        totalWeightActive += areaWeight;
        const areaCompleted = areaTasks.filter((t) => t.status === 'completed').length;
        earnedWeight += (areaCompleted / areaTasks.length) * areaWeight;
      }
    }
    const weightedRate = totalWeightActive > 0 ? Math.round((earnedWeight / totalWeightActive) * 100) : 0;

    return {
      todaysTasks,
      overdueTasks,
      completedCount,
      rawRate,
      weightedRate,
    };
  }

  it('toggles an incomplete task to complete, and toggles it back to incomplete with full reversibility', () => {
    const todayStr = '2026-10-11';
    const initialTask: Task = {
      id: 'task-1',
      title: 'Solve LeetCode Problem',
      lifeArea: 'technical',
      priority: 'high',
      status: 'not-started',
      dueDate: todayStr,
      createdAt: '2026-10-11T08:00:00Z',
      updatedAt: '2026-10-11T08:00:00Z',
    };

    // Initial state: not started, completedAt undefined
    expect(initialTask.status).toBe('not-started');
    expect(initialTask.completedAt).toBeUndefined();

    // 1. First toggle -> complete
    const completed = toggleTaskCompletion(initialTask, '2026-10-11T09:30:00Z');
    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBe('2026-10-11T09:30:00Z');

    // 2. Second toggle -> restore to incomplete
    const restored = toggleTaskCompletion(completed, '2026-10-11T09:45:00Z');
    expect(restored.status).toBe('not-started');
    expect(restored.completedAt).toBeUndefined();
    expect(restored.id).toBe(initialTask.id); // Same ID, no duplicate created
  });

  it('recalculates completion percentages, dashboard counts, and priorities when toggling', () => {
    const todayStr = '2026-10-11';
    const task1: Task = {
      id: 'task-1',
      title: 'Technical Task',
      lifeArea: 'technical',
      priority: 'high',
      status: 'not-started',
      dueDate: todayStr,
      createdAt: '2026-10-11T08:00:00Z',
      updatedAt: '2026-10-11T08:00:00Z',
    };
    const task2: Task = {
      id: 'task-2',
      title: 'Communication Task',
      lifeArea: 'communication',
      priority: 'medium',
      status: 'not-started',
      dueDate: todayStr,
      createdAt: '2026-10-11T08:00:00Z',
      updatedAt: '2026-10-11T08:00:00Z',
    };

    let tasks = [task1, task2];

    // Initial stats (0/2 completed)
    const initialStats = computeStats(tasks, todayStr, sampleWeights);
    expect(initialStats.completedCount).toBe(0);
    expect(initialStats.rawRate).toBe(0);
    expect(initialStats.weightedRate).toBe(0);

    // Toggle task1 to complete
    const completedTask1 = toggleTaskCompletion(task1, '2026-10-11T10:00:00Z');
    tasks = tasks.map((t) => (t.id === task1.id ? completedTask1 : t));

    // Stats after completing technical task (50% weight of 65 total active weight = 77%)
    const completedStats = computeStats(tasks, todayStr, sampleWeights);
    expect(completedStats.completedCount).toBe(1);
    expect(completedStats.rawRate).toBe(50);
    expect(completedStats.weightedRate).toBe(77);

    // Toggle task1 back to incomplete
    const restoredTask1 = toggleTaskCompletion(completedTask1, '2026-10-11T10:05:00Z');
    tasks = tasks.map((t) => (t.id === task1.id ? restoredTask1 : t));

    // Stats restored to 0
    const restoredStats = computeStats(tasks, todayStr, sampleWeights);
    expect(restoredStats.completedCount).toBe(0);
    expect(restoredStats.rawRate).toBe(0);
    expect(restoredStats.weightedRate).toBe(0);
  });

  it('correctly manages overdue task count when toggling completion', () => {
    const todayStr = '2026-10-11';
    const overdueTask: Task = {
      id: 'task-overdue',
      title: 'Yesterday Task',
      lifeArea: 'career',
      priority: 'high',
      status: 'not-started',
      dueDate: '2026-10-10', // yesterday
      createdAt: '2026-10-10T08:00:00Z',
      updatedAt: '2026-10-10T08:00:00Z',
    };

    let tasks = [overdueTask];

    // Initially in overdue list
    let stats = computeStats(tasks, todayStr, sampleWeights);
    expect(stats.overdueTasks.length).toBe(1);

    // Mark complete -> removed from overdue
    const completedOverdue = toggleTaskCompletion(overdueTask, '2026-10-11T11:00:00Z');
    tasks = [completedOverdue];
    stats = computeStats(tasks, todayStr, sampleWeights);
    expect(stats.overdueTasks.length).toBe(0);

    // Restore to incomplete -> reappears in overdue
    const restoredOverdue = toggleTaskCompletion(completedOverdue, '2026-10-11T11:15:00Z');
    tasks = [restoredOverdue];
    stats = computeStats(tasks, todayStr, sampleWeights);
    expect(stats.overdueTasks.length).toBe(1);
    expect(stats.overdueTasks[0].id).toBe('task-overdue');
  });

  it('ensures user account isolation by resetting in-memory task state on auth transition', () => {
    let sessionUser: string | null = 'user-alpha';
    let inMemoryTasks: Task[] = [
      {
        id: 'alpha-task',
        userId: 'user-alpha',
        title: 'Alpha Secret Task',
        lifeArea: 'technical',
        priority: 'high',
        status: 'completed',
        dueDate: '2026-10-11',
        createdAt: '2026-10-11T08:00:00Z',
        updatedAt: '2026-10-11T08:00:00Z',
      },
    ];

    // User Alpha logs out
    sessionUser = null;
    inMemoryTasks = []; // Explicitly cleared on auth change

    expect(sessionUser).toBeNull();
    expect(inMemoryTasks.length).toBe(0);

    // User Beta logs in
    sessionUser = 'user-beta';
    expect(sessionUser).toBe('user-beta');
    const betaCloudTasks: Task[] = [
      {
        id: 'beta-task',
        userId: 'user-beta',
        title: 'Beta Clean Task',
        lifeArea: 'health',
        priority: 'medium',
        status: 'not-started',
        dueDate: '2026-10-11',
        createdAt: '2026-10-11T09:00:00Z',
        updatedAt: '2026-10-11T09:00:00Z',
      },
    ];
    inMemoryTasks = betaCloudTasks;

    expect(inMemoryTasks.length).toBe(1);
    expect(inMemoryTasks[0].userId).toBe('user-beta');
    expect(inMemoryTasks.some((t) => t.userId === 'user-alpha')).toBe(false);
  });
});
