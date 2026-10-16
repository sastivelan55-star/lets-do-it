import React, { useState } from 'react';
import type { ScheduleEntry } from '../../types';
import { today } from '../../utils/dates';

import { useApp } from '../../context/AppContext';

interface ScheduleFormProps {
  initial?: Partial<ScheduleEntry>;
  onSubmit: (data: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export default function ScheduleForm({ initial = {}, onSubmit, onCancel }: ScheduleFormProps) {
  const { tasks } = useApp();

  const [title, setTitle] = useState(initial.title ?? '');
  const [date, setDate] = useState(initial.date ?? today());
  const [startTime, setStartTime] = useState(initial.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(initial.endTime ?? '10:00');
  const [description, setDescription] = useState(initial.description ?? '');
  const [linkedTaskId, setLinkedTaskId] = useState(initial.linkedTaskId ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!date) {
      setError('Date is required');
      return;
    }
    if (!startTime) {
      setError('Start time is required');
      return;
    }
    if (!endTime) {
      setError('End time is required');
      return;
    }
    if (startTime >= endTime) {
      setError('End time must be later than start time');
      return;
    }

    setError('');
    onSubmit({
      title: title.trim(),
      date,
      startTime,
      endTime,
      description: description.trim() || undefined,
      linkedTaskId: linkedTaskId || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {error && (
        <div
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px',
            padding: '0.6rem 0.9rem',
            color: '#f87171',
            fontSize: '0.85rem',
          }}
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="sched-title">Schedule Title *</label>
        <input
          id="sched-title"
          className="input"
          placeholder="e.g. Deep Work: Spring Security or Morning DSA"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </div>

      <div className="form-grid-3">
        <div>
          <label htmlFor="sched-date">Date *</label>
          <input
            id="sched-date"
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="sched-start">Start Time *</label>
          <input
            id="sched-start"
            type="time"
            className="input"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="sched-end">End Time *</label>
          <input
            id="sched-end"
            type="time"
            className="input"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="sched-task">Linked Task (optional)</label>
        <select
          id="sched-task"
          className="input select"
          value={linkedTaskId}
          onChange={(e) => setLinkedTaskId(e.target.value)}
        >
          <option value="">-- None (Standalone Schedule) --</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.status === 'completed' ? '✓ ' : '○ '} {t.title} ({t.lifeArea})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="sched-desc">Description (optional)</label>
        <textarea
          id="sched-desc"
          className="input"
          style={{ resize: 'vertical', minHeight: '64px' }}
          placeholder="Objectives, locations, or notes for this time block…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {initial.title ? 'Save Changes' : 'Add Schedule'}
        </button>
      </div>
    </form>
  );
}
