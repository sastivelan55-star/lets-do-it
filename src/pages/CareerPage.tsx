import { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  ExternalLink,
  Check,
  Plus,
  Edit2,
  Trash2,
  Sliders,
} from 'lucide-react';
import ProgressRing from '../components/ui/ProgressRing';
import Modal from '../components/ui/Modal';
import type { CareerItem, InternshipApplication } from '../types';
import { getAllFromStore, saveToStore, deleteFromStore, getStoredChecklist, saveStoredChecklist } from '../db/storage';
import { today } from '../utils/dates';
import { nanoid } from '../utils/nanoid';

export interface CareerRoutineItem {
  id: string;
  time: string;
  task: string;
}

export interface CareerMilestoneItem {
  id: string;
  title: string;
  targetDate?: string;
  isCompleted: boolean;
  notes?: string;
}

const DEFAULT_TOOLKIT: { title: string; type: CareerItem['type']; icon: string; description: string }[] = [
  { icon: '📄', title: 'Resume & LinkedIn', type: 'resume', description: 'ATS-optimized resume & complete LinkedIn profile' },
  { icon: '🐙', title: 'GitHub Portfolio', type: 'github', description: 'Pinned production-ready projects with live demos' },
  { icon: '💻', title: 'DSA Practice', type: 'dsa', description: 'Problem-solving patterns on LeetCode / NeetCode' },
  { icon: '📚', title: 'Core CS Subjects', type: 'cs-fundamentals', description: 'OS, DBMS, Networks & System Design' },
  { icon: '🎤', title: 'Interview Prep', type: 'mock-interview', description: 'Behavioral stories & technical mock interviews' },
  { icon: '🏢', title: 'Internship Pipeline', type: 'internship', description: 'Active applications, follow-ups & networking' },
];

const DEFAULT_ROUTINES: CareerRoutineItem[] = [
  { id: '1', time: '10 min', task: 'Check new internship & full-time job postings' },
  { id: '2', time: '15 min', task: 'Improve resume bullet points or project GitHub READMEs' },
  { id: '3', time: '20 min', task: 'Solve or review 1 DSA problem / pattern' },
  { id: '4', time: '15 min', task: 'Review 1 target job description and required technologies' },
  { id: '5', time: '10 min', task: 'Follow up on pending applications or message recruiters' },
];

const DEFAULT_MILESTONES: CareerMilestoneItem[] = [
  { id: '1', title: 'Complete ATS-friendly Software Engineer Resume', isCompleted: true },
  { id: '2', title: 'Build 2 full-stack showcase projects with live deployments', isCompleted: false },
  { id: '3', title: 'Solve 75 essential LeetCode questions (Blind 75)', isCompleted: false },
  { id: '4', title: 'Submit 30 high-quality applications to target companies', isCompleted: false },
  { id: '5', title: 'Secure summer / fall internship offer', isCompleted: false },
];

const APP_STATUSES: { value: InternshipApplication['status']; label: string; color: string }[] = [
  { value: 'researching', label: 'Researching', color: '#64748b' },
  { value: 'applied', label: 'Applied', color: '#6366f1' },
  { value: 'interviewing', label: 'Interviewing', color: '#f59e0b' },
  { value: 'offered', label: 'Offer Received', color: '#10b981' },
  { value: 'rejected', label: 'Rejected', color: '#ef4444' },
  { value: 'withdrawn', label: 'Withdrawn', color: '#94a3b8' },
];

