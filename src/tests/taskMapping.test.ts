import { describe, it, expect } from 'vitest';
import { dbRowToTask, taskToDbRow, type DbTaskRow } from '../services/taskService';
import type { Task } from '../types';

describe('Task Data Mapping and Serialization', () => {
  it('correctly maps a PostgreSQL database row to an application Task', () => {
    const mockRow: DbTaskRow = {
      id: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
      user_id: 'user-uuid-123',
      title: 'Practice DSA Trees',
      description: 'Solve binary search tree problems',
      area: 'technical',
      project_id: null,
      due_date: '2026-10-15',
      planned_start: '07:00',
      estimated_minutes: 45,
      actual_minutes: 50,
      priority: 'high',
      status: 'in-progress',
      recurring_rule: 'daily',
      notes: 'Review space complexity',
      completed_at: null,
      created_at: '2026-10-11T10:00:00Z',
      updated_at: '2026-10-11T10:30:00Z',
    };

    const task = dbRowToTask(mockRow);

    expect(task.id).toBe('c56a4180-65aa-42ec-a945-5fd21dec0538');
    expect(task.userId).toBe('user-uuid-123');
    expect(task.title).toBe('Practice DSA Trees');
    expect(task.lifeArea).toBe('technical');
    expect(task.priority).toBe('high');
    expect(task.status).toBe('in-progress');
    expect(task.estimatedMinutes).toBe(45);
    expect(task.actualMinutes).toBe(50);
    expect(task.recurring).toBe('daily');
    expect(task.projectId).toBeUndefined();
    expect(task.completedAt).toBeUndefined();
  });

  it('correctly prepares a partial Task into an RLS-enforced database row payload', () => {
    const partialTask: Partial<Task> = {
      id: 'task-777',
      title: '  English presentation prep  ',
      description: '',
      lifeArea: 'communication',
      priority: 'medium',
      status: 'not-started',
      dueDate: '2026-10-12',
    };

    const userId = 'auth-user-999';
    const row = taskToDbRow(partialTask, userId);

    expect(row.user_id).toBe('auth-user-999');
    expect(row.title).toBe('English presentation prep'); // Trimmed
    expect(row.description).toBeNull(); // Empty string normalized to null
    expect(row.area).toBe('communication');
    expect(row.priority).toBe('medium');
    expect(row.status).toBe('not-started');
  });

  it('sets completed_at to timestamp when marking complete, and NULL when restoring to incomplete', () => {
    const userId = 'auth-user-999';

    // 1. Marking complete
    const completedTask: Partial<Task> = {
      id: 'task-100',
      status: 'completed',
      completedAt: '2026-10-11T12:00:00.000Z',
    };
    const completedRow = taskToDbRow(completedTask, userId);
    expect(completedRow.status).toBe('completed');
    expect(completedRow.completed_at).toBe('2026-10-11T12:00:00.000Z');

    // 2. Reversing completion back to not-started
    const restoredTask: Partial<Task> = {
      id: 'task-100',
      status: 'not-started',
      completedAt: undefined,
    };
    const restoredRow = taskToDbRow(restoredTask, userId);
    expect(restoredRow.status).toBe('not-started');
    expect(restoredRow.completed_at).toBeNull();
  });
});
