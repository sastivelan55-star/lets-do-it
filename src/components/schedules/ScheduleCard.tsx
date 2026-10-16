import { useState } from 'react';
import { Clock, Edit3, Trash2, CheckCircle2, Link2 } from 'lucide-react';
import type { ScheduleEntry, Task } from '../../types';

interface ScheduleCardProps {
  schedule: ScheduleEntry;
  linkedTask?: Task;
  onEdit: (schedule: ScheduleEntry) => void;
  onDelete: (id: string) => void;
}

export default function ScheduleCard({
  schedule,
  linkedTask,
  onEdit,
  onDelete,
}: ScheduleCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        gap: '0.875rem',
        padding: '0.875rem 1rem',
        background: 'var(--bg-surface-2)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        alignItems: 'flex-start',
        transition: 'border-color 0.15s ease',
      }}
    >
      {/* Time block pill */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.45rem 0.65rem',
          borderRadius: '8px',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          minWidth: '5.2rem',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: '#818cf8',
          }}
        >
          <Clock size={11} /> {schedule.startTime}
        </span>
        <span
          style={{
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            marginTop: '2px',
          }}
        >
          to {schedule.endTime}
        </span>
      </div>

      {/* Main details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          className="task-title"
          style={{
            fontWeight: 700,
            fontSize: '0.92rem',
            margin: '0 0 0.25rem 0',
            color: 'var(--text-primary)',
            overflowWrap: 'anywhere',
          }}
        >
          {schedule.title}
        </h3>

        {schedule.description && (
          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              margin: '0 0 0.4rem 0',
              lineHeight: 1.4,
              overflowWrap: 'anywhere',
            }}
          >
            {schedule.description}
          </p>
        )}

        {/* Linked Task badge */}
        {linkedTask && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              background: 'rgba(139, 92, 246, 0.12)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              fontSize: '0.72rem',
              color: '#a78bfa',
              marginTop: '0.2rem',
            }}
          >
            <Link2 size={11} />
            <span>Task: {linkedTask.title}</span>
            {linkedTask.status === 'completed' && <CheckCircle2 size={11} color="#10b981" />}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexShrink: 0 }}>
        <button
          className="btn btn-ghost btn-sm btn-icon"
          onClick={() => onEdit(schedule)}
          title="Edit Schedule"
          aria-label="Edit Schedule"
        >
          <Edit3 size={14} />
        </button>

        {confirmDelete ? (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              className="btn btn-sm btn-danger"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              onClick={() => onDelete(schedule.id)}
            >
              Delete
            </button>
            <button
              className="btn btn-sm btn-ghost"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="btn btn-ghost btn-sm btn-icon"
            style={{ color: '#ef4444' }}
            onClick={() => setConfirmDelete(true)}
            title="Delete Schedule"
            aria-label="Delete Schedule"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
