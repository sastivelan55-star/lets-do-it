// Life OS — Daily Execution Dashboard
// Date-Aware Task Synchronization + Daily Routine Engine + Independent Execution History
// Complete Redesign implementing sections A through J with Life OS Dark Purple / Neon Aesthetic.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Zap,
  Target,
  Flame,
  Plus,
  Repeat,
  RotateCcw,
  Sparkles,
  Calendar as CalendarIcon,
  Check,
  TrendingUp,
  MoreVertical,
  Trash2,
  ListTodo,
  Inbox,
} from 'lucide-react';
import { format, parseISO, addDays, subDays, startOfWeek } from 'date-fns';
import { useDailyExecution } from '../../hooks/useDailyExecution';
import { useApp } from '../../context/AppContext';
import { today, formatDateLong, getGreeting, formatTime } from '../../utils/dates';
import { ALL_CHARACTERS, type AnimeCharacter } from '../../data/animeCharacters';
import type { DailyTaskOccurrence, Task } from '../../types';
import FloatingTimePicker, { type TimePickerResult } from '../common/FloatingTimePicker';
import DailyRecurrenceToggle from '../common/DailyRecurrenceToggle';
import { getOverdueTasksForDate, getUnscheduledTasks } from '../../services/occurrenceEngine';

// ─── Visual Constants & Styling ──────────────────────────────────────────────

const GLASS_CARD: React.CSSProperties = {
  background: 'rgba(18, 12, 38, 0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: '20px',
  border: '1px solid rgba(192, 132, 252, 0.22)',
  padding: 'clamp(1rem, 2vw, 1.25rem)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
  transition: 'all 0.25s ease',
  boxSizing: 'border-box',
};

const LIFE_AREA_COLOR: Record<string, string> = {
  technical: '#6366f1',
  communication: '#06b6d4',
  career: '#f59e0b',
  creativity: '#ec4899',
  health: '#10b981',
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: '#f87171',
  high: '#f97316',
  medium: '#facc15',
  low: '#4ade80',
};

function getLifeAreaColor(area: string): string {
  return LIFE_AREA_COLOR[area] ?? '#c084fc';
}

function getPriorityColor(priority: string): string {
  return PRIORITY_COLOR[priority] ?? '#c084fc';
}

interface DailyExecutionDashboardProps {
  onNavigateSection?: (section: string) => void;
  onOpenTaskBuilder?: () => void;
  onOpenTimetable?: () => void;
}

