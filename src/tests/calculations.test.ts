import { describe, it, expect } from 'vitest';
import type { Task, LifeAreaWeights } from '../types';

function computeRawCompletionRate(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
}

function computeWeightedCompletionRate(tasks: Task[], weights: LifeAreaWeights): number {
  if (tasks.length === 0) return 0;
  const areas = Object.keys(weights) as (keyof LifeAreaWeights)[];

  let totalWeightActive = 0;
  let earnedWeight = 0;

  for (const area of areas) {
    const areaTasks = tasks.filter((t) => t.lifeArea === area);
    if (areaTasks.length > 0) {
      const areaWeight = weights[area] || 0;
      totalWeightActive += areaWeight;
      const completed = areaTasks.filter((t) => t.status === 'completed').length;
      earnedWeight += (completed / areaTasks.length) * areaWeight;
    }
  }

  if (totalWeightActive === 0) return 0;
  return Math.round((earnedWeight / totalWeightActive) * 100);
}

function filterOverdueTasks(tasks: Task[], currentDate: string): Task[] {
  return tasks.filter(
    (t) => t.dueDate < currentDate && t.status !== 'completed' && t.status !== 'rescheduled'
  );
}

describe('LifeMap Dashboard Calculations & Progress Weighting', () => {
  const defaultWeights: LifeAreaWeights = {
    technical: 50,
    communication: 15,
    career: 15,
    creativity: 10,
    health: 10,
  };

  it('calculates raw completion rate accurately', () => {
    expect(computeRawCompletionRate([])).toBe(0);

    const tasks: Partial<Task>[] = [
      { id: '1', status: 'completed' },
      { id: '2', status: 'not-started' },
      { id: '3', status: 'in-progress' },
      { id: '4', status: 'completed' },
    ];
    expect(computeRawCompletionRate(tasks as Task[])).toBe(50);
  });

  it('calculates weighted progress respecting 50/15/15/10/10 area allocations', () => {
    // If only technical (50%) and communication (15%) have tasks scheduled today:
    // Technical: 1/1 completed (100% of 50 weight = 50)
    // Communication: 0/1 completed (0% of 15 weight = 0)
    // Active total weight = 65.
    // Result = 50 / 65 * 100 = 77%
    const tasks: Partial<Task>[] = [
      { id: '1', lifeArea: 'technical', status: 'completed' },
      { id: '2', lifeArea: 'communication', status: 'not-started' },
    ];

    const weightedRate = computeWeightedCompletionRate(tasks as Task[], defaultWeights);
    expect(weightedRate).toBe(77);
  });

  it('correctly isolates overdue tasks from completed and rescheduled tasks', () => {
    const sampleDate = '2026-10-15';
    const tasks: Partial<Task>[] = [
      { id: '1', dueDate: '2026-10-10', status: 'not-started' }, // Overdue
      { id: '2', dueDate: '2026-10-12', status: 'completed' },   // Completed (not overdue)
      { id: '3', dueDate: '2026-10-14', status: 'rescheduled' }, // Rescheduled (not overdue)
      { id: '4', dueDate: '2026-10-15', status: 'in-progress' }, // Due today (not overdue)
      { id: '5', dueDate: '2026-10-16', status: 'not-started' }, // Due tomorrow (not overdue)
    ];

    const overdue = filterOverdueTasks(tasks as Task[], sampleDate);
    expect(overdue.map((t) => t.id)).toEqual(['1']);
  });
});
