import React from 'react';
import { Clock, Sparkles } from 'lucide-react';

interface TimetableScheduledBadgeProps {
  time?: string;
  showTime?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const TIMETABLE_SCHEDULED_TOOLTIP = "Scheduled for today's timetable";

export default function TimetableScheduledBadge({
  time,
  showTime = false,
  className = '',
  style = {},
}: TimetableScheduledBadgeProps) {
  return (
    <span
      className={`timetable-scheduled-symbol ${className}`}
      title={TIMETABLE_SCHEDULED_TOOLTIP}
      aria-label={TIMETABLE_SCHEDULED_TOOLTIP}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 7px',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.18), rgba(56, 189, 248, 0.14))',
        border: '1px solid rgba(168, 85, 247, 0.45)',
        color: '#e2e8f0',
        fontSize: '0.68rem',
        fontWeight: 700,
        verticalAlign: 'middle',
        cursor: 'help',
        boxShadow: '0 0 10px rgba(168, 85, 247, 0.25)',
        backdropFilter: 'blur(8px)',
        userSelect: 'none',
        lineHeight: 1.3,
        ...style,
      }}
    >
      <Clock
        size={11}
        color="#38bdf8"
        style={{ filter: 'drop-shadow(0 0 4px rgba(56, 189, 248, 0.6))' }}
      />
      <Sparkles
        size={10}
        color="#fbbf24"
        style={{ filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.7))' }}
      />
      {showTime && time && (
        <span
          style={{
            color: '#c084fc',
            fontFamily: 'monospace',
            letterSpacing: '0.02em',
            fontSize: '0.67rem',
          }}
        >
          {time}
        </span>
      )}
    </span>
  );
}

