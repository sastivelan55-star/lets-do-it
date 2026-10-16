import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { WeeklyReview } from '../types';
import { getAllFromStore, saveToStore, deleteFromStore, getStoredChecklist, saveStoredChecklist } from '../db/storage';
import { getWeekDates, today } from '../utils/dates';
import { nanoid } from '../utils/nanoid';
import { format, parseISO } from 'date-fns';

export default function WeeklyReviewPage() {
  const { tasks, weeklyCompletionRate } = useApp();
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    wins: '',
    challenges: '',
    continueItems: '',
    reduceItems: '',
    postponeItems: '',
    nextWeekFocus: '',
    notes: '',
  });

  const { start: weekStart, end: weekEnd } = getWeekDates();
  const [weeklyChecked, setWeeklyChecked] = useState<Record<string, boolean>>(() =>
    getStoredChecklist('review_' + weekStart)
  );

  useEffect(() => {
    getAllFromStore<WeeklyReview>('weeklyReviews').then(setReviews);
  }, []);

  const weekTasks = tasks.filter((t) => t.dueDate >= weekStart && t.dueDate <= weekEnd);
  const completedThisWeek = weekTasks.filter((t) => t.status === 'completed').length;
  const overdueThisWeek = tasks.filter((t) => t.dueDate < today() && t.status !== 'completed' && t.status !== 'rescheduled').length;

  // Tasks by life area this week
  const byArea = {
    technical: weekTasks.filter((t) => t.lifeArea === 'technical'),
    communication: weekTasks.filter((t) => t.lifeArea === 'communication'),
    career: weekTasks.filter((t) => t.lifeArea === 'career'),
    creativity: weekTasks.filter((t) => t.lifeArea === 'creativity'),
    health: weekTasks.filter((t) => t.lifeArea === 'health'),
  };

  const saveReview = async () => {
    const { start, end } = getWeekDates();
    const review: WeeklyReview = {
      id: nanoid(),
      weekStart: start,
      weekEnd: end,
      wins: form.wins.split('\n').filter(Boolean),
      challenges: form.challenges.split('\n').filter(Boolean),
      continueItems: form.continueItems.split('\n').filter(Boolean),
      reduceItems: form.reduceItems.split('\n').filter(Boolean),
      postponeItems: form.postponeItems.split('\n').filter(Boolean),
      nextWeekFocus: form.nextWeekFocus.split('\n').filter(Boolean),
      completionRate: weeklyCompletionRate,
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    await saveToStore('weeklyReviews', review);
    setReviews((prev) => [...prev, review]);
    setShowForm(false);
    setForm({ wins: '', challenges: '', continueItems: '', reduceItems: '', postponeItems: '', nextWeekFocus: '', notes: '' });
  };

  const deleteReview = async (id: string) => {
    await deleteFromStore('weeklyReviews', id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleWeekly = (item: string) => {
    setWeeklyChecked((prev) => {
      const next = { ...prev, [item]: !prev[item] };
      saveStoredChecklist('review_' + weekStart, next);
      return next;
    });
  };

  const WEEKLY_CHECKLIST = [
    'Apply to suitable internships',
    'Tailor resume to a relevant role',
    'Practice DSA and core CS interview questions',
    'Update GitHub with meaningful progress',
    'Publish or improve one LinkedIn post',
    'Practice one mock interview',
    'Connect with one professional, alumnus or mentor',
    'Review progress and plan next week',
  ];

  return (
    <div className="page-container pb-safe">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            📊 <span className="gradient-text">Weekly Review</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Week of {format(parseISO(weekStart), 'MMM d')} — {format(parseISO(weekEnd), 'MMM d, yyyy')}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Write Review
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Tasks This Week', value: weekTasks.length, color: '#818cf8' },
          { label: 'Completed', value: completedThisWeek, color: '#10b981' },
          { label: 'Overdue', value: overdueThisWeek, color: '#f59e0b' },
          { label: 'Weekly Rate', value: `${weeklyCompletionRate}%`, color: '#60a5fa' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ textAlign: 'center', background: `${s.color}08`, borderColor: `${s.color}20` }}>
            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Task breakdown by area */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>📋 This Week by Life Area</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {Object.entries(byArea).map(([area, areaT]) => {
            const done = areaT.filter((t) => t.status === 'completed').length;
            const total = areaT.length;
            const pct = total ? Math.round((done / total) * 100) : 0;
            const colors: Record<string, string> = { technical: '#6366f1', communication: '#06b6d4', career: '#f59e0b', creativity: '#ec4899', health: '#10b981' };
            const c = colors[area] ?? '#818cf8';
            return (
              <div key={area} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', minWidth: 0 }}>
                <span style={{ minWidth: '4.5rem', width: '6.5rem', flexShrink: 0, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{area}</span>
                <div className="progress-bar-track" style={{ flex: 1, minWidth: 0 }}>
                  <div className="progress-bar-fill" style={{ width: `${pct}%`, background: c }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0, minWidth: '4rem', textAlign: 'right' }}>
                  {done}/{total} · {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly checklist */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.875rem' }}>✅ Weekly Career Checklist</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {WEEKLY_CHECKLIST.map((item) => (
            <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.45rem 0.75rem', background: weeklyChecked[item] ? 'rgba(129,140,248,0.08)' : 'var(--bg-surface-2)', borderRadius: '8px' }}>
              <div onClick={() => toggleWeekly(item)} style={{ width: 18, height: 18, borderRadius: '4px', border: `2px solid ${weeklyChecked[item] ? '#818cf8' : 'var(--border)'}`, background: weeklyChecked[item] ? '#818cf8' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                {weeklyChecked[item] && <CheckCircle2 size={10} color="white" />}
              </div>
              <span style={{ fontSize: '0.85rem', color: weeklyChecked[item] ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: weeklyChecked[item] ? 'line-through' : 'none' }}>{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Weekly review checklist from image */}
      <div className="card" style={{ marginBottom: '1.25rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(99,102,241,0.02))', borderColor: 'rgba(99,102,241,0.18)' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.875rem' }}>📊 Weekly Review Checklist</h2>
        <div className="form-grid-2">
          {['Solved DSA Problems', 'Committed Code', 'Learned New Concepts', 'Built / Improved Projects', 'Revised & Practiced', 'Logged in STAR Doc'].map((item) => (
            <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.83rem', color: 'var(--text-secondary)', width: '100%', minWidth: 0 }}>
              <div onClick={() => toggleWeekly(item)} style={{ width: '1rem', height: '1rem', borderRadius: '4px', border: `2px solid ${weeklyChecked[item] ? '#818cf8' : 'var(--border)'}`, background: weeklyChecked[item] ? '#818cf8' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                {weeklyChecked[item] && <span style={{ fontSize: '0.6rem', color: 'white' }}>✓</span>}
              </div>
              <span className="task-title" style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Past reviews */}
      {reviews.length > 0 ? (
        <div className="card">
          <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.875rem' }}>📝 Past Reviews</h2>
          {reviews.slice(-3).reverse().map((r) => (
            <div key={r.id} style={{ padding: '0.875rem', background: 'var(--bg-surface-2)', borderRadius: '10px', marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>Week of {r.weekStart}</p>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="badge status-in-progress" style={{ fontSize: '0.72rem' }}>{r.completionRate}% completion</span>
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    style={{ color: '#ef4444', padding: '0.2rem' }}
                    onClick={() => deleteReview(r.id)}
                    title="Delete review"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {r.wins.length > 0 && <p style={{ fontSize: '0.8rem', color: '#10b981', marginBottom: '0.25rem' }}>✅ {r.wins.slice(0, 2).join(' · ')}</p>}
              {r.continueItems.length > 0 && <p style={{ fontSize: '0.8rem', color: '#818cf8', marginBottom: '0.25rem' }}>▶️ Continue: {r.continueItems.slice(0, 2).join(' · ')}</p>}
              {r.nextWeekFocus.length > 0 && <p style={{ fontSize: '0.8rem', color: '#f59e0b' }}>🎯 Next week: {r.nextWeekFocus.slice(0, 2).join(' · ')}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>No weekly reviews logged yet</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.875rem' }}>Take 5 minutes at the end of the week to capture wins, lessons, and next priorities.</p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Write Your First Review
          </button>
        </div>
      )}

      {/* Write review modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal-box" style={{ maxWidth: '40rem', width: '100%' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>✍️ Write Weekly Review</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label>🏆 Wins this week (one per line)</label>
                <textarea className="input" style={{ minHeight: '72px' }} placeholder="Completed Month 2 roadmap&#10;Solved 5 LeetCode problems" value={form.wins} onChange={(e) => setForm((f) => ({ ...f, wins: e.target.value }))} />
              </div>
              <div>
                <label>💪 Challenges (one per line)</label>
                <textarea className="input" style={{ minHeight: '60px' }} placeholder="Struggled with recursion&#10;Missed two planned tasks" value={form.challenges} onChange={(e) => setForm((f) => ({ ...f, challenges: e.target.value }))} />
              </div>
              <div className="form-grid-3">
                <div>
                  <label>▶️ Continue</label>
                  <textarea className="input" style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Daily LeetCode\nMorning reading" value={form.continueItems} onChange={(e) => setForm((f) => ({ ...f, continueItems: e.target.value }))} />
                </div>
                <div>
                  <label>⬇️ Reduce</label>
                  <textarea className="input" style={{ minHeight: '80px', resize: 'vertical' }} placeholder="Late-night studying\nSocial media" value={form.reduceItems} onChange={(e) => setForm((f) => ({ ...f, reduceItems: e.target.value }))} />
                </div>
                <div>
                  <label>⏸️ Postpone</label>
                  <textarea className="input" style={{ minHeight: '80px', resize: 'vertical' }} placeholder="YouTube channel\nLinkedIn articles" value={form.postponeItems} onChange={(e) => setForm((f) => ({ ...f, postponeItems: e.target.value }))} />
                </div>
              </div>
              <div>
                <label>🎯 Next week focus (one per line)</label>
                <textarea className="input" style={{ minHeight: '60px' }} placeholder="Start Java OOP chapter\nApply to 2 internships" value={form.nextWeekFocus} onChange={(e) => setForm((f) => ({ ...f, nextWeekFocus: e.target.value }))} />
              </div>
              <div>
                <label>Notes</label>
                <textarea className="input" style={{ minHeight: '60px' }} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any other reflections..." />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveReview}>Save Review</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
