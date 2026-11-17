// Life OS — Floating Set Time Interface
// Anchored popover rendered in a Portal above all page content.
// Does NOT change task card dimensions, push cards down, or alter list height.

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Calendar, Check, X, Trash2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { today } from '../../utils/dates';

export interface TimePickerResult {
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  targetDate?: string; // YYYY-MM-DD
  date?: string;       // Alias for targetDate
  clearSchedule?: boolean;
}

export interface FloatingTimePickerProps {
  isOpen: boolean;
  anchorRect?: DOMRect | null;
  anchorEl?: HTMLElement | null;
  initialStartTime?: string;
  initialEndTime?: string;
  initialDate?: string;
  taskTitle?: string;
  onSave: (result: TimePickerResult) => Promise<void> | void;
  onClose?: () => void;
  onCancel?: () => void;
  onClear?: () => Promise<void> | void;
}

const TIME_PRESETS = [
  { label: 'Morning', time: '09:00' },
  { label: 'Noon', time: '12:00' },
  { label: 'Afternoon', time: '14:30' },
  { label: 'Evening', time: '18:00' },
  { label: 'Night', time: '21:00' },
];

export default function FloatingTimePicker({
  isOpen,
  anchorRect,
  anchorEl,
  initialStartTime = '',
  initialEndTime = '',
  initialDate,
  taskTitle = 'Set Time',
  onSave,
  onClose,
  onCancel,
  onClear,
}: FloatingTimePickerProps) {
  const closeHandler = onClose || onCancel || (() => {});
  const [startTime, setStartTime] = useState(initialStartTime || '09:00');
  const [endTime, setEndTime] = useState(initialEndTime || '');
  const [targetDate, setTargetDate] = useState(initialDate || today());
  const [isSaving, setIsSaving] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync initial values when opened
  useEffect(() => {
    if (isOpen) {
      setStartTime(initialStartTime || '09:00');
      setEndTime(initialEndTime || '');
      setTargetDate(initialDate || today());
    }
  }, [isOpen, initialStartTime, initialEndTime, initialDate]);

  // Handle Escape key and outside clicks
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeHandler();
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        closeHandler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen, closeHandler]);

  if (!isOpen) return null;

  // Calculate anchored popover position
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const currentRect = anchorRect || (anchorEl ? anchorEl.getBoundingClientRect() : null);

  let popoverStyle: React.CSSProperties = {};

  if (isMobile || !currentRect) {
    // Mobile bottom sheet / centered modal
    popoverStyle = {
      position: 'fixed',
      bottom: '16px',
      left: '16px',
      right: '16px',
      margin: '0 auto',
      maxWidth: '420px',
      zIndex: 99999,
    };
  } else {
    // Desktop / Tablet: anchor near the clicked button
    const popoverWidth = 340;
    const popoverHeight = 360;

    let left = currentRect.left;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = window.innerWidth - popoverWidth - 16;
    }
    if (left < 16) left = 16;

    let top = currentRect.bottom + 8;
    // If overflowing viewport bottom, flip above the anchor
    if (top + popoverHeight > window.innerHeight - 16) {
      top = Math.max(16, currentRect.top - popoverHeight - 8);
    }

    popoverStyle = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${popoverWidth}px`,
      zIndex: 99999,
    };
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        targetDate: targetDate || undefined,
        date: targetDate || undefined,
      });
      closeHandler();
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setIsSaving(true);
    try {
      if (onClear) {
        await onClear();
      } else {
        await onSave({
          clearSchedule: true,
        });
      }
      closeHandler();
    } finally {
      setIsSaving(false);
    }
  };

  const setQuickDate = (daysAhead: number) => {
    const d = addDays(new Date(), daysAhead);
    setTargetDate(format(d, 'yyyy-MM-dd'));
  };

  return createPortal(
    <>
      {/* Invisible backdrop to catch outside interactions */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: isMobile ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.3)',
          backdropFilter: isMobile ? 'blur(4px)' : 'none',
          WebkitBackdropFilter: isMobile ? 'blur(4px)' : 'none',
          zIndex: 99998,
        }}
      />

      {/* Floating Popover Container */}
      <div
        ref={popoverRef}
        style={{
          ...popoverStyle,
          background: 'rgba(22, 14, 46, 0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(192, 132, 252, 0.4)',
          borderRadius: '18px',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6), 0 0 24px rgba(168, 85, 247, 0.25)',
          padding: '1.1rem',
          color: '#f8fafc',
          boxSizing: 'border-box',
          animation: 'fadeInUp 0.18s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.85rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '0.65rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'rgba(168, 85, 247, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c084fc',
                flexShrink: 0,
              }}
            >
              <Clock size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#f8fafc' }}>
                Set Schedule Time
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: '#94a3b8',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '220px',
                }}
              >
                {taskTitle}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={closeHandler}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
            }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Quick Presets */}
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
              Time Presets:
            </div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {TIME_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setStartTime(p.time)}
                  style={{
                    background: startTime === p.time ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'rgba(255, 255, 255, 0.05)',
                    border: startTime === p.time ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: startTime === p.time ? '#ffffff' : '#cbd5e1',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start and End Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(192, 132, 252, 0.35)',
                  borderRadius: '10px',
                  padding: '6px 8px',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                End Time (Opt)
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '6px 8px',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Optional Date Picker & Shortcuts */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} color="#38bdf8" /> Scheduled Date
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '0.68rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#c084fc',
                    fontSize: '0.68rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Tomorrow
                </button>
              </div>
            </div>

            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(192, 132, 252, 0.35)',
                borderRadius: '10px',
                padding: '6px 8px',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Actions Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '0.75rem',
              marginTop: '4px',
            }}
          >
            {initialStartTime ? (
              <button
                type="button"
                onClick={handleClear}
                disabled={isSaving}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f87171',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '4px 6px',
                }}
                title="Remove start and end times from this task"
              >
                <Trash2 size={12} /> Clear Time
              </button>
            ) : <span />}

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={closeHandler}
                disabled={isSaving}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '5px 12px',
                  color: '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '5px 16px',
                  color: '#ffffff',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
                }}
              >
                <Check size={14} strokeWidth={3} /> {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
}
