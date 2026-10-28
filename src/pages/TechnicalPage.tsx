import { useState } from 'react';
import { useApp } from '../context/AppContext';
import ProgressRing from '../components/ui/ProgressRing';
import { Code2, Plus, Check, CheckCircle2, Trash2, Edit3, Clock, Sparkles } from 'lucide-react';
import { today } from '../utils/dates';
import TaskForm from '../components/tasks/TaskForm';
import Modal from '../components/ui/Modal';
import type { Task } from '../types';

export default function TechnicalPage() {
  const { tasks, addTask, completeTask, removeTask, updateTask } = useApp();
  const [addedTasks, setAddedTasks] = useState<Record<string, boolean>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const techTasks = tasks.filter((t) => t.lifeArea === 'technical' && !t.parentId);
  const completedTech = techTasks.filter((t) => t.status === 'completed').length;
  const techCompletionRate = techTasks.length ? Math.round((completedTech / techTasks.length) * 100) : 0;

  const handleAddDailyTask = async (title: string, defaultMinutes: number) => {
    await addTask({
      title,
      lifeArea: 'technical',
      dueDate: today(),
      priority: 'high',
      status: 'not-started',
      estimatedMinutes: defaultMinutes,
    });
    setAddedTasks((prev) => ({ ...prev, [title]: true }));
    setTimeout(() => {
      setAddedTasks((prev) => ({ ...prev, [title]: false }));
    }, 2500);
  };

  const ONGOING_TASKS = [
    { icon: '🧩', title: 'LeetCode / DSA Practice', sub: '2+ hrs/day · solve problems, review patterns', mins: 120 },
    { icon: '🐙', title: 'GitHub Commits & Push', sub: 'Push code daily · consistent commits', mins: 30 },
    { icon: '☕', title: 'Java & Spring Revision', sub: 'Spaced repetition of core concepts', mins: 45 },
    { icon: '⭐', title: 'STAR Technical Story', sub: 'Document bugs fixed, challenges & architecture', mins: 30 },
    { icon: '🔢', title: 'Aptitude & Logic Practice', sub: 'Problem solving 20–30 min/day', mins: 30 },
    { icon: '🤖', title: 'AI Tools & Systems Awareness', sub: 'Prompting, agents, APIs & models', mins: 45 },
    { icon: '📖', title: 'System Design Reading', sub: 'Architecture blogs, high-scale patterns', mins: 45 },
    { icon: '🧠', title: 'Mindset & Evening Reflection', sub: 'Review learning & prepare tomorrow', mins: 15 },
  ];

  return (
    <div className="page-container pb-safe">
      {/* Hero Progress Header */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.06))',
          borderColor: 'rgba(99,102,241,0.25)',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <ProgressRing value={techCompletionRate} size={90} strokeWidth={9} label={`${techCompletionRate}%`} sublabel="Done" />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <Code2 size={22} color="#818cf8" />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
              <span className="gradient-text">Technical Mastery</span>
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
            Core coding, algorithms, system design, and daily engineering practice.
          </p>
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            <Stat label="Total Tech Tasks" value={String(techTasks.length)} color="#818cf8" />
            <Stat label="Completed" value={String(completedTech)} color="#10b981" />
            <Stat label="Remaining" value={String(techTasks.length - completedTech)} color="#f59e0b" />
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={15} /> Add Tech Task
        </button>
      </div>

      {/* Actionable Learning Tasks */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 2px 0' }}>
              💻 Active Technical Tasks
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Actionable tasks linked directly to your database.
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(true)}>
            <Plus size={13} /> New Task
          </button>
        </div>

        {techTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <Code2 size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
            <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: '0 0 4px 0' }}>No technical tasks yet</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
              Add a custom task or choose one of the daily practice pillars below.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {techTasks.map((t) => {
              const isDone = t.status === 'completed';
              return (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--bg-surface-2)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '0.85rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 200 }}>
                    <button
                      onClick={() => completeTask(t.id)}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '4px',
                        border: `2px solid ${isDone ? '#10b981' : 'var(--border)'}`,
                        background: isDone ? '#10b981' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isDone && <CheckCircle2 size={11} color="white" />}
                    </button>
                    <div>
                      <span style={{ fontWeight: 600, color: isDone ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none' }}>
                        {t.title}
                      </span>
                      {t.notes && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0', fontStyle: 'italic' }}>
                          📝 {t.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                    {t.estimatedMinutes && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        <Clock size={11} /> {t.estimatedMinutes}m
                      </span>
                    )}
                    <span className={`badge priority-${t.priority}`} style={{ fontSize: '0.68rem' }}>
                      {t.priority}
                    </span>
                    <button className="btn btn-ghost btn-icon btn-xs" onClick={() => setEditingTask(t)}>
                      <Edit3 size={13} />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-xs" style={{ color: '#ef4444' }} onClick={() => removeTask(t.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Daily practice routines / ongoing habits */}
      <div className="card">
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={16} color="#818cf8" /> Ongoing Daily Technical Practice
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          One-click additions to today's schedule to maintain consistent momentum.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.75rem' }}>
          {ONGOING_TASKS.map((item) => (
            <div
              key={item.title}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '0.85rem',
                background: 'var(--bg-surface-2)',
                borderRadius: '10px',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <p style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>{item.icon}</p>
                <p style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{item.title}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.35 }}>{item.sub}</p>
              </div>

              <button
                className={`btn btn-sm ${addedTasks[item.title] ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  fontSize: '0.72rem',
                  padding: '0.35rem 0.6rem',
                  width: '100%',
                  justifyContent: 'center',
                }}
                disabled={addedTasks[item.title]}
                onClick={() => handleAddDailyTask(item.title, item.mins)}
              >
                {addedTasks[item.title] ? (
                  <>
                    <Check size={12} /> Added to Today!
                  </>
                ) : (
                  <>
                    <Plus size={12} /> Add to Today
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <Modal isOpen={true} onClose={() => setShowAddModal(false)} title="New Technical Task">
          <TaskForm
            initial={{ lifeArea: 'technical', dueDate: today() }}
            onSubmit={async (data) => {
              await addTask({ ...data, lifeArea: 'technical' });
              setShowAddModal(false);
            }}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <Modal isOpen={true} onClose={() => setEditingTask(null)} title="Edit Task">
          <TaskForm
            initial={editingTask}
            onSubmit={async (data) => {
              await updateTask({ ...editingTask, ...data });
              setEditingTask(null);
            }}
            onCancel={() => setEditingTask(null)}
          />
        </Modal>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>{label}</p>
      <p style={{ fontSize: '1.15rem', fontWeight: 800, color, margin: '2px 0 0 0' }}>{value}</p>
    </div>
  );
}
