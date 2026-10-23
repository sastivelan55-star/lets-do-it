import { describe, it, expect } from 'vitest';
import type { Task } from '../types';
import {
  buildTaskTree,
  getAllDescendantIds,
  getAncestorPath,
  searchTaskTree,
  reorderSiblings,
} from '../utils/taskTreeUtils';
import { dbRowToTask, taskToDbRow, type DbTaskRow } from '../services/taskService';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id || 'task-root',
    title: overrides.title || 'Root Task',
    lifeArea: 'technical',
    priority: 'medium',
    status: 'not-started',
    dueDate: '2026-10-23',
    createdAt: '2026-10-23T10:00:00Z',
    updatedAt: '2026-10-23T10:00:00Z',
    notes: overrides.notes,
    parentId: overrides.parentId ?? null,
    orderIndex: overrides.orderIndex ?? 0,
    ...overrides,
  };
}

describe('Unlimited Hierarchical Task Builder: Tree Construction & Arbitrary Depth', () => {
  it('builds a tree supporting arbitrary nesting depth without hardcoded limits', () => {
    // Construct a 5-level hierarchy:
    // Root -> Subtask L1 -> Subtask L2 -> Subtask L3 -> Subtask L4
    const tasks: Task[] = [
      makeTask({ id: 't0', title: 'Learn Python', parentId: null, orderIndex: 0, notes: 'Overall goal' }),
      makeTask({ id: 't1', title: 'Learn variables', parentId: 't0', orderIndex: 0, notes: 'Strings and numbers' }),
      makeTask({ id: 't2', title: 'Complete exercises', parentId: 't1', orderIndex: 0, notes: 'Ten exercises' }),
      makeTask({ id: 't3', title: 'Level 3 Deep', parentId: 't2', orderIndex: 0, notes: 'Deep notes L3' }),
      makeTask({ id: 't4', title: 'Level 4 Ultra Deep', parentId: 't3', orderIndex: 0, notes: 'Deep notes L4' }),
    ];

    const tree = buildTaskTree(tasks);

    expect(tree).toHaveLength(1);
    const root = tree[0];
    expect(root.id).toBe('t0');
    expect(root.depth).toBe(0);
    expect(root.notes).toBe('Overall goal');
    expect(root.children).toHaveLength(1);

    const l1 = root.children[0];
    expect(l1.id).toBe('t1');
    expect(l1.depth).toBe(1);
    expect(l1.notes).toBe('Strings and numbers');
    expect(l1.children).toHaveLength(1);

    const l2 = l1.children[0];
    expect(l2.id).toBe('t2');
    expect(l2.depth).toBe(2);
    expect(l2.notes).toBe('Ten exercises');
    expect(l2.children).toHaveLength(1);

    const l3 = l2.children[0];
    expect(l3.id).toBe('t3');
    expect(l3.depth).toBe(3);
    expect(l3.children).toHaveLength(1);

    const l4 = l3.children[0];
    expect(l4.id).toBe('t4');
    expect(l4.depth).toBe(4);
    expect(l4.children).toHaveLength(0);
  });

  it('supports multiple root tasks, each with unlimited subtasks (user example structure)', () => {
    const tasks: Task[] = [
      // Task 1: Learn Python
      makeTask({ id: 'root-1', title: 'Task 1: Learn Python', parentId: null, orderIndex: 0, notes: 'My overall learning objective.' }),
      makeTask({ id: 'sub-1', title: 'Subtask 1: Learn variables', parentId: 'root-1', orderIndex: 0, notes: 'Practise strings, numbers, and booleans.' }),
      makeTask({ id: 'nested-1', title: 'Nested subtask: Complete exercises', parentId: 'sub-1', orderIndex: 0, notes: 'Finish ten exercises.' }),
      makeTask({ id: 'sub-2', title: 'Subtask 2: Learn loops', parentId: 'root-1', orderIndex: 1, notes: 'Practise loops.' }),
      makeTask({ id: 'sub-3', title: 'Subtask 3: Build a project', parentId: 'root-1', orderIndex: 2, notes: 'Apply the concepts.' }),

      // Task 2: Build Portfolio
      makeTask({ id: 'root-2', title: 'Task 2: Build Portfolio', parentId: null, orderIndex: 1, notes: 'Career objective.' }),
      makeTask({ id: 'sub-2-1', title: 'Subtask 2.1: Design mockup', parentId: 'root-2', orderIndex: 0, notes: 'Figma layout.' }),
    ];

    const tree = buildTaskTree(tasks);

    expect(tree).toHaveLength(2);

    // Root 1 verification
    const r1 = tree[0];
    expect(r1.title).toBe('Task 1: Learn Python');
    expect(r1.notes).toBe('My overall learning objective.');
    expect(r1.children).toHaveLength(3); // sub-1, sub-2, sub-3

    // Verify sub-1 has nested subtask
    const sub1 = r1.children[0];
    expect(sub1.title).toBe('Subtask 1: Learn variables');
    expect(sub1.notes).toBe('Practise strings, numbers, and booleans.');
    expect(sub1.children).toHaveLength(1);
    expect(sub1.children[0].title).toBe('Nested subtask: Complete exercises');
    expect(sub1.children[0].notes).toBe('Finish ten exercises.');

    // Root 2 verification
    const r2 = tree[1];
    expect(r2.title).toBe('Task 2: Build Portfolio');
    expect(r2.children).toHaveLength(1);
  });
});

