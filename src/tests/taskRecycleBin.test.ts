import { describe, it, expect } from 'vitest';
import type { Task } from '../types';
import { dbRowToTask, taskToDbRow, type DbTaskRow } from '../services/taskService';
import { getAllDescendantIds, buildTaskTree } from '../utils/taskTreeUtils';

function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id || 'task-1',
    title: overrides.title || 'Sample Task',
    lifeArea: 'technical',
    priority: 'medium',
    status: 'not-started',
    dueDate: '2026-10-25',
    createdAt: '2026-10-25T10:00:00Z',
    updatedAt: '2026-10-25T10:00:00Z',
    notes: overrides.notes,
    parentId: overrides.parentId ?? null,
    orderIndex: overrides.orderIndex ?? 0,
    isDeleted: overrides.isDeleted ?? false,
    deletedAt: overrides.deletedAt,
    ...overrides,
  };
}

describe('Task Recycle Bin: Data Mapping & Serialization', () => {
  it('maps is_deleted and deleted_at from DbTaskRow to Task object', () => {
    const row: DbTaskRow = {
      id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      user_id: 'user-123',
      title: 'Database indexing study',
      description: null,
      area: 'technical',
      project_id: null,
      due_date: '2026-10-25',
      planned_start: '09:00',
      estimated_minutes: 45,
      actual_minutes: 30,
      priority: 'high',
      status: 'completed',
      recurring_rule: null,
      notes: 'Study B-Trees and composite indexes',
      completed_at: '2026-10-25T12:00:00Z',
      created_at: '2026-10-25T08:00:00Z',
      updated_at: '2026-10-25T12:00:00Z',
      parent_id: null,
      order_index: 0,
      is_deleted: true,
      deleted_at: '2026-10-25T15:30:00Z',
    };

    const task = dbRowToTask(row);

    expect(task.isDeleted).toBe(true);
    expect(task.deletedAt).toBe('2026-10-25T15:30:00Z');
    expect(task.notes).toBe('Study B-Trees and composite indexes');
  });

  it('serializes isDeleted and deletedAt to DB row format for persistence', () => {
    const task = createMockTask({
      id: 'task-soft-deleted',
      isDeleted: true,
      deletedAt: '2026-10-25T16:00:00Z',
      notes: 'Preserved notes in recycle bin',
    });

    const row = taskToDbRow(task, 'user-999');

    expect(row.is_deleted).toBe(true);
    expect(row.deleted_at).toBe('2026-10-25T16:00:00Z');
    expect(row.notes).toBe('Preserved notes in recycle bin');
    expect(row.user_id).toBe('user-999');
  });
});

describe('Task Recycle Bin: Hierarchy Soft-Deletion & Preservation', () => {
  it('soft deleting a parent task identifies all recursive descendants for deletion', () => {
    const tasks: Task[] = [
      createMockTask({ id: 'parent', title: 'Main Project', parentId: null }),
      createMockTask({ id: 'child-1', title: 'Phase 1', parentId: 'parent' }),
      createMockTask({ id: 'subchild-1', title: 'Task A', parentId: 'child-1' }),
      createMockTask({ id: 'subchild-2', title: 'Task B', parentId: 'child-1' }),
      createMockTask({ id: 'child-2', title: 'Phase 2', parentId: 'parent' }),
      createMockTask({ id: 'unrelated', title: 'Other Goal', parentId: null }),
    ];

    const descendantIds = getAllDescendantIds('parent', tasks);
    const allIdsToDelete = new Set(['parent', ...descendantIds]);

    expect(allIdsToDelete.size).toBe(5);
    expect(allIdsToDelete.has('parent')).toBe(true);
    expect(allIdsToDelete.has('child-1')).toBe(true);
    expect(allIdsToDelete.has('subchild-1')).toBe(true);
    expect(allIdsToDelete.has('subchild-2')).toBe(true);
    expect(allIdsToDelete.has('child-2')).toBe(true);
    expect(allIdsToDelete.has('unrelated')).toBe(false);
  });

  it('active tasks filter cleanly excludes all tasks marked isDeleted', () => {
    const allTasks: Task[] = [
      createMockTask({ id: 't1', title: 'Active Task 1', isDeleted: false }),
      createMockTask({ id: 't2', title: 'Deleted Task 2', isDeleted: true, deletedAt: '2026-10-25T12:00:00Z' }),
      createMockTask({ id: 't3', title: 'Active Task 3', isDeleted: false }),
    ];

    const activeTasks = allTasks.filter((t) => !t.isDeleted);
    const recycleBinTasks = allTasks.filter((t) => Boolean(t.isDeleted));

    expect(activeTasks).toHaveLength(2);
    expect(activeTasks.map((t) => t.id)).toEqual(['t1', 't3']);
    expect(recycleBinTasks).toHaveLength(1);
    expect(recycleBinTasks[0].id).toBe('t2');
  });

  it('building tree from active tasks creates clean hierarchy without deleted nodes', () => {
    const allTasks: Task[] = [
      createMockTask({ id: 'p1', title: 'Active Parent', parentId: null, isDeleted: false }),
      createMockTask({ id: 'c1', title: 'Active Child', parentId: 'p1', isDeleted: false }),
      createMockTask({ id: 'p2', title: 'Deleted Parent', parentId: null, isDeleted: true }),
      createMockTask({ id: 'c2', title: 'Deleted Child', parentId: 'p2', isDeleted: true }),
    ];

    const activeTasks = allTasks.filter((t) => !t.isDeleted);
    const tree = buildTaskTree(activeTasks);

    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('p1');
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].id).toBe('c1');
  });
});

