import { useState } from 'react';
import { useApp } from '../context/AppContext';
import ProgressRing from '../components/ui/ProgressRing';
import { Code2, Plus, Check } from 'lucide-react';
import { today } from '../utils/dates';

export default function TechnicalPage() {
  const { milestones, tasks, addTask } = useApp();
  const [addedTasks, setAddedTasks] = useState<Record<string, boolean>>({});

  const techTasks = tasks.filter((t) => t.lifeArea === 'technical');
  const completedTech = techTasks.filter((t) => t.status === 'completed').length;

  const totalSubtasks = milestones.reduce((s, m) => s + m.subtasks.length, 0);
  const completedSubtasks = milestones.reduce((s, m) => s + m.subtasks.filter((st) => st.completed).length, 0);
  const overallPct = totalSubtasks ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

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
    { icon: '☕', title: 'Java & Spring Revision', sub: 'Spaced repetition of earlier concepts', mins: 45 },
    { icon: '⭐', title: 'STAR Behavioral Story', sub: 'Document bugs fixed, challenges & lessons', mins: 30 },
    { icon: '🔢', title: 'Aptitude & Reasoning Practice', sub: 'Light practice 20–30 min/day', mins: 30 },
    { icon: '🤖', title: 'AI Tools & Engineering Awareness', sub: 'AI workflows, prompting, awareness', mins: 45 },
    { icon: '📖', title: 'System Design & Tech Reading', sub: 'Architecture blogs, documentation', mins: 45 },
    { icon: '🧠', title: 'Mindset & Evening Reflection', sub: 'Consistency · motivation · daily reflection', mins: 15 },
  ];


  return (
    <div className="page-container pb-safe">
      {/* Hero */}
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
        <ProgressRing value={overallPct} size={100} strokeWidth={10} label={`${overallPct}%`} sublabel="Roadmap" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Code2 size={20} color="#818cf8" />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              <span className="gradient-text">Technical Mastery — 50%</span>
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            Web, Java, DSA, Spring Boot, React, DevOps, AI — Your core skill stack for placement.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Stat label="Milestones" value={`${milestones.filter(m=>m.status==='completed').length}/${milestones.length}`} color="#818cf8" />
            <Stat label="Subtasks Done" value={`${completedSubtasks}/${totalSubtasks}`} color="#60a5fa" />
            <Stat label="Tech Tasks" value={`${completedTech}/${techTasks.length}`} color="#a78bfa" />
          </div>
        </div>
      </div>

      {/* Milestones overview */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>📅 8-Month Roadmap Progress</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.875rem' }}>
          {milestones.map((m, i) => {
            const done = m.subtasks.filter((s) => s.completed).length;
            const total = m.subtasks.length;
            const pct = total ? Math.round((done / total) * 100) : 0;
            const colors = ['#6366f1','#60a5fa','#a78bfa','#f59e0b','#10b981','#06b6d4','#ec4899','#f97316'];
            const c = colors[i % colors.length];
            return (
              <div
                key={m.id}
                className="card"
                style={{ borderLeft: `3px solid ${c}`, padding: '0.875rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.72rem', color: c, fontWeight: 700, textTransform: 'uppercase' }}>Month {m.month}</span>
                  <span className={`badge status-${m.status}`} style={{ fontSize: '0.65rem' }}>
                    {m.status === 'not-started' ? '○' : m.status === 'in-progress' ? '◉' : '✓'}
                  </span>
                </div>
                <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.3 }}>{m.title}</p>
                <div className="progress-bar-track" style={{ height: 4 }}>
                  <div className="progress-bar-fill" style={{ width: `${pct}%`, background: c }} />
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{done}/{total} · {pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily reminders from the roadmap */}
      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>⚡ Ongoing Daily Tasks</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '0.75rem' }}>
          {ONGOING_TASKS.map((item) => (
            <div
              key={item.title}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '0.875rem',
                background: 'var(--bg-surface-2)',
                borderRadius: '10px',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <p style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{item.icon}</p>
                <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{item.title}</p>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.35 }}>{item.sub}</p>
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
    </div>
  );

}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</p>
      <p style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{value}</p>
    </div>
  );
}
