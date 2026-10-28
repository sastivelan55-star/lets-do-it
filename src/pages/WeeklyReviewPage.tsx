import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  Sparkles,
  Sliders,
  Calendar,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { WeeklyReview } from '../types';
import { getAllFromStore, saveToStore, deleteFromStore, getStoredChecklist, saveStoredChecklist } from '../db/storage';
import { getWeekDates, today } from '../utils/dates';
import { nanoid } from '../utils/nanoid';
import { format, parseISO } from 'date-fns';
import Modal from '../components/ui/Modal';

export interface ReviewQuestion {
  id: string;
  question: string;
}

const DEFAULT_REVIEW_QUESTIONS: ReviewQuestion[] = [
  { id: '1', question: 'What were my biggest wins and accomplishments this week?' },
  { id: '2', question: 'What challenges or bottlenecks slowed me down?' },
  { id: '3', question: 'What routines should I continue, reduce, or postpone?' },
  { id: '4', question: 'What are my top 3 non-negotiable priorities for next week?' },
];

const DEFAULT_REVIEW_CHECKLIST = [
  'Solved planned DSA / coding problems',
  'Pushed clean commits to GitHub',
  'Built or polished project components',
  'Practiced English / technical speaking',
  'Reviewed roadmap milestones & updated tasks',
  'Maintained sleep & personal health routines',
];

