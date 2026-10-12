import { useState } from 'react';
import { Plus, SortAsc, Calendar, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import TaskCard from '../components/tasks/TaskCard';
import TaskForm from '../components/tasks/TaskForm';
import Modal from '../components/ui/Modal';
import type { Task, LifeArea, TaskStatus } from '../types';
import { formatDate, today } from '../utils/dates';
import { addDays, format, parseISO, startOfWeek } from 'date-fns';

const FILTER_AREAS: { value: LifeArea | 'all'; label: string }[] = [
  { value: 'all',           label: 'All Areas' },
  { value: 'technical',     label: '💻 Technical' },
  { value: 'communication', label: '🗣️ Communication' },
  { value: 'career',        label: '💼 Career' },
  { value: 'creativity',    label: '🎨 Creativity' },
  { value: 'health',        label: '💚 Health' },
];

const STATUS_FILTERS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all',          label: 'All' },
  { value: 'not-started',  label: 'Not Started' },
  { value: 'in-progress',  label: 'In Progress' },
  { value: 'completed',    label: 'Completed' },
  { value: 'rescheduled',  label: 'Rescheduled' },
];

export default function PlannerPage() {
  const { tasks, addTask, updateTask, completeTask, rescheduleTask, removeTask, error } = useApp();
  const [showAdd, setShowAdd]       = useState(false);
  const [editing, setEditing]       = useState<Task | null>(null);
  const [areaFilter, setAreaFilter] = useState<LifeArea | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [viewDate, setViewDate]     = useState(today());
  const [viewMode, setViewMode]     = useState<'day' | 'week'>('day');

  // Week dates
  const weekStart = startOfWeek(parseISO(viewDate), { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'));

  // Filtered tasks
  const filtered = tasks.filter((t) => {
    if (viewMode === 'day' && t.dueDate !== viewDate) return false;
    if (viewMode === 'week' && !weekDates.includes(t.dueDate)) return false;
    if (areaFilter !== 'all' && t.lifeArea !== areaFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.plannedStartTime && b.plannedStartTime) return a.plannedStartTime.localeCompare(b.plannedStartTime);
    const po = { critical: 0, high: 1, medium: 2, low: 3 };
    return po[a.priority] - po[b.priority];
  });

  const handleAdd = async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addTask(data);
    setShowAdd(false);
  };

  const handleEdit = async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editing) return;
    await updateTask({ ...editing, ...data });
    setEditing(null);
  };

  return (
    <div className="page-container pb-safe">
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          📅 <span className="gradient-text">Daily Planner</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Plan and manage your tasks by day or week.
        </p>
      </div>

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

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* View mode toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-surface-2)', borderRadius: '10px', padding: '3px' }}>
          {(['day', 'week'] as const).map((m) => (
            <button
              key={m}
              className={`btn btn-sm ${viewMode === m ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: '8px', minWidth: '3.75rem' }}
              onClick={() => setViewMode(m)}
            >
              {m === 'day' ? 'Day' : 'Week'}
            </button>
          ))}
        </div>

        {/* Date picker */}
        <input
          type="date"
          className="input"
          style={{ width: 'auto', fontSize: '0.85rem' }}
          value={viewDate}
          onChange={(e) => setViewDate(e.target.value)}
        />

        {/* Today button */}
        <button className="btn btn-secondary btn-sm" onClick={() => setViewDate(today())}>
          <Calendar size={14} /> Today
        </button>

        <div style={{ flex: 1 }} />

        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="filter-scroll" style={{ marginBottom: '1rem' }}>
        {FILTER_AREAS.map((a) => (
          <button
            key={a.value}
            className={`btn btn-sm ${areaFilter === a.value ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setAreaFilter(a.value as LifeArea | 'all')}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="filter-scroll" style={{ marginBottom: '1.25rem' }}>
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.value}
            className={`btn btn-sm ${statusFilter === s.value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter(s.value as TaskStatus | 'all')}
            style={{ fontSize: '0.78rem' }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Week view nav */}
      {viewMode === 'week' && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {weekDates.map((d) => {
            const dayTasks = tasks.filter((t) => t.dueDate === d);
            const done = dayTasks.filter((t) => t.status === 'completed').length;
            return (
              <button
                key={d}
                onClick={() => { setViewDate(d); setViewMode('day'); }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '0.6rem 0.9rem',
                  borderRadius: '10px',
                  background: d === viewDate ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'var(--bg-surface)',
                  border: `1px solid ${d === today() ? '#818cf8' : 'var(--border)'}`,
                  cursor: 'pointer',
                  minWidth: '4.25rem',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: '0.7rem', color: d === viewDate ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  {format(parseISO(d), 'EEE')}
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: d === viewDate ? 'white' : 'var(--text-primary)' }}>
                  {format(parseISO(d), 'd')}
                </span>
                {dayTasks.length > 0 && (
                  <span style={{ fontSize: '0.68rem', color: d === viewDate ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                    {done}/{dayTasks.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Title */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {viewMode === 'day' ? formatDate(viewDate) : `Week of ${format(weekStart, 'MMM d')}`}
        </h2>
        <span className="badge status-in-progress" style={{ fontSize: '0.72rem' }}>
          {sorted.length} task{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Task list */}
      {sorted.length === 0 ? (
        <div className="empty-state">
          <SortAsc size={36} />
          <p style={{ fontWeight: 600, marginTop: '0.75rem' }}>No tasks for this period</p>
          <p style={{ fontSize: '0.85rem' }}>Add a task or adjust filters.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Add Task
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {sorted.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onComplete={completeTask}
              onEdit={setEditing}
              onDelete={removeTask}
              onReschedule={rescheduleTask}
            />
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Task">
        <TaskForm
          initial={{ dueDate: viewDate }}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Task">
        {editing && (
          <TaskForm
            initial={editing}
            onSave={handleEdit}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}
