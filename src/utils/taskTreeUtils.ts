import type { Task, HierarchicalTask } from '../types';

/**
 * Builds a recursive tree from a flat array of Task items.
 * Supports unlimited nesting depth.
 */
export function buildTaskTree(tasks: Task[]): HierarchicalTask[] {
  const taskMap = new Map<string, HierarchicalTask>();
  const rootTasks: HierarchicalTask[] = [];

  // 1. Initialize map with empty children and default metrics
  for (const t of tasks) {
    taskMap.set(t.id, {
      ...t,
      children: [],
      depth: 0,
      subtaskCount: 0,
      completedSubtaskCount: 0,
      progressPercent: t.status === 'completed' ? 100 : 0,
    });
  }

  // 2. Link children to their parent
  for (const t of tasks) {
    const node = taskMap.get(t.id)!;
    const parentId = t.parentId;

    if (parentId && taskMap.has(parentId)) {
      const parentNode = taskMap.get(parentId)!;
      parentNode.children.push(node);
    } else {
      rootTasks.push(node);
    }
  }

  // 3. Recursive helper to assign depth, sort siblings, and calculate subtask metrics
  function processNode(node: HierarchicalTask, depth: number) {
    node.depth = depth;

    // Sort children by orderIndex ascending, then createdAt ascending
    node.children.sort((a, b) => {
      const orderA = a.orderIndex ?? 0;
      const orderB = b.orderIndex ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.createdAt.localeCompare(b.createdAt);
    });

    let totalSubtasks = 0;
    let completedSubtasks = 0;

    for (const child of node.children) {
      processNode(child, depth + 1);
      totalSubtasks += 1 + child.subtaskCount;
      completedSubtasks += (child.status === 'completed' ? 1 : 0) + child.completedSubtaskCount;
    }

    node.subtaskCount = totalSubtasks;
    node.completedSubtaskCount = completedSubtasks;

    if (totalSubtasks > 0) {
      node.progressPercent = Math.round((completedSubtasks / totalSubtasks) * 100);
    } else {
      node.progressPercent = node.status === 'completed' ? 100 : 0;
    }
  }

  // Sort root tasks by orderIndex ascending, then createdAt ascending
  rootTasks.sort((a, b) => {
    const orderA = a.orderIndex ?? 0;
    const orderB = b.orderIndex ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return a.createdAt.localeCompare(b.createdAt);
  });

  for (const root of rootTasks) {
    processNode(root, 0);
  }

  return rootTasks;
}

/**
 * Returns all descendant IDs (children, grandchildren, etc.) for a given parentId.
 */
export function getAllDescendantIds(parentId: string, tasks: Task[]): string[] {
  const result: string[] = [];
  const childrenMap = new Map<string, string[]>();

  for (const t of tasks) {
    if (t.parentId) {
      const list = childrenMap.get(t.parentId) || [];
      list.push(t.id);
      childrenMap.set(t.parentId, list);
    }
  }

  function collect(id: string) {
    const children = childrenMap.get(id) || [];
    for (const childId of children) {
      result.push(childId);
      collect(childId);
    }
  }

  collect(parentId);
  return result;
}

/**
 * Returns the ancestor path from root down to the target task.
 */
export function getAncestorPath(taskId: string, tasks: Task[]): Task[] {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const path: Task[] = [];
  let current = taskMap.get(taskId);

  while (current) {
    path.unshift(current);
    if (!current.parentId) break;
    current = taskMap.get(current.parentId);
  }

  return path;
}

/**
 * Searches the task tree across titles and notes.
 * Returns matchedIds and expandedIds (ancestors that should be expanded to reveal matches).
 */
export function searchTaskTree(
  tree: HierarchicalTask[],
  query: string
): { matchedIds: Set<string>; expandedIds: Set<string> } {
  const matchedIds = new Set<string>();
  const expandedIds = new Set<string>();
  const cleanQuery = query.trim().toLowerCase();

  if (!cleanQuery) {
    return { matchedIds, expandedIds };
  }

  function traverse(node: HierarchicalTask, ancestors: string[]): boolean {
    const titleMatch = node.title.toLowerCase().includes(cleanQuery);
    const notesMatch = node.notes ? node.notes.toLowerCase().includes(cleanQuery) : false;
    const descriptionMatch = node.description ? node.description.toLowerCase().includes(cleanQuery) : false;

    const isMatch = titleMatch || notesMatch || descriptionMatch;
    if (isMatch) {
      matchedIds.add(node.id);
      for (const ancId of ancestors) {
        expandedIds.add(ancId);
      }
    }

    let childHasMatch = false;
    for (const child of node.children) {
      if (traverse(child, [...ancestors, node.id])) {
        childHasMatch = true;
      }
    }

    return isMatch || childHasMatch;
  }

  for (const root of tree) {
    traverse(root, []);
  }

  return { matchedIds, expandedIds };
}

/**
 * Reorders a task among its siblings either 'up' or 'down'.
 * Returns an array of updated orderIndex items for the affected siblings.
 */
export function reorderSiblings(
  tasks: Task[],
  parentId: string | null | undefined,
  movedId: string,
  direction: 'up' | 'down'
): { id: string; orderIndex: number }[] {
  const normalizedParent = parentId || null;
  const siblings = tasks
    .filter((t) => (t.parentId || null) === normalizedParent)
    .sort((a, b) => {
      const orderA = a.orderIndex ?? 0;
      const orderB = b.orderIndex ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.createdAt.localeCompare(b.createdAt);
    });

  const index = siblings.findIndex((s) => s.id === movedId);
  if (index === -1) return [];

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= siblings.length) return [];

  // Swap positions
  const reordered = [...siblings];
  const [movedItem] = reordered.splice(index, 1);
  reordered.splice(targetIndex, 0, movedItem);

  return reordered.map((item, idx) => ({
    id: item.id,
    orderIndex: idx,
  }));
}
