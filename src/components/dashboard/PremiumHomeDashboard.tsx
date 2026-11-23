// Life OS — Premium Home Productivity Dashboard
// Streamlined layout: Today's Missions on the left, Quick Actions, Calendar,
// Upcoming Tasks, and Recent Activity on the right.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  Star,
  Plus,
  ArrowRight,
  Check,
  Edit3,
  ListTodo,
  FolderPlus,
  UploadCloud,
  BarChart2,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  subDays,
} from 'date-fns';
import { useDailyExecution } from '../../hooks/useDailyExecution';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { today, formatDateLong, getGreeting, formatTime } from '../../utils/dates';
import { ALL_CHARACTERS } from '../../data/animeCharacters';
import type { Task, DailyTaskOccurrence, DailyTaskCompletion, TaskPriority } from '../../types';
import { getOverdueTasksForDate } from '../../services/occurrenceEngine';
import FloatingTimePicker, { type TimePickerResult } from '../common/FloatingTimePicker';

// ─── Theme & Styling Constants ───────────────────────────────────────────────

const GLASS_CARD: React.CSSProperties = {
  background: 'rgba(19, 13, 38, 0.85)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderRadius: '20px',
  border: '1px solid rgba(168, 85, 247, 0.2)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
  padding: '1.25rem',
  position: 'relative',
  overflow: 'hidden',
};

// Category Tag Colors matching the reference design
const CATEGORY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  habit: { bg: 'rgba(16, 185, 129, 0.18)', color: '#34d399', border: 'rgba(16, 185, 129, 0.4)' },
  health: { bg: 'rgba(16, 185, 129, 0.18)', color: '#34d399', border: 'rgba(16, 185, 129, 0.4)' },
  study: { bg: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.45)' },
  work: { bg: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.45)' },
  career: { bg: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.45)' },
  technical: { bg: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.45)' },
  personal: { bg: 'rgba(236, 72, 153, 0.2)', color: '#f472b6', border: 'rgba(236, 72, 153, 0.45)' },
  default: { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' },
};

function getCategoryBadge(area?: string) {
  const key = (area || 'default').toLowerCase();
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
}

interface PremiumHomeDashboardProps {
  onNavigateSection?: (section: string) => void;
  onOpenQuickCapture?: () => void;
  onOpenSearch?: () => void;
  onOpenTimetable?: () => void;
  onOpenTaskBuilder?: () => void;
}

