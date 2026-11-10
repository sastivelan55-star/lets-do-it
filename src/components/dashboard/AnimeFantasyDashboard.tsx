// Life OS — Productivity Dashboard
// Clean, streamlined missions timeline, milestones, celebrations & quote

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Target,
  Trophy,
  Check,
  ChevronRight,
  Sparkles,
  Gift,
  Plus,
  Clock,
  MoreVertical,
  X,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Task } from '../../types';
import TimetableScheduledBadge from '../common/TimetableScheduledBadge';
import { formatTimetableTime, getTimetableIcon } from '../timetable/DailyTimetable';

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
  } = useApp();

  const rawWidgets = settings.personalization?.dashboardWidgets;
  const widgets = {
    showMissions: rawWidgets?.showMissions !== false,
    showMilestone: rawWidgets?.showMilestone !== false,
    showQuote: rawWidgets?.showQuote !== false,
    enableAnimations: rawWidgets?.enableAnimations !== false,
    density: rawWidgets?.density || 'comfortable',
  };

  // Task Completion Celebration Banner State
  const [celebrationText, setCelebrationText] = useState<string | null>(null);

  // Set of mission IDs currently undergoing completion & auto-move to Recycle Bin
  const [movingToTrashIds, setMovingToTrashIds] = useState<Set<string>>(new Set());
  const autoMovedIdsRef = useRef<Set<string>>(new Set());

  // Dynamic Date Formatting
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });

  // Current system date formatted to 'YYYY-MM-DD'
  const todayDateStr = useMemo(() => {
    const sysDate = new Date();
    const y = sysDate.getFullYear();
    const m = String(sysDate.getMonth() + 1).padStart(2, '0');
    const d = String(sysDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Automatically move any completed today missions to the Recycle Bin on load / background
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const completedToday = tasks.filter((t) => {
      if (t.isDeleted) return false;
      if (t.status !== 'completed') return false;
      if (autoMovedIdsRef.current.has(t.id)) return false;
      const taskDate = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
      return taskDate === todayDateStr;
    });

    if (completedToday.length > 0) {
      completedToday.forEach((t) => {
        autoMovedIdsRef.current.add(t.id);
        removeTask(t.id).catch((err) => {
          console.error('Failed to auto-move completed task to recycle bin:', err);
        });
      });
    }
  }, [tasks, todayDateStr, removeTask]);

  // Scheduling modal state
  const [timeModalTask, setTimeModalTask] = useState<Task | null>(null);
  const [timeModalStart, setTimeModalStart] = useState('08:00');
  const [timeModalEnd, setTimeModalEnd] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filter global task array: compare targetDate / scheduledDate / dueDate with current system date
  // Exclude completed missions unless currently in the middle of celebratory fade-out to Recycle Bin
  const todayMissions = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    const filtered = tasks.filter((t) => {
      if (t.isDeleted) return false;
      // If already completed and not in active completion transition, hide from active missions list
      if (t.status === 'completed' && !movingToTrashIds.has(t.id)) return false;
      const taskDate = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
      return taskDate === todayDateStr;
    });

    return filtered.map((t) => {
      const isScheduled = Boolean(t.startTime || t.plannedStartTime);
      const rawTime = t.startTime || t.plannedStartTime;
      const formattedTime = isScheduled ? formatTimetableTime(rawTime) : undefined;
      const icon = getTimetableIcon(t.title, t.lifeArea);
      const isMoving = movingToTrashIds.has(t.id);

      return {
        id: t.id,
        title: t.title,
        time: formattedTime,
        isScheduled,
        category: (t.recurring === 'daily' ? 'Daily' : t.lifeArea === 'routine' ? 'Routine' : 'Daily') as 'Routine' | 'Daily' | 'One-time',
        icon,
        isCompleted: t.status === 'completed' || isMoving,
        isMovingToTrash: isMoving,
        realTask: t,
      };
    });
  }, [tasks, todayDateStr, movingToTrashIds]);

  // Compute total completed tasks for today (active + those moved to recycle bin so user milestone is preserved!)
  const completedCount = useMemo(() => {
    const fromActive = tasks.filter((t) => {
      const taskDate = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
      return (taskDate === todayDateStr && t.status === 'completed') || (t.completedAt && t.completedAt.slice(0, 10) === todayDateStr);
    }).length;

    const fromDeleted = deletedTasks.filter((t) => {
      const taskDate = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
      const deletedDate = (t.deletedAt || '').slice(0, 10);
      return (taskDate === todayDateStr && (t.status === 'completed' || deletedDate === todayDateStr)) || (t.completedAt && t.completedAt.slice(0, 10) === todayDateStr);
    }).length;

    return fromActive + fromDeleted;
  }, [tasks, deletedTasks, todayDateStr]);

  const totalMissions = todayMissions.length;

  // Toggle mission completion with instant celebration and auto-move to Recycle Bin
  const handleToggleMission = async (missionId: string, currentCompleted: boolean) => {
    if (!currentCompleted) {
      // 1. Mark in moving state so checkmark immediately turns green
      setMovingToTrashIds((prev) => new Set([...prev, missionId]));
      setCelebrationText('Mission Completed! Moved to Recycle Bin (+10 XP)');

      // 2. Mark complete in DB so completedAt is saved
      try {
        await completeTask(missionId);
      } catch (err) {
        console.error('Failed to complete task:', err);
      }

      // 3. Automatically soft-delete / move to Recycle Bin after brief celebratory animation
      setTimeout(async () => {
        try {
          await removeTask(missionId);
        } catch (err) {
          console.error('Failed to move task to recycle bin:', err);
        } finally {
          setMovingToTrashIds((prev) => {
            const next = new Set(prev);
            next.delete(missionId);
            return next;
          });
        }
      }, 700);

      setTimeout(() => setCelebrationText(null), 3500);
    } else {
      // If already marked, move directly to recycle bin
      await removeTask(missionId);
    }
  };

  const handleMoveToRecycleBin = async (taskId: string) => {
    setActiveMenuId(null);
    setCelebrationText('Mission moved to Recycle Bin');
    setTimeout(() => setCelebrationText(null), 2500);
    await removeTask(taskId);
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
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(99, 102, 241, 0.95))',
            color: '#ffffff',
            padding: '0.85rem 1.4rem',
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 800,
            fontSize: '0.9rem',
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            animation: 'fadeInUp 0.3s ease',
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
            }}
          >
            <Check size={16} strokeWidth={3} />
          </div>
          <span>{celebrationText}</span>
          <Sparkles size={16} color="#facc15" />
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
            style={{
              background: 'rgba(18, 12, 38, 0.75)',
              backdropFilter: 'blur(16px)',
              borderRadius: '20px',
              border: '1px solid rgba(192, 132, 252, 0.25)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              minHeight: '220px',
              transition: 'all 0.25s ease',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                  }}
                >
                  <Target size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                    Today Missions
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span>Your plan for today • {formattedDate}</span>
                    <span style={{ fontSize: '0.68rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.12)', padding: '1px 6px', borderRadius: '4px' }}>
                      ⚡ Auto-Recycle Completed
                    </span>
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {deletedTasks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onNavigateSection && onNavigateSection('settings')}
                    className="btn btn-ghost btn-sm"
                    style={{
                      color: '#f87171',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      cursor: 'pointer',
                    }}
                    title="View Recycle Bin in Settings"
                  >
                    <Trash2 size={12} color="#f87171" />
                    <span>Recycle Bin ({deletedTasks.length})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => (onOpenTimetable ? onOpenTimetable() : onNavigateSection && onNavigateSection('timeline'))}
                  className="btn btn-ghost btn-sm"
                  style={{
                    color: '#c084fc',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'rgba(168, 85, 247, 0.12)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    cursor: 'pointer',
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
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  View All <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Missions Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {todayMissions.length === 0 ? (
                <div
                  style={{
                    padding: '2rem 1.5rem',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '16px',
                    border: '1px dashed rgba(192, 132, 252, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
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
                    <div style={{ fontSize: '0.76rem', color: '#94a3b8', maxWidth: '280px', margin: '0 auto' }}>
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
                      padding: '7px 16px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
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
                todayMissions.map((m, idx) => {
                  const isRoutine = m.category === 'Routine';
                  const isDaily = m.category === 'Daily';

                  const badgeColor = isRoutine
                    ? '#10b981'
                    : isDaily
                      ? '#06b6d4'
                      : '#a855f7';

                  return (
                    <div
                      key={m.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        borderRadius: '14px',
                        background: m.isCompleted
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: m.isCompleted
                          ? '1px solid rgba(16, 185, 129, 0.35)'
                          : '1px solid rgba(255, 255, 255, 0.06)',
                        transition: 'all 0.3s ease',
                        opacity: m.isMovingToTrash ? 0.6 : 1,
                        transform: m.isMovingToTrash ? 'scale(0.98)' : 'scale(1)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                          }}
                        >
                          {m.icon}
                        </div>

                        <div>
                          <div
                            style={{
                              fontSize: '0.88rem',
                              fontWeight: 700,
                              color: m.isCompleted ? '#94a3b8' : '#f8fafc',
                              textDecoration: m.isCompleted ? 'line-through' : 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span>{m.title}</span>
                            {m.isScheduled && <TimetableScheduledBadge time={m.time} />}
                            {m.isMovingToTrash && (
                              <span
                                style={{
                                  fontSize: '0.66rem',
                                  color: '#34d399',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                <Trash2 size={10} /> Moving to Recycle Bin...
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                            {m.isScheduled ? (
                              <span style={{ color: '#c084fc', fontFamily: 'monospace' }}>{m.time}</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenTimeModal(m.realTask)}
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
                          {m.category}
                        </span>

                        {/* Quick options menu */}
                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(activeMenuId === m.id ? null : m.id)}
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

                          {activeMenuId === m.id && (
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
                                onClick={() => handleOpenTimeModal(m.realTask)}
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
                                {m.isScheduled ? 'Change Timetable Time' : 'Assign Timetable Time'}
                              </button>

                              {m.isScheduled && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFromTimetable(m.realTask)}
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
                                onClick={() => handleMoveToRecycleBin(m.realTask.id)}
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
                          onClick={() => handleToggleMission(m.id, m.isCompleted)}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: m.isCompleted ? 'none' : '2px solid rgba(192, 132, 252, 0.4)',
                            background: m.isCompleted ? '#10b981' : 'transparent',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                            boxShadow: m.isCompleted ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
                            transition: 'all 0.2s ease',
                          }}
                          aria-label={`Mark ${m.title} ${m.isCompleted ? 'incomplete' : 'complete'}`}
                        >
                          {m.isCompleted && <Check size={14} strokeWidth={3} />}
                        </button>
                      </div>
                    </div>
                  );
                })
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

        {/* Next Milestone Card */}
        {widgets.showMilestone && (
          <div
            style={{
              background: 'rgba(18, 12, 38, 0.75)',
              backdropFilter: 'blur(16px)',
              borderRadius: '20px',
              border: '1px solid rgba(192, 132, 252, 0.25)',
              padding: '1.25rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              height: 'fit-content',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#facc15', fontSize: '0.78rem', fontWeight: 800 }}>
                <Trophy size={14} /> Next Milestone
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', margin: '3px 0 6px' }}>
                Complete 5 tasks today!
              </div>

              {/* Progress Bar */}
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
                    width: `${Math.min(100, (completedCount / 5) * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #ec4899, #a855f7)',
                    borderRadius: '999px',
                  }}
                />
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '4px', textAlign: 'right' }}>
                {completedCount} / 5
              </div>
            </div>

            {/* Gift Box Icon */}
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)',
                flexShrink: 0,
              }}
            >
              <Gift size={22} />
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
            margin: '0.75rem auto 0',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              padding: '0.85rem 2.5rem',
              borderRadius: '999px',
              background: 'linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.15), rgba(168, 85, 247, 0.15), transparent)',
              border: '1px solid rgba(236, 72, 153, 0.25)',
              fontFamily: 'cursive, var(--font-display), sans-serif',
              fontSize: '1.15rem',
              color: '#f472b6',
              fontWeight: 600,
              letterSpacing: '0.02em',
              textShadow: '0 0 16px rgba(244, 114, 182, 0.6)',
              boxShadow: '0 4px 20px rgba(236, 72, 153, 0.12)',
            }}
          >
            "Small steps today... Big dreams tomorrow ♡"
          </div>
        </div>
      )}
    </div>
  );
}