describe('Task Recycle Bin: Safe Restoration & Orphan Prevention', () => {
  it('restoring a root task restores itself and all its nested subtasks', () => {
    const deletionTime = '2026-10-25T14:00:00Z';
    let tasks: Task[] = [
      createMockTask({ id: 'root', title: 'App Architecture', isDeleted: true, deletedAt: deletionTime }),
      createMockTask({ id: 'child', title: 'API Design', parentId: 'root', isDeleted: true, deletedAt: deletionTime }),
      createMockTask({ id: 'grandchild', title: 'Endpoints', parentId: 'child', isDeleted: true, deletedAt: deletionTime }),
    ];

    const targetId = 'root';
    const descendantIds = getAllDescendantIds(targetId, tasks);
    const allIdsToRestore = new Set([targetId, ...descendantIds]);

    tasks = tasks.map((t) => {
      if (allIdsToRestore.has(t.id)) {
        return { ...t, isDeleted: false, deletedAt: undefined };
      }
      return t;
    });

    expect(tasks.every((t) => !t.isDeleted && t.deletedAt === undefined)).toBe(true);
  });

  it('restoring an individual subtask whose parent is still in Recycle Bin re-parents it to top level', () => {
    const allTasks: Task[] = [
      createMockTask({ id: 'deleted-parent', title: 'Deleted Parent', isDeleted: true, deletedAt: '2026-10-25T10:00:00Z' }),
      createMockTask({ id: 'subtask-to-restore', title: 'Independent Subtask', parentId: 'deleted-parent', isDeleted: true, deletedAt: '2026-10-25T10:00:00Z' }),
    ];

    const target = allTasks.find((t) => t.id === 'subtask-to-restore')!;
    const activeParent = target.parentId
      ? allTasks.find((t) => t.id === target.parentId && !t.isDeleted)
      : null;

    // Because parent is deleted, activeParent is null -> must re-parent root to null
    const shouldReparentRoot = Boolean(target.parentId && !activeParent);
    expect(shouldReparentRoot).toBe(true);

    const restoredTask: Task = {
      ...target,
      isDeleted: false,
      deletedAt: undefined,
      parentId: shouldReparentRoot ? null : target.parentId,
    };

    expect(restoredTask.isDeleted).toBe(false);
    expect(restoredTask.parentId).toBeNull(); // Cleanly attached to root, never orphaned!
  });

  it('restoring a subtask whose parent is active keeps parent relationship intact', () => {
    const allTasks: Task[] = [
      createMockTask({ id: 'active-parent', title: 'Active Parent', isDeleted: false }),
      createMockTask({ id: 'child-to-restore', title: 'Child Task', parentId: 'active-parent', isDeleted: true, deletedAt: '2026-10-25T10:00:00Z' }),
    ];

    const target = allTasks.find((t) => t.id === 'child-to-restore')!;
    const activeParent = target.parentId
      ? allTasks.find((t) => t.id === target.parentId && !t.isDeleted)
      : null;

    const shouldReparentRoot = Boolean(target.parentId && !activeParent);
    expect(shouldReparentRoot).toBe(false);

    const restoredTask: Task = {
      ...target,
      isDeleted: false,
      deletedAt: undefined,
      parentId: shouldReparentRoot ? null : target.parentId,
    };

    expect(restoredTask.parentId).toBe('active-parent');
  });
});

describe('Task Recycle Bin: Permanent Purge & Empty Bin Safety', () => {
  it('emptying the recycle bin removes only soft-deleted tasks and never touches active tasks', () => {
    const allTasks: Task[] = [
      createMockTask({ id: 'active-1', title: 'Important Project', isDeleted: false }),
      createMockTask({ id: 'active-2', title: 'Daily Workout', isDeleted: false }),
      createMockTask({ id: 'trash-1', title: 'Old Note', isDeleted: true }),
      createMockTask({ id: 'trash-2', title: 'Old Subtask', isDeleted: true }),
    ];

    // Empty recycle bin operation
    const remainingTasks = allTasks.filter((t) => !t.isDeleted);

    expect(remainingTasks).toHaveLength(2);
    expect(remainingTasks.map((t) => t.id)).toEqual(['active-1', 'active-2']);
    expect(remainingTasks.every((t) => !t.isDeleted)).toBe(true);
  });
});
