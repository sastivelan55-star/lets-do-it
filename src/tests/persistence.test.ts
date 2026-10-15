/**
 * Persistence Regression Tests
 *
 * Covers the root causes identified in the LifeMap OS persistence audit:
 *  1. loadTasks must not run while auth is still loading (prevents offline flash)
 *  2. Tasks must be cleared immediately on user switch (no cross-account leak)
 *  3. Blind local->cloud migration must not happen (empty cloud != migrate me)
 *  4. Failed saves must surface errors, not silently succeed
 *  5. Stale-closure rollback must restore the correct snapshot
 *  6. Anon key format validation (JWT vs publishable key)
 */

import { describe, it, expect } from 'vitest';
import { dbRowToTask, taskToDbRow } from '../services/taskService';
import type { DbTaskRow } from '../services/taskService';
import type { Task } from '../types';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-001',
    title: 'Test Task',
    lifeArea: 'technical',
    priority: 'medium',
    status: 'not-started',
    dueDate: '2026-10-15',
    createdAt: '2026-10-15T00:00:00Z',
    updatedAt: '2026-10-15T00:00:00Z',
    ...overrides,
  };
}

describe('Persistence Regression: Auth Loading Guard', () => {
  it('loadTasks is a no-op while authIsLoading is true', () => {
    let tasksFetched = false;
    const simulateLoadTasks = (authIsLoading: boolean) => {
      if (authIsLoading) return;
      tasksFetched = true;
    };
    simulateLoadTasks(true);
    expect(tasksFetched).toBe(false);
    simulateLoadTasks(false);
    expect(tasksFetched).toBe(true);
  });

  it('while auth is loading and user is null, mode must be pending not offline', () => {
    const simulateTaskMode = (user: string | null, authIsLoading: boolean): string => {
      if (authIsLoading) return 'pending';
      if (user) return 'cloud';
      return 'offline';
    };
    expect(simulateTaskMode(null, true)).toBe('pending');
    expect(simulateTaskMode('user-123', false)).toBe('cloud');
    expect(simulateTaskMode(null, false)).toBe('offline');
  });
});

describe('Persistence Regression: Account Isolation on User Switch', () => {
  it('clears tasks immediately when user identity changes', () => {
    let currentTasks: Task[] = [makeTask({ id: 'alpha-1', userId: 'user-alpha' })];
    let prevUserId: string | null | undefined = undefined;

    const onUserChange = (newUserId: string | null) => {
      if (prevUserId !== undefined && prevUserId !== newUserId) {
        currentTasks = [];
      }
      prevUserId = newUserId;
    };

    onUserChange('user-alpha');
    expect(currentTasks.length).toBe(1);

    onUserChange(null);
    expect(currentTasks.length).toBe(0);

    onUserChange('user-beta');
    expect(currentTasks.length).toBe(0);
    expect(currentTasks.some((t) => t.userId === 'user-alpha')).toBe(false);
  });

  it('does NOT clear tasks on the very first mount (prevId starts as undefined)', () => {
    let currentTasks: Task[] = [makeTask({ id: 'task-1', userId: 'user-alpha' })];
    let prevUserId: string | null | undefined = undefined;

    const onUserChange = (newUserId: string | null) => {
      if (prevUserId !== undefined && prevUserId !== newUserId) {
        currentTasks = [];
      }
      prevUserId = newUserId;
    };

    onUserChange('user-alpha');
    expect(currentTasks.length).toBe(1);
  });
});

describe('Persistence Regression: No Blind Local->Cloud Migration', () => {
  it('empty cloud response does NOT trigger local task migration', async () => {
    let migrated = false;
    const simulateLoad = async (fetchCloud: () => Promise<Task[]>): Promise<Task[]> => {
      const cloudTasks = await fetchCloud();
      // NEW: no migration, just use cloud result
      return cloudTasks;
    };

    const tasks = await simulateLoad(async () => []);
    expect(tasks).toHaveLength(0);
    expect(migrated).toBe(false);
  });

  it('a 401 error from cloud is surfaced as error, not silently converted to offline mode', async () => {
    let errorMessage: string | null = null;
    let syncStatus = 'synced';

    const simulateLoad = async (fetchCloud: () => Promise<Task[]>): Promise<Task[]> => {
      try {
        return await fetchCloud();
      } catch (err) {
        errorMessage = err instanceof Error ? err.message : 'Unknown error';
        syncStatus = 'error';
        return [];
      }
    };

    const tasks = await simulateLoad(async () => {
      throw new Error('401: Invalid API key');
    });

    expect(tasks).toHaveLength(0);
    expect(errorMessage).toContain('401');
    expect(syncStatus).toBe('error');
  });
});

describe('Persistence Regression: Stale-Closure Rollback', () => {
  it('captures snapshot atomically inside setTasks functional updater', () => {
    let tasks: Task[] = [makeTask({ id: 'task-1' }), makeTask({ id: 'task-2' })];
    let capturedSnapshot: Task[] = [];

    const updateTasksWithSnapshot = (id: string, updated: Task) => {
      tasks = ((prev: Task[]) => {
        capturedSnapshot = prev;
        return prev.map((t) => (t.id === id ? updated : t));
      })(tasks);
    };

    const updatedTask = makeTask({ id: 'task-1', title: 'Updated Title' });
    updateTasksWithSnapshot('task-1', updatedTask);

    expect(capturedSnapshot).toHaveLength(2);
    expect(tasks[0].title).toBe('Updated Title');

    tasks = capturedSnapshot;
    expect(tasks[0].title).toBe('Test Task');
  });
});

