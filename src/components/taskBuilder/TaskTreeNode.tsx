import { useState } from 'react';
import type { HierarchicalTask, Task } from '../../types';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  ArrowUp,
  ArrowDown,
  FileText,
  Maximize2,
  Clock,
  Sparkles,
  ArrowRightLeft,
} from 'lucide-react';
import clsx from 'clsx';
import { formatTime } from '../../utils/dates';
import TaskAssignmentModal from '../tasks/TaskAssignmentModal';
import { useApp } from '../../context/AppContext';

interface TaskTreeNodeProps {
  task: HierarchicalTask;
  expandedMap: Record<string, boolean>;
  onToggleExpand: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onAddSubtask: (parentTask: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: HierarchicalTask) => void;
  onMove: (taskId: string, direction: 'up' | 'down') => void;
  onUpdateNotes: (task: Task, notes: string) => Promise<void>;
  onDrillDown?: (task: HierarchicalTask) => void;
  searchQuery?: string;
  isFirstSibling?: boolean;
  isLastSibling?: boolean;
}

const DEPTH_COLORS = [
  '#818cf8', // Level 0: Indigo
  '#38bdf8', // Level 1: Sky
  '#34d399', // Level 2: Emerald
  '#fbbf24', // Level 3: Amber
  '#f472b6', // Level 4: Pink
  '#a78bfa', // Level 5+: Purple
];

const AREA_COLOR: Record<string, string> = {
  technical: '#6366f1',
  communication: '#06b6d4',
  career: '#f59e0b',
  creativity: '#ec4899',
  health: '#10b981',
};

