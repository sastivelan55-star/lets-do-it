// Life OS — Productivity Dashboard
// Clean, streamlined missions timeline, milestones, celebrations & quote

import { useState, useMemo } from 'react';
import {
  Target,
  Trophy,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Plus,
  Clock,
  MoreVertical,
  X,
  Trash2,
  Flame,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Task } from '../../types';
import TimetableScheduledBadge from '../common/TimetableScheduledBadge';
import { formatTimetableTime, getTimetableIcon } from '../timetable/DailyTimetable';
import TaskRecycleBinModal from '../taskBuilder/TaskRecycleBinModal';
import { today } from '../../utils/dates';

interface AnimeFantasyDashboardProps {
  onNavigateSection?: (section: string) => void;
  onOpenTaskBuilder?: () => void;
  onOpenTimetable?: () => void;
}

export default function AnimeFantasyDashboard({
  onNavigateSection,
  onOpenTaskBuilder,
  onOpenTimetable,
}: AnimeFantasyDashboardProps) {
  const {
    settings,
    tasks,
    deletedTasks,
    completeTask,
    updateTask,
    removeTask,
    restoreTask,
    permanentDeleteTask,
    emptyRecycleBin,
    currentDate,
    streakData,
    carryForwardOverdueTasks,
  } = useApp();

  const rawWidgets = settings.personalization?.dashboardWidgets;
  const widgets = {
    showMissions: rawWidgets?.showMissions !== false,
    showMilestone: rawWidgets?.showMilestone !== false,
    showStreakLevel: rawWidgets?.showStreakLevel !== false,
    showQuote: rawWidgets?.showQuote !== false,
    enableAnimations: rawWidgets?.enableAnimations !== false,
    density: rawWidgets?.density || 'comfortable',
  };

  // Task Completion Celebration Banner State
  const [celebrationText, setCelebrationText] = useState<string | null>(null);

  // Recycle Bin Modal Visibility State
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);

  // Accordion state for completed missions section
  const [showCompletedMissions, setShowCompletedMissions] = useState(true);
  const [isRollingOverdue, setIsRollingOverdue] = useState(false);

  // Dynamic Date Formatting
  const todayDateStr = currentDate || today();
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });

  // Scheduling modal state
  const [timeModalTask, setTimeModalTask] = useState<Task | null>(null);
  const [timeModalStart, setTimeModalStart] = useState('08:00');
  const [timeModalEnd, setTimeModalEnd] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // 1. Active missions scheduled for today (not completed, not deleted)
  const activeTodayTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    return tasks.filter((t) => {
      if (t.isDeleted) return false;
      if (t.status === 'completed') return false;
      const taskDate = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
      return taskDate === todayDateStr;
    });
  }, [tasks, todayDateStr]);

  // 2. Completed missions for today (completed, with scheduled date or completedAt == today)
  const completedTodayTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    return tasks.filter((t) => {
      if (t.isDeleted) return false;
      if (t.status !== 'completed') return false;
      const taskDate = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
      const compDate = (t.completedAt || '').slice(0, 10);
      return taskDate === todayDateStr || compDate === todayDateStr;
    });
  }, [tasks, todayDateStr]);

  // 3. Overdue missions (scheduled before today, not completed, not rescheduled, not deleted)
  const overdueTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    return tasks.filter((t) => {
      if (t.isDeleted) return false;
      if (t.status === 'completed' || t.status === 'rescheduled') return false;
      const taskDate = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
      return taskDate !== '' && taskDate < todayDateStr;
    });
  }, [tasks, todayDateStr]);

  const totalMissionsToday = activeTodayTasks.length + completedTodayTasks.length;
  const completedCount = completedTodayTasks.length;
  const totalMissions = totalMissionsToday;

  // Toggle mission completion without deleting to recycle bin (supports instant reversible undo)
  const handleToggleMission = async (missionId: string, currentCompleted: boolean) => {
    if (!currentCompleted) {
      setCelebrationText('Mission Completed! (+10 XP) 🔥');
      try {
        await completeTask(missionId);
      } catch (err) {
        console.error('Failed to complete task:', err);
      }
      setTimeout(() => setCelebrationText(null), 3000);
    } else {
      // Reversible: undo completion and return to active
      setCelebrationText('Mission restored to Active');
      try {
        await completeTask(missionId);
      } catch (err) {
        console.error('Failed to undo task completion:', err);
      }
      setTimeout(() => setCelebrationText(null), 2500);
    }
  };

  const handleCarryForwardAllOverdue = async () => {
    setIsRollingOverdue(true);
    try {
      const count = await carryForwardOverdueTasks();
      setCelebrationText(`Carried forward ${count} overdue mission(s) to Today!`);
      setTimeout(() => setCelebrationText(null), 3000);
    } catch (err) {
      console.error('Failed to carry forward overdue missions:', err);
    } finally {
      setIsRollingOverdue(false);
    }
  };

  const handleMoveToRecycleBin = async (taskId: string) => {
    setActiveMenuId(null);
    setCelebrationText('Mission moved to Recycle Bin');
    setTimeout(() => setCelebrationText(null), 2500);
    await removeTask(taskId);
  };

  const handleRestoreFromRecycleBin = async (taskId: string) => {
    await restoreTask(taskId);

    // If task was marked completed, reset status to not-started so it reappears active in Today Missions
    const target = deletedTasks.find((t) => t.id === taskId);
    if (target && target.status === 'completed') {
      await updateTask({
        ...target,
        isDeleted: false,
        deletedAt: undefined,
        status: 'not-started',
        completedAt: undefined,
        updatedAt: new Date().toISOString(),
      });
    }

    setCelebrationText(`Restored "${target?.title || 'task'}" to Today Missions!`);
    setTimeout(() => setCelebrationText(null), 3000);
  };

  const handleOpenTimeModal = (t: Task) => {
    setTimeModalTask(t);
    setTimeModalStart(t.startTime || t.plannedStartTime || '08:00');
    setTimeModalEnd(t.endTime || '');
    setActiveMenuId(null);
  };

  const handleSaveTimeModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeModalTask) return;

    await updateTask({
      ...timeModalTask,
      startTime: timeModalStart,
      plannedStartTime: timeModalStart,
      endTime: timeModalEnd || undefined,
      targetDate: todayDateStr,
      dueDate: todayDateStr,
      scheduledDate: todayDateStr,
    });

    setTimeModalTask(null);
  };

  const handleRemoveFromTimetable = async (t: Task) => {
    await updateTask({
      ...t,
      startTime: undefined,
      plannedStartTime: undefined,
      endTime: undefined,
      targetDate: todayDateStr,
      dueDate: todayDateStr,
      scheduledDate: todayDateStr,
    });
    setActiveMenuId(null);
  };

  return (
    <div
      className="anime-dashboard-container"
      style={{
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        margin: '0 auto',
        padding: '0.5rem 1rem calc(96px + env(safe-area-inset-bottom, 24px))',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      {/* Celebration Notification Banner */}
      {celebrationText && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(76px + env(safe-area-inset-bottom, 16px))',
            right: '16px',
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
            maxWidth: 'calc(100vw - 32px)',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              flexShrink: 0,
            }}
          >
            <Check size={16} strokeWidth={3} />
          </div>
          <span style={{ overflowWrap: 'anywhere' }}>{celebrationText}</span>
          <Sparkles size={16} color="#facc15" style={{ flexShrink: 0 }} />
        </div>
      )}

      {/* Main Grid: Today's Missions & Next Milestone */}
      <div
        className="dash-middle-grid"
        style={{
          display: 'grid',
          gap: '1.25rem',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Today's Missions Glass Card */}
        {widgets.showMissions && (
          <div
            className="dash-today-card"
            style={{
              background: 'rgba(18, 12, 38, 0.75)',
              backdropFilter: 'blur(16px)',
              borderRadius: '20px',
              border: '1px solid rgba(192, 132, 252, 0.25)',
              padding: 'clamp(0.85rem, 2.5vw, 1.25rem)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              minHeight: '220px',
              transition: 'all 0.25s ease',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/* Header */}
            <div
              className="dash-today-header"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                width: '100%',
              }}
            >
              <div
                className="dash-today-title-block"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: '1 1 auto' }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f87171',
                    flexShrink: 0,
                  }}
                >
                  <Target size={18} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.01em' }}>
                    Today Missions
                  </h3>
                  <div style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span>Your plan for today • {formattedDate}</span>
                    <span style={{ fontSize: '0.68rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                      {completedTodayTasks.length}/{totalMissionsToday} Completed
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="dash-today-actions"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsRecycleBinOpen(true)}
                  className="btn btn-ghost btn-sm"
                  style={{
                    color: deletedTasks.length > 0 ? '#f87171' : '#94a3b8',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: deletedTasks.length > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: deletedTasks.length > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    boxShadow: deletedTasks.length > 0 ? '0 0 12px rgba(239, 68, 68, 0.2)' : 'none',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                  title="View deleted & auto-recycled missions"
                >
                  <Trash2 size={13} color={deletedTasks.length > 0 ? '#f87171' : '#94a3b8'} />
                  <span>Recycle Bin ({deletedTasks.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => (onOpenTimetable ? onOpenTimetable() : onNavigateSection && onNavigateSection('timeline'))}
                  className="btn btn-ghost btn-sm"
                  style={{
                    color: '#c084fc',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(168, 85, 247, 0.12)',
                    padding: '4px 9px',
                    borderRadius: '8px',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Clock size={13} color="#c084fc" /> Timetable
                </button>

                <button
                  type="button"
                  onClick={() => (onOpenTaskBuilder ? onOpenTaskBuilder() : onNavigateSection && onNavigateSection('tasks'))}
                  className="btn btn-ghost btn-sm"
                  style={{
                    color: '#94a3b8',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '4px 8px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>View All</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Overdue Carryover Banner */}
            {overdueTasks.length > 0 && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '12px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <AlertTriangle size={16} color="#f87171" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', color: '#fecaca', fontWeight: 600 }}>
                    {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''} from previous days
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCarryForwardAllOverdue}
                  disabled={isRollingOverdue}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #f97316)',
                    border: 'none',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <RotateCcw size={12} className={isRollingOverdue ? 'animate-spin' : ''} />
                  Carry Over to Today
                </button>
              </div>
            )}

            {/* Missions Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {activeTodayTasks.length === 0 ? (
                completedTodayTasks.length === 0 ? (
                  <div
                    style={{
                      padding: '1.5rem 1rem',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '16px',
                      border: '1px dashed rgba(192, 132, 252, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'rgba(192, 132, 252, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#c084fc',
                      }}
                    >
                      <Target size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                        No Missions Scheduled
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#94a3b8', maxWidth: '300px', margin: '0 auto', lineHeight: 1.4 }}>
                        You have no pending missions for today. Add new tasks in the Task Builder to track your progress!
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => (onOpenTaskBuilder ? onOpenTaskBuilder() : onNavigateSection && onNavigateSection('tasks'))}
                      style={{
                        marginTop: '4px',
                        background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
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
                        boxShadow: '0 0 16px rgba(236, 72, 153, 0.3)',
                      }}
                    >
                      <Plus size={14} /> Add First Mission
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '1.25rem 1rem',
                      textAlign: 'center',
                      background: 'rgba(16, 185, 129, 0.08)',
                      borderRadius: '14px',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <CheckCircle2 size={24} color="#34d399" />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ecfdf5' }}>
                      All missions completed for today!
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#a7f3d0' }}>
                      Awesome work maintaining your streak. Keep it up tomorrow! 🔥
                    </span>
                  </div>
                )
              ) : (
                activeTodayTasks.map((t) => {
                  const isScheduled = !!(t.startTime || t.plannedStartTime);
                  const displayTime = isScheduled ? formatTimetableTime(t.startTime || t.plannedStartTime) : null;
                  const cat = t.lifeArea ? t.lifeArea.toUpperCase() : 'DAILY';
                  const isRoutine = cat === 'ROUTINE' || cat === 'HEALTH';
                  const isDaily = cat === 'GROWTH' || cat === 'CAREER';
                  const badgeColor = isRoutine ? '#10b981' : isDaily ? '#06b6d4' : '#a855f7';

                  return (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.7rem 0.85rem',
                        borderRadius: '14px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        transition: 'all 0.3s ease',
                        gap: '8px',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: '1 1 auto' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: `${badgeColor}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: badgeColor,
                            flexShrink: 0,
                          }}
                        >
                          {getTimetableIcon(t.title, t.lifeArea)}
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: '0.86rem',
                              fontWeight: 700,
                              color: '#f8fafc',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              flexWrap: 'wrap',
                              overflowWrap: 'anywhere',
                            }}
                          >
                            <span>{t.title}</span>
                            {isScheduled && <TimetableScheduledBadge time={displayTime || ''} />}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                            {isScheduled ? (
                              <span style={{ color: '#c084fc', fontFamily: 'monospace' }}>{displayTime}</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenTimeModal(t)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  color: '#38bdf8',
                                  cursor: 'pointer',
                                  fontSize: '0.72rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                <Clock size={11} /> + Schedule in Timetable
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: `${badgeColor}18`,
                            color: badgeColor,
                            border: `1px solid ${badgeColor}33`,
                          }}
                        >
                          {cat}
                        </span>

                        {/* Quick options menu */}
                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(activeMenuId === t.id ? null : t.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#64748b',
                              cursor: 'pointer',
                              padding: '3px',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <MoreVertical size={14} />
                          </button>

                          {activeMenuId === t.id && (
                            <div
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                zIndex: 100,
                                background: 'rgba(20, 10, 36, 0.95)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(168, 85, 247, 0.4)',
                                borderRadius: '10px',
                                padding: '5px',
                                minWidth: '180px',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '3px',
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => handleOpenTimeModal(t)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#f8fafc',
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.76rem',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                <Clock size={12} color="#38bdf8" />
                                {isScheduled ? 'Change Timetable Time' : 'Assign Timetable Time'}
                              </button>

                              {isScheduled && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFromTimetable(t)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#cbd5e1',
                                    padding: '6px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.76rem',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                  }}
                                >
                                  <X size={12} color="#f87171" /> Remove from Timetable
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleMoveToRecycleBin(t.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#f87171',
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.76rem',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                <Trash2 size={12} color="#f87171" /> Move to Recycle Bin
                              </button>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleMission(t.id, false)}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: '2px solid rgba(192, 132, 252, 0.4)',
                            background: 'transparent',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                            transition: 'all 0.2s ease',
                          }}
                          aria-label={`Mark ${t.title} complete`}
                        />
                      </div>
                    </div>
                  );
                })
              )}

              {/* Dedicated Completed Tasks Section (Reversible Undo, never sent to Recycle Bin) */}
              {completedTodayTasks.length > 0 && (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowCompletedMissions(!showCompletedMissions)}
                    style={{
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '10px',
                      padding: '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      color: '#34d399',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} />
                      <span>Completed Today ({completedTodayTasks.length})</span>
                    </div>
                    {showCompletedMissions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {showCompletedMissions && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', paddingLeft: '4px' }}>
                      {completedTodayTasks.map((t) => (
                        <div
                          key={t.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.55rem 0.75rem',
                            borderRadius: '10px',
                            background: 'rgba(16, 185, 129, 0.05)',
                            border: '1px solid rgba(16, 185, 129, 0.15)',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <div
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                flexShrink: 0,
                              }}
                            >
                              <Check size={12} strokeWidth={3} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <span
                                style={{
                                  fontSize: '0.82rem',
                                  color: '#94a3b8',
                                  textDecoration: 'line-through',
                                  overflowWrap: 'anywhere',
                                }}
                              >
                                {t.title}
                              </span>
                              {t.completedAt && (
                                <span style={{ fontSize: '0.68rem', color: '#64748b', marginLeft: '6px' }}>
                                  at {new Date(t.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleMission(t.id, true)}
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
                              whiteSpace: 'nowrap',
                            }}
                            title="Undo completion and restore to active"
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

            {/* Quick Time Setting Modal */}
            {timeModalTask && (
              <div
                style={{
                  padding: '1rem',
                  background: 'rgba(25, 14, 46, 0.95)',
                  borderRadius: '12px',
                  border: '1px solid rgba(168, 85, 247, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={15} color="#c084fc" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                    Schedule "{timeModalTask.title}":
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <label style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Start:
                    <input
                      type="time"
                      value={timeModalStart}
                      onChange={(e) => setTimeModalStart(e.target.value)}
                      className="cyber-date-picker"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        borderRadius: '6px',
                        padding: '3px 6px',
                        color: '#fff',
                        fontSize: '0.78rem',
                      }}
                    />
                  </label>

                  <label style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    End (opt):
                    <input
                      type="time"
                      value={timeModalEnd}
                      onChange={(e) => setTimeModalEnd(e.target.value)}
                      className="cyber-date-picker"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(168, 85, 247, 0.4)',
                        borderRadius: '6px',
                        padding: '3px 6px',
                        color: '#fff',
                        fontSize: '0.78rem',
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleSaveTimeModal}
                    style={{
                      background: '#10b981',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Save
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimeModalTask(null)}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      color: '#94a3b8',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Footer Counter */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#94a3b8',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '0.65rem',
              }}
            >
              <span style={{ fontWeight: 700, color: '#c084fc' }}>
                ✦ {totalMissions === 0 ? '0 missions' : `${completedCount} of ${totalMissions} done!`}
              </span>

              <button
                type="button"
                onClick={() => (onOpenTaskBuilder ? onOpenTaskBuilder() : onNavigateSection && onNavigateSection('tasks'))}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.72rem', color: '#38bdf8', padding: '2px 6px' }}
              >
                <Plus size={12} /> Add Mission
              </button>
            </div>
          </div>
        )}

        {/* Snapchat-Style Streak Engine Card */}
        {widgets.showMilestone && streakData && (
          <div
            className="dash-milestone-card"
            style={{
              background: 'rgba(18, 12, 38, 0.75)',
              backdropFilter: 'blur(16px)',
              borderRadius: '20px',
              border: streakData.flameIntensity === 'super'
                ? '1px solid rgba(236, 72, 153, 0.45)'
                : streakData.flameIntensity === 'blazing'
                  ? '1px solid rgba(249, 115, 22, 0.45)'
                  : '1px solid rgba(192, 132, 252, 0.25)',
              padding: 'clamp(0.85rem, 2.5vw, 1.25rem)',
              boxShadow: streakData.flameIntensity === 'super'
                ? '0 0 24px rgba(236, 72, 153, 0.25)'
                : streakData.flameIntensity === 'blazing'
                  ? '0 0 20px rgba(249, 115, 22, 0.25)'
                  : '0 8px 32px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              height: 'fit-content',
              boxSizing: 'border-box',
              width: '100%',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top Row: Flame Avatar & Streak Counts */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: streakData.flameIntensity === 'super'
                      ? 'linear-gradient(135deg, #ec4899, #8b5cf6)'
                      : streakData.flameIntensity === 'blazing'
                        ? 'linear-gradient(135deg, #ef4444, #f97316)'
                        : streakData.flameIntensity === 'warm'
                          ? 'linear-gradient(135deg, #f59e0b, #ea580c)'
                          : 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: streakData.flameIntensity === 'super'
                      ? '0 0 20px rgba(236, 72, 153, 0.6)'
                      : streakData.flameIntensity === 'blazing'
                        ? '0 0 16px rgba(239, 68, 68, 0.6)'
                        : streakData.flameIntensity === 'warm'
                          ? '0 0 12px rgba(245, 158, 11, 0.5)'
                          : 'none',
                    flexShrink: 0,
                    animation: streakData.currentStreak > 0 ? 'pulse 2s infinite' : 'none',
                  }}
                >
                  <Flame size={24} fill={streakData.currentStreak > 0 ? '#ffffff' : 'none'} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 900,
                        color: '#f8fafc',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {streakData.currentStreak}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f97316' }}>
                      DAY STREAK 🔥
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Trophy size={11} color="#facc15" />
                    <span>Best Record: </span>
                    <strong style={{ color: '#facc15' }}>{streakData.bestStreak} Days</strong>
                  </div>
                </div>
              </div>

              {/* Today Goal Badge */}
              <div
                style={{
                  textAlign: 'right',
                  padding: '4px 10px',
                  borderRadius: '10px',
                  background: streakData.todayQualified
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: streakData.todayQualified
                    ? '1px solid rgba(16, 185, 129, 0.35)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ fontSize: '0.68rem', color: streakData.todayQualified ? '#34d399' : '#94a3b8', fontWeight: 700 }}>
                  {streakData.todayQualified ? 'Goal Met! 🎯' : 'Daily Goal'}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc' }}>
                  {streakData.todayCompletedCount} / {streakData.dailyGoal}
                </div>
              </div>
            </div>

            {/* Daily Goal Progress Bar */}
            <div>
              <div
                style={{
                  height: '6px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, (streakData.todayCompletedCount / streakData.dailyGoal) * 100)}%`,
                    height: '100%',
                    background: streakData.todayQualified
                      ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                      : 'linear-gradient(90deg, #f97316, #ec4899)',
                    borderRadius: '999px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* 7-Day Weekly Activity Calendar Strip (Mon - Sun) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '6px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                paddingTop: '0.65rem',
              }}
            >
              {streakData.weeklyActivity.map((day) => {
                return (
                  <div
                    key={day.date}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 2px',
                      borderRadius: '8px',
                      background: day.isToday
                        ? 'rgba(168, 85, 247, 0.15)'
                        : 'transparent',
                      border: day.isToday
                        ? '1px solid rgba(168, 85, 247, 0.4)'
                        : '1px solid transparent',
                    }}
                    title={`${day.date}: ${day.completedCount} task(s) completed`}
                  >
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        color: day.isToday ? '#c084fc' : '#64748b',
                      }}
                    >
                      {day.dayName.slice(0, 1)}
                    </span>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: day.isQualified
                          ? 'linear-gradient(135deg, #f97316, #ef4444)'
                          : day.completedCount > 0
                            ? 'rgba(249, 115, 22, 0.25)'
                            : 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        boxShadow: day.isQualified ? '0 0 8px rgba(249, 115, 22, 0.4)' : 'none',
                      }}
                    >
                      {day.isQualified ? (
                        <Flame size={12} fill="#ffffff" />
                      ) : day.completedCount > 0 ? (
                        <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#f97316' }}>
                          {day.completedCount}
                        </span>
                      ) : (
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#475569' }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Motivational Quote Banner - Centered across dashboard */}
      {widgets.showQuote && (
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0.5rem auto 0',
            boxSizing: 'border-box',
            padding: '0 0.5rem',
          }}
        >
          <div
            className="dash-quote-banner"
            style={{
              textAlign: 'center',
              padding: '0.75rem 1.5rem',
              borderRadius: '999px',
              background: 'linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.15), rgba(168, 85, 247, 0.15), transparent)',
              border: '1px solid rgba(236, 72, 153, 0.25)',
              fontFamily: 'cursive, var(--font-display), sans-serif',
              fontSize: 'clamp(0.85rem, 3.2vw, 1.15rem)',
              color: '#f472b6',
              fontWeight: 600,
              letterSpacing: '0.02em',
              textShadow: '0 0 16px rgba(244, 114, 182, 0.6)',
              boxShadow: '0 4px 20px rgba(236, 72, 153, 0.12)',
              maxWidth: '100%',
              wordBreak: 'break-word',
            }}
          >
            "Small steps today... Big dreams tomorrow ♡"
          </div>
        </div>
      )}
      {/* Recycle Bin Modal: View, restore, or permanently purge deleted missions */}
      <TaskRecycleBinModal
        isOpen={isRecycleBinOpen}
        onClose={() => setIsRecycleBinOpen(false)}
        deletedTasks={deletedTasks}
        onRestore={handleRestoreFromRecycleBin}
        onPermanentDelete={permanentDeleteTask}
        onEmptyRecycleBin={emptyRecycleBin}
      />
    </div>
  );
}