export default function DailyExecutionDashboard({
  onNavigateSection,
  onOpenTaskBuilder,
  onOpenTimetable,
}: DailyExecutionDashboardProps) {
  const [selectedDate, setSelectedDate] = useState<string>(today());
  const [liveTime, setLiveTime] = useState<string>('');
  const [completedOpen, setCompletedOpen] = useState(true);
  const [celebrationText, setCelebrationText] = useState<string | null>(null);

  // Floating Time Picker Popover State (Anchored, non-shifting portal)
  const [timePickerTask, setTimePickerTask] = useState<DailyTaskOccurrence | Task | null>(null);
  const [timePickerAnchor, setTimePickerAnchor] = useState<HTMLElement | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Sections collapse/expand state
  const [overdueOpen, setOverdueOpen] = useState(true);
  const [unscheduledOpen, setUnscheduledOpen] = useState(false);

  const { occurrences, summary, isLoading, error, toggleCompletion } = useDailyExecution(selectedDate);
  const { tasks, settings, streakData, updateTask, removeTask, completeTask } = useApp();

  // Active Anime Character Companion from settings
  const activeChar = useMemo(() => {
    const charId = settings.personalization?.activeCharacterId || 'nami';
    return ALL_CHARACTERS.find((c: AnimeCharacter) => c.id === charId) || ALL_CHARACTERS[0];
  }, [settings.personalization?.activeCharacterId]);

  // Live running clock
  useEffect(() => {
    const tick = () => {
      setLiveTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Date Navigation Handlers
  const handlePrevDay = useCallback(() => {
    setSelectedDate((d) => format(subDays(parseISO(d), 1), 'yyyy-MM-dd'));
  }, []);
  const handleNextDay = useCallback(() => {
    setSelectedDate((d) => format(addDays(parseISO(d), 1), 'yyyy-MM-dd'));
  }, []);
  const handleToday = useCallback(() => setSelectedDate(today()), []);

  const isCurrentDayToday = selectedDate === today();

  // Split occurrences into Pending and Completed
  const pendingOccurrences = useMemo(() => occurrences.filter((o) => !o.isCompleted), [occurrences]);
  const completedOccurrences = useMemo(() => occurrences.filter((o) => o.isCompleted), [occurrences]);

  // Section D: Today's Focus (High & Critical Priority Tasks for this date)
  const focusTasks = useMemo(
    () => occurrences.filter((o) => o.priority === 'critical' || o.priority === 'high'),
    [occurrences]
  );

  // Section E: Today's Schedule (Chronological timeline of tasks with start times)
  const scheduledTimelineTasks = useMemo(() => {
    return occurrences
      .filter((o) => Boolean(o.startTime))
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [occurrences]);

  // Section G: Daily Habits & Routines (Recurring tasks)
  const habitOccurrences = useMemo(() => {
    return occurrences.filter((o) => Boolean(o.recurring && o.recurring !== 'none'));
  }, [occurrences]);

  const habitsCompletedCount = useMemo(
    () => habitOccurrences.filter((h) => h.isCompleted).length,
    [habitOccurrences]
  );
  const habitPercentage =
    habitOccurrences.length > 0
      ? Math.round((habitsCompletedCount / habitOccurrences.length) * 100)
      : 0;

  // Section H: Upcoming Tasks (Future one-time scheduled tasks)
  const upcomingTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (t.isDeleted) return false;
        if (t.recurring && t.recurring !== 'none') return false;
        const taskDate = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
        return taskDate > selectedDate;
      })
      .sort((a, b) => {
        const da = (a.scheduledDate || a.targetDate || a.dueDate || '').slice(0, 10);
        const db = (b.scheduledDate || b.targetDate || b.dueDate || '').slice(0, 10);
        return da.localeCompare(db);
      })
      .slice(0, 5);
  }, [tasks, selectedDate]);

  // Section I: Historical Activity Data (Yesterday's performance)
  const yesterdayDateStr = useMemo(
    () => format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'),
    [selectedDate]
  );

  const yesterdayCompletedCount = useMemo(() => {
    // Count from tasks completed on yesterday's date
    return tasks.filter((t) => {
      if (t.isDeleted) return false;
      const compDate = (t.completedAt || '').slice(0, 10);
      const schedDate = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
      return (compDate === yesterdayDateStr || schedDate === yesterdayDateStr) && t.status === 'completed';
    }).length;
  }, [tasks, yesterdayDateStr]);

  // Interactive 7-Day Activity Strip
  const weekDays = useMemo(() => {
    const monday = startOfWeek(parseISO(selectedDate), { weekStartsOn: 1 });
    return [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const d = addDays(monday, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const isSelected = dateStr === selectedDate;
      const isNowToday = dateStr === today();
      // Count completed tasks for this day from tasks
      const completedOnDay = tasks.filter((t) => {
        if (t.isDeleted) return false;
        const cDate = (t.completedAt || '').slice(0, 10);
        const sDate = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
        return (cDate === dateStr || sDate === dateStr) && t.status === 'completed';
      }).length;

      return {
        dateStr,
        dayName: format(d, 'EEE'),
        dayNum: format(d, 'd'),
        isSelected,
        isNowToday,
        hasActivity: completedOnDay > 0,
        count: completedOnDay,
      };
    });
  }, [selectedDate, tasks]);

  // Interactive Toggle Handler
  const handleToggle = async (taskId: string, currentCompleted: boolean) => {
    try {
      await toggleCompletion(taskId, currentCompleted);
      if (!currentCompleted) {
        setCelebrationText('Mission Cleared! +10 XP 🔥');
        setTimeout(() => setCelebrationText(null), 2800);
      } else {
        setCelebrationText('Mission marked pending');
        setTimeout(() => setCelebrationText(null), 2000);
      }
    } catch (err) {
      console.error('Failed to toggle completion:', err);
    }
  };

  // Overdue and Unscheduled tasks to guarantee full visibility of all tasks in the system
  const overdueTasks = useMemo(() => {
    return getOverdueTasksForDate(tasks, selectedDate);
  }, [tasks, selectedDate]);

  const unscheduledTasks = useMemo(() => {
    return getUnscheduledTasks(tasks);
  }, [tasks]);

  const handleCarryForward = async (task: Task) => {
    await updateTask({
      ...task,
      targetDate: selectedDate,
      dueDate: selectedDate,
      scheduledDate: selectedDate,
      updatedAt: new Date().toISOString(),
    });
    setCelebrationText(`Carried forward "${task.title}" to ${selectedDate} 🚀`);
    setTimeout(() => setCelebrationText(null), 2500);
  };

  const handleCarryForwardAll = async () => {
    if (overdueTasks.length === 0) return;
    for (const t of overdueTasks) {
      await updateTask({
        ...t,
        targetDate: selectedDate,
        dueDate: selectedDate,
        scheduledDate: selectedDate,
        updatedAt: new Date().toISOString(),
      });
    }
    setCelebrationText(`Carried forward all ${overdueTasks.length} overdue tasks to ${selectedDate}! 🔥`);
    setTimeout(() => setCelebrationText(null), 3000);
  };

  const handleScheduleToday = async (task: Task) => {
    await updateTask({
      ...task,
      targetDate: selectedDate,
      dueDate: selectedDate,
      scheduledDate: selectedDate,
      updatedAt: new Date().toISOString(),
    });
    setCelebrationText(`Scheduled "${task.title}" for today 🎯`);
    setTimeout(() => setCelebrationText(null), 2500);
  };

  const handleMoveToRecycleBin = async (occurrence: DailyTaskOccurrence) => {
    setActiveMenuId(null);
    await removeTask(occurrence.taskId);
    setCelebrationText('Mission moved to Recycle Bin');
    setTimeout(() => setCelebrationText(null), 2500);
  };

  // Dynamic Motivational Message based on percentage
  const motivationalMessage = useMemo(() => {
    const pct = summary.percentage;
    if (summary.total === 0) return 'Add your first mission to ignite today’s growth!';
    if (pct === 100) return '🏆 Outstanding! All missions completed today! You are unstoppable!';
    if (pct >= 75) return '🔥 Crushing it! You are in the home stretch — finish strong!';
    if (pct >= 50) return '⚡ Halfway mark conquered! Keep the momentum flying high!';
    if (pct > 0) return '🌱 Great start! Focus on one mission at a time to build momentum.';
    return '✨ Ready to conquer today? Check off your first mission to get going!';
  }, [summary.percentage, summary.total]);

  const greeting = getGreeting();

  return (
    <div
      className="daily-execution-dashboard"
      style={{
        width: '100%',
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0.25rem 0.5rem calc(80px + env(safe-area-inset-bottom, 20px))',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxSizing: 'border-box',
      }}
    >
      {/* Celebration Notification Toast */}
      {celebrationText && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(76px + env(safe-area-inset-bottom, 16px))',
            right: '20px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(99, 102, 241, 0.95))',
            color: '#ffffff',
            padding: '0.75rem 1.25rem',
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 800,
            fontSize: '0.85rem',
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            animation: 'fadeInUp 0.3s ease',
            maxWidth: 'calc(100vw - 40px)',
          }}
        >
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              flexShrink: 0,
            }}
          >
            <Check size={14} strokeWidth={3} />
          </div>
          <span>{celebrationText}</span>
          <Sparkles size={16} color="#facc15" style={{ flexShrink: 0 }} />
        </div>
      )}

      {/* ─── SECTION A: Welcome and Date Header ────────────────────────────── */}
      <div
        style={{
          ...GLASS_CARD,
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          border: '1px solid rgba(192, 132, 252, 0.3)',
        }}
      >
        {/* Dynamic Greeting & Date */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'var(--font-display, Outfit, sans-serif)',
                fontSize: 'clamp(1.2rem, 3vw, 1.65rem)',
                fontWeight: 800,
                color: '#f8fafc',
                letterSpacing: '0.01em',
              }}
            >
              {greeting}!
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(236, 72, 153, 0.15)',
                color: '#ec4899',
                border: '1px solid rgba(236, 72, 153, 0.3)',
              }}
            >
              Life OS Active
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c084fc', fontWeight: 600, fontSize: '0.9rem' }}>
              <CalendarDays size={16} color="#38bdf8" />
              <span>{formatDateLong(selectedDate)}</span>
            </div>

            {isCurrentDayToday && (
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '6px',
                  background: 'rgba(56, 189, 248, 0.18)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                }}
              >
                TODAY
              </span>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '0.8rem' }}>
              <Clock size={13} color="#ec4899" />
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{liveTime}</span>
            </div>
          </div>
        </div>

        {/* Date Navigation & Calendar Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Calendar Picker input */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(192, 132, 252, 0.3)',
              borderRadius: '12px',
              padding: '4px 10px',
              gap: '6px',
            }}
          >
            <CalendarIcon size={14} color="#c084fc" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '0.82rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              title="Pick exact date"
            />
          </div>

          {/* Prev / Today / Next Controls */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={handlePrevDay}
              title="Previous day"
              style={{
                background: 'rgba(192, 132, 252, 0.12)',
                border: '1px solid rgba(192, 132, 252, 0.25)',
                borderRadius: '10px',
                color: '#c084fc',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s',
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={handleToday}
              title="Go to Today"
              style={{
                background: isCurrentDayToday ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'rgba(192, 132, 252, 0.12)',
                border: isCurrentDayToday ? 'none' : '1px solid rgba(192, 132, 252, 0.25)',
                borderRadius: '10px',
                color: '#ffffff',
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: isCurrentDayToday ? '0 0 16px rgba(236, 72, 153, 0.4)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Today
            </button>

            <button
              type="button"
              onClick={handleNextDay}
              title="Next day"
              style={{
                background: 'rgba(192, 132, 252, 0.12)',
                border: '1px solid rgba(192, 132, 252, 0.25)',
                borderRadius: '10px',
                color: '#c084fc',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Error banner if database issue */}
      {error && (
        <div
          style={{
            ...GLASS_CARD,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid rgba(248, 113, 113, 0.35)',
            background: 'rgba(248, 113, 113, 0.08)',
          }}
        >
          <AlertCircle size={18} color="#f87171" />
          <span style={{ color: '#f87171', fontSize: '0.85rem' }}>{error}</span>
        </div>
      )}

      {/* ─── SECTION B: Daily Overview Cards (4 Metric Cards) ──────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1rem',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* 1. Total Tasks */}
        <div
          style={{
            ...GLASS_CARD,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.18)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              flexShrink: 0,
            }}
          >
            <ListTodo size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Tasks
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
              {summary.total}
            </div>
          </div>
        </div>

        {/* 2. Completed */}
        <div
          style={{
            ...GLASS_CARD,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.18)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
              Completed
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', lineHeight: 1.2 }}>
              {summary.completed}
            </div>
          </div>
        </div>

        {/* 3. Remaining */}
        <div
          style={{
            ...GLASS_CARD,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(250, 204, 21, 0.18)',
              border: '1px solid rgba(250, 204, 21, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#facc15',
              flexShrink: 0,
            }}
          >
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
              Remaining
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#facc15', lineHeight: 1.2 }}>
              {summary.pending}
            </div>
          </div>
        </div>

        {/* 4. Completion Rate */}
        <div
          style={{
            ...GLASS_CARD,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '1rem',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(236, 72, 153, 0.18)',
              border: '1px solid rgba(236, 72, 153, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ec4899',
              flexShrink: 0,
            }}
          >
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
              Completion Rate
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ec4899', lineHeight: 1.2 }}>
              {summary.percentage}%
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION C: Daily Progress Section ─────────────────────────────── */}
      <div
        style={{
          ...GLASS_CARD,
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          background: 'linear-gradient(135deg, rgba(24, 15, 48, 0.85), rgba(18, 12, 38, 0.75))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              <Zap size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                Daily Progress Gauge
              </h3>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>
                Target: {settings.personalization?.dailyMissionGoal || 3} missions per day
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.12)',
                padding: '3px 10px',
                borderRadius: '999px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              {summary.completed} of {summary.total} missions cleared
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
              {summary.percentage}%
            </span>
          </div>
        </div>

        {/* Dynamic Animated Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '10px',
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${summary.percentage}%`,
              background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #38bdf8)',
              borderRadius: '999px',
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 0 16px rgba(168, 85, 247, 0.6)',
            }}
          />
        </div>

        {/* Motivational message banner */}
        <div
          style={{
            fontSize: '0.82rem',
            color: '#e2e8f0',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '8px 12px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <span>{motivationalMessage}</span>
        </div>
      </div>

      {/* ─── TWO-COLUMN MAIN WORKSPACE ────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gap: '1.25rem',
          width: '100%',
          boxSizing: 'border-box',
        }}
        className="dash-main-two-columns"
      >
        {/* ── LEFT COLUMN: Focus, Missions, and Habits ────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>
          {/* ─── SECTION D: Today's Focus ─────────────────────────────────── */}
          {focusTasks.length > 0 && (
            <div style={GLASS_CARD}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'rgba(248, 113, 113, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#f87171',
                    }}
                  >
                    <Target size={16} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc' }}>
                    Today's Critical Focus
                  </h4>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 700 }}>
                  {focusTasks.filter((t) => !t.isCompleted).length} Urgent
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {focusTasks.map((t) => (
                  <div
                    key={t.taskId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: t.isCompleted ? 'rgba(255, 255, 255, 0.02)' : 'rgba(248, 113, 113, 0.08)',
                      border: t.isCompleted ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(248, 113, 113, 0.3)',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <button
                        type="button"
                        onClick={() => handleToggle(t.taskId, t.isCompleted)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: t.isCompleted ? '#34d399' : 'rgba(255, 255, 255, 0.4)',
                          display: 'flex',
                          padding: 0,
                        }}
                      >
                        {t.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </button>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            color: t.isCompleted ? '#94a3b8' : '#f8fafc',
                            textDecoration: t.isCompleted ? 'line-through' : 'none',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {t.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              color: getPriorityColor(t.priority),
                              textTransform: 'uppercase',
                            }}
                          >
                            {t.priority}
                          </span>
                          {t.startTime && (
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <Clock size={10} /> {t.startTime}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateSection && onNavigateSection('tasks')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      title="Open in Tasks"
                    >
                      <ExternalLink size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── SECTION F: Today's Missions (Primary Execution Area) ──────── */}
          <div style={GLASS_CARD}>
            {/* Header with Title & Add Mission Action */}
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
                    borderRadius: '10px',
                    background: 'rgba(236, 72, 153, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ec4899',
                  }}
                >
                  <Target size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                    Today's Missions
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    {pendingOccurrences.length} Pending • {completedOccurrences.length} Completed
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => (onOpenTaskBuilder ? onOpenTaskBuilder() : onNavigateSection && onNavigateSection('tasks'))}
                style={{
                  background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: '#fff',
                  cursor: 'pointer',
                  boxShadow: '0 0 12px rgba(236, 72, 153, 0.3)',
                }}
              >
                <Plus size={14} /> Add Mission
              </button>
            </div>

            {/* Loading Skeleton */}
            {isLoading && occurrences.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    style={{
                      height: '52px',
                      borderRadius: '14px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      animation: 'pulse 1.5s infinite',
                    }}
                  />
                ))}
              </div>
            )}

            {/* ── Overdue / Pending from Previous Days Section ── */}
            {overdueTasks.length > 0 && (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '1rem 1.15rem',
                  background: 'rgba(239, 68, 68, 0.08)',
                  borderRadius: '16px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginBottom: overdueOpen ? '0.75rem' : 0,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOverdueOpen(!overdueOpen)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#f87171',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>Pending from Previous Days ({overdueTasks.length})</span>
                    {overdueOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  <button
                    type="button"
                    onClick={handleCarryForwardAll}
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.45)',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      color: '#fca5a5',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <RotateCcw size={12} /> Carry Forward All to Today
                  </button>
                </div>

                {overdueOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {overdueTasks.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          background: 'rgba(15, 10, 30, 0.6)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          gap: '8px',
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f8fafc' }}>
                            {task.title}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span>Due: {task.dueDate || task.targetDate || 'Past'}</span>
                            <span>•</span>
                            <span style={{ textTransform: 'capitalize' }}>{task.priority} Priority</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <DailyRecurrenceToggle
                            task={task}
                            size="sm"
                            onToggle={(updated: Task) => updateTask(updated)}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              setTimePickerAnchor(e.currentTarget);
                              setTimePickerTask(task);
                            }}
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              color: '#c084fc',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <Clock size={11} /> Set Time
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCarryForward(task)}
                            style={{
                              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(139, 92, 246, 0.3))',
                              border: '1px solid rgba(236, 72, 153, 0.5)',
                              borderRadius: '6px',
                              padding: '3px 10px',
                              color: '#fff',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            Move to Today
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await completeTask(task.id);
                              setCelebrationText(`Completed "${task.title}"! 🔥`);
                              setTimeout(() => setCelebrationText(null), 2500);
                            }}
                            style={{
                              background: 'rgba(16, 185, 129, 0.2)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              color: '#34d399',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            ✓ Done
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION J: Meaningful Empty States */}
            {!isLoading && occurrences.length === 0 && (
              <div
                style={{
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '16px',
                  border: '1px dashed rgba(192, 132, 252, 0.25)',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(192, 132, 252, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c084fc',
                  }}
                >
                  <Target size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
                    {overdueTasks.length > 0
                      ? `${overdueTasks.length} Pending Missions From Previous Days`
                      : unscheduledTasks.length > 0
                      ? `${unscheduledTasks.length} Missions in Backlog Ready to Schedule`
                      : 'No missions scheduled for this date'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', maxWidth: '360px', margin: '0 auto', lineHeight: 1.4 }}>
                    {overdueTasks.length > 0
                      ? 'You have incomplete missions from earlier dates. Bring them forward to today with one click or review them above.'
                      : unscheduledTasks.length > 0
                      ? 'You have tasks in your backlog without a scheduled date. Pick what you want to tackle today.'
                      : 'Start planning your day by scheduling tasks or creating your daily habits in the Task Builder.'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {overdueTasks.length > 0 && (
                    <button
                      type="button"
                      onClick={handleCarryForwardAll}
                      style={{
                        background: 'linear-gradient(135deg, #ef4444, #ec4899)',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '8px 18px',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#fff',
                        cursor: 'pointer',
                        boxShadow: '0 0 16px rgba(239, 68, 68, 0.4)',
                      }}
                    >
                      <RotateCcw size={14} /> Carry Forward All ({overdueTasks.length})
                    </button>
                  )}

                  {unscheduledTasks.length > 0 && overdueTasks.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setUnscheduledOpen(true)}
                      style={{
                        background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '8px 18px',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#fff',
                        cursor: 'pointer',
                        boxShadow: '0 0 16px rgba(14, 165, 233, 0.4)',
                      }}
                    >
                      <Inbox size={14} /> Pick Backlog Missions ({unscheduledTasks.length})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => (onOpenTaskBuilder ? onOpenTaskBuilder() : onNavigateSection && onNavigateSection('tasks'))}
                    style={{
                      background:
                        overdueTasks.length > 0 || unscheduledTasks.length > 0
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                      border:
                        overdueTasks.length > 0 || unscheduledTasks.length > 0
                          ? '1px solid rgba(255, 255, 255, 0.2)'
                          : 'none',
                      borderRadius: '10px',
                      padding: '8px 18px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={14} /> Create New Mission
                  </button>
                </div>
              </div>
            )}

            {/* List of Pending Missions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pendingOccurrences.map((occ) => {
                const lifeColor = getLifeAreaColor(occ.lifeArea);
                const priorityColor = getPriorityColor(occ.priority);
                const isRecurring = Boolean(occ.recurring && occ.recurring !== 'none');

                return (
                  <div
                    key={occ.taskId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '14px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      transition: 'all 0.2s ease',
                      gap: '10px',
                      position: 'relative',
                    }}
                  >
                    {/* Color bar on left edge */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '3px',
                        background: lifeColor,
                        borderRadius: '14px 0 0 14px',
                      }}
                    />

                    {/* Left: Checkbox + Title + Meta */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      <button
                        type="button"
                        onClick={() => handleToggle(occ.taskId, false)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'rgba(192, 132, 252, 0.4)',
                          display: 'flex',
                          padding: 0,
                          flexShrink: 0,
                          transition: 'transform 0.15s, color 0.15s',
                        }}
                        title="Mark complete"
                      >
                        <Circle size={22} />
                      </button>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              color: '#f8fafc',
                              wordBreak: 'break-word',
                            }}
                          >
                            {occ.title}
                          </span>
                          {isRecurring && (
                            <span
                              title={`Recurring ${occ.recurring}`}
                              style={{
                                fontSize: '0.65rem',
                                color: '#38bdf8',
                                background: 'rgba(56, 189, 248, 0.12)',
                                border: '1px solid rgba(56, 189, 248, 0.25)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              <Repeat size={10} /> {occ.recurring}
                            </span>
                          )}
                        </div>

                        {occ.notes && (
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px', lineClamp: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {occ.notes}
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.68rem', color: lifeColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: lifeColor }} />
                            {occ.lifeArea}
                          </span>

                          <span
                            style={{
                              fontSize: '0.64rem',
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: `${priorityColor}18`,
                              color: priorityColor,
                              border: `1px solid ${priorityColor}33`,
                              textTransform: 'uppercase',
                            }}
                          >
                            {occ.priority}
                          </span>

                          {occ.startTime && (
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={10} /> {formatTime(occ.startTime)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {/* Daily Recurrence Toggle */}
                      <DailyRecurrenceToggle
                        task={occ.originalTask}
                        size="sm"
                        onToggle={async (updated: Task) => {
                          await updateTask(updated);
                        }}
                      />

                      {/* Set Time Floating Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          setTimePickerAnchor(e.currentTarget);
                          setTimePickerTask(occ);
                        }}
                        style={{
                          background: occ.startTime ? 'rgba(192, 132, 252, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          border: occ.startTime ? '1px solid rgba(192, 132, 252, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          padding: '4px 8px',
                          color: occ.startTime ? '#c084fc' : '#94a3b8',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontWeight: 600,
                          transition: 'all 0.15s ease',
                        }}
                        title="Set Scheduled Time (Floating Popover)"
                      >
                        <Clock size={12} /> {occ.startTime ? occ.startTime : 'Set Time'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === occ.taskId ? null : occ.taskId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title="Task actions"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === occ.taskId && (
                        <div
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '40px',
                            zIndex: 100,
                            background: 'rgba(25, 15, 50, 0.98)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(192, 132, 252, 0.35)',
                            borderRadius: '10px',
                            padding: '4px',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            minWidth: '150px',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onNavigateSection?.('tasks');
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#f8fafc',
                              padding: '6px 10px',
                              fontSize: '0.76rem',
                              textAlign: 'left',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <ExternalLink size={12} /> Open in Tasks
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMoveToRecycleBin(occ)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#f87171',
                              padding: '6px 10px',
                              fontSize: '0.76rem',
                              textAlign: 'left',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <Trash2 size={12} /> Delete Task
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Unscheduled Backlog Tray ── */}
            {unscheduledTasks.length > 0 && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.85rem 1.15rem',
                  background: 'rgba(56, 189, 248, 0.04)',
                  borderRadius: '16px',
                  border: '1px dashed rgba(56, 189, 248, 0.25)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onClick={() => setUnscheduledOpen(!unscheduledOpen)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
                    <Inbox size={15} />
                    <span style={{ fontWeight: 700, fontSize: '0.84rem' }}>
                      Unscheduled Backlog ({unscheduledTasks.length} tasks ready to schedule)
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '0.75rem' }}>
                    <span>{unscheduledOpen ? 'Hide Backlog' : 'Show & Pick'}</span>
                    {unscheduledOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>

                {unscheduledOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '0.75rem' }}>
                    {unscheduledTasks.slice(0, 10).map((task) => (
                      <div
                        key={task.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 12px',
                          borderRadius: '10px',
                          background: 'rgba(15, 10, 30, 0.5)',
                          border: '1px solid rgba(56, 189, 248, 0.15)',
                          gap: '8px',
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>
                            {task.title}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <DailyRecurrenceToggle
                            task={task}
                            size="sm"
                            onToggle={(updated: Task) => updateTask(updated)}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              setTimePickerAnchor(e.currentTarget);
                              setTimePickerTask(task);
                            }}
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              color: '#c084fc',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <Clock size={11} /> Set Time
                          </button>
                          <button
                            type="button"
                            onClick={() => handleScheduleToday(task)}
                            style={{
                              background: 'rgba(56, 189, 248, 0.2)',
                              border: '1px solid rgba(56, 189, 248, 0.4)',
                              borderRadius: '6px',
                              padding: '3px 10px',
                              color: '#38bdf8',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            + Today
                          </button>
                        </div>
                      </div>
                    ))}
                    {unscheduledTasks.length > 10 && (
                      <div style={{ textAlign: 'center', paddingTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => onNavigateSection && onNavigateSection('tasks')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          View all {unscheduledTasks.length} backlog tasks in Tasks Hub →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Collapsible Completed Missions Section */}
            {completedOccurrences.length > 0 && (
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setCompletedOpen(!completedOpen)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    padding: 0,
                    marginBottom: completedOpen ? '10px' : 0,
                  }}
                >
                  {completedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  <span>Completed Today ({completedOccurrences.length})</span>
                </button>

                {completedOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {completedOccurrences.map((c) => (
                      <div
                        key={c.taskId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.015)',
                          border: '1px solid rgba(255, 255, 255, 0.04)',
                          gap: '8px',
                          opacity: 0.7,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <CheckCircle2 size={18} color="#34d399" />
                          <span
                            style={{
                              fontSize: '0.84rem',
                              color: '#94a3b8',
                              textDecoration: 'line-through',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {c.title}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggle(c.taskId, true)}
                          style={{
                            background: 'none',
                            border: '1px solid rgba(148, 163, 184, 0.25)',
                            borderRadius: '6px',
                            padding: '2px 8px',
                            color: '#94a3b8',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                          title="Undo completion and restore to pending"
                        >
                          <RotateCcw size={10} /> Undo
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── SECTION G: Daily Habits & Routines ────────────────────────── */}
          <div style={GLASS_CARD}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'rgba(6, 182, 212, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#06b6d4',
                  }}
                >
                  <Repeat size={16} />
                </div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                  Daily Habits & Routines
                </h4>
              </div>

              <span style={{ fontSize: '0.74rem', color: '#06b6d4', fontWeight: 700 }}>
                {habitsCompletedCount} of {habitOccurrences.length} Done ({habitPercentage}%)
              </span>
            </div>

            {habitOccurrences.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center', padding: '1rem 0' }}>
                No recurring habits configured for this date. Set a task's recurrence to "Daily" in the Task Builder to track it here.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {habitOccurrences.map((h) => (
                  <div
                    key={h.taskId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: h.isCompleted ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: h.isCompleted ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <button
                        type="button"
                        onClick={() => handleToggle(h.taskId, h.isCompleted)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: h.isCompleted ? '#34d399' : '#94a3b8',
                          display: 'flex',
                          padding: 0,
                        }}
                      >
                        {h.isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>
                      <span
                        style={{
                          fontSize: '0.86rem',
                          fontWeight: 600,
                          color: h.isCompleted ? '#94a3b8' : '#f8fafc',
                          textDecoration: h.isCompleted ? 'line-through' : 'none',
                        }}
                      >
                        {h.title}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.64rem',
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.1)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        textTransform: 'capitalize',
                      }}
                    >
                      {h.recurring}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Supporting Modules (Timeline, Companion, Upcoming, History) ─ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>
          {/* Anime Character Companion Card */}
          <div
            style={{
              ...GLASS_CARD,
              background: 'linear-gradient(135deg, rgba(30, 16, 58, 0.85), rgba(18, 12, 38, 0.75))',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(236, 72, 153, 0.25)',
                    border: '1px solid rgba(236, 72, 153, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ec4899',
                    fontSize: '1.1rem',
                  }}
                >
                  ✨
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>
                    {activeChar.name}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#c084fc' }}>
                    {activeChar.series} • Companion
                  </div>
                </div>
              </div>

              {/* Streak Flame Badge */}
              {streakData && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(249, 115, 22, 0.15)',
                    border: '1px solid rgba(249, 115, 22, 0.35)',
                    padding: '3px 8px',
                    borderRadius: '999px',
                  }}
                >
                  <Flame size={14} color="#f97316" />
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#f97316' }}>
                    {streakData.currentStreak} Day{streakData.currentStreak === 1 ? '' : 's'}
                  </span>
                </div>
              )}
            </div>

            <p style={{ margin: 0, fontSize: '0.78rem', color: '#cbd5e1', fontStyle: 'italic', lineHeight: 1.4 }}>
              "{activeChar.quote}"
            </p>
          </div>

          {/* ─── SECTION E: Today's Schedule (Chronological Timeline) ─────── */}
          <div style={GLASS_CARD}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a855f7',
                  }}
                >
                  <Clock size={16} />
                </div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc' }}>
                  Today's Schedule
                </h4>
              </div>

              {onOpenTimetable && (
                <button
                  type="button"
                  onClick={onOpenTimetable}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Full Timetable →
                </button>
              )}
            </div>

            {scheduledTimelineTasks.length === 0 ? (
              <div style={{ fontSize: '0.76rem', color: '#94a3b8', textAlign: 'center', padding: '1rem 0' }}>
                No timed blocks scheduled for this date. Use "Set Time" on any mission to place it on your schedule.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
                {scheduledTimelineTasks.map((st) => (
                  <div
                    key={st.taskId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.12)',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatTime(st.startTime || '00:00')}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: st.isCompleted ? '#94a3b8' : '#f8fafc',
                          textDecoration: st.isCompleted ? 'line-through' : 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {st.title}
                      </div>
                      <span style={{ fontSize: '0.64rem', color: getLifeAreaColor(st.lifeArea) }}>
                        {st.lifeArea}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── SECTION H: Upcoming Tasks ───────────────────────────────── */}
          <div style={GLASS_CARD}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8',
                  }}
                >
                  <CalendarDays size={16} />
                </div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc' }}>
                  Upcoming Tasks
                </h4>
              </div>
            </div>

            {upcomingTasks.length === 0 ? (
              <div style={{ fontSize: '0.76rem', color: '#94a3b8', textAlign: 'center', padding: '1rem 0' }}>
                No future tasks scheduled.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {upcomingTasks.map((ut) => {
                  const sDate = (ut.scheduledDate || ut.targetDate || ut.dueDate || '').slice(0, 10);
                  return (
                    <div
                      key={ut.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        gap: '8px',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: '#f8fafc',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {ut.title}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                          Due: {sDate}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigateSection && onNavigateSection('tasks')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#c084fc',
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                        title="View in Tasks"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── SECTION I: Daily Activity & History (7-Day Strip) ───────── */}
          <div style={GLASS_CARD}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'rgba(236, 72, 153, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ec4899',
                  }}
                >
                  <TrendingUp size={16} />
                </div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc' }}>
                  Execution History
                </h4>
              </div>
            </div>

            {/* Yesterday Summary Badge */}
            <div
              style={{
                fontSize: '0.76rem',
                color: '#cbd5e1',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Yesterday's Record:</span>
              <span style={{ fontWeight: 800, color: '#34d399' }}>
                {yesterdayCompletedCount} completed
              </span>
            </div>

            {/* 7-Day Interactive Week Calendar Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {weekDays.map((wd) => (
                <button
                  key={wd.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(wd.dateStr)}
                  style={{
                    background: wd.isSelected
                      ? 'linear-gradient(135deg, #ec4899, #8b5cf6)'
                      : wd.isNowToday
                        ? 'rgba(56, 189, 248, 0.15)'
                        : 'rgba(255, 255, 255, 0.03)',
                    border: wd.isSelected
                      ? '1px solid rgba(236, 72, 153, 0.6)'
                      : wd.isNowToday
                        ? '1px solid rgba(56, 189, 248, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    padding: '6px 2px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  title={`View ${wd.dateStr}`}
                >
                  <span style={{ fontSize: '0.6rem', color: wd.isSelected ? '#fff' : '#94a3b8' }}>
                    {wd.dayName}
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: wd.isSelected ? '#fff' : '#f8fafc' }}>
                    {wd.dayNum}
                  </span>
                  {wd.hasActivity && (
                    <span
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: wd.isSelected ? '#fff' : '#34d399',
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Anchored Floating Time Picker (Rendered via Document Body Portal) */}
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
          setCelebrationText(`Scheduled "${timePickerTask.title}" at ${result.startTime || 'specified time'}`);
          setTimeout(() => setCelebrationText(null), 2500);
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
          setCelebrationText(`Cleared scheduled time for "${timePickerTask.title}"`);
          setTimeout(() => setCelebrationText(null), 2500);
        }}
      />
    </div>
  );
}
