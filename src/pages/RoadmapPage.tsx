import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Edit3, BookOpen, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { RoadmapMilestone, LearningSession } from '../types';
import { nanoid } from '../utils/nanoid';
import { today } from '../utils/dates';

const MONTH_COLORS = [
  '#6366f1','#60a5fa','#a78bfa','#f59e0b',
  '#10b981','#06b6d4','#ec4899','#f97316',
];

const STATUS_OPTS: { value: RoadmapMilestone['status']; label: string }[] = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
];

export default function RoadmapPage() {
  const { milestones, updateMilestone } = useApp();
  const [expanded, setExpanded] = useState<string | null>(milestones.find(m => m.status === 'in-progress')?.id ?? null);
  const [sessionForm, setSessionForm] = useState<string | null>(null); // milestoneId

  const totalSubtasks = milestones.reduce((s, m) => s + m.subtasks.length, 0);
  const completedSubtasks = milestones.reduce((s, m) => s + m.subtasks.filter((st) => st.completed).length, 0);
  const overallPct = totalSubtasks ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          🗺️ <span className="gradient-text">8-Month Learning Roadmap</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          SDE-Focused · DevOps-Aware · AI-First — Track your placement preparation journey.
        </p>

        {/* Overall progress */}
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Overall Progress</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 700 }}>{overallPct}%</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${overallPct}%` }} />
            </div>
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {completedSubtasks}/{totalSubtasks} subtasks
          </span>
        </div>
      </div>

      {/* Ongoing tasks reminder */}
      <div
        style={{
          background: 'rgba(99,102,241,0.07)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: '12px',
          padding: '0.9rem 1.1rem',
          marginBottom: '1.25rem',
          fontSize: '0.83rem',
          color: 'var(--text-secondary)',
        }}
      >
        📌 <strong>Daily habits:</strong> LeetCode/DSA (2+ hrs) · GitHub commits · Java revision · STAR stories · Aptitude practice · AI learning (2–4 hrs) · Read/Learn · Mindset
      </div>

      {/* Milestone cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {milestones.map((m, i) => (
          <MilestoneCard
            key={m.id}
            milestone={m}
            color={MONTH_COLORS[i % MONTH_COLORS.length]}
            isExpanded={expanded === m.id}
            onToggle={() => setExpanded(expanded === m.id ? null : m.id)}
            onUpdate={updateMilestone}
            showSessionForm={sessionForm === m.id}
            onToggleSessionForm={() => setSessionForm(sessionForm === m.id ? null : m.id)}
          />
        ))}
      </div>
    </div>
  );
}

function MilestoneCard({
  milestone, color, isExpanded, onToggle, onUpdate, showSessionForm, onToggleSessionForm,
}: {
  milestone: RoadmapMilestone;
  color: string;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (m: RoadmapMilestone) => void;
  showSessionForm: boolean;
  onToggleSessionForm: () => void;
}) {
  const completedCount = milestone.subtasks.filter((s) => s.completed).length;
  const pct = milestone.subtasks.length ? Math.round((completedCount / milestone.subtasks.length) * 100) : 0;

  const [newSubtask, setNewSubtask] = useState('');
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionMinutes, setSessionMinutes] = useState('30');
  const [sessionNotes, setSessionNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(milestone.notes ?? '');

  const toggleSubtask = (stId: string) => {
    onUpdate({
      ...milestone,
      subtasks: milestone.subtasks.map((s) =>
        s.id === stId ? { ...s, completed: !s.completed } : s
      ),
    });
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    onUpdate({
      ...milestone,
      subtasks: [...milestone.subtasks, { id: nanoid(), title: newSubtask.trim(), completed: false }],
    });
    setNewSubtask('');
  };

  const removeSubtask = (stId: string) => {
    onUpdate({ ...milestone, subtasks: milestone.subtasks.filter((s) => s.id !== stId) });
  };

  const changeStatus = (status: RoadmapMilestone['status']) => {
    onUpdate({ ...milestone, status });
  };

  const addSession = () => {
    if (!sessionTopic.trim()) return;
    const session: LearningSession = {
      id: nanoid(),
      date: today(),
      topic: sessionTopic.trim(),
      minutes: Number(sessionMinutes) || 30,
      notes: sessionNotes.trim() || undefined,
    };
    onUpdate({ ...milestone, learningSessions: [...milestone.learningSessions, session] });
    setSessionTopic('');
    setSessionMinutes('30');
    setSessionNotes('');
    onToggleSessionForm();
  };

  const saveNotes = () => {
    onUpdate({ ...milestone, notes: notesValue });
    setEditingNotes(false);
  };

  const totalSessionMinutes = milestone.learningSessions.reduce((s, sess) => s + sess.minutes, 0);

  return (
    <div
      className="card"
      style={{
        borderLeft: `4px solid ${color}`,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem 1.25rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Month badge */}
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: '10px',
            background: `${color}20`,
            color,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          <span style={{ fontSize: '0.6rem', fontWeight: 600 }}>Month</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{milestone.month}</span>
        </div>

        {/* Title + progress */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {milestone.title}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="progress-bar-track" style={{ flex: 1, height: 5 }}>
              <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
              {completedCount}/{milestone.subtasks.length}
            </span>
          </div>
        </div>

        {/* Status badge */}
        <span className={`badge status-${milestone.status}`} style={{ flexShrink: 0, fontSize: '0.72rem' }}>
          {milestone.status === 'not-started' ? '○ Not started'
            : milestone.status === 'in-progress' ? '◉ In progress'
            : '✓ Done'}
        </span>

        {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          {/* Description */}
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '1rem 0 0.875rem' }}>
            {milestone.description}
          </p>

          {/* Status changer */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {STATUS_OPTS.map((opt) => (
              <button
                key={opt.value}
                className={`btn btn-sm ${milestone.status === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => changeStatus(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              📚 <strong style={{ color: 'var(--text-primary)' }}>{totalSessionMinutes}m</strong> logged
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              🎯 <strong style={{ color: 'var(--text-primary)' }}>{pct}%</strong> complete
            </div>
          </div>

          {/* Subtasks */}
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Subtasks
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {milestone.subtasks.map((st) => (
                <div
                  key={st.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.75rem',
                    background: st.completed ? `${color}08` : 'var(--bg-surface-2)',
                    borderRadius: '8px',
                    border: `1px solid ${st.completed ? color + '25' : 'transparent'}`,
                  }}
                >
                  <button
                    onClick={() => toggleSubtask(st.id)}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '4px',
                      border: `2px solid ${st.completed ? color : 'var(--border)'}`,
                      background: st.completed ? color : 'transparent',
                      flexShrink: 0,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {st.completed && <CheckCircle2 size={10} color="white" />}
                  </button>
                  <span
                    style={{
                      flex: 1,
                      fontSize: '0.85rem',
                      color: st.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: st.completed ? 'line-through' : 'none',
                    }}
                  >
                    {st.title}
                  </span>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => removeSubtask(st.id)}
                    aria-label="Remove subtask"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add subtask */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input
                className="input"
                style={{ fontSize: '0.82rem' }}
                placeholder="Add a subtask…"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
              />
              <button className="btn btn-sm btn-primary" onClick={addSubtask}>
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* Learning sessions */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Learning Sessions ({milestone.learningSessions.length})
              </p>
              <button className="btn btn-sm btn-secondary" onClick={onToggleSessionForm}>
                <BookOpen size={12} /> Log Session
              </button>
            </div>

            {showSessionForm && (
              <div
                style={{
                  background: 'var(--bg-surface-2)',
                  borderRadius: '10px',
                  padding: '0.875rem',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                }}
              >
                <input className="input" placeholder="Topic / What did you learn?" value={sessionTopic} onChange={(e) => setSessionTopic(e.target.value)} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="input" type="number" placeholder="Minutes" value={sessionMinutes} onChange={(e) => setSessionMinutes(e.target.value)} min={1} />
                  <input className="input" placeholder="Notes (optional)" value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-sm btn-primary" onClick={addSession}>Save Session</button>
                  <button className="btn btn-sm btn-ghost" onClick={onToggleSessionForm}>Cancel</button>
                </div>
              </div>
            )}

            {milestone.learningSessions.slice(-3).reverse().map((sess) => (
              <div key={sess.id} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{sess.date}</span>
                <span style={{ flex: 1, color: 'var(--text-primary)' }}>{sess.topic}</span>
                <span style={{ color, fontWeight: 700, whiteSpace: 'nowrap' }}>{sess.minutes}m</span>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</p>
              {!editingNotes && (
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditingNotes(true); setNotesValue(milestone.notes ?? ''); }}>
                  <Edit3 size={12} />
                </button>
              )}
            </div>
            {editingNotes ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <textarea
                  className="input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  placeholder="Notes, resources, links…"
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-sm btn-primary" onClick={saveNotes}>Save</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => setEditingNotes(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.83rem', color: milestone.notes ? 'var(--text-secondary)' : 'var(--text-muted)', fontStyle: milestone.notes ? 'normal' : 'italic' }}>
                {milestone.notes || 'No notes yet. Click edit to add.'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
