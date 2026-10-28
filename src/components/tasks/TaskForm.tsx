import React, { useState } from 'react';
import type { Task, LifeArea, TaskPriority } from '../../types';
import { today } from '../../utils/dates';
import { useApp } from '../../context/AppContext';

interface TaskFormProps {
  initial?: Partial<Task>;
  onSave?: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onSubmit?: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'low',      label: '🔵 Low' },
  { value: 'medium',   label: '🟡 Medium' },
  { value: 'high',     label: '🟠 High' },
  { value: 'critical', label: '🔴 Critical' },
];

export default function TaskForm({ initial = {}, onSave, onSubmit, onCancel }: TaskFormProps) {
  const { customLifeAreas } = useApp();
  const availableAreas = customLifeAreas.filter((a) => a.isEnabled !== false);
  const defaultArea = availableAreas[0]?.id || 'technical';

  const [title, setTitle]           = useState(initial.title ?? '');
  const [description, setDesc]      = useState(initial.description ?? '');
  const [lifeArea, setLifeArea]     = useState<LifeArea>(initial.lifeArea ?? defaultArea);
  const [dueDate, setDueDate]       = useState(initial.dueDate ?? today());
  const [startTime, setStartTime]   = useState(initial.plannedStartTime ?? '');
  const [priority, setPriority]     = useState<TaskPriority>(initial.priority ?? 'medium');
  const [notes, setNotes]           = useState(initial.notes ?? '');
  const [estimated, setEstimated]   = useState(String(initial.estimatedMinutes ?? ''));
  const [error, setError]           = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    if (!dueDate) { setError('Due date is required'); return; }
    setError('');

    const saveFn = onSave || onSubmit;
    if (saveFn) {
      saveFn({
        title: title.trim(),
        description: description.trim() || undefined,
        lifeArea,
        dueDate,
        plannedStartTime: startTime || undefined,
        duration: initial.duration,
        priority,
        status: initial.status ?? 'not-started',
        estimatedMinutes: estimated ? Number(estimated) : undefined,
        actualMinutes: initial.actualMinutes,
        notes: notes.trim() || undefined,
        completedAt: initial.completedAt,
        rescheduledFrom: initial.rescheduledFrom,
        rescheduledTo: initial.rescheduledTo,
        projectId: initial.projectId,
        recurring: initial.recurring ?? 'none',
        parentRecurringId: initial.parentRecurringId,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.6rem 0.9rem', color: '#f87171', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <div>
        <label htmlFor="task-title">Task Title *</label>
        <input
          id="task-title"
          className="input"
          placeholder="What do you need to do?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="task-desc">Description (optional)</label>
        <textarea
          id="task-desc"
          className="input"
          style={{ resize: 'vertical', minHeight: '72px' }}
          placeholder="More details…"
          value={description}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>

      <div className="form-grid-2">
        <div>
          <label htmlFor="task-area">Life Area *</label>
          <select
            id="task-area"
            className="input select"
            value={lifeArea}
            onChange={(e) => setLifeArea(e.target.value as LifeArea)}
          >
            {availableAreas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.icon} {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="task-priority">Priority *</label>
          <select
            id="task-priority"
            className="input select"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-grid-3">
        <div>
          <label htmlFor="task-due">Due Date *</label>
          <input
            id="task-due"
            type="date"
            className="input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="task-start">Start Time</label>
          <input
            id="task-start"
            type="time"
            className="input"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="task-est">Est. Minutes</label>
          <input
            id="task-est"
            type="number"
            className="input"
            placeholder="e.g. 30"
            value={estimated}
            onChange={(e) => setEstimated(e.target.value)}
            min={1}
          />
        </div>
      </div>

      <div>
        <label htmlFor="task-notes">Notes</label>
        <textarea
          id="task-notes"
          className="input"
          style={{ resize: 'vertical', minHeight: '60px' }}
          placeholder="Any blockers, links, or context…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {initial.title ? 'Save Changes' : 'Add Task'}
        </button>
      </div>
    </form>
  );
}
