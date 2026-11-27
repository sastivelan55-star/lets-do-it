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
  Sparkles,
  RotateCcw,
  Trash2,
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
import { today, getGreeting, formatTime } from '../../utils/dates';
import { ALL_CHARACTERS } from '../../data/animeCharacters';
import { runAiPrompt } from '../../services/aiService';
import type { Task, DailyTaskOccurrence, DailyTaskCompletion, TaskPriority } from '../../types';
import FloatingTimePicker, { type TimePickerResult } from '../common/FloatingTimePicker';

// ─── Theme & Styling Constants ───────────────────────────────────────────────

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
  const { tasks, deletedTasks, settings, updateTask, addTask, batchUpdateTasks, removeTask } = useApp();

  const isLight = settings.theme === 'light' || settings.appearance?.theme === 'light';

  const glassCardStyle: React.CSSProperties = useMemo(() => ({
    background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(19, 13, 38, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: isLight ? '1px solid rgba(168, 85, 247, 0.16)' : '1px solid rgba(168, 85, 247, 0.2)',
    boxShadow: isLight ? '0 8px 30px rgba(100, 116, 139, 0.10)' : '0 8px 32px rgba(0, 0, 0, 0.35)',
    padding: '1.25rem',
    position: 'relative',
    overflow: 'hidden',
  }), [isLight]);

  // Selected date state (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(today());
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => parseISO(today()));

  // Today's Missions Filter ('all' | 'pending' | 'completed')
  const [missionsFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const [isCarryingForward, setIsCarryingForward] = useState(false);

  // Floating time picker popover state
  const [timePickerTask, setTimePickerTask] = useState<DailyTaskOccurrence | Task | null>(null);
  const [timePickerAnchor, setTimePickerAnchor] = useState<HTMLElement | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const [aiFocusText, setAiFocusText] = useState<string | null>(null);
  const [aiFocusLoading, setAiFocusLoading] = useState(false);
  const [aiFocusError, setAiFocusError] = useState<string | null>(null);
  const [routineEditor, setRoutineEditor] = useState<{
    mode: 'add' | 'edit';
    task?: Task;
    title: string;
    startTime: string;
    lifeArea: string;
    notes: string;
    isRoutineActive: boolean;
  } | null>(null);

  // Daily Execution engine hook for the selected date
  const { occurrences, toggleCompletion, completions } = useDailyExecution(selectedDate);

  const handleCompleteMission = useCallback(
    async (taskId: string, isCurrentlyDone: boolean) => {
      const task = tasks.find((t) => t.id === taskId);
      const isRoutineOrRecurring = Boolean(
        task?.isRoutine || (task?.recurring && task.recurring !== 'none')
      );

      if (isRoutineOrRecurring) {
        await toggleCompletion(taskId, isCurrentlyDone);
        if (!isCurrentlyDone) {
          showToast('Routine completed for today! Resets tomorrow ✨');
        }
        return;
      }

      if (isCurrentlyDone) {
        await toggleCompletion(taskId, true);
        return;
      }

      setCompletingIds((prev) => {
        const next = new Set(prev);
        next.add(taskId);
        return next;
      });
      setTimeout(async () => {
        await toggleCompletion(taskId, false);
        await removeTask(taskId);
        setCompletingIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }, 300);
    },
    [tasks, toggleCompletion, removeTask]
  );

  const handleSaveRoutineEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineEditor || !routineEditor.title.trim()) return;
    const now = new Date().toISOString();
    if (routineEditor.mode === 'edit' && routineEditor.task) {
      await updateTask({
        ...routineEditor.task,
        title: routineEditor.title.trim(),
        startTime: routineEditor.startTime || undefined,
        plannedStartTime: routineEditor.startTime || undefined,
        lifeArea: routineEditor.lifeArea || 'technical',
        notes: routineEditor.notes.trim() || undefined,
        isRoutine: true,
        recurring:
          routineEditor.task.recurring && routineEditor.task.recurring !== 'none'
            ? routineEditor.task.recurring
            : 'daily',
        isRoutineActive: routineEditor.isRoutineActive,
        updatedAt: now,
      });
      showToast('Routine updated');
    } else {
      await addTask({
        title: routineEditor.title.trim(),
        lifeArea: routineEditor.lifeArea || 'health',
        priority: 'medium',
        dueDate: selectedDate,
        targetDate: selectedDate,
        scheduledDate: selectedDate,
        startTime: routineEditor.startTime || undefined,
        plannedStartTime: routineEditor.startTime || undefined,
        notes: routineEditor.notes.trim() || undefined,
        recurring: 'daily',
        isRoutine: true,
        isRoutineActive: routineEditor.isRoutineActive,
        status: 'not-started',
      });
      showToast('Daily routine added');
    }
    setRoutineEditor(null);
  };

  // Live digital clock (updates every second)
  const [nowTime, setNowTime] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNowTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Active user name and greeting
  const greeting = useMemo(() => getGreeting(), []);
  const userName = useMemo(() => {
    return settings.displayName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Sastivelan';
  }, [settings.displayName, user]);

  // Active user avatar (custom Settings avatar -> companion fallback)
  const activeAvatar = useMemo(() => {
    if (settings.avatarUrl) return settings.avatarUrl;
    if (settings.profileAvatar) return settings.profileAvatar;
    const charId = settings.personalization?.activeCharacterId || 'nami';
    const found = ALL_CHARACTERS.find((c) => c.id === charId);
    return (
      found?.avatarUrl ||
      found?.artworkUrl ||
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80'
    );
  }, [settings.avatarUrl, settings.profileAvatar, settings.personalization?.activeCharacterId]);

  // Toast feedback helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // ─── OVERDUE TASKS & ACTIVE MISSIONS MERGE ─────────────────────────────────

  // Fast lookup of per-task completion status for selectedDate
  const completionMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const c of completions) {
      if (c.occurrenceDate.slice(0, 10) === selectedDate) {
        map.set(c.taskId, c.isCompleted);
      }
    }
    return map;
  }, [completions, selectedDate]);

  // Overdue tasks from previous days to avoid hidden tasks
  const overdueTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.isDeleted) return false;
      if (t.recurring && t.recurring !== 'none') return false;
      const taskDate = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
      if (!taskDate || taskDate >= selectedDate) return false;

      // Pending tasks from earlier dates
      if (t.status !== 'completed' && t.status !== 'rescheduled') return true;

      // Overdue tasks that were marked completed on selectedDate
      if (completionMap.get(t.id) === true) return true;
      if (t.completedAt) {
        try {
          if (format(parseISO(t.completedAt), 'yyyy-MM-dd') === selectedDate) return true;
        } catch {
          if (t.completedAt.slice(0, 10) === selectedDate) return true;
        }
      }

      return false;
    });
  }, [tasks, selectedDate, completionMap]);

  // Fast lookup set of overdue task IDs
  const overdueTaskIdSet = useMemo(() => {
    return new Set(overdueTasks.map((t) => t.id));
  }, [overdueTasks]);

  // Pending overdue tasks count for the Carry Forward banner
  const pendingOverdueTasks = useMemo(() => {
    return overdueTasks.filter((t) => {
      if (completionMap.get(t.id) === true) return false;
      if (t.status === 'completed') return false;
      return true;
    });
  }, [overdueTasks, completionMap]);

  // All missions for selected date:
  // When viewing today, automatically include any pending overdue missions from previous days
  // so the user never sees an empty "0 of 0 completed" when there are pending missions waiting!
  const allMissions = useMemo(() => {
    if (selectedDate === today() && overdueTasks.length > 0) {
      const occurrenceTaskIds = new Set(occurrences.map((o) => o.taskId));
      const overdueOccurrences: DailyTaskOccurrence[] = overdueTasks
        .filter((t) => !occurrenceTaskIds.has(t.id))
        .map((t) => {
          const isDone = completionMap.has(t.id)
            ? completionMap.get(t.id)!
            : t.status === 'completed';

          return {
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
            isCompleted: isDone,
            completedAt: t.completedAt,
            originalTask: t,
          };
        });
      return [...occurrences, ...overdueOccurrences];
    }
    return occurrences;
  }, [occurrences, overdueTasks, selectedDate, completionMap]);

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
    if (pendingOverdueTasks.length === 0 || isCarryingForward) return;
    setIsCarryingForward(true);
    try {
      const updatedList: Task[] = pendingOverdueTasks.map((t) => ({
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

  // ─── CACHED COMPLETIONS FOR CALENDAR DOT INDICATORS ────────────────────────
  const [allCompletions, setAllCompletions] = useState<DailyTaskCompletion[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lifeos.daily_task_completions.v1');
      if (raw) {
        setAllCompletions(JSON.parse(raw));
      }
    } catch { }
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
        background: isLight ? '#f1f5f9' : '#090514',
        color: isLight ? '#0f172a' : '#f8fafc',
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
          gap: '1rem',
          marginBottom: '1.75rem',
          padding: '1.15rem 1.35rem',
          borderRadius: '20px',
          background: isLight
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(245, 243, 255, 0.92))'
            : 'linear-gradient(135deg, rgba(24, 16, 52, 0.88), rgba(14, 10, 32, 0.85))',
          border: isLight
            ? '1px solid rgba(168, 85, 247, 0.22)'
            : '1px solid rgba(168, 85, 247, 0.28)',
          boxShadow: isLight
            ? '0 8px 28px rgba(100, 116, 139, 0.10)'
            : '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* Left: Profile Avatar & Warm Greeting */}
        <div className="home-greeting" style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
          <div
            style={{
              position: 'relative',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              padding: '3px',
              background: 'linear-gradient(135deg, #a855f7, #38bdf8)',
              boxShadow: '0 0 24px rgba(168, 85, 247, 0.4)',
              flexShrink: 0,
            }}
          >
            <img
              src={activeAvatar}
              alt={userName}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
                background: isLight ? '#f8fafc' : '#120c26',
              }}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: isLight ? '#0f172a' : '#ffffff',
                fontFamily: 'Inter, system-ui, sans-serif',
                lineHeight: 1.2,
              }}
            >
              {greeting}, {userName}!
            </h1>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '0.86rem',
                color: isLight ? '#7c3aed' : '#c084fc',
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

        {/* Right: Live Digital Clock, Full Date & Optional Return-to-Today Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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
                color: isLight ? '#7c3aed' : '#c084fc',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Click to reset view back to today"
            >
              <RotateCcw size={13} />
              <span>Viewing {format(parseISO(selectedDate), 'MMM d')} • Today</span>
            </button>
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              padding: '0.55rem 1rem',
              borderRadius: '14px',
              background: isLight ? 'var(--bg-surface)' : 'rgba(255, 255, 255, 0.04)',
              border: isLight ? '1px solid var(--border)' : '1px solid rgba(168, 85, 247, 0.25)',
              boxShadow: isLight
                ? '0 2px 10px rgba(100, 116, 139, 0.08)'
                : '0 0 20px rgba(168, 85, 247, 0.14)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  color: isLight ? '#0f172a' : '#f8fafc',
                }}
              >
                {format(nowTime, 'hh:mm:ss a')}
              </span>
            </div>
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 600,
                color: isLight ? '#475569' : '#a5b4fc',
                marginTop: '2px',
              }}
            >
              {format(nowTime, 'EEEE, MMMM d, yyyy')}
            </div>
          </div>
        </div>
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
          <div style={glassCardStyle}>
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
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span>Today&apos;s Missions</span>
                    {onOpenQuickCapture && (
                      <button
                        type="button"
                        onClick={onOpenQuickCapture}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 10px',
                          borderRadius: '8px',
                          background: isLight ? 'rgba(124, 58, 237, 0.1)' : 'rgba(168, 85, 247, 0.2)',
                          border: isLight ? '1px solid rgba(124, 58, 237, 0.28)' : '1px solid rgba(168, 85, 247, 0.4)',
                          color: isLight ? '#6d28d9' : '#e9d5ff',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        title="Quick Capture New Task (Ctrl + K)"
                      >
                        <Plus size={13} />
                        <span>Add Task</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setRoutineEditor({
                          mode: 'add',
                          title: '',
                          startTime: '',
                          lifeArea: 'health',
                          notes: '',
                          isRoutineActive: true,
                        })
                      }
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 10px',
                        borderRadius: '8px',
                        background: isLight ? 'rgba(236, 72, 153, 0.1)' : 'rgba(236, 72, 153, 0.18)',
                        border: isLight ? '1px solid rgba(236, 72, 153, 0.28)' : '1px solid rgba(236, 72, 153, 0.4)',
                        color: isLight ? '#be185d' : '#f9a8d4',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      title="Add Daily Routine (Resets automatically each day)"
                    >
                      <RotateCcw size={12} />
                      <span>+ Routine</span>
                    </button>
                  </h3>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={aiFocusLoading}
                  onClick={async () => {
                    setAiFocusLoading(true);
                    setAiFocusError(null);
                    const pendingList = filteredMissions
                      .filter((m) => !m.isCompleted)
                      .map((m, i) => {
                        const rawTask = tasks.find((t) => t.id === m.taskId);
                        const isRoutine = Boolean(rawTask?.isRoutine || (rawTask?.recurring && rawTask.recurring !== 'none'));
                        return `${i + 1}. ${m.title} [priority: ${m.priority || 'medium'}, area: ${m.lifeArea}${m.startTime ? `, at ${m.startTime}` : ''}${isRoutine ? ', routine' : ''}]`;
                      });
                    if (pendingList.length === 0) {
                      setAiFocusText('All of today’s missions are completed! Great momentum — use the quiet block to review tomorrow’s roadmap or unwind.');
                      setAiFocusLoading(false);
                      return;
                    }
                    const res = await runAiPrompt(
                      `Here are my pending missions and routines for today (${selectedDate}):\n${pendingList.join('\n')}\n\nPick the TOP 3 priorities to tackle first, recommend the best execution order with a quick reason for each, and keep the reply concise (bullet list, under 120 words).`,
                      'You are an executive productivity coach inside Life OS. Be direct, practical, and reference the user’s actual task titles.',
                      {
                        provider: settings.aiSettings?.provider || 'gemini',
                        model: settings.aiSettings?.model,
                      }
                    );
                    setAiFocusLoading(false);
                    if (res.success && res.text) {
                      setAiFocusText(res.text);
                    } else {
                      setAiFocusError(res.error || 'Unable to generate AI Focus.');
                    }
                  }}
                  title="Analyze today's tasks & routines with AI to highlight top 3 priorities"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: isLight
                      ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(56, 189, 248, 0.12))'
                      : 'linear-gradient(135deg, rgba(168, 85, 247, 0.22), rgba(56, 189, 248, 0.18))',
                    border: isLight ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid rgba(192, 132, 252, 0.45)',
                    color: isLight ? '#6d28d9' : '#e9d5ff',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: aiFocusLoading ? 'wait' : 'pointer',
                    opacity: aiFocusLoading ? 0.7 : 1,
                  }}
                >
                  <Sparkles size={13} className={aiFocusLoading ? 'animate-spin' : ''} />
                  <span>{aiFocusLoading ? 'Analyzing…' : 'AI Focus'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateSection && onNavigateSection('settings')}
                  title="Open Recycle Bin to inspect or restore completed/deleted tasks"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: isLight ? 'var(--bg-surface-2)' : 'rgba(255, 255, 255, 0.05)',
                    border: isLight ? '1px solid var(--border)' : '1px solid rgba(168, 85, 247, 0.25)',
                    color: isLight ? '#475569' : '#cbd5e1',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} color="#f43f5e" />
                  <span>Recycle Bin</span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '0 6px',
                      borderRadius: '999px',
                      background: 'rgba(244, 63, 94, 0.16)',
                      color: '#f43f5e',
                      fontWeight: 800,
                    }}
                  >
                    {deletedTasks.length}
                  </span>
                </button>
              </div>
            </div>

            {/* AI Focus Top-3 Priority Panel */}
            {(aiFocusText || aiFocusError) && (
              <div
                style={{
                  background: isLight
                    ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(56, 189, 248, 0.08))'
                    : 'linear-gradient(135deg, rgba(168, 85, 247, 0.14), rgba(30, 27, 75, 0.65))',
                  border: aiFocusError
                    ? '1px solid rgba(239, 68, 68, 0.4)'
                    : isLight
                    ? '1px solid rgba(124, 58, 237, 0.25)'
                    : '1px solid rgba(192, 132, 252, 0.38)',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem',
                  marginBottom: '0.9rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: aiFocusError ? '#f87171' : isLight ? '#6d28d9' : '#d8b4fe', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={13} /> {aiFocusError ? 'AI Focus Notice' : 'AI Focus — Top 3 Priorities'}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setAiFocusText(null); setAiFocusError(null); }}
                    style={{ background: 'none', border: 'none', color: isLight ? '#64748b' : '#94a3b8', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 700 }}
                  >
                    Dismiss
                  </button>
                </div>
                <div style={{ fontSize: '0.82rem', lineHeight: 1.5, color: isLight ? '#1e293b' : '#e2e8f0', whiteSpace: 'pre-wrap' }}>
                  {aiFocusError || aiFocusText}
                </div>
              </div>
            )}

            {/* Overdue Banner if prior tasks are pending */}
            {pendingOverdueTasks.length > 0 && (
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
                  ⚠ You have {pendingOverdueTasks.length} pending missions from previous days.
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
                  const isCompleting = completingIds.has(occ.taskId);

                  return (
                    <div
                      key={occ.taskId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: isCompleting
                          ? 'rgba(16, 185, 129, 0.18)'
                          : isLight
                            ? (isDone ? 'rgba(241, 245, 249, 0.6)' : '#ffffff')
                            : 'rgba(255, 255, 255, 0.03)',
                        border: isCompleting
                          ? '1px solid rgba(16, 185, 129, 0.5)'
                          : isLight
                            ? '1px solid rgba(226, 232, 240, 0.95)'
                            : '1px solid rgba(255, 255, 255, 0.07)',
                        gap: '10px',
                        opacity: isCompleting ? 0 : 1,
                        transform: isCompleting ? 'translateX(16px) scale(0.98)' : 'translateX(0) scale(1)',
                        transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      {/* Left: Checkbox + Title */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <button
                          type="button"
                          onClick={() => handleCompleteMission(occ.taskId, isDone)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            color: isDone || isCompleting ? '#10b981' : (isLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.35)'),
                            display: 'flex',
                            flexShrink: 0,
                            transform: isCompleting ? 'scale(1.25)' : 'scale(1)',
                            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          }}
                          title={isDone ? 'Mark incomplete' : 'Complete & move to Recycle Bin'}
                        >
                          {isDone || isCompleting ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                        </button>

                        <span
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            color: isDone ? '#94a3b8' : (isLight ? '#0f172a' : '#ffffff'),
                            textDecoration: isDone ? 'line-through' : 'none',
                            wordBreak: 'break-word',
                          }}
                        >
                          {occ.title}
                        </span>
                      </div>

                      {/* Right: Badges & Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                        {Boolean(occ.originalTask?.isRoutine || (occ.recurring && occ.recurring !== 'none')) && (
                          <>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '999px',
                                background: 'rgba(236, 72, 153, 0.16)',
                                color: isLight ? '#be185d' : '#f472b6',
                                border: '1px solid rgba(236, 72, 153, 0.35)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <RotateCcw size={10} /> Routine
                            </span>
                            {occ.originalTask && (
                              <button
                                type="button"
                                onClick={() =>
                                  setRoutineEditor({
                                    mode: 'edit',
                                    task: occ.originalTask,
                                    title: occ.title,
                                    startTime: occ.startTime || '',
                                    lifeArea: occ.lifeArea || 'health',
                                    notes: occ.notes || '',
                                    isRoutineActive: occ.originalTask.isRoutineActive !== false,
                                  })
                                }
                                title="Edit routine"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '3px',
                                  color: isLight ? '#64748b' : '#94a3b8',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                }}
                              >
                                <Edit3 size={13} />
                              </button>
                            )}
                          </>
                        )}

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
          </div>
        </div>

        {/* ─── RIGHT COLUMN: UTILITY PANELS (Quick Actions, Calendar, Upcoming, Recent) ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '5rem' }}>
          {/* ── 2. COMPACT MONTHLY CALENDAR WIDGET ── */}
          <div style={glassCardStyle}>
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

              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
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
                      color: isSelected ? '#ffffff' : isCurrentMonth ? (isLight ? '#1e293b' : '#cbd5e1') : (isLight ? '#94a3b8' : 'rgba(255, 255, 255, 0.25)'),
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
          <div style={glassCardStyle}>
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
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
                  Upcoming Tasks
                </span>
              </div>

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
                        background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                        border: isLight ? '1px solid rgba(226, 232, 240, 0.95)' : '1px solid rgba(255, 255, 255, 0.06)',
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
                              color: isLight ? '#0f172a' : '#ffffff',
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
          <div style={glassCardStyle}>
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
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>
                  Recent Activity
                </span>
              </div>

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
                      background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.02)',
                      border: isLight ? '1px solid rgba(226, 232, 240, 0.8)' : '1px solid transparent',
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
                          color: isLight ? '#0f172a' : '#f8fafc',
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

      {/* ─── QUICK ROUTINE EDITOR MODAL ───────────────────────────────────────── */}
      {routineEditor && (
        <div
          onClick={() => setRoutineEditor(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.72)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveRoutineEditor}
            style={{
              width: '100%',
              maxWidth: '420px',
              background: isLight ? '#ffffff' : '#120d26',
              border: isLight ? '1px solid var(--border)' : '1px solid rgba(236, 72, 153, 0.35)',
              borderRadius: '18px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RotateCcw size={16} color="#ec4899" />
                {routineEditor.mode === 'edit' ? 'Edit Daily Routine' : 'New Daily Routine'}
              </h4>
              <button
                type="button"
                onClick={() => setRoutineEditor(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ×
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px' }}>
                Routine Title
              </label>
              <input
                className="input"
                required
                value={routineEditor.title}
                onChange={(e) => setRoutineEditor({ ...routineEditor, title: e.target.value })}
                placeholder="e.g., Morning Workout / DSA Practice"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px' }}>
                  Time (Optional)
                </label>
                <input
                  className="input"
                  type="time"
                  value={routineEditor.startTime}
                  onChange={(e) => setRoutineEditor({ ...routineEditor, startTime: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px' }}>
                  Category
                </label>
                <select
                  className="input"
                  value={routineEditor.lifeArea}
                  onChange={(e) => setRoutineEditor({ ...routineEditor, lifeArea: e.target.value })}
                >
                  <option value="health">Health</option>
                  <option value="technical">Technical</option>
                  <option value="communication">Communication</option>
                  <option value="career">Career</option>
                  <option value="creativity">Creativity</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: isLight ? '#475569' : '#94a3b8', marginBottom: '4px' }}>
                Notes
              </label>
              <input
                className="input"
                value={routineEditor.notes}
                onChange={(e) => setRoutineEditor({ ...routineEditor, notes: e.target.value })}
                placeholder="Quick routine details..."
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: isLight ? '#0f172a' : '#e2e8f0', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={routineEditor.isRoutineActive}
                onChange={(e) => setRoutineEditor({ ...routineEditor, isRoutineActive: e.target.checked })}
              />
              <span>Active daily (resets automatically every day)</span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
              {routineEditor.mode === 'edit' && routineEditor.task ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (routineEditor.task) await removeTask(routineEditor.task.id);
                    setRoutineEditor(null);
                    showToast('Routine moved to Recycle Bin');
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.14)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#ef4444',
                    borderRadius: '8px',
                    padding: '0.45rem 0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRoutineEditor(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  {routineEditor.mode === 'edit' ? 'Save Routine' : 'Add Routine'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
