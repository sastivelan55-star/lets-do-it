import { useState, useEffect, useCallback } from 'react';
import { Plus, Briefcase, ExternalLink, Check } from 'lucide-react';
import ProgressRing from '../components/ui/ProgressRing';
import Modal from '../components/ui/Modal';
import type { CareerItem, InternshipApplication } from '../types';
import { getAllFromStore, saveToStore, deleteFromStore, getStoredChecklist, saveStoredChecklist } from '../db/storage';
import { today } from '../utils/dates';
import { nanoid } from '../utils/nanoid';

const CAREER_TOOLKIT = [
  { icon: '📄', title: 'Resume & LinkedIn', type: 'resume' as const },
  { icon: '🐙', title: 'GitHub Portfolio', type: 'github' as const },
  { icon: '💻', title: 'DSA Practice', type: 'dsa' as const },
  { icon: '📚', title: 'Core CS Subjects', type: 'cs-fundamentals' as const },
  { icon: '🎤', title: 'Interview Prep', type: 'mock-interview' as const },
  { icon: '🏢', title: 'Internship Tracker', type: 'internship' as const },
];

const APP_STATUSES: InternshipApplication['status'][] = [
  'researching','applied','interviewing','offered','rejected','withdrawn',
];

const STATUS_COLOR: Record<string, string> = {
  researching: '#64748b', applied: '#6366f1', interviewing: '#f59e0b',
  offered: '#10b981', rejected: '#ef4444', withdrawn: '#94a3b8',
};

const DAILY_CAREER_ROUTINE = [
  { time: '10 min', task: 'Check internship opportunities' },
  { time: '10 min', task: 'Improve resume or LinkedIn' },
  { time: '15 min', task: 'Practice interview questions' },
  { time: '15 min', task: 'Review one job description and its required skills' },
  { time: '10 min', task: 'Record achievements in a career tracker' },
];

