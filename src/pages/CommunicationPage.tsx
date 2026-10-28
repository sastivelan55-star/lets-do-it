import { useState, useMemo } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Search,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Sparkles,
} from 'lucide-react';
import Modal from '../components/ui/Modal';
import ProgressRing from '../components/ui/ProgressRing';
import { useApp } from '../context/AppContext';
import type { CommunicationSession } from '../types';
import { today } from '../utils/dates';

const ACTIVITY_TYPES: { value: CommunicationSession['activityType']; label: string; color: string }[] = [
  { value: 'speaking', label: 'Speaking Practice', color: '#06b6d4' },
  { value: 'presentation', label: 'Presentation', color: '#8b5cf6' },
  { value: 'discussion', label: 'Group Discussion', color: '#6366f1' },
  { value: 'interview', label: 'Interview Prep', color: '#f59e0b' },
  { value: 'vocabulary', label: 'Vocabulary & Phrases', color: '#10b981' },
  { value: 'listening', label: 'Listening & Comprehension', color: '#3b82f6' },
  { value: 'writing', label: 'Writing & Email', color: '#ec4899' },
  { value: 'other', label: 'Other Exercise', color: '#64748b' },
];

const ATTENDANCE_STATUSES: { value: CommunicationSession['attendanceStatus']; label: string; color: string }[] = [
  { value: 'attended', label: 'Attended', color: '#10b981' },
  { value: 'present', label: 'Present', color: '#10b981' },
  { value: 'missed', label: 'Missed', color: '#ef4444' },
  { value: 'excused', label: 'Excused', color: '#94a3b8' },
];

const COMPLETION_STATUSES: { value: CommunicationSession['completionStatus']; label: string; color: string }[] = [
  { value: 'completed', label: 'Completed', color: '#10b981' },
  { value: 'in-progress', label: 'In Progress', color: '#f59e0b' },
  { value: 'partial', label: 'Partial', color: '#94a3b8' },
];

interface SessionFormData {
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  activityType: CommunicationSession['activityType'];
  topic: string;
  description: string;
  notes: string;
  attendanceStatus: CommunicationSession['attendanceStatus'];
  completionStatus: CommunicationSession['completionStatus'];
}

const DEFAULT_FORM: SessionFormData = {
  date: today(),
  startTime: '09:00',
  endTime: '09:30',
  durationMinutes: 30,
  activityType: 'speaking',
  topic: '',
  description: '',
  notes: '',
  attendanceStatus: 'attended',
  completionStatus: 'completed',
};

