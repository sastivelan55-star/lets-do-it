import { useState } from 'react';
import Modal from '../ui/Modal';
import { AlertTriangle } from 'lucide-react';
import type { HierarchicalTask } from '../../types';

interface DeleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  task: HierarchicalTask | null;
}

export default function DeleteTaskModal({
  isOpen,
  onClose,
  onConfirm,
  task,
}: DeleteTaskModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!task) return null;

  const hasSubtasks = task.subtaskCount > 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // Handled in parent
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} />
          </div>

          <div>
            <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Delete &ldquo;{task.title}&rdquo;?
            </h4>
            {hasSubtasks ? (
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#fca5a5', lineHeight: 1.45 }}>
                <strong>Warning:</strong> This task contains <strong>{task.subtaskCount}</strong> nested {task.subtaskCount === 1 ? 'subtask' : 'subtasks'}. Deleting it will permanently remove the parent and all its nested subtasks across all levels.
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                This action cannot be undone. Are you sure you want to delete this task?
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : hasSubtasks ? `Delete All (${task.subtaskCount + 1})` : 'Delete Task'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
