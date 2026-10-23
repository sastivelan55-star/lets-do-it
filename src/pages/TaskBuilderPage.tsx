import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  AlertCircle,
  FolderTree,
  ArrowLeft,
  X,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Task, HierarchicalTask, LifeArea } from '../types';
import {
  buildTaskTree,
  searchTaskTree,
  reorderSiblings,
  getAncestorPath,
} from '../utils/taskTreeUtils';
import TaskTreeNode from '../components/taskBuilder/TaskTreeNode';
import TaskEditModal from '../components/taskBuilder/TaskEditModal';
import DeleteTaskModal from '../components/taskBuilder/DeleteTaskModal';
import MigrationGuideBanner from '../components/taskBuilder/MigrationGuideBanner';
import { formatSafeErrorMessage } from '../utils/errorUtils';

const FILTER_AREAS: { value: LifeArea | 'all'; label: string }[] = [
  { value: 'all', label: 'All Areas' },
  { value: 'technical', label: 'Technical' },
  { value: 'communication', label: 'Communication' },
  { value: 'career', label: 'Career' },
  { value: 'creativity', label: 'Creativity' },
  { value: 'health', label: 'Health' },
];

export default function TaskBuilderPage() {
  const { tasks, addTask, updateTask, completeTask, removeTask, reorderTasks, error } = useApp();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState<LifeArea | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [parentForSubtask, setParentForSubtask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<HierarchicalTask | null>(null);
  const [showMigrationBanner, setShowMigrationBanner] = useState(true);
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);

  // Build the full hierarchy tree
  const fullTree = useMemo(() => buildTaskTree(tasks), [tasks]);

  // Overall metrics
  const metrics = useMemo(() => {
    let mainTasksCount = 0;
    let subtasksCount = 0;
    let completedCount = 0;
    let maxDepth = 0;

    for (const t of tasks) {
      if (!t.parentId) {
        mainTasksCount++;
      } else {
        subtasksCount++;
      }
      if (t.status === 'completed') {
        completedCount++;
      }
    }

    function calculateMaxDepth(nodes: HierarchicalTask[], currentDepth: number) {
      for (const n of nodes) {
        maxDepth = Math.max(maxDepth, currentDepth);
        if (n.children.length > 0) {
          calculateMaxDepth(n.children, currentDepth + 1);
        }
      }
    }
    calculateMaxDepth(fullTree, 0);

    const totalTasks = tasks.length;
    const completionRate = totalTasks ? Math.round((completedCount / totalTasks) * 100) : 0;

    return {
      mainTasksCount,
      subtasksCount,
      totalTasks,
      completedCount,
      maxDepth,
      completionRate,
    };
  }, [tasks, fullTree]);

  // Search calculation
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return searchTaskTree(fullTree, searchQuery);
  }, [fullTree, searchQuery]);

  // If search is active, ensure matched nodes' ancestors are automatically expanded
  const effectiveExpandedMap = useMemo(() => {
    if (!searchResults) return expandedMap;
    const next = { ...expandedMap };
    searchResults.expandedIds.forEach((id) => {
      next[id] = true;
    });
    return next;
  }, [expandedMap, searchResults]);

  // Filtered tree
  const displayedTree = useMemo(() => {
    // If focused on a specific task
    let sourceTree = fullTree;
    if (focusTaskId) {
      function findNode(nodes: HierarchicalTask[]): HierarchicalTask | null {
        for (const n of nodes) {
          if (n.id === focusTaskId) return n;
          const found = findNode(n.children);
          if (found) return found;
        }
        return null;
      }
      const focusedNode = findNode(fullTree);
      sourceTree = focusedNode ? [focusedNode] : fullTree;
    }

    // Apply Area & Status Filters
    function filterNode(node: HierarchicalTask): HierarchicalTask | null {
      const areaMatches = areaFilter === 'all' || node.lifeArea === areaFilter;
      const statusMatches =
        statusFilter === 'all' ||
        (statusFilter === 'active' && node.status !== 'completed') ||
        (statusFilter === 'completed' && node.status === 'completed');

      const searchMatches = !searchResults || searchResults.matchedIds.has(node.id);

      const filteredChildren: HierarchicalTask[] = [];
      for (const child of node.children) {
        const filteredChild = filterNode(child);
        if (filteredChild) {
          filteredChildren.push(filteredChild);
        }
      }

      const selfMatches = areaMatches && statusMatches && searchMatches;
      if (selfMatches || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }
      return null;
    }

    if (areaFilter === 'all' && statusFilter === 'all' && !searchResults) {
      return sourceTree;
    }

    const filtered: HierarchicalTask[] = [];
    for (const root of sourceTree) {
      const res = filterNode(root);
      if (res) filtered.push(res);
    }
    return filtered;
  }, [fullTree, focusTaskId, areaFilter, statusFilter, searchResults]);

  // Breadcrumbs for drill down mode
  const breadcrumbPath = useMemo(() => {
    if (!focusTaskId) return [];
    return getAncestorPath(focusTaskId, tasks);
  }, [focusTaskId, tasks]);

  // Handlers
  const handleToggleExpand = (taskId: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [taskId]: !(prev[taskId] ?? true),
    }));
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    function setAll(nodes: HierarchicalTask[]) {
      for (const n of nodes) {
        next[n.id] = true;
        if (n.children.length > 0) setAll(n.children);
      }
    }
    setAll(fullTree);
    setExpandedMap(next);
  };

  const handleCollapseAll = () => {
    const next: Record<string, boolean> = {};
    function setAll(nodes: HierarchicalTask[]) {
      for (const n of nodes) {
        next[n.id] = false;
        if (n.children.length > 0) setAll(n.children);
      }
    }
    setAll(fullTree);
    setExpandedMap(next);
  };

  const handleMove = async (taskId: string, direction: 'up' | 'down') => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    const updates = reorderSiblings(tasks, target.parentId, taskId, direction);
    if (updates.length > 0) {
      await reorderTasks(updates);
    }
  };

  const handleUpdateNotes = async (task: Task, notes: string) => {
    await updateTask({
      ...task,
      notes: notes || undefined,
    });
  };

  const handleOpenAddMainTask = () => {
    setEditingTask(null);
    setParentForSubtask(null);
    setIsEditModalOpen(true);
  };

  const handleOpenAddSubtask = (parent: Task) => {
    setEditingTask(null);
    setParentForSubtask(parent);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setParentForSubtask(null);
    setIsEditModalOpen(true);
  };

  const handleSaveModal = async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTask) {
      await updateTask({
        ...editingTask,
        ...data,
      });
    } else {
      await addTask(data);
      // Auto-expand the parent if adding a subtask
      if (data.parentId) {
        setExpandedMap((prev) => ({ ...prev, [data.parentId!]: true }));
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return;
    await removeTask(deletingTask.id);
    if (focusTaskId === deletingTask.id) {
      setFocusTaskId(null);
    }
  };

  // Template loader: Python Learning Goal example from prompt
  const handleLoadPythonTemplate = async () => {
    setIsTemplateLoading(true);
    try {
      // 1. Root: Learn Python
      const rootTask = await addTask({
        title: 'Learn Python',
        notes: 'My overall learning objective.',
        lifeArea: 'technical',
        priority: 'high',
        dueDate: new Date().toISOString().slice(0, 10),
        status: 'not-started',
        parentId: null,
        orderIndex: 0,
      });

      // 2. Subtask 1: Learn variables
      const subtask1 = await addTask({
        title: 'Learn variables',
        notes: 'Practise strings, numbers, and booleans.',
        lifeArea: 'technical',
        priority: 'high',
        dueDate: new Date().toISOString().slice(0, 10),
        status: 'not-started',
        parentId: rootTask.id,
        orderIndex: 0,
      });

      // Nested subtask: Complete exercises
      await addTask({
        title: 'Complete exercises',
        notes: 'Finish ten exercises.',
        lifeArea: 'technical',
        priority: 'medium',
        dueDate: new Date().toISOString().slice(0, 10),
        status: 'not-started',
        parentId: subtask1.id,
        orderIndex: 0,
      });

      // 3. Subtask 2: Learn loops
      await addTask({
        title: 'Learn loops',
        notes: 'Practise loops.',
        lifeArea: 'technical',
        priority: 'medium',
        dueDate: new Date().toISOString().slice(0, 10),
        status: 'not-started',
        parentId: rootTask.id,
        orderIndex: 1,
      });

      // 4. Subtask 3: Build a project
      await addTask({
        title: 'Build a project',
        notes: 'Apply the concepts.',
        lifeArea: 'technical',
        priority: 'critical',
        dueDate: new Date().toISOString().slice(0, 10),
        status: 'not-started',
        parentId: rootTask.id,
        orderIndex: 2,
      });

      // Expand all
      setExpandedMap((prev) => ({
        ...prev,
        [rootTask.id]: true,
        [subtask1.id]: true,
      }));
    } finally {
      setIsTemplateLoading(false);
    }
  };

  return (
    <div className="page-container pb-safe">
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            ⚡ <span className="gradient-text">Task Builder</span>
          </h1>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#c7d2fe',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Unlimited Hierarchy
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
          Create unlimited main tasks and nest subtasks to any depth with independent notes, progress tracking, and reordering.
        </p>
      </div>

      {/* Migration Helper Banner */}
      {showMigrationBanner && (
        <MigrationGuideBanner onDismiss={() => setShowMigrationBanner(false)} />
      )}

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{typeof error === 'string' && error !== '[object Object]' ? error : formatSafeErrorMessage(error)}</span>
        </div>
      )}

      {/* Metrics Summary Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        <div className="card" style={{ padding: '0.85rem 1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Main Tasks</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#818cf8', marginTop: '2px' }}>
            {metrics.mainTasksCount}
          </div>
        </div>

        <div className="card" style={{ padding: '0.85rem 1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Subtasks</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
            {metrics.subtasksCount}
          </div>
        </div>

        <div className="card" style={{ padding: '0.85rem 1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Deepest Nesting</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
            Level {metrics.maxDepth}
          </div>
        </div>

        <div className="card" style={{ padding: '0.85rem 1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completion</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
            {metrics.completionRate}%
          </div>
        </div>
      </div>

      {/* Main Controls & Search */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="input"
              placeholder="Search tasks and notes across all levels…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Add Main Task Button */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenAddMainTask}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>Add Main Task</span>
          </button>

          {/* Template loader */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleLoadPythonTemplate}
            disabled={isTemplateLoading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
            title="Load Example: Learn Python hierarchy with nested subtasks"
          >
            <BookOpen size={14} color="#818cf8" />
            <span>{isTemplateLoading ? 'Loading…' : 'Load Example'}</span>
          </button>
        </div>

        {/* Filters & Tree Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.6rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Life Area Filters */}
          <div className="filter-scroll" style={{ margin: 0, paddingBottom: 0 }}>
            {FILTER_AREAS.map((a) => (
              <button
                key={a.value}
                className={`btn btn-sm ${areaFilter === a.value ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setAreaFilter(a.value)}
                style={{ fontSize: '0.78rem' }}
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Status & Expand toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', background: 'var(--bg-surface-2)', borderRadius: '8px', padding: '2px' }}>
              {(['all', 'active', 'completed'] as const).map((s) => (
                <button
                  key={s}
                  className={`btn btn-sm ${statusFilter === s ? 'btn-secondary' : 'btn-ghost'}`}
                  style={{
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.6rem',
                    textTransform: 'capitalize',
                  }}
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={handleExpandAll}
              style={{ fontSize: '0.75rem' }}
            >
              Expand All
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={handleCollapseAll}
              style={{ fontSize: '0.75rem' }}
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Focus / Drill Down Breadcrumb Mode */}
      {focusTaskId && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            padding: '0.6rem 0.85rem',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '10px',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setFocusTaskId(null)}
              style={{ padding: '2px 6px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#38bdf8' }}
            >
              <ArrowLeft size={13} />
              <span>All Tasks</span>
            </button>
            {breadcrumbPath.map((item, idx) => (
              <span key={item.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
                <span style={{ fontWeight: idx === breadcrumbPath.length - 1 ? 700 : 500, color: 'var(--text-primary)' }}>
                  {item.title}
                </span>
              </span>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => setFocusTaskId(null)}
            style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
          >
            Exit Focus
          </button>
        </div>
      )}

      {/* Task Tree Content */}
      {displayedTree.length === 0 ? (
        <div className="empty-state" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <FolderTree size={48} color="#818cf8" style={{ margin: '0 auto 1rem', opacity: 0.7 }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.4rem', color: 'var(--text-primary)' }}>
            {searchQuery
              ? 'No matching tasks or notes found'
              : 'Start your unlimited task hierarchy'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            {searchQuery
              ? 'Try a different search term or clear the filter.'
              : 'Create main tasks and break them down into unlimited nested subtasks with independent notes at every level.'}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenAddMainTask}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              <span>Create Main Task</span>
            </button>

            {!searchQuery && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleLoadPythonTemplate}
                disabled={isTemplateLoading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <BookOpen size={15} color="#818cf8" />
                <span>Load Example: Learn Python</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="task-tree-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {displayedTree.map((rootNode, index) => (
            <TaskTreeNode
              key={rootNode.id}
              task={rootNode}
              expandedMap={effectiveExpandedMap}
              onToggleExpand={handleToggleExpand}
              onComplete={completeTask}
              onAddSubtask={handleOpenAddSubtask}
              onEdit={handleOpenEdit}
              onDelete={setDeletingTask}
              onMove={handleMove}
              onUpdateNotes={handleUpdateNotes}
              onDrillDown={(node) => setFocusTaskId(node.id)}
              searchQuery={searchQuery}
              isFirstSibling={index === 0}
              isLastSibling={index === displayedTree.length - 1}
            />
          ))}
        </div>
      )}

      {/* Task Edit / Create Modal */}
      <TaskEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveModal}
        initialTask={editingTask}
        parentTask={parentForSubtask}
      />

      {/* Delete Confirmation Modal */}
      <DeleteTaskModal
        isOpen={Boolean(deletingTask)}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDeleteConfirm}
        task={deletingTask}
      />
    </div>
  );
}
