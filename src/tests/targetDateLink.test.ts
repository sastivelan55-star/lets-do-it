import { describe, it, expect } from 'vitest';
import type { Task } from '../types';

describe('Task TargetDate Linking & Filtering', () => {
  const getSystemTodayDate = () => {
    const sysDate = new Date();
    const y = sysDate.getFullYear();
    const m = String(sysDate.getMonth() + 1).padStart(2, '0');
    const d = String(sysDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  it('filters tasks correctly when targetDate matches today system date', () => {
    const todayStr = getSystemTodayDate();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const globalTasks: Task[] = [
      {
        id: 't-1',
        title: 'Mission For Today',
        dueDate: todayStr,
        targetDate: todayStr,
        priority: 'high',
        status: 'not-started',
        lifeArea: 'growth',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 't-2',
        title: 'Mission For Tomorrow',
        dueDate: tomorrowStr,
        targetDate: tomorrowStr,
        priority: 'medium',
        status: 'not-started',
        lifeArea: 'career',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 't-3',
        title: 'Past Mission',
        dueDate: yesterdayStr,
        targetDate: yesterdayStr,
        priority: 'low',
        status: 'completed',
        lifeArea: 'health',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 't-4',
        title: 'Deleted Mission for Today',
        dueDate: todayStr,
        targetDate: todayStr,
        priority: 'critical',
        status: 'not-started',
        lifeArea: 'growth',
        isDeleted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Home tab "Today Missions" filter logic
    const todayMissions = globalTasks.filter((t) => {
      if (t.isDeleted) return false;
      const taskDate = (t.targetDate || t.dueDate || '').slice(0, 10);
      return taskDate === todayStr;
    });

    expect(todayMissions).toHaveLength(1);
    expect(todayMissions[0].id).toBe('t-1');
    expect(todayMissions[0].title).toBe('Mission For Today');
  });

  it('dynamically updates when task targetDate is reconfigured from future date to today', () => {
    const todayStr = getSystemTodayDate();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    let task: Task = {
      id: 't-edit',
      title: 'Postponed Raid',
      dueDate: tomorrowStr,
      targetDate: tomorrowStr,
      priority: 'high',
      status: 'not-started',
      lifeArea: 'growth',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let todayMissions = [task].filter((t) => !t.isDeleted && (t.targetDate || t.dueDate || '').slice(0, 10) === todayStr);
    expect(todayMissions).toHaveLength(0);

    // User updates task in Tasks tab to today
    task = {
      ...task,
      dueDate: todayStr,
      targetDate: todayStr,
      updatedAt: new Date().toISOString(),
    };

    todayMissions = [task].filter((t) => !t.isDeleted && (t.targetDate || t.dueDate || '').slice(0, 10) === todayStr);
    expect(todayMissions).toHaveLength(1);
    expect(todayMissions[0].title).toBe('Postponed Raid');
  });
});