export default function PremiumHomeDashboard({
  onNavigateSection,
  onOpenQuickCapture,
  onOpenSearch: _onOpenSearch,
  onOpenTimetable: _onOpenTimetable,
  onOpenTaskBuilder: _onOpenTaskBuilder,
}: PremiumHomeDashboardProps) {
  const { user } = useAuth();
  const { tasks, settings, updateTask, addTask, batchUpdateTasks } = useApp();

  // Selected date state (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(today());
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => parseISO(today()));

  // Today's Missions Filter ('all' | 'pending' | 'completed')
  const [missionsFilter, setMissionsFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Quick inline add mission input
  const [inlineNewTaskTitle, setInlineNewTaskTitle] = useState('');
  const [isSubmittingInline, setIsSubmittingInline] = useState(false);
  const [isCarryingForward, setIsCarryingForward] = useState(false);

  // Floating time picker popover state
  const [timePickerTask, setTimePickerTask] = useState<DailyTaskOccurrence | Task | null>(null);
  const [timePickerAnchor, setTimePickerAnchor] = useState<HTMLElement | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Daily Execution engine hook for the selected date
  const { occurrences, toggleCompletion } = useDailyExecution(selectedDate);

  // Active user name and greeting
  const greeting = useMemo(() => getGreeting(), []);
  const userName = useMemo(() => {
    return settings.displayName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Sastivelan';
  }, [settings.displayName, user]);

  // Active Anime Character Companion avatar
  const activeAvatar = useMemo(() => {
    const charId = settings.personalization?.activeCharacterId || 'nami';
    const found = ALL_CHARACTERS.find((c) => c.id === charId);
    return (
      found?.avatarUrl ||
      found?.artworkUrl ||
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80'
    );
  }, [settings.personalization?.activeCharacterId]);

  // Toast feedback helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // ─── OVERDUE TASKS & ACTIVE MISSIONS MERGE ─────────────────────────────────

  // Overdue tasks from previous days to avoid hidden tasks
  const overdueTasks = useMemo(() => {
    return getOverdueTasksForDate(tasks, selectedDate);
  }, [tasks, selectedDate]);

  // Fast lookup set of overdue task IDs
  const overdueTaskIdSet = useMemo(() => {
    return new Set(overdueTasks.map((t) => t.id));
  }, [overdueTasks]);

  // All missions for selected date:
  // When viewing today, automatically include any pending overdue missions from previous days
  // so the user never sees an empty "0 of 0 completed" when there are pending missions waiting!
  const allMissions = useMemo(() => {
    if (selectedDate === today() && overdueTasks.length > 0) {
      const occurrenceTaskIds = new Set(occurrences.map((o) => o.taskId));
      const overdueOccurrences: DailyTaskOccurrence[] = overdueTasks
        .filter((t) => !occurrenceTaskIds.has(t.id))
        .map((t) => ({
          taskId: t.id,
          title: t.title,
          lifeArea: t.lifeArea,
          priority: t.priority,
          recurring: t.recurring,
          startTime: t.startTime,
          endTime: t.endTime,
          estimatedMinutes: t.estimatedMinutes,
          notes: t.notes,
          projectId: t.projectId,
          occurrenceDate: selectedDate,
          isCompleted: t.status === 'completed',
          completedAt: t.completedAt,
          originalTask: t,
        }));
      return [...occurrences, ...overdueOccurrences];
    }
    return occurrences;
  }, [occurrences, overdueTasks, selectedDate]);

  // Completed tasks count for the selected date
  const completedCount = useMemo(() => {
    return allMissions.filter((o) => o.isCompleted).length;
  }, [allMissions]);

  // ─── TODAY'S MISSIONS LIST & FILTERS ───────────────────────────────────────

  const filteredMissions = useMemo(() => {
    if (missionsFilter === 'completed') {
      return allMissions.filter((o) => o.isCompleted);
    }
    if (missionsFilter === 'pending') {
      return allMissions.filter((o) => !o.isCompleted);
    }
    return allMissions;
  }, [allMissions, missionsFilter]);

  // Handle carry forward all overdue tasks to selected date using batchUpdateTasks
  const handleCarryForwardAll = async () => {
    if (overdueTasks.length === 0 || isCarryingForward) return;
    setIsCarryingForward(true);
    try {
      const updatedList: Task[] = overdueTasks.map((t) => ({
        ...t,
        targetDate: selectedDate,
        dueDate: selectedDate,
        scheduledDate: selectedDate,
        rescheduledFrom: t.scheduledDate || t.targetDate || t.dueDate,
        rescheduledTo: selectedDate,
        updatedAt: new Date().toISOString(),
      }));

      await batchUpdateTasks(updatedList);
      showToast(`Carried forward ${updatedList.length} missions to today! 🚀`);
    } catch {
      showToast('Failed to carry forward missions');
    } finally {
      setIsCarryingForward(false);
    }
  };

  // Inline Quick Add Mission
  const handleInlineAddMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineNewTaskTitle.trim() || isSubmittingInline) return;

    setIsSubmittingInline(true);
    try {
      await addTask({
        title: inlineNewTaskTitle.trim(),
        lifeArea: 'technical',
        priority: 'medium',
        status: 'not-started',
        dueDate: selectedDate,
        targetDate: selectedDate,
        scheduledDate: selectedDate,
        recurring: 'none',
      });
      setInlineNewTaskTitle('');
      showToast('New mission added! ✨');
    } catch {
      showToast('Failed to add mission');
    } finally {
      setIsSubmittingInline(false);
    }
  };

  // ─── CACHED COMPLETIONS FOR CALENDAR DOT INDICATORS ────────────────────────
  const [allCompletions, setAllCompletions] = useState<DailyTaskCompletion[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lifeos.daily_task_completions.v1');
      if (raw) {
        setAllCompletions(JSON.parse(raw));
      }
    } catch {}
  }, [occurrences]);

  // ─── COMPACT MONTHLY CALENDAR WIDGET ───────────────────────────────────────

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  // Map of date strings that have tasks or completed tasks for calendar dot indicators
  const dateTaskIndicators = useMemo(() => {
    const hasTasks = new Set<string>();
    const hasCompleted = new Set<string>();

    for (const t of tasks) {
      if (t.isDeleted) continue;
      const d = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
      if (d) {
        hasTasks.add(d);
        if (t.status === 'completed') {
          hasCompleted.add(d);
        }
      }
    }

    for (const c of allCompletions) {
      if (c.isCompleted) {
        hasCompleted.add(c.occurrenceDate.slice(0, 10));
      }
    }

    return { hasTasks, hasCompleted };
  }, [tasks, allCompletions]);

  // ─── UPCOMING TASKS ────────────────────────────────────────────────────────

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (t.isDeleted || t.status === 'completed') return false;
        if (t.recurring && t.recurring !== 'none') return false;
        const taskDate = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
        return taskDate > selectedDate;
      })
      .sort((a, b) => {
        const da = (a.scheduledDate || a.targetDate || a.dueDate || '').slice(0, 10);
        const db = (b.scheduledDate || b.targetDate || b.dueDate || '').slice(0, 10);
        return da.localeCompare(db);
      })
      .slice(0, 4);
  }, [tasks, selectedDate]);

  // ─── RECENT ACTIVITY FEED ──────────────────────────────────────────────────

  const recentActivities = useMemo(() => {
    type ActivityItem = {
      id: string;
      action: 'completed' | 'added' | 'updated';
      title: string;
      timestamp: string;
      timeDisplay: string;
      color: string;
      icon: React.ReactNode;
    };

    const items: ActivityItem[] = [];

    // Completed tasks
    for (const t of tasks) {
      if (t.completedAt) {
        items.push({
          id: `comp-${t.id}`,
          action: 'completed',
          title: t.title,
          timestamp: t.completedAt,
          timeDisplay: formatRelativeTime(t.completedAt),
          color: '#10b981',
          icon: <Check size={13} color="#10b981" />,
        });
      }
    }

    // Recently added tasks
    for (const t of tasks) {
      if (t.createdAt && t.createdAt !== t.completedAt) {
        items.push({
          id: `add-${t.id}`,
          action: 'added',
          title: t.title,
          timestamp: t.createdAt,
          timeDisplay: formatRelativeTime(t.createdAt),
          color: '#c084fc',
          icon: <Plus size={13} color="#c084fc" />,
        });
      }
    }

    // Recently updated tasks
    for (const t of tasks) {
      if (t.updatedAt && t.updatedAt !== t.createdAt && t.updatedAt !== t.completedAt) {
        items.push({
          id: `upd-${t.id}`,
          action: 'updated',
          title: t.title,
          timestamp: t.updatedAt,
          timeDisplay: formatRelativeTime(t.updatedAt),
          color: '#38bdf8',
          icon: <Edit3 size={13} color="#38bdf8" />,
        });
      }
    }

    return items
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 3);
  }, [tasks]);

  function formatRelativeTime(isoStr: string): string {
    try {
      const d = parseISO(isoStr);
      const isToday = isSameDay(d, new Date());
      const isYest = isSameDay(d, subDays(new Date(), 1));
      const timeStr = format(d, 'h:mm a');
      if (isToday) return `Today • ${timeStr}`;
      if (isYest) return `Yesterday • ${timeStr}`;
      return `${format(d, 'MMM d')} • ${timeStr}`;
    } catch {
      return 'Recently';
    }
  }

  // Helper to get priority badge styling
  const getPriorityBadgeStyle = (priority?: TaskPriority) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.45)' };
      case 'medium':
        return { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.45)' };
      default:
        return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: 'rgba(16, 185, 129, 0.45)' };
    }
  };

  return (
    <div
      className="home-dashboard"
      style={{
        minHeight: 0,
        background: '#090514',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        padding: '1.25rem clamp(1rem, 2.5vw, 2.5rem)',
        maxWidth: '1680px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* Toast Notification Pill */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 999999,
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.95), rgba(56, 189, 248, 0.95))',
            color: '#fff',
            padding: '8px 18px',
            borderRadius: '999px',
            fontSize: '0.84rem',
            fontWeight: 700,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <Sparkles size={15} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── WELCOME HEADER ROW ──────────────────────────────────────────────── */}
      <div
        className="home-welcome"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* Left: Companion Avatar & Warm Greeting */}
        <div className="home-greeting" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              position: 'relative',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              padding: '3px',
              background: 'linear-gradient(135deg, #a855f7, #38bdf8)',
              boxShadow: '0 0 24px rgba(168, 85, 247, 0.45)',
              flexShrink: 0,
            }}
          >
            <img
              src={activeAvatar}
              alt="Companion"
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
                background: '#120c26',
              }}
            />
          </div>

          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(1.35rem, 2.5vw, 1.85rem)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {greeting}, {userName}!
            </h1>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '0.88rem',
                color: '#c084fc',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>Let's make today productive and meaningful.</span>
              <span>✨</span>
            </p>
          </div>
        </div>

        {/* Right: Active Date Pill (when inspecting non-today dates from calendar) */}
        {selectedDate !== today() && (
          <button
            type="button"
            onClick={() => {
              setSelectedDate(today());
              setCalendarMonth(parseISO(today()));
              showToast('Returned to Today');
            }}
            style={{
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: '999px',
              padding: '6px 14px',
              color: '#c084fc',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Click to reset view back to today"
          >
            <RotateCcw size={14} />
            <span>Viewing {format(parseISO(selectedDate), 'MMM d, yyyy')} • Return to Today</span>
          </button>
        )}
      </div>

      {/* ─── MAIN TWO-COLUMN DASHBOARD GRID ──────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.75fr) minmax(320px, 1fr)',
          gap: '1.5rem',
          alignItems: 'start',
        }}
        className="premium-dashboard-grid"
      >
        {/* ─── LEFT COLUMN: ONLY TODAY'S MISSIONS ───────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={GLASS_CARD}>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34d399',
                  }}
                >
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Today's Missions</span>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
                      • {formatDateLong(selectedDate)}
                    </span>
                  </h3>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const next = missionsFilter === 'all' ? 'pending' : missionsFilter === 'pending' ? 'completed' : 'all';
                    setMissionsFilter(next);
                    showToast(`Showing ${next} missions`);
                  }}
                  title="Click to filter (all / pending / completed)"
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '0.74rem',
                    color: '#34d399',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {completedCount} of {allMissions.length} completed
                  {missionsFilter !== 'all' && ` (${missionsFilter})`}
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateSection && onNavigateSection('tasks')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#c084fc',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <span>View All</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* Overdue Banner if prior tasks are pending */}
            {overdueTasks.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  marginBottom: '0.85rem',
                  fontSize: '0.78rem',
                }}
              >
                <span style={{ color: '#fca5a5', fontWeight: 600 }}>
                  ⚠ You have {overdueTasks.length} pending missions from previous days.
                </span>
                <button
                  type="button"
                  onClick={handleCarryForwardAll}
                  disabled={isCarryingForward}
                  style={{
                    background: isCarryingForward ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.25)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    cursor: isCarryingForward ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {isCarryingForward ? 'Carrying Forward...' : 'Carry Forward All'}
                </button>
              </div>
            )}

            {/* Mission Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredMissions.length > 0 ? (
                filteredMissions.map((occ) => {
                  const cat = getCategoryBadge(occ.lifeArea);
                  const isDone = Boolean(occ.isCompleted);

                  return (
                    <div
                      key={occ.taskId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.07)',
                        gap: '10px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {/* Left: Checkbox + Title */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <button
                          type="button"
                          onClick={() => toggleCompletion(occ.taskId, isDone)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            color: isDone ? '#10b981' : 'rgba(255, 255, 255, 0.35)',
                            display: 'flex',
                            flexShrink: 0,
                          }}
                          title={isDone ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {isDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                        </button>

                        <span
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            color: isDone ? '#94a3b8' : '#ffffff',
                            textDecoration: isDone ? 'line-through' : 'none',
                            wordBreak: 'break-word',
                          }}
                        >
                          {occ.title}
                        </span>
                      </div>

                      {/* Right: Badges & Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        {overdueTaskIdSet.has(occ.taskId) && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              background: 'rgba(239, 68, 68, 0.18)',
                              color: '#f87171',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                            }}
                          >
                            Overdue
                          </span>
                        )}

                        {occ.priority && (occ.priority === 'high' || occ.priority === 'critical') && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              textTransform: 'capitalize',
                              ...getPriorityBadgeStyle(occ.priority),
                            }}
                          >
                            {occ.priority}
                          </span>
                        )}

                        {occ.lifeArea && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              textTransform: 'capitalize',
                              background: cat.bg,
                              color: cat.color,
                              border: `1px solid ${cat.border}`,
                            }}
                          >
                            {occ.lifeArea}
                          </span>
                        )}

                        {occ.startTime && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: '#cbd5e1',
                              background: 'rgba(255, 255, 255, 0.05)',
                              padding: '2px 6px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <Clock size={10} color="#c084fc" />
                            {formatTime(occ.startTime)}
                          </span>
                        )}

                        {/* Set Time Trigger */}
                        <button
                          type="button"
                          onClick={(e) => {
                            setTimePickerAnchor(e.currentTarget);
                            setTimePickerTask(occ);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                          }}
                          title="Set Time"
                        >
                          <Clock size={14} />
                        </button>

                        {/* Star Toggle */}
                        <button
                          type="button"
                          onClick={async () => {
                            if (occ.originalTask) {
                              await updateTask({
                                ...occ.originalTask,
                                isStarred: !occ.originalTask.isStarred,
                              });
                            }
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '4px',
                            color: occ.originalTask?.isStarred ? '#eab308' : 'rgba(255, 255, 255, 0.25)',
                            cursor: 'pointer',
                            display: 'flex',
                          }}
                        >
                          <Star size={15} fill={occ.originalTask?.isStarred ? '#eab308' : 'none'} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                  No missions scheduled for this date. Add one below!
                </div>
              )}
            </div>

            {/* Quick Inline Add Mission Row */}
            <form
              onSubmit={handleInlineAddMission}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '1.25rem',
                padding: '6px 12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(168, 85, 247, 0.2)',
              }}
            >
              <Plus size={16} color="#c084fc" />
              <input
                type="text"
                value={inlineNewTaskTitle}
                onChange={(e) => setInlineNewTaskTitle(e.target.value)}
                placeholder="+ Add new mission for today... (Press Enter)"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  flex: 1,
                }}
              />
              <button
                type="submit"
                disabled={!inlineNewTaskTitle.trim()}
                style={{
                  background: inlineNewTaskTitle.trim() ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '5px 14px',
                  color: '#fff',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: inlineNewTaskTitle.trim() ? 'pointer' : 'default',
                }}
              >
                Add
              </button>
            </form>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: UTILITY PANELS (Quick Actions, Calendar, Upcoming, Recent) ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* ── 1. QUICK ACTIONS (6 Grid Buttons) ── */}
          <div style={GLASS_CARD}>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.85rem' }}>
              Quick Actions
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
              }}
            >
              {/* Button 1: New Task */}
              <button
                type="button"
                onClick={() => (onOpenQuickCapture ? onOpenQuickCapture() : onNavigateSection && onNavigateSection('tasks'))}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.75rem 0.5rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  color: '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(168, 85, 247, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c084fc',
                  }}
                >
                  <Plus size={16} />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>New Task</span>
              </button>

              {/* Button 2: Go to Calendar */}
              <button
                type="button"
                onClick={() => onNavigateSection && onNavigateSection('calendar')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.75rem 0.5rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  color: '#f8fafc',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(168, 85, 247, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c084fc',
                  }}
                >
                  <CalendarIcon size={16} />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Go to Calendar</span>
              </button>

              {/* Button 3: Add List */}
              <button
                type="button"
                onClick={() => onNavigateSection && onNavigateSection('tasks')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.75rem 0.5rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  color: '#f8fafc',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(168, 85, 247, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c084fc',
                  }}
                >
                  <ListTodo size={16} />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Add List</span>
              </button>

              {/* Button 4: Browse Templates */}
              <button
                type="button"
                onClick={() => onNavigateSection && onNavigateSection('projects')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.75rem 0.5rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  color: '#f8fafc',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(168, 85, 247, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c084fc',
                  }}
                >
                  <FolderPlus size={16} />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Browse Templates</span>
              </button>

              {/* Button 5: Import Tasks */}
              <button
                type="button"
                onClick={() => onNavigateSection && onNavigateSection('vault')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.75rem 0.5rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  color: '#f8fafc',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(168, 85, 247, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c084fc',
                  }}
                >
                  <UploadCloud size={16} />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Import Tasks</span>
              </button>

              {/* Button 6: View Stats */}
              <button
                type="button"
                onClick={() => onNavigateSection && onNavigateSection('reflection')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.75rem 0.5rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  color: '#f8fafc',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fbbf24',
                  }}
                >
                  <BarChart2 size={16} />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>View Stats</span>
              </button>
            </div>
          </div>

          {/* ── 2. COMPACT MONTHLY CALENDAR WIDGET ── */}
          <div style={GLASS_CARD}>
            {/* Header with Month & Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <button
                type="button"
                onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex' }}
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>

              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc' }}>
                {format(calendarMonth, 'MMMM yyyy')}
              </span>

              <button
                type="button"
                onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex' }}
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Weekday Names Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                textAlign: 'center',
                fontSize: '0.68rem',
                color: '#94a3b8',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '4px',
                textAlign: 'center',
              }}
            >
              {calendarDays.map((d) => {
                const dateStr = format(d, 'yyyy-MM-dd');
                const isSelected = dateStr === selectedDate;
                const isCurrentToday = dateStr === today();
                const isCurrentMonth = isSameMonth(d, calendarMonth);
                const hasTask = dateTaskIndicators.hasTasks.has(dateStr);
                const hasDone = dateTaskIndicators.hasCompleted.has(dateStr);

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateStr);
                      showToast(`Selected ${format(d, 'MMM d, yyyy')}`);
                    }}
                    style={{
                      height: '34px',
                      borderRadius: '50%',
                      border: 'none',
                      background: isSelected ? '#8b5cf6' : 'transparent',
                      color: isSelected ? '#ffffff' : isCurrentMonth ? '#cbd5e1' : 'rgba(255, 255, 255, 0.25)',
                      fontSize: '0.78rem',
                      fontWeight: isSelected || isCurrentToday ? 800 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      boxShadow: isSelected ? '0 0 12px rgba(139, 92, 246, 0.6)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{format(d, 'd')}</span>

                    {/* Dot Indicators */}
                    <div style={{ display: 'flex', gap: '2px', position: 'absolute', bottom: '2px' }}>
                      {hasDone && (
                        <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#10b981' }} />
                      )}
                      {!hasDone && hasTask && (
                        <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#38bdf8' }} />
                      )}
                      {isCurrentToday && !isSelected && (
                        <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#c084fc' }} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginTop: '12px',
                paddingTop: '8px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '0.68rem',
                color: '#94a3b8',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8b5cf6' }} />
                <span>Today</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                <span>Completed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />
                <span>Has Tasks</span>
              </div>
            </div>
          </div>

          {/* ── 3. UPCOMING TASKS ── */}
          <div style={GLASS_CARD}>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarIcon size={16} color="#c084fc" />
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc' }}>
                  Upcoming Tasks
                </span>
              </div>

              <button
                type="button"
                onClick={() => onNavigateSection && onNavigateSection('calendar')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#c084fc',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                <span>View All</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Upcoming List */}
            {upcomingTasks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {upcomingTasks.map((t) => {
                  const taskDateStr = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
                  const formatted = taskDateStr ? format(parseISO(taskDateStr), 'MMM d, yyyy') : 'Upcoming';
                  const priStyle = getPriorityBadgeStyle(t.priority);

                  return (
                    <div
                      key={t.id}
                      onClick={() => onNavigateSection && onNavigateSection('tasks')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '8px',
                            background: priStyle.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: priStyle.color,
                            flexShrink: 0,
                          }}
                        >
                          <CalendarIcon size={13} />
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              color: '#ffffff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {t.title}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                            {formatted} {t.priority && `• ${t.priority}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '0.85rem 0', color: '#94a3b8', fontSize: '0.78rem' }}>
                No upcoming scheduled tasks.
              </div>
            )}
          </div>

          {/* ── 4. RECENT ACTIVITY ── */}
          <div style={GLASS_CARD}>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#38bdf8" />
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc' }}>
                  Recent Activity
                </span>
              </div>

              <button
                type="button"
                onClick={() => onNavigateSection && onNavigateSection('reflection')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#c084fc',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                <span>View All</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Activity List */}
            {recentActivities.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {recentActivities.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '7px 10px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: `${act.color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {act.icon}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          color: '#f8fafc',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        <span style={{ textTransform: 'capitalize' }}>{act.action}</span>: {act.title}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        {act.timeDisplay}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '0.85rem 0', color: '#94a3b8', fontSize: '0.78rem' }}>
                No recent activity logged yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── ANCHORED FLOATING TIME PICKER ───────────────────────────────────── */}
      <FloatingTimePicker
        isOpen={Boolean(timePickerTask && timePickerAnchor)}
        anchorEl={timePickerAnchor}
        initialStartTime={
          timePickerTask
            ? 'originalTask' in timePickerTask
              ? timePickerTask.startTime
              : timePickerTask.startTime || timePickerTask.plannedStartTime
            : undefined
        }
        initialEndTime={
          timePickerTask
            ? 'originalTask' in timePickerTask
              ? timePickerTask.endTime
              : timePickerTask.endTime
            : undefined
        }
        initialDate={
          timePickerTask
            ? 'originalTask' in timePickerTask
              ? timePickerTask.occurrenceDate || selectedDate
              : timePickerTask.targetDate || timePickerTask.dueDate || selectedDate
            : selectedDate
        }
        taskTitle={timePickerTask?.title || 'Set Time'}
        onSave={async (result: TimePickerResult) => {
          if (!timePickerTask) return;
          const original = 'originalTask' in timePickerTask ? timePickerTask.originalTask : timePickerTask;
          const updatedDate = result.date || result.targetDate || selectedDate;
          await updateTask({
            ...original,
            startTime: result.startTime || undefined,
            plannedStartTime: result.startTime || undefined,
            endTime: result.endTime || undefined,
            targetDate: updatedDate,
            dueDate: updatedDate,
            scheduledDate: updatedDate,
            updatedAt: new Date().toISOString(),
          });
          setTimePickerTask(null);
          setTimePickerAnchor(null);
          showToast(`Scheduled "${timePickerTask.title}" at ${result.startTime || 'time'}`);
        }}
        onCancel={() => {
          setTimePickerTask(null);
          setTimePickerAnchor(null);
        }}
        onClear={async () => {
          if (!timePickerTask) return;
          const original = 'originalTask' in timePickerTask ? timePickerTask.originalTask : timePickerTask;
          await updateTask({
            ...original,
            startTime: undefined,
            plannedStartTime: undefined,
            endTime: undefined,
            updatedAt: new Date().toISOString(),
          });
          setTimePickerTask(null);
          setTimePickerAnchor(null);
          showToast(`Cleared schedule for "${timePickerTask.title}"`);
        }}
      />
    </div>
  );
}
