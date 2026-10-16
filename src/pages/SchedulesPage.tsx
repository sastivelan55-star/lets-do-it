import { useState } from 'react';
import {
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/ui/Modal';
import ScheduleForm from '../components/schedules/ScheduleForm';
import ScheduleCard from '../components/schedules/ScheduleCard';
import type { ScheduleEntry } from '../types';
import { formatDateLong, today } from '../utils/dates';
import { addDays, format, parseISO } from 'date-fns';

export default function SchedulesPage() {
  const { schedules, tasks, addSchedule, updateSchedule, removeSchedule, error } = useApp();

  const [selectedDate, setSelectedDate] = useState(today());
  const [viewMode, setViewMode] = useState<'day' | 'upcoming'>('day');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleEntry | null>(null);

  // Filter schedules for the selected day, sorted chronologically
  const daySchedules = schedules
    .filter((s) => s.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Upcoming schedules from today onwards
  const todayStr = today();
  const upcomingSchedules = schedules
    .filter((s) => s.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const handlePrevDay = () => {
    const prev = format(addDays(parseISO(selectedDate), -1), 'yyyy-MM-dd');
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd');
    setSelectedDate(next);
  };

  const handleAddSubmit = async (
    data: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    await addSchedule(data);
    setShowAddModal(false);
  };

  const handleEditSubmit = async (
    data: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!editingSchedule) return;
    await updateSchedule({ ...editingSchedule, ...data });
    setEditingSchedule(null);
  };

  return (
    <div className="page-container pb-safe">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            🗓️ <span className="gradient-text">Time Schedules</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Time-blocked schedules, daily focus routines, and synced event blocks.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={15} /> Add Schedule
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Controls Bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '1.25rem',
        }}
      >
        {/* View Mode Toggle */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-surface-2)',
            borderRadius: '10px',
            padding: '3px',
          }}
        >
          <button
            className={`btn btn-sm ${viewMode === 'day' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: '8px', minWidth: '4.5rem' }}
            onClick={() => setViewMode('day')}
          >
            Day View
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'upcoming' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: '8px', minWidth: '4.5rem' }}
            onClick={() => setViewMode('upcoming')}
          >
            Upcoming
          </button>
        </div>

        {viewMode === 'day' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm btn-icon"
              onClick={handlePrevDay}
              title="Previous Day"
              aria-label="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>

            <input
              type="date"
              className="input"
              style={{ width: 'auto', fontSize: '0.85rem' }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />

            <button
              className="btn btn-secondary btn-sm btn-icon"
              onClick={handleNextDay}
              title="Next Day"
              aria-label="Next Day"
            >
              <ChevronRight size={16} />
            </button>

            {selectedDate !== today() && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedDate(today())}
              >
                <Calendar size={14} /> Today
              </button>
            )}
          </div>
        )}
      </div>

      {/* View Content */}
      {viewMode === 'day' ? (
        <div>
          {/* Date banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {formatDateLong(selectedDate)}
            </h2>
            <span className="badge" style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}>
              {daySchedules.length} block{daySchedules.length !== 1 ? 's' : ''} scheduled
            </span>
          </div>

          {/* Schedule list */}
          {daySchedules.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <Clock size={40} color="#818cf8" style={{ margin: '0 auto 0.75rem auto' }} />
              <p style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0 0 0.25rem 0' }}>
                No schedule planned for this day
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0' }}>
                Block out dedicated time for deep work, classes, DSA practice, or review.
              </p>
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                <Plus size={16} /> Add First Schedule
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {daySchedules.map((schedule) => {
                const linked = schedule.linkedTaskId
                  ? tasks.find((t) => t.id === schedule.linkedTaskId)
                  : undefined;
                return (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    linkedTask={linked}
                    onEdit={(s) => setEditingSchedule(s)}
                    onDelete={removeSchedule}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Upcoming View */
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Upcoming Time Blocks
            </h2>
          </div>

          {upcomingSchedules.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <CalendarDays size={40} color="#818cf8" style={{ margin: '0 auto 0.75rem auto' }} />
              <p style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0 0 0.25rem 0' }}>
                No upcoming schedules
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0' }}>
                Plan your upcoming study blocks and important routines ahead of time.
              </p>
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                <Plus size={16} /> Schedule a Time Block
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {upcomingSchedules.map((schedule) => {
                const linked = schedule.linkedTaskId
                  ? tasks.find((t) => t.id === schedule.linkedTaskId)
                  : undefined;
                return (
                  <div key={schedule.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', marginLeft: '4px' }}>
                      {schedule.date === today() ? 'Today' : schedule.date}
                    </div>
                    <ScheduleCard
                      schedule={schedule}
                      linkedTask={linked}
                      onEdit={(s) => setEditingSchedule(s)}
                      onDelete={removeSchedule}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Suggested Focus Templates card */}
      <div
        className="card"
        style={{
          marginTop: '1.75rem',
          background: 'rgba(99, 102, 241, 0.04)',
          borderColor: 'rgba(99, 102, 241, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Sparkles size={16} color="#818cf8" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
            Quick Routine Suggestions
          </h3>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Click to pre-fill a recommended student time block into today's schedule:
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { title: 'Morning DSA Problem Solving', start: '06:45', end: '07:45' },
            { title: 'Core Dev Deep Work (Spring / React)', start: '18:00', end: '19:30' },
            { title: 'English Speaking & Communication', start: '06:20', end: '06:45' },
            { title: 'Night Reflection & Review', start: '21:30', end: '22:00' },
          ].map((template) => (
            <button
              key={template.title}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', borderRadius: '8px' }}
              onClick={() => {
                setShowAddModal(true);
              }}
            >
              + {template.title} ({template.start}–{template.end})
            </button>
          ))}
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddModal(false)}
          title="Add Schedule Time Block"
        >
          <ScheduleForm
            initial={{ date: selectedDate }}
            onSubmit={handleAddSubmit}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}

      {/* Edit Schedule Modal */}
      {editingSchedule && (
        <Modal
          isOpen={true}
          onClose={() => setEditingSchedule(null)}
          title="Edit Schedule Time Block"
        >
          <ScheduleForm
            initial={editingSchedule}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditingSchedule(null)}
          />
        </Modal>
      )}
    </div>
  );
}
