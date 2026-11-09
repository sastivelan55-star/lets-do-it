import React, { useState, useMemo, useEffect } from 'react';
import {
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Check,
  CheckCircle2,
  Edit3,
  Trash2,
  TrendingUp,
  Sun,
  BookOpen,
  GraduationCap,
  Coffee,
  Laptop,
  Code2,
  RefreshCw,
  BarChart3,
  Moon,
  Dumbbell,
  Target,
  MoreVertical,
  CornerUpRight,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Task, LifeArea, TaskPriority } from '../../types';
import { today, formatDate } from '../../utils/dates';
import TimetableScheduledBadge from '../common/TimetableScheduledBadge';

// Helper to format time into "04:00 AM"
export function formatTimetableTime(timeStr?: string): string {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  if (trimmed.toLowerCase().includes('am') || trimmed.toLowerCase().includes('pm')) {
    return trimmed;
  }
  const parts = trimmed.split(':');
  if (parts.length < 2) return trimmed;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return trimmed;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  const hourPadded = String(hour).padStart(2, '0');
  const minPadded = String(m).padStart(2, '0');
  return `${hourPadded}:${minPadded} ${ampm}`;
}

// Convert time string to minutes for chronological sorting
export function timeToMinutes(timeStr?: string): number {
  if (!timeStr) return 9999;
  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');
  const noAmPm = clean.replace(/[AP]M/, '').trim();
  const [hStr, mStr] = noAmPm.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h)) return 9999;
  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;
  return h * 60 + (isNaN(m) ? 0 : m);
}

// Dynamically resolve category/mission icon
export function getTimetableIcon(title: string, area?: LifeArea) {
  const t = (title || '').toLowerCase();
  if (t.includes('wake') || t.includes('morning') || t.includes('freshen') || t.includes('breakfast') || t.includes('sun')) {
    return <Sun size={18} color="#fbbf24" />;
  }
  if (t.includes('ready') || t.includes('shower') || t.includes('prep') || t.includes('clean') || t.includes('dress')) {
    return <CheckCircle2 size={18} color="#34d399" />;
  }
  if (t.includes('study') || t.includes('reading') || t.includes('book') || t.includes('dsa') || t.includes('learn') || t.includes('course') || t.includes('java')) {
    return <BookOpen size={18} color="#60a5fa" />;
  }
  if (t.includes('college') || t.includes('school') || t.includes('university') || t.includes('exam') || t.includes('degree') || t.includes('class') || t.includes('lecture')) {
    return <GraduationCap size={18} color="#a78bfa" />;
  }
  if (t.includes('lunch') || t.includes('dinner') || t.includes('break') || t.includes('snack') || t.includes('coffee') || t.includes('tea') || t.includes('eat')) {
    return <Coffee size={18} color="#38bdf8" />;
  }
  if (t.includes('project') || t.includes('code') || t.includes('dev') || t.includes('program') || t.includes('build') || t.includes('app') || t.includes('git')) {
    return <Code2 size={18} color="#c084fc" />;
  }
  if (t.includes('revision') || t.includes('review') || t.includes('sync') || t.includes('repeat') || t.includes('recap')) {
    return <RefreshCw size={18} color="#06b6d4" />;
  }
  if (t.includes('exercise') || t.includes('gym') || t.includes('workout') || t.includes('walk') || t.includes('run') || t.includes('fitness')) {
    return <Dumbbell size={18} color="#f472b6" />;
  }
  if (t.includes('plan') || t.includes('strategy') || t.includes('chart') || t.includes('analytics') || t.includes('metric')) {
    return <BarChart3 size={18} color="#38bdf8" />;
  }
  if (t.includes('night') || t.includes('sleep') || t.includes('bed') || t.includes('tomorrow')) {
    return <Moon size={18} color="#818cf8" />;
  }
  if (t.includes('laptop') || t.includes('work') || t.includes('meeting') || t.includes('office') || area === 'work') {
    return <Laptop size={18} color="#a855f7" />;
  }
  return <Target size={18} color="#c084fc" />;
}