describe('Unlimited Hierarchical Task Builder: Completion Progress & Metrics', () => {
  it('dynamically computes subtask count, completed subtask count, and progress percentage recursively', () => {
    const tasks: Task[] = [
      makeTask({ id: 'root', title: 'Master DSA', parentId: null, status: 'not-started' }),
      makeTask({ id: 'sub-1', title: 'Trees', parentId: 'root', status: 'completed' }), // completed direct subtask
      makeTask({ id: 'sub-2', title: 'Graphs', parentId: 'root', status: 'not-started' }), // in-progress direct subtask
      makeTask({ id: 'sub-2-1', title: 'BFS', parentId: 'sub-2', status: 'completed' }), // completed nested subtask
      makeTask({ id: 'sub-2-2', title: 'DFS', parentId: 'sub-2', status: 'not-started' }), // incomplete nested subtask
    ];

    const tree = buildTaskTree(tasks);
    const root = tree[0];

    // Total subtasks under root = 4 (sub-1, sub-2, sub-2-1, sub-2-2)
    expect(root.subtaskCount).toBe(4);
    // Completed subtasks = 2 (sub-1 and sub-2-1)
    expect(root.completedSubtaskCount).toBe(2);
    // Progress = 2 / 4 = 50%
    expect(root.progressPercent).toBe(50);

    // Sub-2 has 2 children (BFS completed, DFS not started) -> 1/2 = 50%
    const sub2 = root.children.find((c) => c.id === 'sub-2')!;
    expect(sub2.subtaskCount).toBe(2);
    expect(sub2.completedSubtaskCount).toBe(1);
    expect(sub2.progressPercent).toBe(50);
  });

  it('marks node progress as 100% when all nested subtasks are completed', () => {
    const tasks: Task[] = [
      makeTask({ id: 'root', title: 'Frontend Basics', parentId: null, status: 'in-progress' }),
      makeTask({ id: 'sub-1', title: 'HTML', parentId: 'root', status: 'completed' }),
      makeTask({ id: 'sub-2', title: 'CSS', parentId: 'root', status: 'completed' }),
    ];

    const tree = buildTaskTree(tasks);
    const root = tree[0];
    expect(root.subtaskCount).toBe(2);
    expect(root.completedSubtaskCount).toBe(2);
    expect(root.progressPercent).toBe(100);
  });
});

describe('Unlimited Hierarchical Task Builder: Cascading Deletion & Reordering', () => {
  it('getAllDescendantIds finds all nested descendant IDs across all levels for safe cascade', () => {
    const tasks: Task[] = [
      makeTask({ id: 'parent', parentId: null }),
      makeTask({ id: 'child-1', parentId: 'parent' }),
      makeTask({ id: 'grandchild-1', parentId: 'child-1' }),
      makeTask({ id: 'great-grandchild-1', parentId: 'grandchild-1' }),
      makeTask({ id: 'child-2', parentId: 'parent' }),
      makeTask({ id: 'unrelated', parentId: null }),
    ];

    const descendants = getAllDescendantIds('parent', tasks);

    expect(descendants).toContain('child-1');
    expect(descendants).toContain('grandchild-1');
    expect(descendants).toContain('great-grandchild-1');
    expect(descendants).toContain('child-2');
    expect(descendants).not.toContain('unrelated');
    expect(descendants).toHaveLength(4);
  });

  it('reorders siblings cleanly within their branch without affecting other branches', () => {
    const tasks: Task[] = [
      makeTask({ id: 'sub-1', parentId: 'parent-1', orderIndex: 0, createdAt: '2026-10-23T01:00:00Z' }),
      makeTask({ id: 'sub-2', parentId: 'parent-1', orderIndex: 1, createdAt: '2026-10-23T02:00:00Z' }),
      makeTask({ id: 'sub-3', parentId: 'parent-1', orderIndex: 2, createdAt: '2026-10-23T03:00:00Z' }),
      makeTask({ id: 'other-sub', parentId: 'parent-2', orderIndex: 0 }),
    ];

    // Move sub-2 up -> should swap with sub-1
    const updates = reorderSiblings(tasks, 'parent-1', 'sub-2', 'up');

    expect(updates).toHaveLength(3);
    const newSub2 = updates.find((u) => u.id === 'sub-2')!;
    const newSub1 = updates.find((u) => u.id === 'sub-1')!;
    expect(newSub2.orderIndex).toBe(0);
    expect(newSub1.orderIndex).toBe(1);

    // Other branch is unaffected
    expect(updates.some((u) => u.id === 'other-sub')).toBe(false);
  });
});

