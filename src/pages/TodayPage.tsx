import React, { useState } from 'react';
import {
  Plus, Zap, CalendarDays, Target, TrendingUp,
  AlertCircle, CheckCircle2, Clock, Sparkles, Cloud, CloudOff, RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ProgressRing from '../components/ui/ProgressRing';
import Modal from '../components/ui/Modal';
import TaskForm from '../components/tasks/TaskForm';
import TaskCard from '../components/tasks/TaskCard';
import { formatDateLong, getGreeting, today } from '../utils/dates';
import type { Task, LifeArea } from '../types';

const MOTIVATIONAL_QUOTES = [
  "Focus, Execute, Improve, Repeat. 8 months of consistency = a lifetime of opportunities.",
  "Small steps every day compound into massive results over months.",
  "You don't have to be perfect. You just have to keep going.",
  "A missed day is not a failed journey — just reschedule and continue.",
  "Consistency beats intensity. Show up today.",
];

const AREA_WEIGHT_INFO: { area: LifeArea; label: string; weight: number; color: string; desc: string }[] = [
  { area: 'technical', label: 'Technical Mastery', weight: 50, color: '#6366f1', desc: 'Core coding, DSA, system projects' },
  { area: 'communication', label: 'Communication', weight: 15, color: '#06b6d4', desc: 'English fluency, speaking, articulate thoughts' },
  { area: 'career', label: 'Career Readiness', weight: 15, color: '#f59e0b', desc: 'Resume, GitHub, internships, LinkedIn' },
  { area: 'creativity', label: 'Creativity & Identity', weight: 10, color: '#ec4899', desc: 'Writing, personal brand, content' },
  { area: 'health', label: 'Health, Relationships & Reflection', weight: 10, color: '#10b981', desc: 'Sleep, exercise, connections, calm mindset' },
];

export default function TodayPage() {
  const {
    settings,
    todaysTasks,
    overdueTasks,
    todayCompletionRate,
    weightedTodayRate,
    weeklyCompletionRate,
    milestones,
    addTask,
    updateTask,
    completeTask,
    rescheduleTask,
    removeTask,
    loadStarterPack,
    syncStatus,
    error,
  } = useApp();

  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [startTask, setStartTask] = useState<Task | null>(null);
  const [seeding, setSeeding] = useState(false);

  const completedToday = todaysTasks.filter((t) => t.status === 'completed').length;
  const totalToday = todaysTasks.length;
  const remaining = totalToday - completedToday;

  const topPriorities = [...todaysTasks]
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => {
      const po: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return po[a.priority] - po[b.priority];
    })
    .slice(0, 3);

  const currentMilestone = milestones.find((m) => m.status === 'in-progress') ?? milestones[0];

  const quote = MOTIVATIONAL_QUOTES[new Date().getDate() % MOTIVATIONAL_QUOTES.length];

  const handleAddTask = async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addTask(data);
    setShowAddTask(false);
  };

  const handleEditTask = async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingTask) return;
    await updateTask({ ...editingTask, ...data });
    setEditingTask(null);
  };

  const handleStartWithTen = async () => {
    if (topPriorities[0]) {
      setStartTask(topPriorities[0]);
      setFocusMode(true);
    }
  };

  const handleLoadStarter = async () => {
    setSeeding(true);
    try {
      await loadStarterPack();
    } finally {
      setSeeding(false);
    }
  };

  // ── Focus Mode ───────────────────────────────────────────────────────────
  if (focusMode && startTask) {
    return (
      <FocusMode
        task={startTask}
        onComplete={() => { completeTask(startTask.id); setFocusMode(false); setStartTask(null); }}
        onExit={() => { setFocusMode(false); setStartTask(null); }}
      />
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header & Sync Status Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
            {formatDateLong(today())}
          </p>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            <span className="gradient-text">{getGreeting()}</span>
            {settings.displayName && `, ${settings.displayName}`}! 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem', fontSize: '0.9rem' }}>
            {quote}
          </p>
        </div>

        {/* Sync status indicator badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0.4rem 0.85rem',
            borderRadius: '999px',
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border)',
            fontSize: '0.78rem',
            fontWeight: 600,
          }}
        >
          {syncStatus === 'synced' && <Cloud size={14} color="#10b981" />}
          {syncStatus === 'syncing' && <RefreshCw size={14} color="#818cf8" className="animate-spin" />}
          {syncStatus === 'offline' && <CloudOff size={14} color="#f59e0b" />}
          {syncStatus === 'error' && <AlertCircle size={14} color="#ef4444" />}
          <span
            style={{
              color:
                syncStatus === 'synced'
                  ? '#10b981'
                  : syncStatus === 'syncing'
                  ? '#818cf8'
                  : syncStatus === 'error'
                  ? '#ef4444'
                  : '#f59e0b',
            }}
          >
            {syncStatus === 'synced'
              ? 'Cloud Database Synced'
              : syncStatus === 'syncing'
              ? 'Saving to Cloud…'
              : syncStatus === 'error'
              ? 'Sync Error (Retrying)'
              : 'Offline Mode'}
          </span>
        </div>
      </div>

      {/* Global Error Banner if any */}
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

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard
          icon={<CheckCircle2 size={20} color="#10b981" />}
          label="Tasks Completed"
          value={`${completedToday} / ${totalToday}`}
          sub={`${remaining} remaining today`}
          color="#10b981"
        />
        <StatCard
          icon={<TrendingUp size={20} color="#6366f1" />}
          label="Raw Progress"
          value={`${todayCompletionRate}%`}
          sub="unweighted tasks"
          color="#6366f1"
        />
        <StatCard
          icon={<Zap size={20} color="#8b5cf6" />}
          label="Weighted Balance"
          value={`${weightedTodayRate}%`}
          sub="by life-area weights"
          color="#8b5cf6"
        />
        <StatCard
          icon={<CalendarDays size={20} color="#60a5fa" />}
          label="Weekly Consistency"
          value={`${weeklyCompletionRate}%`}
          sub="last 7 days"
          color="#60a5fa"
        />
        <StatCard
          icon={<AlertCircle size={20} color="#f59e0b" />}
          label="Overdue"
          value={String(overdueTasks.length)}
          sub={overdueTasks.length === 0 ? 'All caught up!' : 'need reschedule'}
          color={overdueTasks.length > 0 ? '#f59e0b' : '#64748b'}
        />
      </div>

      {/* Main 2-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Overdue alert card if any */}
          {overdueTasks.length > 0 && (
            <div
              className="card"
              style={{
                borderColor: 'rgba(245, 158, 11, 0.3)',
                background: 'rgba(245, 158, 11, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <AlertCircle size={16} color="#f59e0b" />
                <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.9rem' }}>
                  {overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? 's' : ''}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  — No guilt. Just reschedule and continue.
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {overdueTasks.slice(0, 3).map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onComplete={completeTask}
                    onEdit={setEditingTask}
                    onDelete={removeTask}
                    onReschedule={rescheduleTask}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Today's Tasks */}
          <div className="card">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 className="section-title" style={{ margin: 0 }}>📋 Today's Tasks</h2>
                <span className="badge" style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {totalToday}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ProgressRing value={todayCompletionRate} size={44} strokeWidth={5} label={`${todayCompletionRate}%`} />
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddTask(true)}>
                  <Plus size={14} /> Add Task
                </button>
              </div>
            </div>

            {todaysTasks.length === 0 ? (
              <div className="empty-state" style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                <Target size={40} color="#818cf8" style={{ margin: '0 auto 0.75rem auto' }} />
                <p style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0 0 0.25rem 0' }}>No tasks scheduled for today yet</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0' }}>
                  Add your custom task or load the student starter routine to begin.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => setShowAddTask(true)}>
                    <Plus size={16} /> Add First Task
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleLoadStarter}
                    disabled={seeding}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Sparkles size={16} color="#f59e0b" />
                    {seeding ? 'Loading Starter Pack…' : 'Load Starter Routine'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {/* Incomplete tasks */}
                {todaysTasks
                  .filter((t) => t.status !== 'completed')
                  .sort((a, b) => {
                    const po: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
                    return po[a.priority] - po[b.priority];
                  })
                  .map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onComplete={completeTask}
                      onEdit={setEditingTask}
                      onDelete={removeTask}
                      onReschedule={rescheduleTask}
                      onStart={(id) => {
                        const task = todaysTasks.find((tt) => tt.id === id);
                        if (task) { setStartTask(task); setFocusMode(true); }
                      }}
                    />
                  ))}

                {/* Completed tasks */}
                {todaysTasks.filter((t) => t.status === 'completed').length > 0 && (
                  <>
                    <div className="divider" style={{ margin: '0.75rem 0' }} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, margin: '0 0 0.4rem 0' }}>
                      ✅ Completed Today ({todaysTasks.filter((t) => t.status === 'completed').length})
                    </p>
                    {todaysTasks
                      .filter((t) => t.status === 'completed')
                      .map((t) => (
                        <TaskCard
                          key={t.id}
                          task={t}
                          onComplete={completeTask}
                          onEdit={setEditingTask}
                          onDelete={removeTask}
                          onReschedule={rescheduleTask}
                        />
                      ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Planning Weights Clarification Box */}
          <div
            className="card"
            style={{
              background: 'rgba(99, 102, 241, 0.04)',
              borderColor: 'rgba(99, 102, 241, 0.2)',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} color="#818cf8" /> The 5 Life Planning Areas
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 600 }}>100% Total Focus</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.85rem' }}>
              {AREA_WEIGHT_INFO.map((item) => (
                <div key={item.area} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>— {item.desc}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: item.color }}>{item.weight}%</span>
                </div>
              ))}
            </div>

            <div
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '0.65rem',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              ℹ️ <strong>Design Principle:</strong> These percentages are <em>planning weights</em> to guide your focus distribution, <strong>not scores for your personal worth</strong>. A zero in one area today simply means you focused elsewhere.
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Top 3 Priorities */}
          <div className="card">
            <h2 className="section-title" style={{ marginBottom: '1rem' }}>🎯 Top 3 Priorities</h2>
            {topPriorities.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                {totalToday > 0 ? '🎉 All priorities completed today!' : 'Add tasks to see today\'s priority ranking.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {topPriorities.map((t, i) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'flex-start',
                      padding: '0.75rem',
                      background: 'var(--bg-surface-2)',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(99,102,241,0.2)',
                        color: '#818cf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.88rem', margin: '0 0 2px 0', color: 'var(--text-primary)' }}>
                        {t.title}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className={`badge priority-${t.priority}`} style={{ fontSize: '0.7rem' }}>
                          {t.priority}
                        </span>
                        {t.estimatedMinutes && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <Clock size={11} /> {t.estimatedMinutes}m
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {topPriorities[0] && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}
                    onClick={handleStartWithTen}
                  >
                    <Zap size={14} color="#f59e0b" /> Start 10-Min Focus Session
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Current Roadmap Milestone */}
          {currentMilestone && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Target size={16} color="#818cf8" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Current Milestone
                </span>
              </div>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Month {currentMilestone.month}: {currentMilestone.title}
              </p>
              {(() => {
                const done = currentMilestone.subtasks.filter((s) => s.completed).length;
                const total = currentMilestone.subtasks.length;
                const pct = total ? Math.round((done / total) * 100) : 0;
                return (
                  <>
                    <div className="progress-bar-track" style={{ marginBottom: '0.4rem' }}>
                      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                      {done}/{total} subtasks · {pct}% complete
                    </p>
                  </>
                );
              })()}
            </div>
          )}

          {/* Daily Schedule Card */}
          <div className="card">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>⏰ Balanced Routine</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.8rem' }}>
              {[
                { time: '6:00–6:20 AM', title: 'Wake up, water, reset' },
                { time: '6:20–6:45 AM', title: 'English speaking + communication' },
                { time: '6:45–7:15 AM', title: 'DSA: solve or review 1 problem' },
                { time: 'College hrs',  title: 'Classes, labs & active participation' },
                { time: '60–90 min',    title: 'Main deep work block (Coding/Spring)' },
                { time: '30 min',       title: 'Java / SQL / roadmap revision' },
                { time: '15 min',       title: 'Night reflection & tomorrow plan' },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{item.time}</span>
                  <span style={{ fontWeight: 500 }}>{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <Modal title="Add New Task" onClose={() => setShowAddTask(false)}>
          <TaskForm onSubmit={handleAddTask} onCancel={() => setShowAddTask(false)} />
        </Modal>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <Modal title="Edit Task" onClose={() => setEditingTask(null)}>
          <TaskForm initial={editingTask} onSubmit={handleEditTask} onCancel={() => setEditingTask(null)} />
        </Modal>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '10px',
          background: `${color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, margin: '0 0 2px 0' }}>{label}</p>
        <p style={{ fontSize: '1.25rem', fontWeight: 800, color, lineHeight: 1.2, margin: 0 }}>{value}</p>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{sub}</p>
      </div>
    </div>
  );
}

// Focus Mode component
function FocusMode({ task, onComplete, onExit }: { task: Task; onComplete: () => void; onExit: () => void }) {
  const [elapsed, setElapsed] = React.useState(0);
  const [blocker, setBlocker] = React.useState('');

  React.useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 70%)',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '500px', width: '100%' }}>
        <div
          className="badge status-in-progress"
          style={{ marginBottom: '1.5rem', fontSize: '0.8rem' }}
        >
          ▶ Focus Mode
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>{task.title}</h1>
        {task.description && (
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{task.description}</p>
        )}

        {/* Timer */}
        <div
          style={{
            fontSize: '4rem',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            color: 'var(--accent)',
            margin: '1.5rem 0',
            letterSpacing: '0.05em',
          }}
        >
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>

        {/* Blocker reflection */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <label htmlFor="blocker-input" style={{ fontSize: '0.85rem' }}>
            ❓ What's blocking me? (optional — just reflect)
          </label>
          <textarea
            id="blocker-input"
            className="input"
            style={{ minHeight: '72px', resize: 'vertical', marginTop: '0.4rem', width: '100%' }}
            placeholder="Nothing is blocking me, or… I'm not sure where to start because…"
            value={blocker}
            onChange={(e) => setBlocker(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={onComplete}>
            <CheckCircle2 size={16} /> Mark Complete
          </button>
          <button className="btn btn-secondary" onClick={onExit}>
            Exit Focus Mode
          </button>
        </div>
      </div>
    </div>
  );
}