export default function CareerPage() {
  const [items, setItems] = useState<CareerItem[]>([]);
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [routines, setRoutines] = useState<CareerRoutineItem[]>(() => {
    const saved = localStorage.getItem('career_routines_v2');
    return saved ? JSON.parse(saved) : DEFAULT_ROUTINES;
  });
  const [milestones, setMilestones] = useState<CareerMilestoneItem[]>(() => {
    const saved = localStorage.getItem('career_milestones_v2');
    return saved ? JSON.parse(saved) : DEFAULT_MILESTONES;
  });

  // Section Headers & Goals
  const [careerGoal, setCareerGoal] = useState<string>(() => {
    return localStorage.getItem('career_target_goal') || 'Secure Software Engineer / Full Stack Internship';
  });
  const [careerBio, setCareerBio] = useState<string>(() => {
    return (
      localStorage.getItem('career_target_bio') ||
      'Become interview-ready, communicate your value clearly, and build a portfolio that proves your skills.'
    );
  });

  // Modals
  const [showManageOverview, setShowManageOverview] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<CareerItem | null>(null);
  const [skillForm, setSkillForm] = useState({ title: '', description: '', status: 'todo' as CareerItem['status'] });

  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<CareerRoutineItem | null>(null);
  const [routineForm, setRoutineForm] = useState({ task: '', time: '15 min' });

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<CareerMilestoneItem | null>(null);
  const [milestoneForm, setMilestoneForm] = useState({ title: '', targetDate: '', isCompleted: false });

  const [showAppForm, setShowAppForm] = useState(false);
  const [editingApp, setEditingApp] = useState<InternshipApplication | null>(null);
  const [appForm, setAppForm] = useState({
    company: '',
    role: '',
    link: '',
    appliedDate: today(),
    status: 'applied' as InternshipApplication['status'],
    nextFollowUp: '',
    notes: '',
  });

  const [dailyChecked, setDailyChecked] = useState<Record<string, boolean>>(() =>
    getStoredChecklist('career_' + today())
  );

  // Sync state to storage
  useEffect(() => {
    getAllFromStore<CareerItem>('careerItems').then((savedItems) => {
      if (savedItems.length === 0) {
        // Initialize default toolkit into store
        const initial = DEFAULT_TOOLKIT.map((t) => ({
          id: nanoid(),
          type: t.type,
          title: t.title,
          description: t.description,
          status: 'todo' as const,
          updatedAt: new Date().toISOString(),
        }));
        initial.forEach((i) => saveToStore('careerItems', i));
        setItems(initial);
      } else {
        setItems(savedItems);
      }
    });

    getAllFromStore<InternshipApplication>('internshipApplications').then(setApplications);
  }, []);

  const saveRoutinesToStorage = (updated: CareerRoutineItem[]) => {
    setRoutines(updated);
    localStorage.setItem('career_routines_v2', JSON.stringify(updated));
  };

  const saveMilestonesToStorage = (updated: CareerMilestoneItem[]) => {
    setMilestones(updated);
    localStorage.setItem('career_milestones_v2', JSON.stringify(updated));
  };

  const toggleDaily = (taskId: string) => {
    setDailyChecked((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      saveStoredChecklist('career_' + today(), next);
      return next;
    });
  };

  // Skill / Toolkit Toggle
  const toggleSkillStatus = useCallback(async (item: CareerItem) => {
    const nextStatus: CareerItem['status'] = item.status === 'done' ? 'todo' : 'done';
    const updated: CareerItem = { ...item, status: nextStatus, updatedAt: new Date().toISOString() };
    await saveToStore('careerItems', updated);
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
  }, []);

  const handleSaveSkill = async () => {
    if (!skillForm.title.trim()) return;
    const now = new Date().toISOString();
    if (editingSkill) {
      const updated: CareerItem = {
        ...editingSkill,
        title: skillForm.title.trim(),
        description: skillForm.description.trim() || undefined,
        status: skillForm.status,
        updatedAt: now,
      };
      await saveToStore('careerItems', updated);
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } else {
      const newItem: CareerItem = {
        id: nanoid(),
        type: 'other',
        title: skillForm.title.trim(),
        description: skillForm.description.trim() || undefined,
        status: skillForm.status,
        updatedAt: now,
      };
      await saveToStore('careerItems', newItem);
      setItems((prev) => [...prev, newItem]);
    }
    setShowSkillModal(false);
    setEditingSkill(null);
  };

  const handleDeleteSkill = async (id: string) => {
    await deleteFromStore('careerItems', id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Routine Handler
  const handleSaveRoutine = () => {
    if (!routineForm.task.trim()) return;
    if (editingRoutine) {
      const updated = routines.map((r) =>
        r.id === editingRoutine.id ? { ...r, task: routineForm.task.trim(), time: routineForm.time.trim() } : r
      );
      saveRoutinesToStorage(updated);
    } else {
      const newRoutine: CareerRoutineItem = {
        id: nanoid(),
        task: routineForm.task.trim(),
        time: routineForm.time.trim(),
      };
      saveRoutinesToStorage([...routines, newRoutine]);
    }
    setShowRoutineModal(false);
    setEditingRoutine(null);
  };

  const handleDeleteRoutine = (id: string) => {
    saveRoutinesToStorage(routines.filter((r) => r.id !== id));
  };

  // Milestone Handler
  const handleSaveMilestone = () => {
    if (!milestoneForm.title.trim()) return;
    if (editingMilestone) {
      const updated = milestones.map((m) =>
        m.id === editingMilestone.id
          ? {
              ...m,
              title: milestoneForm.title.trim(),
              targetDate: milestoneForm.targetDate || undefined,
              isCompleted: milestoneForm.isCompleted,
            }
          : m
      );
      saveMilestonesToStorage(updated);
    } else {
      const newMilestone: CareerMilestoneItem = {
        id: nanoid(),
        title: milestoneForm.title.trim(),
        targetDate: milestoneForm.targetDate || undefined,
        isCompleted: milestoneForm.isCompleted,
      };
      saveMilestonesToStorage([...milestones, newMilestone]);
    }
    setShowMilestoneModal(false);
    setEditingMilestone(null);
  };

  const toggleMilestoneComplete = (id: string) => {
    const updated = milestones.map((m) => (m.id === id ? { ...m, isCompleted: !m.isCompleted } : m));
    saveMilestonesToStorage(updated);
  };

  const handleDeleteMilestone = (id: string) => {
    saveMilestonesToStorage(milestones.filter((m) => m.id !== id));
  };

  // Applications
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

  // Progress metrics
  const doneSkills = items.filter((i) => i.status === 'done').length;
  const skillsPct = items.length ? Math.round((doneSkills / items.length) * 100) : 0;
  const doneMilestones = milestones.filter((m) => m.isCompleted).length;

  return (
    <div className="page-container pb-safe">
      {/* Hero Header */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.04))',
          borderColor: 'rgba(245,158,11,0.25)',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <ProgressRing
          value={skillsPct}
          size={100}
          strokeWidth={10}
          color="#f59e0b"
          trackColor="rgba(245,158,11,0.12)"
          label={`${skillsPct}%`}
          sublabel="Prepared"
        />

        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Briefcase size={22} color="#f59e0b" />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{careerGoal}</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '0.5rem', lineHeight: 1.5 }}>
            {careerBio}
          </p>
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Skills & Toolkit</p>
              <p style={{ fontWeight: 800, fontSize: '1.15rem', color: '#f59e0b' }}>
                {doneSkills} / {items.length} Ready
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Milestones</p>
              <p style={{ fontWeight: 800, fontSize: '1.15rem', color: '#10b981' }}>
                {doneMilestones} / {milestones.length} Completed
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Applications</p>
              <p style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>{applications.length}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Interviews & Offers</p>
              <p style={{ fontWeight: 800, fontSize: '1.15rem', color: '#6366f1' }}>
                {applications.filter((a) => a.status === 'interviewing' || a.status === 'offered').length}
              </p>
            </div>
          </div>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => setShowManageOverview(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <Sliders size={15} /> Manage Overview
        </button>
      </div>

      {/* Career Toolkit & Skills Section */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>🛠️ Career Toolkit & Core Skills</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Click to toggle completion, or edit items to match your target role.
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setEditingSkill(null);
              setSkillForm({ title: '', description: '', status: 'todo' });
              setShowSkillModal(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
          >
            <Plus size={14} /> Add Skill / Asset
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: '0.75rem',
          }}
        >
          {items.map((t) => {
            const isDone = t.status === 'done';
            return (
              <div
                key={t.id}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '0.875rem',
                  background: isDone ? 'rgba(245,158,11,0.1)' : 'var(--bg-surface-2)',
                  border: `1px solid ${isDone ? 'rgba(245,158,11,0.35)' : 'var(--border)'}`,
                  borderRadius: '12px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                  <button
                    onClick={() => toggleSkillStatus(t)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      textAlign: 'left',
                      padding: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '6px',
                        border: `2px solid ${isDone ? '#f59e0b' : 'var(--border)'}`,
                        background: isDone ? '#f59e0b' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isDone && <Check size={12} color="white" />}
                    </div>
                    <span
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: isDone ? '#f59e0b' : 'var(--text-primary)',
                      }}
                    >
                      {t.title}
                    </span>
                  </button>

                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        setEditingSkill(t);
                        setSkillForm({ title: t.title, description: t.description || '', status: t.status });
                        setShowSkillModal(true);
                      }}
                      style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                      title="Edit"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleDeleteSkill(t.id)}
                      style={{ padding: '0.2rem', color: '#ef4444' }}
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {t.description && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '0.25rem' }}>
                    {t.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Practice Routines & Milestones (2-col grid) */}
      <div className="grid-2col" style={{ marginBottom: '1.25rem', gap: '1.25rem' }}>
        {/* Daily Career Routine */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '0.95rem' }}>⏰ Daily Career Routine</h2>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setEditingRoutine(null);
                setRoutineForm({ task: '', time: '15 min' });
                setShowRoutineModal(true);
              }}
              style={{ fontSize: '0.78rem', color: '#f59e0b', padding: '0.2rem 0.5rem' }}
            >
              <Plus size={13} /> Add Routine
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {routines.map((r) => {
              const isChecked = Boolean(dailyChecked[r.id]);
              return (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.75rem',
                    background: isChecked ? 'rgba(245,158,11,0.08)' : 'var(--bg-surface-2)',
                    borderRadius: '8px',
                    border: `1px solid ${isChecked ? 'rgba(245,158,11,0.25)' : 'transparent'}`,
                  }}
                >
                  <div
                    onClick={() => toggleDaily(r.id)}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '4px',
                      border: `2px solid ${isChecked ? '#f59e0b' : 'var(--border)'}`,
                      background: isChecked ? '#f59e0b' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                  >
                    {isChecked && <Check size={10} color="white" />}
                  </div>

                  <span
                    className="badge"
                    style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontSize: '0.72rem', flexShrink: 0 }}
                  >
                    {r.time}
                  </span>

                  <span
                    className="task-title"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: '0.84rem',
                      color: isChecked ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: isChecked ? 'line-through' : 'none',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {r.task}
                  </span>

                  <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        setEditingRoutine(r);
                        setRoutineForm({ task: r.task, time: r.time });
                        setShowRoutineModal(true);
                      }}
                      style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleDeleteRoutine(r.id)}
                      style={{ padding: '0.2rem', color: '#ef4444' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Career Milestones */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '0.95rem' }}>🎯 Key Career Milestones</h2>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setEditingMilestone(null);
                setMilestoneForm({ title: '', targetDate: '', isCompleted: false });
                setShowMilestoneModal(true);
              }}
              style={{ fontSize: '0.78rem', color: '#10b981', padding: '0.2rem 0.5rem' }}
            >
              <Plus size={13} /> Add Milestone
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {milestones.map((m) => {
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.75rem',
                    background: m.isCompleted ? 'rgba(16,185,129,0.08)' : 'var(--bg-surface-2)',
                    borderRadius: '8px',
                    border: `1px solid ${m.isCompleted ? 'rgba(16,185,129,0.25)' : 'transparent'}`,
                  }}
                >
                  <div
                    onClick={() => toggleMilestoneComplete(m.id)}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '4px',
                      border: `2px solid ${m.isCompleted ? '#10b981' : 'var(--border)'}`,
                      background: m.isCompleted ? '#10b981' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                  >
                    {m.isCompleted && <Check size={10} color="white" />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        color: m.isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: m.isCompleted ? 'line-through' : 'none',
                      }}
                    >
                      {m.title}
                    </p>
                    {m.targetDate && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Target: {m.targetDate}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        setEditingMilestone(m);
                        setMilestoneForm({ title: m.title, targetDate: m.targetDate || '', isCompleted: m.isCompleted });
                        setShowMilestoneModal(true);
                      }}
                      style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleDeleteMilestone(m.id)}
                      style={{ padding: '0.2rem', color: '#ef4444' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Internship & Job Applications */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>📨 Internship & Job Applications Pipeline</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Track applications, interview rounds, dates, and response stages.
            </p>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditingApp(null);
              setAppForm({
                company: '',
                role: '',
                link: '',
                appliedDate: today(),
                status: 'applied',
                nextFollowUp: '',
                notes: '',
              });
              setShowAppForm(true);
            }}
            style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#000', fontWeight: 700 }}
          >
            <Plus size={14} /> Add Application
          </button>
        </div>

        {applications.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <Briefcase size={32} color="var(--text-muted)" style={{ opacity: 0.5, margin: '0 auto 0.5rem' }} />
            <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>No Applications Logged Yet</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Track every company, role, recruiter contact, and follow-up date here.
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowAppForm(true)}
              style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#000', fontWeight: 700 }}
            >
              <Plus size={14} /> Add First Application
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {applications.map((app) => {
              const statusCfg = APP_STATUSES.find((s) => s.value === app.status) || APP_STATUSES[1];
              return (
                <div
                  key={app.id}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    padding: '0.85rem 1rem',
                    background: 'var(--bg-surface-2)',
                    borderRadius: '10px',
                    border: `1px solid ${statusCfg.color}25`,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{app.company}</p>
                      {app.link && (
                        <a href={app.link} target="_blank" rel="noopener noreferrer" style={{ color: '#f59e0b' }}>
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>{app.role}</p>
                    {app.notes && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        📝 {app.notes}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexShrink: 0 }}>
                    <span
                      className="badge"
                      style={{ background: `${statusCfg.color}18`, color: statusCfg.color, fontWeight: 700 }}
                    >
                      {statusCfg.label}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.appliedDate}</span>
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => {
                        setEditingApp(app);
                        setAppForm({
                          company: app.company,
                          role: app.role,
                          link: app.link ?? '',
                          appliedDate: app.appliedDate,
                          status: app.status,
                          nextFollowUp: app.nextFollowUp ?? '',
                          notes: app.notes ?? '',
                        });
                        setShowAppForm(true);
                      }}
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      style={{ color: '#ef4444' }}
                      onClick={() => deleteApp(app.id)}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Manage Overview Goal & Bio */}
      <Modal isOpen={showManageOverview} onClose={() => setShowManageOverview(false)} title="Manage Career Goals">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Primary Career Target</label>
            <input
              className="input"
              value={careerGoal}
              onChange={(e) => setCareerGoal(e.target.value)}
              placeholder="e.g. Secure Software Engineer / Full Stack Internship"
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Career Mission Statement</label>
            <textarea
              className="input"
              rows={3}
              value={careerBio}
              onChange={(e) => setCareerBio(e.target.value)}
              placeholder="Describe your positioning, key strengths, and immediate focus..."
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                localStorage.setItem('career_target_goal', careerGoal);
                localStorage.setItem('career_target_bio', careerBio);
                setShowManageOverview(false);
              }}
              style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#000', fontWeight: 700 }}
            >
              Save Overview
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Add/Edit Skill / Asset */}
      <Modal
        isOpen={showSkillModal}
        onClose={() => {
          setShowSkillModal(false);
          setEditingSkill(null);
        }}
        title={editingSkill ? 'Edit Skill / Asset' : 'Add Skill / Asset'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Skill or Asset Title *</label>
            <input
              className="input"
              placeholder="e.g. System Design, Docker & CI/CD, AWS Cloud..."
              value={skillForm.title}
              onChange={(e) => setSkillForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Description</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Key competencies, repos or evidence for this skill..."
              value={skillForm.description}
              onChange={(e) => setSkillForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Status</label>
            <select
              className="input select"
              value={skillForm.status}
              onChange={(e) => setSkillForm((f) => ({ ...f, status: e.target.value as CareerItem['status'] }))}
            >
              <option value="todo">Needs Preparation (Todo)</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Ready & Verified (Done)</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setShowSkillModal(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveSkill}
              style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#000', fontWeight: 700 }}
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Add/Edit Routine */}
      <Modal
        isOpen={showRoutineModal}
        onClose={() => {
          setShowRoutineModal(false);
          setEditingRoutine(null);
        }}
        title={editingRoutine ? 'Edit Daily Routine' : 'Add Daily Routine'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Routine Action *</label>
            <input
              className="input"
              placeholder="e.g. Check AngelList & LinkedIn for new postings"
              value={routineForm.task}
              onChange={(e) => setRoutineForm((f) => ({ ...f, task: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Target Time</label>
            <input
              className="input"
              placeholder="e.g. 15 min"
              value={routineForm.time}
              onChange={(e) => setRoutineForm((f) => ({ ...f, time: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setShowRoutineModal(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveRoutine}
              style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#000', fontWeight: 700 }}
            >
              Save Routine
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Add/Edit Milestone */}
      <Modal
        isOpen={showMilestoneModal}
        onClose={() => {
          setShowMilestoneModal(false);
          setEditingMilestone(null);
        }}
        title={editingMilestone ? 'Edit Career Milestone' : 'Add Career Milestone'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Milestone Title *</label>
            <input
              className="input"
              placeholder="e.g. Pass first technical screening interview"
              value={milestoneForm.title}
              onChange={(e) => setMilestoneForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Target Date (optional)</label>
            <input
              className="input"
              type="date"
              value={milestoneForm.targetDate}
              onChange={(e) => setMilestoneForm((f) => ({ ...f, targetDate: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="milestoneComplete"
              checked={milestoneForm.isCompleted}
              onChange={(e) => setMilestoneForm((f) => ({ ...f, isCompleted: e.target.checked }))}
            />
            <label htmlFor="milestoneComplete" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
              Mark as completed
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setShowMilestoneModal(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveMilestone}
              style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#000', fontWeight: 700 }}
            >
              Save Milestone
            </button>
          </div>
        </div>
      </Modal>

      {/* Application Form Modal */}
      <Modal
        isOpen={showAppForm}
        onClose={() => {
          setShowAppForm(false);
          setEditingApp(null);
        }}
        title={editingApp ? 'Edit Application' : 'Add Application'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div className="form-grid-2">
            <div>
              <label>Company *</label>
              <input
                className="input"
                value={appForm.company}
                onChange={(e) => setAppForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="e.g. Google"
              />
            </div>
            <div>
              <label>Role *</label>
              <input
                className="input"
                value={appForm.role}
                onChange={(e) => setAppForm((f) => ({ ...f, role: e.target.value }))}
                placeholder="e.g. Software Engineer Intern"
              />
            </div>
          </div>
          <div>
            <label>Job Link (optional)</label>
            <input
              className="input"
              value={appForm.link}
              onChange={(e) => setAppForm((f) => ({ ...f, link: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="form-grid-3">
            <div>
              <label>Applied Date</label>
              <input
                type="date"
                className="input"
                value={appForm.appliedDate}
                onChange={(e) => setAppForm((f) => ({ ...f, appliedDate: e.target.value }))}
              />
            </div>
            <div>
              <label>Status</label>
              <select
                className="input select"
                value={appForm.status}
                onChange={(e) => setAppForm((f) => ({ ...f, status: e.target.value as InternshipApplication['status'] }))}
              >
                {APP_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Follow-Up Date</label>
              <input
                type="date"
                className="input"
                value={appForm.nextFollowUp}
                onChange={(e) => setAppForm((f) => ({ ...f, nextFollowUp: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label>Notes</label>
            <textarea
              className="input"
              style={{ minHeight: '60px' }}
              value={appForm.notes}
              onChange={(e) => setAppForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Contact person, requirements, interview rounds…"
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowAppForm(false);
                setEditingApp(null);
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={saveApp}
              style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#000', fontWeight: 700 }}
            >
              {editingApp ? 'Save Changes' : 'Add Application'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