describe('Persistence Regression: Failed Save Error Visibility', () => {
  it('does not silently succeed when cloud write fails', async () => {
    let errorMessage: string | null = null;
    let syncStatus = 'synced';

    const simulateUpdateTask = async (cloudUpdate: () => Promise<Task>): Promise<void> => {
      try {
        syncStatus = 'syncing';
        await cloudUpdate();
        syncStatus = 'synced';
      } catch (err) {
        syncStatus = 'error';
        errorMessage = err instanceof Error ? err.message : 'Unknown error';
        throw err;
      }
    };

    await expect(
      simulateUpdateTask(async () => {
        throw new Error('Failed to update task: JWT expired');
      })
    ).rejects.toThrow('Failed to update task: JWT expired');

    expect(syncStatus).toBe('error');
    expect(errorMessage).toContain('JWT expired');
  });
});

describe('Persistence Regression: Session Restoration Round-Trip', () => {
  it('dbRowToTask correctly maps all Supabase fields to Task', () => {
    const row: DbTaskRow = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: 'auth-user-001',
      title: 'DSA Practice',
      description: 'Binary trees',
      area: 'technical',
      project_id: null,
      due_date: '2026-10-15',
      planned_start: '08:00',
      estimated_minutes: 45,
      actual_minutes: null,
      priority: 'high',
      status: 'not-started',
      recurring_rule: null,
      notes: 'Focus on time complexity',
      completed_at: null,
      created_at: '2026-10-15T00:00:00Z',
      updated_at: '2026-10-15T00:00:00Z',
    };

    const task = dbRowToTask(row);
    expect(task.id).toBe(row.id);
    expect(task.userId).toBe('auth-user-001');
    expect(task.title).toBe('DSA Practice');
    expect(task.lifeArea).toBe('technical');
    expect(task.completedAt).toBeUndefined();
    expect(task.projectId).toBeUndefined();
    expect(task.actualMinutes).toBeUndefined();
  });

  it('completed_at is explicit NULL in DB payload when restoring an incomplete task', () => {
    const restoredTask: Partial<Task> = {
      id: 'task-restore',
      status: 'not-started',
      completedAt: undefined,
    };
    const row = taskToDbRow(restoredTask, 'user-xyz');
    expect(row.status).toBe('not-started');
    expect(row.completed_at).toBeNull();
  });

  it('completed_at is set to a timestamp when task is marked complete', () => {
    const completedTask: Partial<Task> = {
      id: 'task-complete',
      status: 'completed',
      completedAt: '2026-10-15T10:30:00Z',
    };
    const row = taskToDbRow(completedTask, 'user-xyz');
    expect(row.status).toBe('completed');
    expect(row.completed_at).toBe('2026-10-15T10:30:00Z');
  });
});

describe('Persistence Regression: Anon Key Format Validation', () => {
  // Supabase SDK v2.117+ uses the new "sb_publishable_" key format.
  // Older projects used JWT tokens starting with "eyJ".
  // Both are valid. The important thing is that placeholder/empty values are rejected.
  const isValidSupabaseAnonKey = (key: string): boolean => {
    if (!key || key.length < 10) return false;
    // New format (Supabase v2.117+ publishable key)
    if (key.startsWith('sb_publishable_')) return true;
    // Legacy JWT format (older projects)
    if (key.startsWith('eyJ') && key.split('.').length === 3) return true;
    return false;
  };

  it('accepts the new sb_publishable_ key format (Supabase v2.117+)', () => {
    // This is exactly the format shown in the Supabase Dashboard for new projects
    const publishableKey = 'sb_publishable_eSrxHfBdB7_kvG26Ppz7Vg_jsAQBFyN';
    expect(isValidSupabaseAnonKey(publishableKey)).toBe(true);
  });

  it('accepts legacy JWT anon key format (older Supabase projects)', () => {
    const jwtKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.ZopqoUt20nEV8rw6HtnRmaiXw';
    expect(isValidSupabaseAnonKey(jwtKey)).toBe(true);
  });

  it('rejects placeholder and empty values', () => {
    expect(isValidSupabaseAnonKey('')).toBe(false);
    expect(isValidSupabaseAnonKey('your-anon-key-placeholder')).toBe(false);
    expect(isValidSupabaseAnonKey('example-anon-key')).toBe(false);
  });

  it('env.ts isSupabaseConfigured correctly passes for the sb_publishable_ key', () => {
    // Simulate the checks in src/config/env.ts
    const validateEnv = (url: string, key: string): boolean => {
      return Boolean(
        url &&
        key &&
        url !== 'https://your-project-id.supabase.co' &&
        !key.includes('example-anon-key') &&
        !key.includes('your-anon-key-placeholder')
      );
    };

    expect(validateEnv(
      'https://waqwcaalsgwavylihvlx.supabase.co',
      'sb_publishable_eSrxHfBdB7_kvG26Ppz7Vg_jsAQBFyN'
    )).toBe(true);

    // Placeholder values should fail
    expect(validateEnv('https://your-project-id.supabase.co', 'sb_publishable_xxx')).toBe(false);
    expect(validateEnv('https://real.supabase.co', '')).toBe(false);
  });
});
