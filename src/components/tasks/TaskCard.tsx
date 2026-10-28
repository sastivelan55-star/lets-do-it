import { useState } from 'react';
import { Check, Clock, Edit3, Trash2, CalendarClock, ChevronDown, ChevronUp, Play, ListTree, ArrowRightLeft } from 'lucide-react';
import type { Task } from '../../types';
import { formatTime, today } from '../../utils/dates';
import { useApp } from '../../context/AppContext';
import TaskAssignmentModal from './TaskAssignmentModal';
import clsx from 'clsx';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onReschedule: (id: string, date: string) => void;
  onStart?: (id: string) => void;
}

const AREA_COLOR: Record<string, string> = {
  technical: '#6366f1',
  communication: '#06b6d4',
  career: '#f59e0b',
  creativity: '#ec4899',
  health: '#10b981',
};

const AREA_LABEL: Record<string, string> = {
  technical: 'Technical',
  communication: 'Communication',
  career: 'Career',
  creativity: 'Creativity',
  health: 'Health',
};

const PRIORITY_DOT: Record<string, string> = {
  low: '#64748b',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

export default function TaskCard({ task, onComplete, onEdit, onDelete, onReschedule, onStart }: TaskCardProps) {
  const { tasks, customLifeAreas } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(today());
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Dynamic life area lookups
  const matchedArea = customLifeAreas.find((a) => a.id === task.lifeArea);
  const areaColor = matchedArea?.color ?? AREA_COLOR[task.lifeArea] ?? '#818cf8';
  const areaLabel = matchedArea?.name ?? AREA_LABEL[task.lifeArea] ?? task.lifeArea;

  // Subtask calculations
  const directSubtasks = tasks.filter((t) => t.parentId === task.id);
  const hasSubtasks = directSubtasks.length > 0;
  const completedSubtasksCount = directSubtasks.filter((t) => t.status === 'completed').length;
  const subtaskPercent = hasSubtasks ? Math.round((completedSubtasksCount / directSubtasks.length) * 100) : 0;

  const isCompleted = task.status === 'completed';
  const isOverdue = task.dueDate < today() && !isCompleted && task.status !== 'rescheduled';

  const handleReschedule = () => {
    if (rescheduleDate && rescheduleDate > task.dueDate) {
      onReschedule(task.id, rescheduleDate);
      setShowReschedule(false);
    }
  };

  return (
    <div
      className={clsx('task-card', isCompleted && 'completed')}
      style={{ borderLeft: `3px solid ${areaColor}` }}
    >
      {/* Reversible completion checkbox toggle */}
      <button
        type="button"
        className={clsx('task-checkbox', isCompleted && 'checked')}
        onClick={() => onComplete(task.id)}
        aria-label={isCompleted ? 'Mark task as incomplete' : 'Mark task as completed'}
        title={isCompleted ? 'Click to restore to incomplete' : 'Click to mark complete'}
        style={{ borderColor: isCompleted ? 'transparent' : areaColor }}
      >
        {isCompleted && <Check size={12} color="white" strokeWidth={3} />}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', width: '100%', minWidth: 0 }}>
          <span
            className="task-title"
            style={{
              flex: 1,
              minWidth: 0,
              fontWeight: 600,
              fontSize: '0.9rem',
              color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
              textDecoration: isCompleted ? 'line-through' : 'none',
              overflowWrap: 'anywhere',
              wordBreak: 'normal',
            }}
          >
            {task.title}
          </span>
          {/* Priority dot */}
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: PRIORITY_DOT[task.priority],
              flexShrink: 0,
              marginTop: 5,
            }}
            title={`Priority: ${task.priority}`}
          />
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
          <span
            className="badge"
            style={{ background: `${areaColor}20`, color: areaColor, fontSize: '0.7rem' }}
          >
            {areaLabel}
          </span>

          {/* Convenient small assignment / move button */}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={(e) => {
              e.stopPropagation();
              setShowAssignModal(true);
            }}
            title="Assign or move task to another life area, roadmap month, or project"
            style={{
              padding: '2px 6px',
              fontSize: '0.7rem',
              height: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              color: 'var(--text-muted)',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <ArrowRightLeft size={10} color="#818cf8" />
            <span>Move</span>
          </button>

          {task.plannedStartTime && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Clock size={11} />
              {formatTime(task.plannedStartTime)}
              {task.estimatedMinutes && ` · ${task.estimatedMinutes}m`}
            </span>
          )}

          {isOverdue && (
            <span className="badge status-rescheduled" style={{ fontSize: '0.7rem' }}>
              ⚠ Overdue
            </span>
          )}

          {task.status === 'in-progress' && (
            <span className="badge status-in-progress" style={{ fontSize: '0.7rem' }}>
              ▶ In Progress
            </span>
          )}

          {hasSubtasks && (
            <span
              className="badge"
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                fontSize: '0.7rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
              title={`${completedSubtasksCount} of ${directSubtasks.length} subtasks completed (${subtaskPercent}%)`}
            >
              <ListTree size={11} />
              {completedSubtasksCount}/{directSubtasks.length} ({subtaskPercent}%)
            </span>
          )}
        </div>

        {/* Expanded details */}
        {expanded && (
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {task.description && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{task.description}</p>
            )}
            {task.notes && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>📝 {task.notes}</p>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              {!isCompleted && onStart && task.status !== 'in-progress' && (
                <button className="btn btn-sm btn-primary" onClick={() => onStart(task.id)}>
                  <Play size={12} /> Start
                </button>
              )}
              <button className="btn btn-sm btn-secondary" onClick={() => setShowAssignModal(true)}>
                <ArrowRightLeft size={12} /> Assign / Move
              </button>
              <button className="btn btn-sm btn-secondary" onClick={() => onEdit(task)}>
                <Edit3 size={12} /> Edit
              </button>
              {!isCompleted && (
                <button className="btn btn-sm btn-secondary" onClick={() => setShowReschedule((v) => !v)}>
                  <CalendarClock size={12} /> Reschedule
                </button>
              )}
              {confirmDelete ? (
                <>
                  <button className="btn btn-sm btn-danger" onClick={() => onDelete(task.id)}>Confirm Delete</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
                </>
              ) : (
                <button className="btn btn-sm btn-ghost" onClick={() => setConfirmDelete(true)} style={{ color: '#ef4444' }}>
                  <Trash2 size={12} />
                </button>
              )}
            </div>

            {/* Reschedule picker */}
            {showReschedule && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                <input
                  type="date"
                  className="input"
                  style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                  value={rescheduleDate}
                  min={today()}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                />
                <button className="btn btn-sm btn-primary" onClick={handleReschedule}>Move</button>
                <button className="btn btn-sm btn-ghost" onClick={() => setShowReschedule(false)}>✕</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expand toggle */}
      <button
        className="btn btn-ghost btn-icon"
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? 'Collapse task' : 'Expand task'}
        style={{ color: 'var(--text-muted)', flexShrink: 0 }}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

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
