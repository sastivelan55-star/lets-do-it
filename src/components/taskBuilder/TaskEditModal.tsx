import { useState } from 'react';
import type { Task, LifeArea, TaskPriority } from '../../types';
import Modal from '../ui/Modal';
import { today } from '../../utils/dates';
import { AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialTask?: Task | null;
  parentTask?: Task | null;
}

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#64748b' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'critical', label: 'Critical', color: '#ef4444' },
];

interface FormProps {
  onClose: () => void;
  onSave: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialTask?: Task | null;
  parentTask?: Task | null;
}

function TaskEditForm({ onClose, onSave, initialTask, parentTask }: FormProps) {
  const { customLifeAreas } = useApp();
  const availableAreas = customLifeAreas.filter((a) => a.isEnabled !== false);
  const defaultArea = availableAreas[0]?.id || 'technical';

  const [title, setTitle] = useState(() => initialTask?.title || '');
  const [notes, setNotes] = useState(() => initialTask?.notes || '');
  const [lifeArea, setLifeArea] = useState<LifeArea>(() => initialTask?.lifeArea || parentTask?.lifeArea || defaultArea);
  const [priority, setPriority] = useState<TaskPriority>(() => initialTask?.priority || parentTask?.priority || 'medium');
  const [dueDate, setDueDate] = useState(() => initialTask?.dueDate || parentTask?.dueDate || today());
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>(() =>
    initialTask?.estimatedMinutes ? String(initialTask.estimatedMinutes) : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isEditing = Boolean(initialTask);
  const isSubtask = Boolean(parentTask || initialTask?.parentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setValidationError('Please enter a task title.');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const minutesNum = estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined;
      await onSave({
        title: cleanTitle,
        notes: notes.trim() || undefined,
        description: initialTask?.description,
        lifeArea,
        priority,
        dueDate: dueDate || today(),
        status: initialTask?.status || 'not-started',
        estimatedMinutes: !isNaN(minutesNum as number) && (minutesNum as number) >= 0 ? minutesNum : undefined,
        parentId: initialTask ? initialTask.parentId : (parentTask ? parentTask.id : null),
        orderIndex: initialTask ? initialTask.orderIndex : 0,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save task';
      setValidationError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {parentTask && !isEditing && (
        <div
          style={{
            padding: '0.6rem 0.85rem',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '8px',
            fontSize: '0.8rem',
            color: '#818cf8',
          }}
        >
          Adding nested subtask under: <strong style={{ color: '#c7d2fe' }}>{parentTask.title}</strong>
        </div>
      )}

      {validationError && (
        <div
          role="alert"
          style={{
            padding: '0.6rem 0.85rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>{validationError}</span>
        </div>
      )}

      {/* Title */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
          Task Title <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          type="text"
          className="input"
          placeholder={isSubtask ? 'e.g. Practise loops or finish exercises' : 'e.g. Learn Python or Build full-stack app'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />
      </div>

      {/* Independent Notes at this level */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
          Notes & Details <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>(Independent at this level)</span>
        </label>
        <textarea
          className="input"
          rows={3}
          placeholder="e.g. Practise strings, numbers, booleans, or specific action items…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ resize: 'vertical' }}
        />
      </div>

      {/* Area and Priority */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
            Life Area
          </label>
          <select
            className="input"
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
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
            Priority
          </label>
          <select
            className="input"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Due Date and Estimated Minutes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
            Due Date
          </label>
          <input
            type="date"
            className="input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
            Est. Minutes
          </label>
          <input
            type="number"
            className="input"
            placeholder="e.g. 45"
            min="0"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEditing ? 'Save Changes' : isSubtask ? 'Add Subtask' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}

export default function TaskEditModal({
  isOpen,
  onClose,
  onSave,
  initialTask,
  parentTask,
}: TaskEditModalProps) {
  const isEditing = Boolean(initialTask);
  const isSubtask = Boolean(parentTask || initialTask?.parentId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : isSubtask ? 'Add Subtask' : 'Add Main Task'}
    >
      {isOpen && (
        <TaskEditForm
          key={initialTask?.id || parentTask?.id || 'new-task'}
          onClose={onClose}
          onSave={onSave}
          initialTask={initialTask}
          parentTask={parentTask}
        />
      )}
    </Modal>
  );
}