describe('Unlimited Hierarchical Task Builder: Search across Titles and Notes', () => {
  it('searches deep tasks and notes and returns ancestors for automatic branch expansion', () => {
    const tasks: Task[] = [
      makeTask({ id: 'root', title: 'Learn Python', notes: 'Top level notes', parentId: null }),
      makeTask({ id: 'sub-1', title: 'Learn variables', notes: 'Strings and numbers', parentId: 'root' }),
      makeTask({ id: 'nested-1', title: 'Practice Exercises', notes: 'Boolean algebra secret formula', parentId: 'sub-1' }),
    ];

    const tree = buildTaskTree(tasks);

    // 1. Search by title
    const titleResult = searchTaskTree(tree, 'variables');
    expect(titleResult.matchedIds.has('sub-1')).toBe(true);
    expect(titleResult.expandedIds.has('root')).toBe(true);

    // 2. Search by notes deeply nested in child
    const notesResult = searchTaskTree(tree, 'secret formula');
    expect(notesResult.matchedIds.has('nested-1')).toBe(true);
    // Ancestors that must expand: root and sub-1
    expect(notesResult.expandedIds.has('root')).toBe(true);
    expect(notesResult.expandedIds.has('sub-1')).toBe(true);
  });
});

describe('Unlimited Hierarchical Task Builder: Database Serialization & RLS Mapping', () => {
  it('maps parent_id and order_index to and from Supabase DbTaskRow', () => {
    const dbRow: DbTaskRow = {
      id: 'f94b1509-c124-44df-be9b-e0f6c2f30612',
      user_id: 'user-uuid-999',
      title: 'Nested Subtask',
      description: null,
      area: 'technical',
      project_id: null,
      due_date: '2026-10-23',
      planned_start: null,
      estimated_minutes: null,
      actual_minutes: null,
      priority: 'high',
      status: 'not-started',
      recurring_rule: null,
      notes: 'Independent subtask note',
      completed_at: null,
      created_at: '2026-10-23T10:00:00Z',
      updated_at: '2026-10-23T10:00:00Z',
      parent_id: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
      order_index: 3,
    };

    const task = dbRowToTask(dbRow);

    expect(task.id).toBe('f94b1509-c124-44df-be9b-e0f6c2f30612');
    expect(task.parentId).toBe('c56a4180-65aa-42ec-a945-5fd21dec0538');
    expect(task.orderIndex).toBe(3);
    expect(task.notes).toBe('Independent subtask note');

    // Convert back to DB row
    const payload = taskToDbRow(task, 'user-uuid-999');
    expect(payload.user_id).toBe('user-uuid-999');
    expect(payload.parent_id).toBe('c56a4180-65aa-42ec-a945-5fd21dec0538');
    expect(payload.order_index).toBe(3);
    expect(payload.notes).toBe('Independent subtask note');
  });

  it('preserves backwards compatibility for legacy tasks with parent_id = null', () => {
    const legacyTask: Partial<Task> = {
      title: 'Legacy Main Task',
      lifeArea: 'career',
      priority: 'medium',
      status: 'not-started',
    };

    const row = taskToDbRow(legacyTask, 'user-uuid-123');
    expect(row.user_id).toBe('user-uuid-123');
    expect(row.parent_id).toBeUndefined(); // or null if set
  });
});

describe('Unlimited Hierarchical Task Builder: Drill-Down & Breadcrumbs', () => {
  it('getAncestorPath computes breadcrumbs from root down to focused task', () => {
    const tasks: Task[] = [
      makeTask({ id: 'root', title: 'Learn Python', parentId: null }),
      makeTask({ id: 'sub-1', title: 'Learn variables', parentId: 'root' }),
      makeTask({ id: 'nested-1', title: 'Complete exercises', parentId: 'sub-1' }),
    ];

    const breadcrumbs = getAncestorPath('nested-1', tasks);

    expect(breadcrumbs.map((b) => b.title)).toEqual([
      'Learn Python',
      'Learn variables',
      'Complete exercises',
    ]);
  });
});
