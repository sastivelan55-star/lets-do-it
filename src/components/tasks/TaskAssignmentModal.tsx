import { useState } from 'react';
import { ArrowRightLeft, Check, AlertTriangle, MapPin, FolderOpen, Calendar } from 'lucide-react';
import type { Task, LifeArea, TaskPriority } from '../../types';
import { useApp } from '../../context/AppContext';
import Modal from '../ui/Modal';

interface TaskAssignmentModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskAssignmentModal({ task, isOpen, onClose }: TaskAssignmentModalProps) {
  const { customLifeAreas, projects, assignTask, milestones } = useApp();

  const [selectedArea, setSelectedArea] = useState<LifeArea>(task.lifeArea);
  const [selectedMonth, setSelectedMonth] = useState<number | 'none'>(task.roadmapMonth ?? 'none');
  const [selectedProject, setSelectedProject] = useState<string | 'none'>(task.projectId ?? 'none');
  const [selectedDueDate, setSelectedDueDate] = useState<string>(task.dueDate);
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>(task.priority);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const currentAreaObj = customLifeAreas.find((a) => a.id === task.lifeArea);
  const newAreaObj = customLifeAreas.find((a) => a.id === selectedArea);
  const isAreaChanging = selectedArea !== task.lifeArea;

  const handleSave = async () => {
    // If moving to a different life area, show confirmation first
    if (isAreaChanging && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await assignTask(task.id, {
        lifeArea: selectedArea,
        roadmapMonth: selectedMonth === 'none' ? null : Number(selectedMonth),
        projectId: selectedProject === 'none' ? null : selectedProject,
        dueDate: selectedDueDate,
        priority: selectedPriority,
      });
      onClose();
    } catch {
      // Error handled in AppContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign & Move Task">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Task Info Pill */}
        <div
          style={{
            padding: '0.75rem',
            background: 'var(--bg-surface-2)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Task</span>
          <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
            {task.title}
          </p>
        </div>

        {/* Confirmation banner if moving area */}
        {showConfirm && isAreaChanging && (
          <div
            style={{
              padding: '0.85rem',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              color: '#f59e0b',
              fontSize: '0.83rem',
            }}
          >
            <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', fontWeight: 600 }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Confirm Life Area Transfer</span>
            </div>
            <p style={{ margin: '0.4rem 0 0 0', color: 'var(--text-secondary)' }}>
              Moving from <strong>{currentAreaObj?.name || task.lifeArea}</strong> to{' '}
              <strong>{newAreaObj?.name || selectedArea}</strong> will transfer this task and its progress metrics.
              Subtasks, notes, and completion state will be preserved.
            </p>
          </div>
        )}

        {/* 1. Life Planning Area */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem' }}>
            <MapPin size={14} color="var(--accent)" /> Life Planning Area
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem' }}>
            {customLifeAreas.map((area) => (
              <button
                key={area.id}
                type="button"
                className={`btn btn-sm ${selectedArea === area.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  fontSize: '0.75rem',
                  justifyContent: 'flex-start',
                  borderLeft: `3px solid ${area.color}`,
                }}
                onClick={() => {
                  setSelectedArea(area.id);
                  setShowConfirm(false);
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {area.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Destination Roadmap Month */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem' }}>
            <Calendar size={14} color="#60a5fa" /> Roadmap Month
          </label>
          <select
            className="input select"
            value={String(selectedMonth)}
            onChange={(e) => setSelectedMonth(e.target.value === 'none' ? 'none' : Number(e.target.value))}
            style={{ fontSize: '0.85rem' }}
          >
            <option value="none">No roadmap month assigned</option>
            {milestones.length > 0
              ? milestones.map((m) => (
                  <option key={m.id} value={m.month}>
                    Month {m.month}: {m.title}
                  </option>
                ))
              : [1, 2, 3, 4, 5, 6, 7, 8].map((mo) => (
                  <option key={mo} value={mo}>
                    Month {mo}
                  </option>
                ))}
          </select>
        </div>

        {/* 3. Link to Project */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.35rem' }}>
            <FolderOpen size={14} color="#f97316" /> Project Link
          </label>
          <select
            className="input select"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          >
            <option value="none">Independent Task (No Project)</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Due Date & Priority */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Due Date</label>
            <input
              type="date"
              className="input"
              value={selectedDueDate}
              onChange={(e) => setSelectedDueDate(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Priority</label>
            <select
              className="input select"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as TaskPriority)}
              style={{ fontSize: '0.85rem' }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSubmitting}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {showConfirm && isAreaChanging ? (
              <>
                <Check size={14} /> Confirm & Move
              </>
            ) : (
              <>
                <ArrowRightLeft size={14} /> {isSubmitting ? 'Saving…' : 'Save Assignment'}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