export default function CommunicationPage() {
  const { communicationSessions, addCommunicationSession, updateCommunicationSession, removeCommunicationSession } =
    useApp();

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<CommunicationSession | null>(null);
  const [form, setForm] = useState<SessionFormData>(DEFAULT_FORM);
  const [sessionToDelete, setSessionToDelete] = useState<CommunicationSession | null>(null);
  const [isManageGoalsOpen, setIsManageGoalsOpen] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAttendance, setSelectedAttendance] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);

  // Goal settings (stored in localStorage for fast personal customization)
  const [weeklyGoalMinutes, setWeeklyGoalMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('comm_weekly_goal');
    return saved ? Number(saved) : 210; // 30 min/day * 7 = 210 min
  });
  const [focusAreaTitle, setFocusAreaTitle] = useState<string>(() => {
    return localStorage.getItem('comm_focus_title') || 'Clear & Confident Professional English';
  });

  // Calculate Duration automatically from start and end times if both provided
  const updateTimes = (startTime: string, endTime: string) => {
    if (startTime && endTime) {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
        const startTotal = sh * 60 + sm;
        const endTotal = eh * 60 + em;
        if (endTotal > startTotal) {
          setForm((f) => ({ ...f, startTime, endTime, durationMinutes: endTotal - startTotal }));
          return;
        }
      }
    }
    setForm((f) => ({ ...f, startTime, endTime }));
  };

  // Open modal for creating
  const handleOpenCreate = () => {
    setEditingSession(null);
    setForm({
      ...DEFAULT_FORM,
      date: today(),
    });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (session: CommunicationSession) => {
    setEditingSession(session);
    setForm({
      date: session.date,
      startTime: session.startTime || '09:00',
      endTime: session.endTime || '09:30',
      durationMinutes: session.durationMinutes || 30,
      activityType: session.activityType,
      topic: session.topic,
      description: session.description || '',
      notes: session.notes || '',
      attendanceStatus: session.attendanceStatus,
      completionStatus: session.completionStatus,
    });
    setIsModalOpen(true);
  };

  // Save Session (Create or Update)
  const handleSaveSession = async () => {
    if (!form.topic.trim()) return;
    setIsSaving(true);
    try {
      if (editingSession) {
        await updateCommunicationSession({
          ...editingSession,
          date: form.date,
          startTime: form.startTime || undefined,
          endTime: form.endTime || undefined,
          durationMinutes: Math.max(1, form.durationMinutes),
          activityType: form.activityType,
          topic: form.topic.trim(),
          description: form.description.trim() || undefined,
          notes: form.notes.trim() || undefined,
          attendanceStatus: form.attendanceStatus,
          completionStatus: form.completionStatus,
        });
      } else {
        await addCommunicationSession({
          date: form.date,
          startTime: form.startTime || undefined,
          endTime: form.endTime || undefined,
          durationMinutes: Math.max(1, form.durationMinutes),
          activityType: form.activityType,
          topic: form.topic.trim(),
          description: form.description.trim() || undefined,
          notes: form.notes.trim() || undefined,
          attendanceStatus: form.attendanceStatus,
          completionStatus: form.completionStatus,
        });
      }
      setIsModalOpen(false);
      setEditingSession(null);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Session
  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    await removeCommunicationSession(sessionToDelete.id);
    setSessionToDelete(null);
  };

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return communicationSessions
      .filter((s) => {
        if (selectedType !== 'all' && s.activityType !== selectedType) return false;
        if (selectedAttendance !== 'all' && s.attendanceStatus !== selectedAttendance) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTopic = s.topic.toLowerCase().includes(q);
          const matchesNotes = s.notes ? s.notes.toLowerCase().includes(q) : false;
          const matchesDesc = s.description ? s.description.toLowerCase().includes(q) : false;
          if (!matchesTopic && !matchesNotes && !matchesDesc) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [communicationSessions, selectedType, selectedAttendance, searchQuery]);

  // Statistics
  const totalMinutes = useMemo(() => {
    return communicationSessions
      .filter((s) => s.attendanceStatus === 'attended' || s.attendanceStatus === 'present')
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  }, [communicationSessions]);

  const totalSessions = communicationSessions.length;

  const attendanceRate = useMemo(() => {
    if (totalSessions === 0) return 100;
    const attendedCount = communicationSessions.filter(
      (s) => s.attendanceStatus === 'attended' || s.attendanceStatus === 'present'
    ).length;
    return Math.round((attendedCount / totalSessions) * 100);
  }, [communicationSessions, totalSessions]);

  const weeklyProgressPct = Math.min(Math.round((totalMinutes / Math.max(1, weeklyGoalMinutes)) * 100), 100);

  return (
    <div className="page-container pb-safe">
      {/* Hero Header */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(99,102,241,0.06))',
          borderColor: 'rgba(6,182,212,0.25)',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <ProgressRing
          value={weeklyProgressPct}
          size={100}
          strokeWidth={10}
          color="#06b6d4"
          trackColor="rgba(6,182,212,0.12)"
          label={`${weeklyProgressPct}%`}
          sublabel="Goal Met"
        />

        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <MessageSquare size={22} color="#06b6d4" />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Communication & Attendance Tracker</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Focus: <strong style={{ color: '#06b6d4' }}>{focusAreaTitle}</strong>
          </p>
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Practice</p>
              <p style={{ fontWeight: 800, fontSize: '1.15rem', color: '#06b6d4' }}>
                {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sessions Recorded</p>
              <p style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>{totalSessions}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Attendance Rate</p>
              <p
                style={{
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  color: attendanceRate >= 80 ? '#10b981' : '#f59e0b',
                }}
              >
                {attendanceRate}%
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Target Weekly</p>
              <p style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-secondary)' }}>
                {Math.round(weeklyGoalMinutes / 60)} hrs
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setIsManageGoalsOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Sliders size={15} /> Manage
          </button>
          <button
            className="btn btn-primary"
            onClick={handleOpenCreate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              background: '#06b6d4',
              borderColor: '#06b6d4',
              color: '#fff',
            }}
          >
            <Plus size={16} /> Record Session
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div
        className="card"
        style={{
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 200 }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            className="input"
            type="text"
            placeholder="Search sessions by topic or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="input select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
          >
            <option value="all">All Activities</option>
            {ACTIVITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            className="input select"
            value={selectedAttendance}
            onChange={(e) => setSelectedAttendance(e.target.value)}
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
          >
            <option value="all">All Attendance</option>
            {ATTENDANCE_STATUSES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sessions List */}
      {filteredSessions.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredSessions.map((session) => {
            const activityConfig =
              ACTIVITY_TYPES.find((t) => t.value === session.activityType) || ACTIVITY_TYPES[0];
            const attendanceConfig =
              ATTENDANCE_STATUSES.find((a) => a.value === session.attendanceStatus) || ATTENDANCE_STATUSES[0];
            const isMissed = session.attendanceStatus === 'missed';

            return (
              <div
                key={session.id}
                className="card"
                style={{
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  borderLeft: `4px solid ${isMissed ? '#ef4444' : activityConfig.color}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 260 }}>
                  {/* Meta tags row */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: `${activityConfig.color}18`,
                        color: activityConfig.color,
                      }}
                    >
                      {activityConfig.label}
                    </span>

                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: `${attendanceConfig.color}15`,
                        color: attendanceConfig.color,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      {isMissed ? <AlertCircle size={11} /> : <CheckCircle2 size={11} />}
                      {attendanceConfig.label}
                    </span>

                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={12} /> {session.date}
                    </span>

                    {session.startTime && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} /> {session.startTime}
                        {session.endTime ? ` - ${session.endTime}` : ''}
                      </span>
                    )}

                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#06b6d4',
                        background: 'rgba(6,182,212,0.1)',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                      }}
                    >
                      {session.durationMinutes} min
                    </span>
                  </div>

                  {/* Topic Title */}
                  <h3
                    style={{
                      fontSize: '0.98rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: session.description || session.notes ? '0.35rem' : '0',
                    }}
                  >
                    {session.topic}
                  </h3>

                  {/* Description */}
                  {session.description && (
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', lineHeight: 1.5 }}>
                      {session.description}
                    </p>
                  )}

                  {/* Notes */}
                  {session.notes && (
                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        fontStyle: 'italic',
                        background: 'var(--bg-surface-2)',
                        padding: '0.35rem 0.6rem',
                        borderRadius: '6px',
                        display: 'inline-block',
                        marginTop: '0.3rem',
                      }}
                    >
                      💡 {session.notes}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0 }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => handleOpenEdit(session)}
                    title="Edit Session"
                    style={{ padding: '0.35rem 0.55rem', color: 'var(--text-secondary)' }}
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setSessionToDelete(session)}
                    title="Delete Session"
                    style={{ padding: '0.35rem 0.55rem', color: '#ef4444' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <MessageSquare size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>No Practice Sessions Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem', maxWidth: 400, margin: '0 auto 1.25rem' }}>
            {searchQuery || selectedType !== 'all' || selectedAttendance !== 'all'
              ? 'Try adjusting your filters or search query.'
              : 'Start logging your speaking practice, presentations, and group discussions to build consistent communication mastery.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={handleOpenCreate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#06b6d4',
              borderColor: '#06b6d4',
              color: '#fff',
            }}
          >
            <Plus size={16} /> Record Your First Session
          </button>
        </div>
      )}

      {/* Create / Edit Session Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSession ? 'Edit Practice Session' : 'Record Practice & Attendance'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div className="grid-2col" style={{ gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Date</label>
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Activity Type</label>
              <select
                className="input select"
                value={form.activityType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    activityType: e.target.value as CommunicationSession['activityType'],
                  }))
                }
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Topic / Session Title *</label>
            <input
              className="input"
              placeholder="e.g. System Design presentation rehearsal, 1-on-1 speaking practice..."
              value={form.topic}
              onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
            />
          </div>

          <div className="grid-3col" style={{ gap: '0.6rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Start Time</label>
              <input
                className="input"
                type="time"
                value={form.startTime}
                onChange={(e) => updateTimes(e.target.value, form.endTime)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>End Time</label>
              <input
                className="input"
                type="time"
                value={form.endTime}
                onChange={(e) => updateTimes(form.startTime, e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Duration (min)</label>
              <input
                className="input"
                type="number"
                min={1}
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) || 30 }))}
              />
            </div>
          </div>

          <div className="grid-2col" style={{ gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Attendance Status</label>
              <select
                className="input select"
                value={form.attendanceStatus}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    attendanceStatus: e.target.value as CommunicationSession['attendanceStatus'],
                  }))
                }
              >
                {ATTENDANCE_STATUSES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Completion Status</label>
              <select
                className="input select"
                value={form.completionStatus}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    completionStatus: e.target.value as CommunicationSession['completionStatus'],
                  }))
                }
              >
                {COMPLETION_STATUSES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Description / What did you practice?</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Key concepts discussed, partner or platform used, agenda..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Notes & Feedback (optional)</label>
            <textarea
              className="input"
              rows={2}
              placeholder="New vocabulary learned, pronunciation tips, areas for improvement..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveSession}
              disabled={isSaving || !form.topic.trim()}
              style={{ background: '#06b6d4', borderColor: '#06b6d4', color: '#fff' }}
            >
              {isSaving ? 'Saving...' : editingSession ? 'Update Session' : 'Save Session'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Manage Goals Modal */}
      <Modal isOpen={isManageGoalsOpen} onClose={() => setIsManageGoalsOpen(false)} title="Manage Communication Goals">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Current Focus Goal</label>
            <input
              className="input"
              value={focusAreaTitle}
              onChange={(e) => setFocusAreaTitle(e.target.value)}
              placeholder="e.g. Clear & Confident Professional English"
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Displayed prominently on your communication tracking dashboard.
            </p>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Weekly Target (minutes)</label>
            <input
              className="input"
              type="number"
              min={15}
              step={15}
              value={weeklyGoalMinutes}
              onChange={(e) => setWeeklyGoalMinutes(Number(e.target.value) || 210)}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Equivalent to {Math.round(weeklyGoalMinutes / 60)} hours per week (recommended: 210 min = 30m/day).
            </p>
          </div>

          <div
            style={{
              padding: '0.75rem',
              background: 'rgba(6,182,212,0.06)',
              borderRadius: '8px',
              border: '1px solid rgba(6,182,212,0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
              <Sparkles size={14} color="#06b6d4" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#06b6d4' }}>Recommended Routine</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              • 15 mins daily speaking aloud on technical topics
              <br />
              • 15 mins active listening or mock interview answers
              <br />• 1 weekly presentation or group discussion practice
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                localStorage.setItem('comm_focus_title', focusAreaTitle);
                localStorage.setItem('comm_weekly_goal', String(weeklyGoalMinutes));
                setIsManageGoalsOpen(false);
              }}
              style={{ background: '#06b6d4', borderColor: '#06b6d4', color: '#fff' }}
            >
              Save Goals
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(sessionToDelete)}
        onClose={() => setSessionToDelete(null)}
        title="Delete Practice Session"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Are you sure you want to delete the session <strong>"{sessionToDelete?.topic}"</strong> recorded on{' '}
            {sessionToDelete?.date}?
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setSessionToDelete(null)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleConfirmDelete}
              style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}
            >
              Delete Session
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