export default function WeeklyReviewPage() {
  const { tasks, weeklyCompletionRate, customLifeAreas, settings } = useApp();
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [editingReview, setEditingReview] = useState<WeeklyReview | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showManageQuestions, setShowManageQuestions] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<WeeklyReview | null>(null);

  const [questions, setQuestions] = useState<ReviewQuestion[]>(() => {
    const saved = localStorage.getItem('weekly_review_questions_v2');
    return saved ? JSON.parse(saved) : DEFAULT_REVIEW_QUESTIONS;
  });

  const [checklistItems, setChecklistItems] = useState<string[]>(() => {
    const saved = localStorage.getItem('weekly_checklist_v2');
    return saved ? JSON.parse(saved) : DEFAULT_REVIEW_CHECKLIST;
  });

  const [form, setForm] = useState({
    weekStart: getWeekDates().start,
    weekEnd: getWeekDates().end,
    wins: '',
    challenges: '',
    continueItems: '',
    reduceItems: '',
    postponeItems: '',
    nextWeekFocus: '',
    unfinishedTasksSummary: '',
    aiSummary: '',
    notes: '',
  });

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const { start: weekStart, end: weekEnd } = getWeekDates();
  const [weeklyChecked, setWeeklyChecked] = useState<Record<string, boolean>>(() =>
    getStoredChecklist('review_' + weekStart)
  );

  useEffect(() => {
    getAllFromStore<WeeklyReview>('weeklyReviews').then((saved) => {
      setReviews(saved.sort((a, b) => b.weekStart.localeCompare(a.weekStart)));
    });
  }, []);

  const saveQuestions = (updated: ReviewQuestion[]) => {
    setQuestions(updated);
    localStorage.setItem('weekly_review_questions_v2', JSON.stringify(updated));
  };

  const saveChecklist = (updated: string[]) => {
    setChecklistItems(updated);
    localStorage.setItem('weekly_checklist_v2', JSON.stringify(updated));
  };

  // Week's tasks metrics
  const weekTasks = useMemo(() => {
    return tasks.filter((t) => t.dueDate >= weekStart && t.dueDate <= weekEnd && !t.deletedAt);
  }, [tasks, weekStart, weekEnd]);

  const completedThisWeek = weekTasks.filter((t) => t.status === 'completed').length;

  const unfinishedThisWeek = useMemo(() => {
    return weekTasks.filter((t) => t.status !== 'completed' && t.status !== 'rescheduled');
  }, [weekTasks]);

  const overdueThisWeek = useMemo(() => {
    return tasks.filter((t) => t.dueDate < today() && t.status !== 'completed' && !t.deletedAt).length;
  }, [tasks]);

  // Open Form for New or Edit
  const handleOpenNew = () => {
    setEditingReview(null);
    const unfinishedNames = unfinishedThisWeek.map((t) => `• ${t.title}`).join('\n');
    setForm({
      weekStart,
      weekEnd,
      wins: '',
      challenges: '',
      continueItems: '',
      reduceItems: '',
      postponeItems: '',
      nextWeekFocus: '',
      unfinishedTasksSummary: unfinishedNames,
      aiSummary: '',
      notes: '',
    });
    setShowForm(true);
  };

  const handleOpenEdit = (review: WeeklyReview) => {
    setEditingReview(review);
    setForm({
      weekStart: review.weekStart,
      weekEnd: review.weekEnd,
      wins: review.wins.join('\n'),
      challenges: review.challenges.join('\n'),
      continueItems: review.continueItems.join('\n'),
      reduceItems: review.reduceItems.join('\n'),
      postponeItems: review.postponeItems.join('\n'),
      nextWeekFocus: review.nextWeekFocus.join('\n'),
      unfinishedTasksSummary: '',
      aiSummary: '',
      notes: review.notes || '',
    });
    setShowForm(true);
  };

  // Save Review (Create or Update)
  const saveReview = async () => {
    const now = new Date().toISOString();
    const winsArray = form.wins.split('\n').map((s) => s.trim()).filter(Boolean);
    const challengesArray = form.challenges.split('\n').map((s) => s.trim()).filter(Boolean);
    const continueArray = form.continueItems.split('\n').map((s) => s.trim()).filter(Boolean);
    const reduceArray = form.reduceItems.split('\n').map((s) => s.trim()).filter(Boolean);
    const postponeArray = form.postponeItems.split('\n').map((s) => s.trim()).filter(Boolean);
    const focusArray = form.nextWeekFocus.split('\n').map((s) => s.trim()).filter(Boolean);

    let fullNotes = form.notes.trim();
    if (form.aiSummary.trim()) {
      fullNotes = fullNotes
        ? `${fullNotes}\n\n[AI Summary]\n${form.aiSummary.trim()}`
        : `[AI Summary]\n${form.aiSummary.trim()}`;
    }
    if (form.unfinishedTasksSummary.trim()) {
      fullNotes = fullNotes
        ? `${fullNotes}\n\n[Unfinished Tasks Tracked]\n${form.unfinishedTasksSummary.trim()}`
        : `[Unfinished Tasks Tracked]\n${form.unfinishedTasksSummary.trim()}`;
    }

    if (editingReview) {
      const updated: WeeklyReview = {
        ...editingReview,
        weekStart: form.weekStart,
        weekEnd: form.weekEnd,
        wins: winsArray,
        challenges: challengesArray,
        continueItems: continueArray,
        reduceItems: reduceArray,
        postponeItems: postponeArray,
        nextWeekFocus: focusArray,
        notes: fullNotes,
      };
      await saveToStore('weeklyReviews', updated);
      setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } else {
      const newReview: WeeklyReview = {
        id: nanoid(),
        weekStart: form.weekStart,
        weekEnd: form.weekEnd,
        wins: winsArray,
        challenges: challengesArray,
        continueItems: continueArray,
        reduceItems: reduceArray,
        postponeItems: postponeArray,
        nextWeekFocus: focusArray,
        completionRate: weeklyCompletionRate,
        notes: fullNotes,
        createdAt: now,
      };
      await saveToStore('weeklyReviews', newReview);
      setReviews((prev) => [newReview, ...prev]);
    }

    setShowForm(false);
    setEditingReview(null);
  };

  const deleteReview = async (id: string) => {
    await deleteFromStore('weeklyReviews', id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setReviewToDelete(null);
  };

  const toggleWeekly = (item: string) => {
    setWeeklyChecked((prev) => {
      const next = { ...prev, [item]: !prev[item] };
      saveStoredChecklist('review_' + weekStart, next);
      return next;
    });
  };

  // Optional AI Weekly Summary Helper
  const handleGenerateAiSummary = async () => {
    setIsGeneratingAi(true);
    try {
      const summaryContext = `Week completed: ${completedThisWeek} tasks. Unfinished: ${unfinishedThisWeek.length}. Wins: ${form.wins}. Challenges: ${form.challenges}`;
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: settings?.aiSettings?.provider || 'gemini',
          model: settings?.aiSettings?.model || 'gemini-1.5-flash',
          instruction: `Summarize this week's productivity and suggest 2 encouraging improvements based on: ${summaryContext}. Keep it concise in 3 bullet points.`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.interpretation) {
          setForm((f) => ({
            ...f,
            aiSummary: data.interpretation,
          }));
        }
      }
    } catch {
      setForm((f) => ({
        ...f,
        aiSummary: `• Consistent momentum maintained on ${completedThisWeek} completed tasks.\n• Key learning: address unfinished items early in the week.\n• Prioritize high-impact deep work blocks for next week.`,
      }));
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="page-container pb-safe">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            📊 <span className="gradient-text">Weekly Review & Strategy</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Current Week: {format(parseISO(weekStart), 'MMM d')} — {format(parseISO(weekEnd), 'MMM d, yyyy')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowManageQuestions(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Sliders size={15} /> Customize Review Prompts
          </button>
          <button className="btn btn-primary" onClick={handleOpenNew}>
            <Plus size={15} /> Write Weekly Review
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        {[
          { label: 'Tasks This Week', value: weekTasks.length, color: '#818cf8' },
          { label: 'Completed', value: completedThisWeek, color: '#10b981' },
          { label: 'Unfinished / Due', value: unfinishedThisWeek.length, color: '#f59e0b' },
          { label: 'Total Overdue', value: overdueThisWeek, color: overdueThisWeek > 0 ? '#ef4444' : '#10b981' },
          { label: 'Weekly Rate', value: `${weeklyCompletionRate}%`, color: '#60a5fa' },
        ].map((s) => (
          <div
            key={s.label}
            className="card"
            style={{ textAlign: 'center', background: `${s.color}08`, borderColor: `${s.color}20` }}
          >
            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Unfinished Tasks Section if any */}
      {unfinishedThisWeek.length > 0 && (
        <div
          className="card"
          style={{
            marginBottom: '1.25rem',
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <AlertCircle size={16} color="#f59e0b" />
            <h2 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f59e0b' }}>
              Unfinished Tasks This Week ({unfinishedThisWeek.length})
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
            These tasks were scheduled for this week but remain uncompleted. You can address or reschedule them during your
            review.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {unfinishedThisWeek.slice(0, 5).map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.4rem 0.6rem',
                  background: 'var(--bg-surface)',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                }}
              >
                <span className="task-title" style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                  {t.title}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Due: {t.dueDate}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task breakdown by area */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>📋 This Week by Life Area</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {customLifeAreas.map((area) => {
            const areaTasks = weekTasks.filter((t) => t.lifeArea === area.id);
            const done = areaTasks.filter((t) => t.status === 'completed').length;
            const total = areaTasks.length;
            const pct = total ? Math.round((done / total) * 100) : 0;
            return (
              <div
                key={area.id}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', minWidth: 0 }}
              >
                <span
                  style={{
                    minWidth: '4.5rem',
                    width: '7.5rem',
                    flexShrink: 0,
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {area.name}
                </span>
                <div className="progress-bar-track" style={{ flex: 1, minWidth: 0 }}>
                  <div className="progress-bar-fill" style={{ width: `${pct}%`, background: area.color }} />
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                    minWidth: '4rem',
                    textAlign: 'right',
                  }}
                >
                  {done}/{total} · {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Checklist */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>✅ Weekly Review & Habit Checklist</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Interactive progress checklist</span>
        </div>
        <div className="form-grid-2">
          {checklistItems.map((item) => (
            <label
              key={item}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                cursor: 'pointer',
                padding: '0.45rem 0.65rem',
                background: weeklyChecked[item] ? 'rgba(99,102,241,0.08)' : 'var(--bg-surface-2)',
                borderRadius: '8px',
                border: `1px solid ${weeklyChecked[item] ? 'rgba(99,102,241,0.25)' : 'transparent'}`,
              }}
            >
              <div
                onClick={() => toggleWeekly(item)}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '4px',
                  border: `2px solid ${weeklyChecked[item] ? '#6366f1' : 'var(--border)'}`,
                  background: weeklyChecked[item] ? '#6366f1' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  cursor: 'pointer',
                }}
              >
                {weeklyChecked[item] && <CheckCircle2 size={11} color="white" />}
              </div>
              <span
                style={{
                  fontSize: '0.84rem',
                  color: weeklyChecked[item] ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: weeklyChecked[item] ? 'line-through' : 'none',
                }}
              >
                {item}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Past Reviews History */}
      {reviews.length > 0 ? (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>📝 Saved Weekly Reviews ({reviews.length})</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click to view or edit</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reviews.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: '1rem',
                  background: 'var(--bg-surface-2)',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={15} color="#818cf8" />
                    <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      Week of {r.weekStart} — {r.weekEnd}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                      {r.completionRate}% completion
                    </span>
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => handleOpenEdit(r)}
                      title="Edit review"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      style={{ color: '#ef4444' }}
                      onClick={() => setReviewToDelete(r)}
                      title="Delete review"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {r.wins.length > 0 && (
                  <p style={{ fontSize: '0.82rem', color: '#10b981', marginBottom: '0.25rem' }}>
                    🏆 <strong>Wins:</strong> {r.wins.join(' · ')}
                  </p>
                )}
                {r.challenges.length > 0 && (
                  <p style={{ fontSize: '0.82rem', color: '#f59e0b', marginBottom: '0.25rem' }}>
                    💪 <strong>Challenges:</strong> {r.challenges.join(' · ')}
                  </p>
                )}
                {r.nextWeekFocus.length > 0 && (
                  <p style={{ fontSize: '0.82rem', color: '#60a5fa', marginBottom: '0.25rem' }}>
                    🎯 <strong>Next Week:</strong> {r.nextWeekFocus.join(' · ')}
                  </p>
                )}
                {r.notes && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.35rem' }}>
                    📝 {r.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
          <Clock size={32} color="var(--text-muted)" style={{ opacity: 0.5, margin: '0 auto 0.5rem' }} />
          <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>No Weekly Reviews Yet</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Take 5 minutes to capture wins, lessons, and your top priorities for next week.
          </p>
          <button className="btn btn-primary btn-sm" onClick={handleOpenNew}>
            <Plus size={14} /> Write Your First Review
          </button>
        </div>
      )}

      {/* Write / Edit Review Modal */}
      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingReview(null);
          }}
          title={editingReview ? 'Edit Weekly Review' : '✍️ Write Weekly Review & Strategy'}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className="grid-2col" style={{ gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Week Start</label>
                <input
                  className="input"
                  type="date"
                  value={form.weekStart}
                  onChange={(e) => setForm((f) => ({ ...f, weekStart: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Week End</label>
                <input
                  className="input"
                  type="date"
                  value={form.weekEnd}
                  onChange={(e) => setForm((f) => ({ ...f, weekEnd: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>🏆 Wins this week (one per line)</label>
              <textarea
                className="input"
                rows={2}
                placeholder="Finished Month 2 roadmap items&#10;Solved 5 LeetCode problems"
                value={form.wins}
                onChange={(e) => setForm((f) => ({ ...f, wins: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>💪 Challenges & Obstacles (one per line)</label>
              <textarea
                className="input"
                rows={2}
                placeholder="Struggled with tree algorithms&#10;Distractions during deep work"
                value={form.challenges}
                onChange={(e) => setForm((f) => ({ ...f, challenges: e.target.value }))}
              />
            </div>

            <div className="grid-3col" style={{ gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>▶️ Continue</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Daily DSA practice&#10;Speaking drills"
                  value={form.continueItems}
                  onChange={(e) => setForm((f) => ({ ...f, continueItems: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>⬇️ Reduce</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Late screen time&#10;Context switching"
                  value={form.reduceItems}
                  onChange={(e) => setForm((f) => ({ ...f, reduceItems: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>⏸️ Postpone</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Non-urgent tutorials"
                  value={form.postponeItems}
                  onChange={(e) => setForm((f) => ({ ...f, postponeItems: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>🎯 Top Priorities for Next Week (one per line)</label>
              <textarea
                className="input"
                rows={2}
                placeholder="Submit 5 high-quality internship apps&#10;Complete Dynamic Programming chapter"
                value={form.nextWeekFocus}
                onChange={(e) => setForm((f) => ({ ...f, nextWeekFocus: e.target.value }))}
              />
            </div>

            {form.unfinishedTasksSummary && (
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f59e0b' }}>
                  Tracked Unfinished Tasks
                </label>
                <textarea
                  className="input"
                  rows={2}
                  value={form.unfinishedTasksSummary}
                  onChange={(e) => setForm((f) => ({ ...f, unfinishedTasksSummary: e.target.value }))}
                />
              </div>
            )}

            {/* AI Summary Generator Assistant */}
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'rgba(99,102,241,0.06)',
                border: '1px solid rgba(99,102,241,0.2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Sparkles size={13} /> AI Strategy Summary (Optional)
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleGenerateAiSummary}
                  disabled={isGeneratingAi}
                  style={{ fontSize: '0.75rem', color: '#818cf8', padding: '0.2rem 0.5rem' }}
                >
                  {isGeneratingAi ? 'Generating...' : '✨ Generate AI Summary'}
                </button>
              </div>
              <textarea
                className="input"
                rows={2}
                placeholder="Click 'Generate AI Summary' to get an editable synthesis of your weekly progress..."
                value={form.aiSummary}
                onChange={(e) => setForm((f) => ({ ...f, aiSummary: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Additional Notes & Insights</label>
              <textarea
                className="input"
                rows={2}
                placeholder="Any other realizations, mindset observations, or thoughts..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingReview(null);
                }}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveReview}>
                {editingReview ? 'Save Changes' : 'Save Weekly Review'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Customize Review Prompts & Checklist */}
      <Modal
        isOpen={showManageQuestions}
        onClose={() => setShowManageQuestions(false)}
        title="Customize Weekly Review Questions & Checklist"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Review Questions</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => saveQuestions([...questions, { id: nanoid(), question: 'New custom reflection question?' }])}
                style={{ fontSize: '0.78rem', color: '#818cf8' }}
              >
                + Add Question
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {questions.map((q, idx) => (
                <div key={q.id} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <input
                    className="input"
                    value={q.question}
                    onChange={(e) => {
                      const updated = [...questions];
                      updated[idx] = { ...updated[idx], question: e.target.value };
                      saveQuestions(updated);
                    }}
                    style={{ fontSize: '0.82rem', padding: '0.35rem 0.5rem' }}
                  />
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#ef4444', padding: '0.3rem' }}
                    onClick={() => saveQuestions(questions.filter((item) => item.id !== q.id))}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Checklist Items</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => saveChecklist([...checklistItems, 'New review habit checklist item'])}
                style={{ fontSize: '0.78rem', color: '#818cf8' }}
              >
                + Add Item
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {checklistItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <input
                    className="input"
                    value={item}
                    onChange={(e) => {
                      const updated = [...checklistItems];
                      updated[idx] = e.target.value;
                      saveChecklist(updated);
                    }}
                    style={{ fontSize: '0.82rem', padding: '0.35rem 0.5rem' }}
                  />
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#ef4444', padding: '0.3rem' }}
                    onClick={() => saveChecklist(checklistItems.filter((_, i) => i !== idx))}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button className="btn btn-primary" onClick={() => setShowManageQuestions(false)}>
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Review Modal */}
      <Modal isOpen={Boolean(reviewToDelete)} onClose={() => setReviewToDelete(null)} title="Delete Weekly Review">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Are you sure you want to delete the review for the week of{' '}
            <strong>{reviewToDelete?.weekStart}</strong>?
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setReviewToDelete(null)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => reviewToDelete && deleteReview(reviewToDelete.id)}
              style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}
            >
              Delete Review
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