// 4-Point Diamond Star Component matching the screenshot
function DiamondStar({ size = 18, color = '#c084fc', glow = true }: { size?: number; color?: string; glow?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: glow ? `drop-shadow(0 0 8px ${color})` : 'none',
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
    >
      <path
        d="M12 0L14.7 9.3L24 12L14.7 14.7L12 24L9.3 14.7L0 12L9.3 9.3L12 0Z"
        fill={color}
      />
    </svg>
  );
}

interface DailyTimetableProps {
  onNavigateSection?: (section: string) => void;
}

export default function DailyTimetable({ onNavigateSection: _onNavigateSection }: DailyTimetableProps) {
  const { tasks, addTask, updateTask, completeTask, removeTask } = useApp();

  // Selected date defaults to today
  const [selectedDate, setSelectedDate] = useState<string>(today());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Modals & Menu states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);
  const [timeChangeTaskId, setTimeChangeTaskId] = useState<string | null>(null);
  const [tempStartTime, setTempStartTime] = useState<string>('08:00');
  const [tempEndTime, setTempEndTime] = useState<string>('');
  const [showUnscheduledDrawer, setShowUnscheduledDrawer] = useState(true);

  // Form states for Add / Edit
  const [modalTitle, setModalTitle] = useState('');
  const [modalStartTime, setModalStartTime] = useState('08:00');
  const [modalEndTime, setModalEndTime] = useState('');
  const [modalArea, setModalArea] = useState<LifeArea>('growth');
  const [modalPriority, setModalPriority] = useState<TaskPriority>('medium');
  const [modalNotes, setModalNotes] = useState('');

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isSelectedDateToday = selectedDate === today();

  // Day navigation
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleJumpToToday = () => {
    setSelectedDate(today());
  };

  // Filter tasks for the selected date
  const { scheduledTasks, unscheduledTasks } = useMemo(() => {
    const dayTasks = tasks.filter((t) => {
      if (t.isDeleted) return false;
      const tDate = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
      return tDate === selectedDate;
    });

    const scheduled = dayTasks.filter((t) => Boolean(t.startTime || t.plannedStartTime));
    const unscheduled = dayTasks.filter((t) => !t.startTime && !t.plannedStartTime);

    // Sort scheduled chronologically
    scheduled.sort((a, b) => {
      const timeA = timeToMinutes(a.startTime || a.plannedStartTime);
      const timeB = timeToMinutes(b.startTime || b.plannedStartTime);
      return timeA - timeB;
    });

    return { scheduledTasks: scheduled, unscheduledTasks: unscheduled };
  }, [tasks, selectedDate]);

  // Current system minutes from midnight
  const currentMinutes = useMemo(() => {
    return currentTime.getHours() * 60 + currentTime.getMinutes();
  }, [currentTime]);

  // Identify active / upcoming missions
  const activeMissionIndex = useMemo(() => {
    if (!isSelectedDateToday || scheduledTasks.length === 0) return -1;

    // First check if any mission is currently active by time window
    const activeIdx = scheduledTasks.findIndex((t) => {
      if (t.status === 'completed') return false;
      const startMin = timeToMinutes(t.startTime || t.plannedStartTime);
      const endMin = t.endTime ? timeToMinutes(t.endTime) : startMin + 60;
      return currentMinutes >= startMin && currentMinutes < endMin;
    });

    if (activeIdx !== -1) return activeIdx;

    // Otherwise find the first upcoming incomplete mission
    const upcomingIdx = scheduledTasks.findIndex((t) => {
      if (t.status === 'completed') return false;
      const startMin = timeToMinutes(t.startTime || t.plannedStartTime);
      return startMin > currentMinutes;
    });

    if (upcomingIdx !== -1) return upcomingIdx;

    // Fallback to first incomplete mission
    const firstIncomplete = scheduledTasks.findIndex((t) => t.status !== 'completed');
    return firstIncomplete !== -1 ? firstIncomplete : 0;
  }, [scheduledTasks, isSelectedDateToday, currentMinutes]);

  // Stats calculation
  const totalTasks = scheduledTasks.length;
  const completedTasks = scheduledTasks.filter((t) => t.status === 'completed').length;
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Toggle mission completion
  const handleToggleComplete = async (taskId: string) => {
    await completeTask(taskId);
  };

  // Open modal to add a brand new mission
  const handleOpenAddModal = () => {
    setModalTitle('');
    setModalStartTime('08:00');
    setModalEndTime('');
    setModalArea('growth');
    setModalPriority('medium');
    setModalNotes('');
    setEditingTask(null);
    setIsAddModalOpen(true);
  };

  // Open modal to edit existing mission
  const handleOpenEditModal = (t: Task) => {
    setEditingTask(t);
    setModalTitle(t.title);
    setModalStartTime(t.startTime || t.plannedStartTime || '08:00');
    setModalEndTime(t.endTime || '');
    setModalArea(t.lifeArea || 'growth');
    setModalPriority(t.priority || 'medium');
    setModalNotes(t.notes || t.description || '');
    setIsAddModalOpen(true);
    setActiveMenuTaskId(null);
  };

  // Save add or edit
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) return;

    if (editingTask) {
      await updateTask({
        ...editingTask,
        title: modalTitle.trim(),
        startTime: modalStartTime || undefined,
        plannedStartTime: modalStartTime || undefined,
        endTime: modalEndTime || undefined,
        lifeArea: modalArea,
        priority: modalPriority,
        notes: modalNotes.trim() || undefined,
        targetDate: selectedDate,
        dueDate: selectedDate,
        scheduledDate: selectedDate,
      });
    } else {
      await addTask({
        title: modalTitle.trim(),
        startTime: modalStartTime || undefined,
        plannedStartTime: modalStartTime || undefined,
        endTime: modalEndTime || undefined,
        lifeArea: modalArea,
        priority: modalPriority,
        status: 'not-started',
        notes: modalNotes.trim() || undefined,
        targetDate: selectedDate,
        dueDate: selectedDate,
        scheduledDate: selectedDate,
      });
    }

    setIsAddModalOpen(false);
    setEditingTask(null);
  };

  // Remove from timetable without deleting the mission (clears scheduling fields)
  const handleRemoveFromTimetable = async (t: Task) => {
    await updateTask({
      ...t,
      startTime: undefined,
      plannedStartTime: undefined,
      endTime: undefined,
      targetDate: t.targetDate || selectedDate,
      dueDate: t.dueDate || selectedDate,
      scheduledDate: t.scheduledDate || selectedDate,
    });
    setActiveMenuTaskId(null);
  };

  // Postpone mission to tomorrow
  const handlePostponeToTomorrow = async (t: Task) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const tomorrowStr = d.toISOString().slice(0, 10);

    await updateTask({
      ...t,
      targetDate: tomorrowStr,
      dueDate: tomorrowStr,
      scheduledDate: tomorrowStr,
    });
    setActiveMenuTaskId(null);
  };

  // Quick assign time to an unscheduled mission
  const handleQuickAssignTime = (t: Task) => {
    setTimeChangeTaskId(t.id);
    setTempStartTime(t.startTime || t.plannedStartTime || '08:00');
    setTempEndTime(t.endTime || '');
  };

  const handleSaveQuickTime = async (taskId: string) => {
    const t = tasks.find((item) => item.id === taskId);
    if (!t) return;

    await updateTask({
      ...t,
      startTime: tempStartTime,
      plannedStartTime: tempStartTime,
      endTime: tempEndTime || undefined,
      targetDate: selectedDate,
      dueDate: selectedDate,
      scheduledDate: selectedDate,
    });
    setTimeChangeTaskId(null);
  };

  // Delete mission with confirmation
  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this mission?')) {
      await removeTask(taskId);
      setActiveMenuTaskId(null);
    }
  };

  return (
    <div
      className="daily-timetable-wrapper"
      style={{
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        margin: '0 auto',
        padding: '0.25rem 0.5rem calc(96px + env(safe-area-inset-bottom, 24px))',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      {/* Main Glassmorphic Container matching media_1794231523432_e1e6df67.png */}
      <div
        className="timetable-glass-panel"
        style={{
          background: 'rgba(18, 10, 36, 0.78)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          padding: '1.5rem',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45), inset 0 0 20px rgba(168, 85, 247, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          position: 'relative',
        }}
      >
        {/* Top Header: Clock + Title "Daily Timetable" + Date Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            borderBottom: '1px solid rgba(168, 85, 247, 0.2)',
            paddingBottom: '1rem',
          }}
        >
          {/* Left: Analog Neon Clock + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, rgba(20, 10, 40, 0.8) 100%)',
                border: '2px solid #a855f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c084fc',
                boxShadow: '0 0 16px rgba(168, 85, 247, 0.5), inset 0 0 10px rgba(168, 85, 247, 0.3)',
                flexShrink: 0,
              }}
            >
              <Clock size={22} color="#c084fc" />
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  fontFamily: 'var(--font-display)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>Daily</span>
                <span
                  style={{
                    background: 'linear-gradient(135deg, #c084fc, #e879f9)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Timetable
                </span>
              </h2>
              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: '0.82rem',
                  color: '#94a3b8',
                  letterSpacing: '0.03em',
                  fontWeight: 500,
                }}
              >
                Plan. Focus. Achieve.
              </p>
            </div>
          </div>

          {/* Right: Date Navigation & Quick Add */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Day Nav: Prev, Date, Next */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '12px',
                padding: '3px 6px',
                gap: '4px',
              }}
            >
              <button
                type="button"
                onClick={handlePrevDay}
                aria-label="Previous day"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#c084fc',
                  padding: '5px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronLeft size={16} />
              </button>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: isSelectedDateToday ? '#38bdf8' : '#f8fafc',
                  cursor: 'pointer',
                  padding: '2px 6px',
                }}
              >
                <Calendar size={13} color="#c084fc" />
                <span>{isSelectedDateToday ? 'Today' : formatDate(selectedDate)}</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                  style={{
                    opacity: 0,
                    width: '1px',
                    height: '1px',
                    position: 'absolute',
                    pointerEvents: 'none',
                  }}
                />
              </label>

              <button
                type="button"
                onClick={handleNextDay}
                aria-label="Next day"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#c084fc',
                  padding: '5px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {!isSelectedDateToday && (
              <button
                type="button"
                onClick={handleJumpToToday}
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#38bdf8',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Today
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenAddModal}
              style={{
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                border: 'none',
                borderRadius: '10px',
                padding: '7px 14px',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 0 14px rgba(168, 85, 247, 0.4)',
              }}
            >
              <Plus size={15} /> Add Mission
            </button>
          </div>
        </div>

        {/* Timetable List Section with glowing vertical rail */}
        <div style={{ position: 'relative', paddingLeft: '1.8rem', minHeight: '260px' }}>
          {/* Vertical rail line */}
          <div
            style={{
              position: 'absolute',
              left: '11px',
              top: '20px',
              bottom: '24px',
              width: '2px',
              background: 'linear-gradient(180deg, #c084fc 0%, rgba(168, 85, 247, 0.3) 100%)',
              boxShadow: '0 0 8px rgba(192, 132, 252, 0.4)',
            }}
          />

          {scheduledTasks.length === 0 ? (
            <div
              style={{
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '18px',
                border: '1px dashed rgba(168, 85, 247, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                margin: '10px 0',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'rgba(168, 85, 247, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#c084fc',
                }}
              >
                <Clock size={22} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                  No Timetable Missions for {isSelectedDateToday ? 'Today' : selectedDate}
                </h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', maxWidth: '320px' }}>
                  {unscheduledTasks.length > 0
                    ? `You have ${unscheduledTasks.length} unscheduled mission(s) for this day. Assign a time below or add a new scheduled mission!`
                    : 'Plan your day by adding missions with assigned start times.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddModal}
                style={{
                  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '7px 18px',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 0 16px rgba(168, 85, 247, 0.4)',
                }}
              >
                <Plus size={14} /> Schedule First Mission
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {scheduledTasks.map((t, idx) => {
                const isActiveOrNext = idx === activeMissionIndex;
                const isCompleted = t.status === 'completed';
                const timeStr = formatTimetableTime(t.startTime || t.plannedStartTime);
                const endTimeStr = t.endTime ? formatTimetableTime(t.endTime) : '';
                const displayTime = endTimeStr ? `${timeStr} - ${endTimeStr}` : timeStr;

                // Activity icon
                const icon = getTimetableIcon(t.title, t.lifeArea);

                return (
                  <div
                    key={t.id}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {/* Rail Node Indicator */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '-1.8rem',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2,
                      }}
                    >
                      {isActiveOrNext ? (
                        <DiamondStar size={20} color="#c084fc" glow />
                      ) : (
                        <div
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: isCompleted ? '#10b981' : '#a855f7',
                            boxShadow: isCompleted
                              ? '0 0 8px rgba(16, 185, 129, 0.6)'
                              : '0 0 6px rgba(168, 85, 247, 0.4)',
                            border: '2px solid rgba(255, 255, 255, 0.2)',
                          }}
                        />
                      )}
                    </div>

                    {/* Mission Slot Card */}
                    <div
                      className={`timetable-slot ${isActiveOrNext ? 'active-slot' : ''}`}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1.15rem',
                        borderRadius: '16px',
                        background: isActiveOrNext
                          ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(99, 102, 241, 0.16) 100%)'
                          : isCompleted
                          ? 'rgba(16, 185, 129, 0.05)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: isActiveOrNext
                          ? '1px solid rgba(192, 132, 252, 0.65)'
                          : isCompleted
                          ? '1px solid rgba(16, 185, 129, 0.25)'
                          : '1px solid rgba(255, 255, 255, 0.07)',
                        boxShadow: isActiveOrNext
                          ? '0 0 24px rgba(168, 85, 247, 0.35), inset 0 0 12px rgba(168, 85, 247, 0.15)'
                          : 'none',
                        transition: 'all 0.2s ease',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      {/* Left: Icon, Time, Separator, Title */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          flex: 1,
                          minWidth: '220px',
                        }}
                      >
                        {/* Icon */}
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '10px',
                            background: isActiveOrNext
                              ? 'rgba(192, 132, 252, 0.2)'
                              : 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {icon}
                        </div>

                        {/* Time */}
                        <span
                          style={{
                            fontSize: '0.86rem',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            color: isActiveOrNext ? '#ffffff' : isCompleted ? '#94a3b8' : '#e2e8f0',
                            letterSpacing: '0.02em',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {displayTime}
                        </span>

                        {/* Subtle Separator */}
                        <span style={{ color: 'rgba(148, 163, 184, 0.4)', fontWeight: 300 }}>|</span>

                        {/* Title & Scheduled Tooltip Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.92rem',
                              fontWeight: 700,
                              color: isCompleted ? '#94a3b8' : '#f8fafc',
                              textDecoration: isCompleted ? 'line-through' : 'none',
                              letterSpacing: '0.01em',
                            }}
                          >
                            {t.title}
                          </span>
                          <TimetableScheduledBadge />
                        </div>
                      </div>

                      {/* Right: Status Capsule Badge, Checkbox & Actions Menu */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Status capsule pill */}
                        {isActiveOrNext && !isCompleted && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '3px 10px',
                              borderRadius: '999px',
                              background: 'rgba(168, 85, 247, 0.25)',
                              border: '1px solid rgba(192, 132, 252, 0.5)',
                              color: '#e9d5ff',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              letterSpacing: '0.02em',
                              boxShadow: '0 0 10px rgba(168, 85, 247, 0.3)',
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#c084fc',
                                boxShadow: '0 0 6px #c084fc',
                              }}
                            />
                            Upcoming
                          </span>
                        )}

                        {isCompleted && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              color: '#34d399',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                            }}
                          >
                            Completed
                          </span>
                        )}

                        {/* Completion Checkbox Ring matching screenshot */}
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(t.id)}
                          aria-label={`Mark ${t.title} ${isCompleted ? 'incomplete' : 'complete'}`}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: isCompleted
                              ? 'none'
                              : '2px solid rgba(192, 132, 252, 0.5)',
                            background: isCompleted ? '#10b981' : 'transparent',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                            boxShadow: isCompleted ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {isCompleted && <Check size={14} strokeWidth={3} />}
                        </button>

                        {/* Actions Menu Dropdown */}
                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuTaskId(activeMenuTaskId === t.id ? null : t.id)
                            }
                            aria-label="Mission actions"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94a3b8',
                              padding: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: '6px',
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeMenuTaskId === t.id && (
                            <div
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                zIndex: 100,
                                background: 'rgba(20, 12, 38, 0.95)',
                                backdropFilter: 'blur(16px)',
                                border: '1px solid rgba(168, 85, 247, 0.35)',
                                borderRadius: '12px',
                                padding: '6px',
                                minWidth: '190px',
                                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '3px',
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(t)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  background: 'none',
                                  border: 'none',
                                  color: '#f8fafc',
                                  padding: '7px 10px',
                                  borderRadius: '8px',
                                  fontSize: '0.78rem',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                }}
                              >
                                <Edit3 size={14} color="#38bdf8" /> Edit Mission
                              </button>

                              <button
                                type="button"
                                onClick={() => handleQuickAssignTime(t)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  background: 'none',
                                  border: 'none',
                                  color: '#f8fafc',
                                  padding: '7px 10px',
                                  borderRadius: '8px',
                                  fontSize: '0.78rem',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                }}
                              >
                                <Clock size={14} color="#a855f7" /> Change Time
                              </button>

                              <button
                                type="button"
                                onClick={() => handlePostponeToTomorrow(t)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  background: 'none',
                                  border: 'none',
                                  color: '#f8fafc',
                                  padding: '7px 10px',
                                  borderRadius: '8px',
                                  fontSize: '0.78rem',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                }}
                              >
                                <CornerUpRight size={14} color="#fbbf24" /> Postpone to Tomorrow
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveFromTimetable(t)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  background: 'none',
                                  border: 'none',
                                  color: '#cbd5e1',
                                  padding: '7px 10px',
                                  borderRadius: '8px',
                                  fontSize: '0.78rem',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                }}
                              >
                                <X size={14} color="#94a3b8" /> Remove from Timetable
                              </button>

                              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '2px 0' }} />

                              <button
                                type="button"
                                onClick={() => handleDeleteTask(t.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  background: 'none',
                                  border: 'none',
                                  color: '#f87171',
                                  padding: '7px 10px',
                                  borderRadius: '8px',
                                  fontSize: '0.78rem',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                }}
                              >
                                <Trash2 size={14} color="#f87171" /> Delete Mission
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Time Change Modal / Popover */}
        {timeChangeTaskId && (
          <div
            style={{
              padding: '1rem',
              background: 'rgba(25, 15, 45, 0.95)',
              borderRadius: '14px',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="#c084fc" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
                Set Scheduled Time:
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Start:
                <input
                  type="time"
                  value={tempStartTime}
                  onChange={(e) => setTempStartTime(e.target.value)}
                  className="cyber-date-picker"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                />
              </label>

              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                End (opt):
                <input
                  type="time"
                  value={tempEndTime}
                  onChange={(e) => setTempEndTime(e.target.value)}
                  className="cyber-date-picker"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => handleSaveQuickTime(timeChangeTaskId)}
                style={{
                  background: '#10b981',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '5px 12px',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>

              <button
                type="button"
                onClick={() => setTimeChangeTaskId(null)}
                style={{
                  background: 'none',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  color: '#94a3b8',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Unscheduled Today Missions Drawer (Connects Today Missions <-> Daily Timetable) */}
        {unscheduledTasks.length > 0 && (
          <div
            style={{
              marginTop: '0.5rem',
              padding: '1rem 1.25rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '16px',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              onClick={() => setShowUnscheduledDrawer(!showUnscheduledDrawer)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={15} color="#c084fc" />
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
                  Unscheduled Today Missions ({unscheduledTasks.length})
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  • In Today Missions but not on timetable
                </span>
              </div>
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#c084fc',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {showUnscheduledDrawer ? 'Hide' : 'Show'}
              </button>
            </div>

            {showUnscheduledDrawer && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {unscheduledTasks.map((ut) => (
                  <div
                    key={ut.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.9rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      gap: '10px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: ut.status === 'completed' ? '#94a3b8' : '#f8fafc',
                          textDecoration: ut.status === 'completed' ? 'line-through' : 'none',
                        }}
                      >
                        {ut.title}
                      </span>
                      <span
                        style={{
                          fontSize: '0.66rem',
                          color: '#94a3b8',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {ut.lifeArea}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuickAssignTime(ut)}
                      style={{
                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(56, 189, 248, 0.3))',
                        border: '1px solid rgba(168, 85, 247, 0.5)',
                        color: '#e2e8f0',
                        borderRadius: '8px',
                        padding: '4px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Clock size={11} color="#38bdf8" /> Schedule Time
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom Card: "Stay Focused — You're doing great!" matching screenshot */}
        <div
          className="stay-focused-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.35rem',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.15) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
            marginTop: '0.5rem',
          }}
        >
          {/* Left: 4-Point Star Icon + Text */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(168, 85, 247, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(168, 85, 247, 0.4)',
              }}
            >
              <DiamondStar size={18} color="#c084fc" glow />
            </div>

            <div>
              <h4
                style={{
                  margin: 0,
                  fontSize: '0.98rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '0.01em',
                }}
              >
                Stay Focused
              </h4>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '0.78rem',
                  color: '#c084fc',
                  fontWeight: 500,
                }}
              >
                You're doing great!
              </p>
            </div>
          </div>

          {/* Right: Progress Telemetry with Trending Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {totalTasks > 0 && (
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#f8fafc',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {completedTasks}/{totalTasks} ({completionPercent}%)
              </span>
            )}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'rgba(192, 132, 252, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c084fc',
              }}
            >
              <TrendingUp size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Mission Modal */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(10, 5, 25, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
        >
          <div
            style={{
              background: 'rgba(24, 14, 48, 0.96)',
              border: '1px solid rgba(168, 85, 247, 0.5)',
              borderRadius: '20px',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '460px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(168, 85, 247, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={20} color="#c084fc" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                  {editingTask ? 'Edit Timetable Mission' : 'Add Timetable Mission'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Mission Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '6px' }}>
                  MISSION TITLE *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Study (DSA + Java)"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Time Slots: Start Time & End Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '6px' }}>
                    START TIME *
                  </label>
                  <input
                    type="time"
                    required
                    value={modalStartTime}
                    onChange={(e) => setModalStartTime(e.target.value)}
                    className="cyber-date-picker"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(168, 85, 247, 0.35)',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '6px' }}>
                    END TIME (OPTIONAL)
                  </label>
                  <input
                    type="time"
                    value={modalEndTime}
                    onChange={(e) => setModalEndTime(e.target.value)}
                    className="cyber-date-picker"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(168, 85, 247, 0.35)',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Category / Life Area */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '6px' }}>
                    CATEGORY / AREA
                  </label>
                  <select
                    value={modalArea}
                    onChange={(e) => setModalArea(e.target.value as LifeArea)}
                    style={{
                      width: '100%',
                      background: 'rgba(20, 10, 40, 0.9)',
                      border: '1px solid rgba(168, 85, 247, 0.35)',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="growth">Growth / Study</option>
                    <option value="work">Work / Dev</option>
                    <option value="routine">Routine / Habits</option>
                    <option value="health">Health / Fitness</option>
                    <option value="personal">Personal / Leisure</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '6px' }}>
                    PRIORITY
                  </label>
                  <select
                    value={modalPriority}
                    onChange={(e) => setModalPriority(e.target.value as TaskPriority)}
                    style={{
                      width: '100%',
                      background: 'rgba(20, 10, 40, 0.9)',
                      border: '1px solid rgba(168, 85, 247, 0.35)',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '6px' }}>
                  NOTES / DETAILS
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional focus goals or notes..."
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    color: '#94a3b8',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px 20px',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: '0 0 16px rgba(168, 85, 247, 0.4)',
                  }}
                >
                  {editingTask ? 'Save Changes' : 'Create Mission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