export default function CareerPage() {
  const [items, setItems] = useState<CareerItem[]>([]);
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [showAppForm, setShowAppForm] = useState(false);
  const [editingApp, setEditingApp] = useState<InternshipApplication | null>(null);
  const [appForm, setAppForm] = useState({
    company: '', role: '', link: '', appliedDate: today(), status: 'applied' as InternshipApplication['status'],
    nextFollowUp: '', notes: '',
  });
  const [dailyChecked, setDailyChecked] = useState<Record<string, boolean>>(() =>
    getStoredChecklist('career_' + today())
  );

  const toggleDaily = (task: string) => {
    setDailyChecked((prev) => {
      const next = { ...prev, [task]: !prev[task] };
      saveStoredChecklist('career_' + today(), next);
      return next;
    });
  };

  useEffect(() => {
    getAllFromStore<CareerItem>('careerItems').then(setItems);
    getAllFromStore<InternshipApplication>('internshipApplications').then(setApplications);
  }, []);

  const doneCount = items.filter((i) => i.status === 'done').length;
  const pct = CAREER_TOOLKIT.length ? Math.round((doneCount / CAREER_TOOLKIT.length) * 100) : 0;

  const getItemForType = (type: CareerItem['type']): CareerItem | undefined =>
    items.find((i) => i.type === type);

  const toggleToolkitStatus = useCallback(async (type: CareerItem['type'], title: string) => {
    const now = new Date().toISOString();
    setItems((prev) => {
      const existing = prev.find((i) => i.type === type);
      if (existing) {
        const next: CareerItem = {
          ...existing,
          status: existing.status === 'done' ? 'todo' : 'done',
          updatedAt: now,
        };
        saveToStore('careerItems', next);
        return prev.map((i) => (i.id === next.id ? next : i));
      } else {
        const newItem: CareerItem = {
          id: nanoid(),
          type,
          title,
          status: 'done',
          updatedAt: now,
        };
        saveToStore('careerItems', newItem);
        return [...prev, newItem];
      }
    });
  }, []);

  const saveApp = async () => {
    if (!appForm.company.trim() || !appForm.role.trim()) return;
    if (editingApp) {
      const updated: InternshipApplication = { ...editingApp, ...appForm, updatedAt: new Date().toISOString() };
      await saveToStore('internshipApplications', updated);
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } else {
      const app: InternshipApplication = { id: nanoid(), ...appForm, updatedAt: new Date().toISOString() };
      await saveToStore('internshipApplications', app);
      setApplications((prev) => [...prev, app]);
    }
    setShowAppForm(false);
    setEditingApp(null);
    setAppForm({ company: '', role: '', link: '', appliedDate: today(), status: 'applied', nextFollowUp: '', notes: '' });
  };

  const deleteApp = async (id: string) => {
    await deleteFromStore('internshipApplications', id);
    setApplications((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="page-container pb-safe">
      {/* Hero */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.04))',
          borderColor: 'rgba(245,158,11,0.25)',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <ProgressRing value={pct} size={100} strokeWidth={10} color="#f59e0b" trackColor="rgba(245,158,11,0.12)" label={`${pct}%`} sublabel="Toolkit" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Briefcase size={20} color="#f59e0b" />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              Career Readiness <span style={{ color: '#f59e0b' }}>— 15%</span>
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
            Prepare · Apply · Interview · Get Hired
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            "Become internship-ready, communicate your value clearly, and build a portfolio that proves your skills."
          </p>
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem' }}>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Applications</p>
              <p style={{ fontWeight: 800, color: '#f59e0b' }}>{applications.length}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Offers</p>
              <p style={{ fontWeight: 800, color: '#10b981' }}>{applications.filter((a) => a.status === 'offered').length}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Interviewing</p>
              <p style={{ fontWeight: 800, color: '#6366f1' }}>{applications.filter((a) => a.status === 'interviewing').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Career Toolkit */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>🛠️ Your Career Toolkit</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '0.75rem' }}>
          {CAREER_TOOLKIT.map((t) => {
            const item = getItemForType(t.type);
            const isDone = item?.status === 'done';
            return (
              <button
                key={t.type}
                onClick={() => toggleToolkitStatus(t.type, t.title)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1rem',
                  background: isDone ? 'rgba(245,158,11,0.1)' : 'var(--bg-surface-2)',
                  border: `1px solid ${isDone ? 'rgba(245,158,11,0.35)' : 'var(--border)'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{t.icon}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isDone ? '#f59e0b' : 'var(--text-primary)' }}>
                  {t.title}
                </span>
                {isDone && <Check size={14} color="#f59e0b" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily routine */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.875rem' }}>⏰ Daily Career Routine</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {DAILY_CAREER_ROUTINE.map((r) => (
            <label
              key={r.task}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem 0.75rem', background: dailyChecked[r.task] ? 'rgba(245,158,11,0.07)' : 'var(--bg-surface-2)', borderRadius: '8px', border: `1px solid ${dailyChecked[r.task] ? 'rgba(245,158,11,0.25)' : 'transparent'}` }}
            >
              <div
                onClick={() => toggleDaily(r.task)}
                style={{
                  width: 18, height: 18, borderRadius: '4px',
                  border: `2px solid ${dailyChecked[r.task] ? '#f59e0b' : 'var(--border)'}`,
                  background: dailyChecked[r.task] ? '#f59e0b' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer',
                }}
              >
                {dailyChecked[r.task] && <Check size={10} color="white" />}
              </div>
              <span className="badge" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', flexShrink: 0 }}>{r.time}</span>
              <span className="task-title" style={{ flex: 1, minWidth: 0, fontSize: '0.85rem', color: dailyChecked[r.task] ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: dailyChecked[r.task] ? 'line-through' : 'none', overflowWrap: 'anywhere' }}>
                {r.task}
              </span>
            </label>
          ))}
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontStyle: 'italic' }}>
          💡 Note: Apply on selected days rather than forcing applications every day.
        </p>
      </div>

      {/* Internship Applications */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>📨 Internship Applications</h2>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAppForm(true)}>
            <Plus size={14} /> Add Application
          </button>
        </div>

        {applications.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <Briefcase size={28} />
            <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>No applications yet</p>
            <p style={{ fontSize: '0.82rem', marginBottom: '0.875rem' }}>Track your first internship application.</p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAppForm(true)}>
              <Plus size={14} /> Add Application
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {applications.map((app) => (
              <div
                key={app.id}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-surface-2)',
                  borderRadius: '10px',
                  border: `1px solid ${STATUS_COLOR[app.status]}25`,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{app.company}</p>
                    {app.link && (
                      <a href={app.link} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{app.role}</p>
                  {app.notes && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{app.notes}</p>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                  <span className="badge" style={{ background: `${STATUS_COLOR[app.status]}18`, color: STATUS_COLOR[app.status] }}>
                    {app.status}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.appliedDate}</span>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditingApp(app); setAppForm({ company: app.company, role: app.role, link: app.link ?? '', appliedDate: app.appliedDate, status: app.status, nextFollowUp: app.nextFollowUp ?? '', notes: app.notes ?? '' }); setShowAppForm(true); }}>✏️</button>
                  <button className="btn btn-ghost btn-sm btn-icon" style={{ color: '#ef4444' }} onClick={() => deleteApp(app.id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application form modal */}
      <Modal isOpen={showAppForm} onClose={() => { setShowAppForm(false); setEditingApp(null); }} title={editingApp ? 'Edit Application' : 'Add Application'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div className="form-grid-2">
            <div>
              <label>Company *</label>
              <input className="input" value={appForm.company} onChange={(e) => setAppForm((f) => ({ ...f, company: e.target.value }))} placeholder="e.g. Google" />
            </div>
            <div>
              <label>Role *</label>
              <input className="input" value={appForm.role} onChange={(e) => setAppForm((f) => ({ ...f, role: e.target.value }))} placeholder="e.g. Software Engineer Intern" />
            </div>
          </div>
          <div>
            <label>Job Link (optional)</label>
            <input className="input" value={appForm.link} onChange={(e) => setAppForm((f) => ({ ...f, link: e.target.value }))} placeholder="https://..." />
          </div>
          <div className="form-grid-3">
            <div>
              <label>Applied Date</label>
              <input type="date" className="input" value={appForm.appliedDate} onChange={(e) => setAppForm((f) => ({ ...f, appliedDate: e.target.value }))} />
            </div>
            <div>
              <label>Status</label>
              <select className="input select" value={appForm.status} onChange={(e) => setAppForm((f) => ({ ...f, status: e.target.value as InternshipApplication['status'] }))}>
                {APP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label>Follow-Up Date</label>
              <input type="date" className="input" value={appForm.nextFollowUp} onChange={(e) => setAppForm((f) => ({ ...f, nextFollowUp: e.target.value }))} />
            </div>
          </div>
          <div>
            <label>Notes</label>
            <textarea className="input" style={{ minHeight: '60px' }} value={appForm.notes} onChange={(e) => setAppForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Contact person, requirements, interview rounds…" />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => { setShowAppForm(false); setEditingApp(null); }}>Cancel</button>
            <button className="btn btn-primary" onClick={saveApp}>{editingApp ? 'Save Changes' : 'Add Application'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
