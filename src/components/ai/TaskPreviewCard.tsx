import { useState } from 'react';
import { Check, X, Edit3, Calendar, Clock, Flag, Repeat } from 'lucide-react';
import type { ExtractedTaskData } from '../../services/novaOrchestrator';

interface TaskPreviewCardProps {
  task: ExtractedTaskData;
  onConfirm: (task: ExtractedTaskData) => void;
  onCancel: () => void;
}

const LIFE_AREA_COLORS: Record<string, string> = {
  technical: '#3b82f6',
  communication: '#10b981',
  career: '#f59e0b',
  creativity: '#8b5cf6',
  health: '#ef4444',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#64748b',
  medium: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444',
};

export default function TaskPreviewCard({ task, onConfirm, onCancel }: TaskPreviewCardProps) {
  const [editMode, setEditMode] = useState(false);
  const [editedTask, setEditedTask] = useState<ExtractedTaskData>({ ...task });

  const areaColor = (editedTask.lifeArea && LIFE_AREA_COLORS[editedTask.lifeArea]) || '#6366f1';
  const priorityColor = PRIORITY_COLORS[editedTask.priority] || '#3b82f6';

  const handleConfirm = () => onConfirm(editedTask);

  return (
    <div
      style={{
        background: 'rgba(17, 24, 39, 0.9)',
        border: `1px solid ${areaColor}55`,
        borderRadius: '14px',
        padding: '1rem',
        marginTop: '0.5rem',
        width: '100%',
        boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px ${areaColor}22`,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: areaColor,
            boxShadow: `0 0 6px ${areaColor}`,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: areaColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          New Task Preview
        </span>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => setEditMode(!editMode)}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            color: '#94a3b8',
            borderRadius: '6px',
            padding: '3px 7px',
            fontSize: '0.68rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
          }}
          title="Edit task before saving"
        >
          <Edit3 size={11} />
          {editMode ? 'Done' : 'Edit'}
        </button>
      </div>

      {/* Task Title */}
      {editMode ? (
        <input
          value={editedTask.title}
          onChange={(e) => setEditedTask((p: ExtractedTaskData) => ({ ...p, title: e.target.value }))}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px',
            color: '#f8fafc',
            fontSize: '0.9rem',
            fontWeight: 700,
            padding: '0.45rem 0.6rem',
            outline: 'none',
            marginBottom: '0.6rem',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <h4 style={{ margin: '0 0 0.65rem', fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.3 }}>
          {editedTask.title}
        </h4>
      )}

      {/* Meta Row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.4rem',
          marginBottom: '0.7rem',
        }}
      >
        {/* Life Area Badge */}
        {editedTask.lifeArea && (
          <span
            style={{
              background: `${areaColor}22`,
              color: areaColor,
              border: `1px solid ${areaColor}44`,
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '0.68rem',
              fontWeight: 700,
            }}
          >
            {editedTask.lifeArea}
          </span>
        )}

        {/* Priority Badge */}
        <span
          style={{
            background: `${priorityColor}22`,
            color: priorityColor,
            border: `1px solid ${priorityColor}44`,
            borderRadius: '6px',
            padding: '2px 8px',
            fontSize: '0.68rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          <Flag size={9} />
          {editedTask.priority}
        </span>

        {/* Recurring */}
        {editedTask.recurring && editedTask.recurring !== 'none' && (
          <span
            style={{
              background: 'rgba(139, 92, 246, 0.15)',
              color: '#a78bfa',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '0.68rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <Repeat size={9} />
            {editedTask.recurring}
          </span>
        )}
      </div>

      {/* Date/Time Row */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#94a3b8' }}>
          <Calendar size={12} color="#818cf8" />
          {editMode ? (
            <input
              type="date"
              value={editedTask.dueDate || ''}
              onChange={(e) => setEditedTask((p: ExtractedTaskData) => ({ ...p, dueDate: e.target.value }))}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px',
                color: '#c7d2fe',
                fontSize: '0.75rem',
                padding: '2px 6px',
                outline: 'none',
              }}
            />
          ) : (
            <span style={{ color: '#c7d2fe', fontWeight: 600 }}>{editedTask.dueDate || 'No due date'}</span>
          )}
        </div>

        {editedTask.plannedStartTime && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#94a3b8' }}>
            <Clock size={12} color="#818cf8" />
            {editMode ? (
              <input
                type="time"
                value={editedTask.plannedStartTime}
                onChange={(e) => setEditedTask((p: ExtractedTaskData) => ({ ...p, plannedStartTime: e.target.value }))}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  color: '#c7d2fe',
                  fontSize: '0.75rem',
                  padding: '2px 6px',
                  outline: 'none',
                }}
              />
            ) : (
              <span style={{ color: '#c7d2fe', fontWeight: 600 }}>{editedTask.plannedStartTime}</span>
            )}
          </div>
        )}
      </div>

      {/* Description / Notes */}
      {(editedTask.description || editedTask.notes) && !editMode && (
        <p style={{ margin: '0 0 0.65rem', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>
          {editedTask.description}
          {editedTask.notes && <span style={{ color: '#818cf8' }}> 📍 {editedTask.notes}</span>}
        </p>
      )}

      {editMode && (
        <div style={{ marginBottom: '0.65rem' }}>
          <select
            value={editedTask.lifeArea || 'technical'}
            onChange={(e) => setEditedTask((p: ExtractedTaskData) => ({ ...p, lifeArea: e.target.value as any }))}
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              color: '#c7d2fe',
              fontSize: '0.75rem',
              padding: '4px 8px',
              outline: 'none',
              marginRight: '0.4rem',
            }}
          >
            <option value="technical">Technical</option>
            <option value="communication">Communication</option>
            <option value="career">Career</option>
            <option value="creativity">Creativity</option>
            <option value="health">Health</option>
          </select>
          <select
            value={editedTask.priority}
            onChange={(e) => setEditedTask((p: ExtractedTaskData) => ({ ...p, priority: e.target.value as any }))}
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              color: '#c7d2fe',
              fontSize: '0.75rem',
              padding: '4px 8px',
              outline: 'none',
            }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={handleConfirm}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            padding: '0.5rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)',
          }}
        >
          <Check size={14} />
          Save Task
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#f87171',
            padding: '0.5rem 0.75rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}
        >
          <X size={14} />
          Cancel
        </button>
      </div>
    </div>
  );
}