export default function TaskTreeNode({
  task,
  expandedMap,
  onToggleExpand,
  onComplete,
  onAddSubtask,
  onEdit,
  onDelete,
  onMove,
  onUpdateNotes,
  onDrillDown,
  searchQuery = '',
  isFirstSibling = false,
  isLastSibling = false,
}: TaskTreeNodeProps) {
  const { customLifeAreas } = useApp();
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(task.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const isCompleted = task.status === 'completed';
  const hasChildren = task.children.length > 0;
  const isExpanded = expandedMap[task.id] ?? true;
  const depth = task.depth || 0;
  const depthColor = DEPTH_COLORS[Math.min(depth, DEPTH_COLORS.length - 1)];
  const matchedArea = customLifeAreas.find((a) => a.id === task.lifeArea);
  const areaColor = matchedArea?.color || AREA_COLOR[task.lifeArea] || '#818cf8';

  const matchesSearch = Boolean(
    searchQuery &&
      (task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.notes && task.notes.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await onUpdateNotes(task, notesValue.trim());
      setEditingNotes(false);
    } catch {
      // Error handled in parent
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div
      className="task-tree-node-wrapper"
      style={{
        position: 'relative',
        marginLeft: depth > 0 ? 'clamp(0.75rem, 3vw, 1.75rem)' : '0',
        paddingLeft: depth > 0 ? '0.75rem' : '0',
        borderLeft: depth > 0 ? `2px solid ${depthColor}35` : 'none',
        marginTop: depth === 0 ? '0.85rem' : '0.4rem',
      }}
    >
      {/* Node Card */}
      <div
        className={clsx('task-tree-node', isCompleted && 'completed')}
        style={{
          background: depth === 0 ? 'var(--bg-surface)' : 'rgba(24, 32, 54, 0.7)',
          border: matchesSearch
            ? '1.5px solid #818cf8'
            : depth === 0
            ? '1px solid var(--border)'
            : '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: depth === 0 ? '12px' : '10px',
          padding: depth === 0 ? '0.85rem 1rem' : '0.7rem 0.85rem',
          boxShadow: depth === 0 ? '0 4px 16px rgba(0, 0, 0, 0.2)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
          {/* Expand/Collapse Chevron */}
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggleExpand(task.id)}
              className="btn btn-ghost btn-icon"
              style={{
                width: '26px',
                height: '26px',
                padding: 0,
                color: depthColor,
                flexShrink: 0,
                marginTop: '1px',
              }}
              aria-label={isExpanded ? 'Collapse branch' : 'Expand branch'}
              title={isExpanded ? 'Collapse branch' : 'Expand branch'}
            >
              {isExpanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
            </button>
          ) : (
            <div style={{ width: '26px', height: '26px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: `${depthColor}60`,
                }}
              />
            </div>
          )}

          {/* Reversible Completion Checkbox */}
          <button
            type="button"
            className={clsx('task-checkbox', isCompleted && 'checked')}
            onClick={() => onComplete(task.id)}
            aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
            title={isCompleted ? 'Click to restore to incomplete' : 'Click to mark complete'}
            style={{
              borderColor: isCompleted ? 'transparent' : depthColor,
              marginTop: '3px',
              flexShrink: 0,
            }}
          >
            {isCompleted && <Check size={12} color="white" strokeWidth={3} />}
          </button>

          {/* Content details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title & Level Tag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontWeight: depth === 0 ? 700 : 600,
                  fontSize: depth === 0 ? '0.98rem' : '0.9rem',
                  color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: isCompleted ? 'line-through' : 'none',
                  overflowWrap: 'anywhere',
                }}
              >
                {task.title}
              </span>

              {/* Depth Level Indicator */}
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '999px',
                  background: `${depthColor}18`,
                  color: depthColor,
                  border: `1px solid ${depthColor}30`,
                }}
              >
                {depth === 0 ? 'Main Task' : `Subtask L${depth}`}
              </span>

              {/* Area tag (on main tasks or if different) */}
              {depth === 0 && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: `${areaColor}20`,
                    color: areaColor,
                  }}
                >
                  {task.lifeArea}
                </span>
              )}

              {task.plannedStartTime && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  <Clock size={11} /> {formatTime(task.plannedStartTime)}
                </span>
              )}
            </div>

            {/* Subtask Progress bar (if node has children) */}
            {hasChildren && (
              <div style={{ marginTop: '0.45rem', marginBottom: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Sparkles size={11} color={depthColor} />
                    <span>
                      {task.completedSubtaskCount} of {task.subtaskCount} subtask{task.subtaskCount !== 1 ? 's' : ''} completed
                    </span>
                  </span>
                  <span style={{ fontWeight: 700, color: task.progressPercent === 100 ? '#10b981' : depthColor }}>
                    {task.progressPercent}%
                  </span>
                </div>
                <div
                  style={{
                    height: '5px',
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${task.progressPercent}%`,
                      background:
                        task.progressPercent === 100
                          ? '#10b981'
                          : `linear-gradient(90deg, ${depthColor}, #8b5cf6)`,
                      borderRadius: '999px',
                      transition: 'width 0.35s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Independent Notes excerpt & toggle */}
            {!editingNotes ? (
              <div style={{ marginTop: '0.35rem' }}>
                {task.notes ? (
                  <div
                    onClick={() => {
                      setNotesValue(task.notes || '');
                      setEditingNotes(true);
                    }}
                    style={{
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px dashed rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '0.35rem 0.6rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '5px',
                      lineHeight: 1.4,
                    }}
                    title="Click to edit notes for this task"
                  >
                    <FileText size={13} style={{ flexShrink: 0, marginTop: '2px', color: '#818cf8' }} />
                    <span style={{ whiteSpace: 'pre-wrap' }}>{task.notes}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setNotesValue('');
                      setEditingNotes(true);
                    }}
                    className="btn btn-ghost"
                    style={{
                      padding: '2px 6px',
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      height: 'auto',
                    }}
                  >
                    <FileText size={12} />
                    <span>+ Add notes</span>
                  </button>
                )}
              </div>
            ) : (
              /* Inline Notes Editor */
              <div
                style={{
                  marginTop: '0.45rem',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '8px',
                  padding: '0.5rem',
                }}
              >
                <textarea
                  className="input"
                  rows={2}
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  placeholder="Notes for this specific level (e.g. practise tips, exercise lists, resources)…"
                  style={{ fontSize: '0.8rem', resize: 'vertical', marginBottom: '0.4rem' }}
                  autoFocus
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => setEditingNotes(false)}
                    disabled={isSavingNotes}
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}
                  >
                    {isSavingNotes ? 'Saving…' : 'Save Note'}
                  </button>
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                flexWrap: 'wrap',
                marginTop: '0.45rem',
              }}
            >
              {/* + Subtask Button (creates nested child) */}
              <button
                type="button"
                onClick={() => onAddSubtask(task)}
                className="btn btn-sm btn-ghost"
                style={{
                  fontSize: '0.72rem',
                  padding: '0.25rem 0.55rem',
                  color: '#818cf8',
                  background: 'rgba(99, 102, 241, 0.08)',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
                title="Add a subtask nested under this task"
              >
                <Plus size={13} />
                <span>Subtask</span>
              </button>

              {/* Focus / Drill Down (zoom into branch) */}
              {hasChildren && onDrillDown && (
                <button
                  type="button"
                  onClick={() => onDrillDown(task)}
                  className="btn btn-sm btn-ghost"
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.25rem 0.5rem',
                    color: '#38bdf8',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                  title="Focus on this branch"
                >
                  <Maximize2 size={12} />
                  <span>Focus</span>
                </button>
              )}

              {/* Move Up */}
              <button
                type="button"
                onClick={() => onMove(task.id, 'up')}
                disabled={isFirstSibling}
                className="btn btn-sm btn-ghost btn-icon"
                style={{
                  width: '26px',
                  height: '26px',
                  padding: 0,
                  opacity: isFirstSibling ? 0.3 : 0.8,
                  color: 'var(--text-muted)',
                }}
                title="Move up among siblings"
              >
                <ArrowUp size={13} />
              </button>

              {/* Move Down */}
              <button
                type="button"
                onClick={() => onMove(task.id, 'down')}
                disabled={isLastSibling}
                className="btn btn-sm btn-ghost btn-icon"
                style={{
                  width: '26px',
                  height: '26px',
                  padding: 0,
                  opacity: isLastSibling ? 0.3 : 0.8,
                  color: 'var(--text-muted)',
                }}
                title="Move down among siblings"
              >
                <ArrowDown size={13} />
              </button>

              {/* Move / Assign */}
              <button
                type="button"
                onClick={() => setShowAssignModal(true)}
                className="btn btn-sm btn-ghost btn-icon"
                style={{
                  width: '26px',
                  height: '26px',
                  padding: 0,
                  color: '#818cf8',
                }}
                title="Assign or move to another life area, roadmap month, or project"
              >
                <ArrowRightLeft size={13} />
              </button>

              {/* Edit */}
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="btn btn-sm btn-ghost btn-icon"
                style={{
                  width: '26px',
                  height: '26px',
                  padding: 0,
                  color: 'var(--text-muted)',
                }}
                title="Edit task details"
              >
                <Edit3 size={13} />
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => onDelete(task)}
                className="btn btn-sm btn-ghost btn-icon"
                style={{
                  width: '26px',
                  height: '26px',
                  padding: 0,
                  color: '#ef4444',
                }}
                title={hasChildren ? `Delete task and all ${task.subtaskCount} subtasks` : 'Delete task'}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Render Nested Children if Expanded */}
      {hasChildren && isExpanded && (
        <div className="task-tree-children" style={{ position: 'relative' }}>
          {task.children.map((child, index) => (
            <TaskTreeNode
              key={child.id}
              task={child}
              expandedMap={expandedMap}
              onToggleExpand={onToggleExpand}
              onComplete={onComplete}
              onAddSubtask={onAddSubtask}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
              onUpdateNotes={onUpdateNotes}
              onDrillDown={onDrillDown}
              searchQuery={searchQuery}
              isFirstSibling={index === 0}
              isLastSibling={index === task.children.length - 1}
            />
          ))}
        </div>
      )}

      {/* Task Assignment Modal */}
      {showAssignModal && (
        <TaskAssignmentModal
          task={task}
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </div>
  );
}
