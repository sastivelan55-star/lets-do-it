// Life OS — Individual Daily Recurrence Toggle Button
// Allows any task to be marked as Daily with a single click.
// Preserves task ID, title, description, priority, and existing deadline.

import React, { useState } from 'react';
import { Repeat } from 'lucide-react';
import type { Task } from '../../types';
import { today } from '../../utils/dates';

export interface DailyRecurrenceToggleProps {
  task: Task;
  onUpdate?: (updatedTask: Task) => Promise<void> | void;
  onToggle?: (updatedTask: Task) => Promise<void> | void;
  compact?: boolean;
  size?: 'sm' | 'md' | string;
}

export default function DailyRecurrenceToggle({
  task,
  onUpdate,
  onToggle,
  compact = false,
  size,
}: DailyRecurrenceToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isDaily = task.recurring === 'daily';
  const isCompact = compact || size === 'sm';

  const handleToggleDaily = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdating(true);
    try {
      const nextRecurring = isDaily ? 'none' : 'daily';
      const updated: Task = {
        ...task,
        recurring: nextRecurring,
        // When enabling daily recurrence, default recurrence start date to current local date
        recurrenceStartDate: nextRecurring === 'daily' ? (task.recurrenceStartDate || today()) : undefined,
        updatedAt: new Date().toISOString(),
      };
      const callback = onToggle || onUpdate;
      if (callback) {
        await callback(updated);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleDaily}
      disabled={isUpdating}
      title={
        isDaily
          ? 'Daily Recurrence Active (Click to disable daily recurrence)'
          : 'Click to enable Daily Recurrence (repeats every day on Home)'
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: isCompact ? '2px 7px' : '3px 9px',
        borderRadius: '8px',
        fontSize: isCompact ? '0.68rem' : '0.73rem',
        fontWeight: 700,
        cursor: isUpdating ? 'wait' : 'pointer',
        transition: 'all 0.2s ease',
        background: isDaily
          ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(56, 189, 248, 0.25))'
          : 'rgba(255, 255, 255, 0.05)',
        color: isDaily ? '#38bdf8' : '#94a3b8',
        border: isDaily
          ? '1px solid rgba(56, 189, 248, 0.5)'
          : '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: isDaily ? '0 0 10px rgba(56, 189, 248, 0.3)' : 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <Repeat
        size={compact ? 11 : 12}
        color={isDaily ? '#38bdf8' : '#94a3b8'}
        style={{
          transition: 'transform 0.3s',
          transform: isDaily ? 'rotate(180deg)' : 'none',
        }}
      />
      <span>{isDaily ? 'Daily Active' : 'Daily'}</span>
    </button>
  );
}
