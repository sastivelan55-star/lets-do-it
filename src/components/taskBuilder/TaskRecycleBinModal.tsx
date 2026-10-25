import { useState } from 'react';
import Modal from '../ui/Modal';
import {
  RotateCcw,
  Trash2,
  AlertTriangle,
  FileText,
  Clock,
  Layers,
  Inbox,
  CheckCircle2,
} from 'lucide-react';
import type { Task } from '../../types';
import { formatTime } from '../../utils/dates';

interface TaskRecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedTasks: Task[];
  onRestore: (id: string) => Promise<void>;
  onPermanentDelete: (id: string) => Promise<void>;
  onEmptyRecycleBin: () => Promise<void>;
}

export default function TaskRecycleBinModal({
  isOpen,
  onClose,
  deletedTasks,
  onRestore,
  onPermanentDelete,
  onEmptyRecycleBin,
}: TaskRecycleBinModalProps) {
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [permanentDeletingTask, setPermanentDeletingTask] = useState<Task | null>(null);
  const [isEmptyConfirmOpen, setIsEmptyConfirmOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Group deleted tasks so root deleted tasks appear with nested children count
  const deletedMap = new Map(deletedTasks.map((t) => [t.id, t]));
  const rootDeletedTasks = deletedTasks.filter((t) => !t.parentId || !deletedMap.has(t.parentId));

  const formatDeletedDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at ${formatTime(d.toTimeString().slice(0, 5))}`;
    } catch {
      return dateStr;
    }
  };

  const getSubtaskCount = (taskId: string): number => {
    let count = 0;
    for (const t of deletedTasks) {
      if (t.parentId === taskId) {
        count += 1 + getSubtaskCount(t.id);
      }
    }
    return count;
  };

  const handleRestore = async (taskId: string, title: string) => {
    setRestoringId(taskId);
    try {
      await onRestore(taskId);
      setActionSuccessMessage(`Restored "${title}"`);
      setTimeout(() => setActionSuccessMessage(null), 3000);
    } finally {
      setRestoringId(null);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!permanentDeletingTask) return;
    setIsActionLoading(true);
    try {
      await onPermanentDelete(permanentDeletingTask.id);
      setPermanentDeletingTask(null);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmEmpty = async () => {
    setIsActionLoading(true);
    try {
      await onEmptyRecycleBin();
      setIsEmptyConfirmOpen(false);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Task Recycle Bin">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh' }}>
          {/* Header Info & Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Items in the Recycle Bin can be restored or permanently removed.
              </p>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  display: 'inline-block',
                  marginTop: '0.2rem',
                }}
              >
                {deletedTasks.length} {deletedTasks.length === 1 ? 'deleted item' : 'deleted items'}
              </span>
            </div>

            {deletedTasks.length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => setIsEmptyConfirmOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}
              >
                <Trash2 size={13} />
                <span>Empty Recycle Bin</span>
              </button>
            )}
          </div>

          {/* Success banner */}
          {actionSuccessMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '0.8rem',
              }}
            >
              <CheckCircle2 size={15} />
              <span>{actionSuccessMessage}</span>
            </div>
          )}

          {/* Deleted List */}
          {deletedTasks.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <Inbox size={42} color="#64748b" style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
              <h4 style={{ margin: '0 0 0.3rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Recycle Bin is empty
              </h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}>
                When you delete tasks or subtasks, they will be kept here safely so you can restore them anytime.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                overflowY: 'auto',
                paddingRight: '4px',
              }}
            >
              {rootDeletedTasks.map((task) => {
                const subCount = getSubtaskCount(task.id);
                const isRestoring = restoringId === task.id;

                return (
                  <div
                    key={task.id}
                    style={{
                      background: 'var(--bg-surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                            {task.title}
                          </span>
                          <span
                            className="badge"
                            style={{
                              fontSize: '0.68rem',
                              background: 'rgba(99, 102, 241, 0.15)',
                              color: '#a5b4fc',
                              textTransform: 'capitalize',
                            }}
                          >
                            {task.lifeArea}
                          </span>
                          {subCount > 0 && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(56, 189, 248, 0.12)',
                                color: '#38bdf8',
                                fontWeight: 600,
                              }}
                            >
                              <Layers size={11} />
                              +{subCount} {subCount === 1 ? 'subtask' : 'subtasks'}
                            </span>
                          )}
                        </div>

                        {task.notes && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              marginTop: '0.3rem',
                              fontSize: '0.78rem',
                              color: 'var(--text-secondary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '480px',
                            }}
                          >
                            <FileText size={12} style={{ flexShrink: 0, opacity: 0.7 }} />
                            <span>{task.notes}</span>
                          </div>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '0.35rem',
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                          }}
                        >
                          <Clock size={11} />
                          <span>Deleted {formatDeletedDate(task.deletedAt)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleRestore(task.id, task.title)}
                          disabled={isRestoring}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.78rem',
                            color: '#34d399',
                            borderColor: 'rgba(52, 211, 153, 0.3)',
                          }}
                          title="Restore task and its subtasks"
                        >
                          <RotateCcw size={12} />
                          <span>{isRestoring ? 'Restoring…' : 'Restore'}</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => setPermanentDeletingTask(task)}
                          style={{
                            padding: '4px 8px',
                            color: '#f87171',
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Permanently delete from database"
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Explicit Confirmation for Permanent Delete */}
      {permanentDeletingTask && (
        <Modal
          isOpen={Boolean(permanentDeletingTask)}
          onClose={() => setPermanentDeletingTask(null)}
          title="Delete Permanently"
        >
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
                  Permanently delete &ldquo;{permanentDeletingTask.title}&rdquo;?
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#fca5a5', lineHeight: 1.45 }}>
                  This will permanently erase this task {getSubtaskCount(permanentDeletingTask.id) > 0 ? `and all its ${getSubtaskCount(permanentDeletingTask.id)} nested subtasks` : ''} from the database. This action <strong>cannot be undone</strong>.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setPermanentDeletingTask(null)}
                disabled={isActionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmPermanentDelete}
                disabled={isActionLoading}
              >
                {isActionLoading ? 'Deleting…' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Strong Confirmation for Empty Recycle Bin */}
      {isEmptyConfirmOpen && (
        <Modal
          isOpen={isEmptyConfirmOpen}
          onClose={() => setIsEmptyConfirmOpen(false)}
          title="Empty Recycle Bin"
        >
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
                <Trash2 size={20} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Empty all {deletedTasks.length} {deletedTasks.length === 1 ? 'item' : 'items'} in Recycle Bin?
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#fca5a5', lineHeight: 1.45 }}>
                  All items currently in the Recycle Bin will be permanently purged from your account. Active tasks will not be affected. This action <strong>cannot be undone</strong>.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsEmptyConfirmOpen(false)}
                disabled={isActionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmEmpty}
                disabled={isActionLoading}
              >
                {isActionLoading ? 'Purging…' : `Empty Recycle Bin (${deletedTasks.length})`}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
