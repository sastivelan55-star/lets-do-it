import { useState } from 'react';
import { AlertCircle, CalendarClock, Clock, CheckSquare, Square } from 'lucide-react';
import type { Task } from '../../types';
import { useApp } from '../../context/AppContext';
import Modal from '../ui/Modal';
import { today } from '../../utils/dates';

interface OverdueManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTask?: (id: string) => void;
}

export default function OverdueManagerModal({ isOpen, onClose }: OverdueManagerModalProps) {
  const { overdueTasks, rescheduleTask, rescheduleAllOverdueTasks, customLifeAreas } = useApp();

  const [bulkDate, setBulkDate] = useState<string>(today());
  const [individualDates, setIndividualDates] = useState<Record<string, string>>({});
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    () => new Set(overdueTasks.map((t) => t.id))
  );
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSelectTask = (id: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.size === overdueTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(overdueTasks.map((t) => t.id)));
    }
  };

  const handleRescheduleSingle = async (task: Task) => {
    const targetDate = individualDates[task.id] || today();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await rescheduleTask(task.id, targetDate);
      setFeedback(`Rescheduled "${task.title}" to ${targetDate}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkReschedule = async () => {
    if (selectedTaskIds.size === 0) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      // If all are selected, use the bulk helper; otherwise reschedule selected ones
      if (selectedTaskIds.size === overdueTasks.length) {
        const { count } = await rescheduleAllOverdueTasks(bulkDate);
        setFeedback(`Successfully rescheduled all ${count} overdue tasks to ${bulkDate}.`);
      } else {
        for (const id of selectedTaskIds) {
          await rescheduleTask(id, bulkDate);
        }
        setFeedback(`Successfully rescheduled ${selectedTaskIds.size} overdue tasks to ${bulkDate}.`);
      }
      setShowBulkConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAreaLabel = (areaId: string) => {
    const found = customLifeAreas.find((a) => a.id === areaId);
    return found ? found.name : areaId;
  };

  const getAreaColor = (areaId: string) => {
    const found = customLifeAreas.find((a) => a.id === areaId);
    return found ? found.color : '#818cf8';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Overdue Tasks Manager">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Banner */}
        <div
          style={{
            padding: '0.85rem 1rem',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
          <div>
            <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.88rem' }}>
              {overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? 's' : ''}
            </span>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              No guilt. A missed date is just an adjustment opportunity. Reschedule individually or in bulk.
            </p>
          </div>
        </div>

        {feedback && (
          <div
            style={{
              padding: '0.75rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
              color: '#34d399',
              fontSize: '0.83rem',
            }}
          >
            ✅ {feedback}
          </div>
        )}

        {overdueTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
              🎉 All caught up!
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              There are no overdue tasks remaining.
            </p>
          </div>
        ) : (
          <>
            {/* Bulk Reschedule Action Bar */}
            <div
              style={{
                padding: '0.875rem',
                background: 'var(--bg-surface-2)',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={toggleSelectAll}
                  style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {selectedTaskIds.size === overdueTasks.length ? (
                    <CheckSquare size={16} color="var(--accent)" />
                  ) : (
                    <Square size={16} color="var(--text-muted)" />
                  )}
                  Select All ({selectedTaskIds.size}/{overdueTasks.length})
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>New Date:</label>
                  <input
                    type="date"
                    className="input"
                    value={bulkDate}
                    min={today()}
                    onChange={(e) => setBulkDate(e.target.value)}
                    style={{ fontSize: '0.82rem', padding: '0.3rem 0.5rem', width: 'auto' }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={selectedTaskIds.size === 0 || isSubmitting}
                    onClick={() => setShowBulkConfirm(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <CalendarClock size={14} /> Reschedule Selected ({selectedTaskIds.size})
                  </button>
                </div>
              </div>

              {/* Confirmation Preview */}
              {showBulkConfirm && (
                <div
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    Confirm: Reschedule {selectedTaskIds.size} task{selectedTaskIds.size > 1 ? 's' : ''} to{' '}
                    <span style={{ color: 'var(--accent)' }}>{bulkDate}</span>?
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setShowBulkConfirm(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleBulkReschedule}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Rescheduling…' : 'Confirm Bulk Reschedule'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* List of Overdue Tasks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '50vh', overflowY: 'auto' }}>
              {overdueTasks.map((task) => {
                const isSelected = selectedTaskIds.has(task.id);
                const areaColor = getAreaColor(task.lifeArea);
                const targetDate = individualDates[task.id] || today();

                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: 'var(--bg-surface-2)',
                      borderRadius: '8px',
                      borderLeft: `3px solid ${areaColor}`,
                      border: '1px solid var(--border)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSelectTask(task.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }}
                      aria-label={isSelected ? 'Deselect task' : 'Select task'}
                    >
                      {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>

                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.88rem', margin: '0 0 2px 0', color: 'var(--text-primary)' }}>
                        {task.title}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="badge" style={{ background: `${areaColor}20`, color: areaColor, fontSize: '0.7rem' }}>
                          {getAreaLabel(task.lifeArea)}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>
                          Due: {task.dueDate}
                        </span>
                        {task.plannedStartTime && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <Clock size={11} /> {task.plannedStartTime}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Individual Reschedule Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      <input
                        type="date"
                        className="input"
                        value={targetDate}
                        min={today()}
                        onChange={(e) =>
                          setIndividualDates((prev) => ({ ...prev, [task.id]: e.target.value }))
                        }
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.4rem', width: 'auto' }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleRescheduleSingle(task)}
                        disabled={isSubmitting}
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      >
                        Reschedule
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
