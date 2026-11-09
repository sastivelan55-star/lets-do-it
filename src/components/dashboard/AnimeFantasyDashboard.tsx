// Life OS — Productivity Dashboard
// Clean, streamlined missions timeline, milestones, celebrations & quote

import { useState, useMemo } from 'react';
import {
  Target,
  Trophy,
  Check,
  ChevronRight,
  Sparkles,
  Sun,
  Dumbbell,
  BookOpen,
  Laptop,
  Moon,
  Gift,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AnimeFantasyDashboardProps {
  onNavigateSection?: (section: string) => void;
  onOpenTaskBuilder?: () => void;
}

export default function AnimeFantasyDashboard({
  onNavigateSection,
  onOpenTaskBuilder,
}: AnimeFantasyDashboardProps) {
  const {
    settings,
    tasks,
    completeTask,
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

  // Filter global task array: compare targetDate with current system date
  const todayMissions = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    const filtered = tasks.filter((t) => {
      if (t.isDeleted) return false;
      // Compare task's targetDate (or fallback to dueDate) with current system date
      const taskDate = (t.targetDate || t.dueDate || '').slice(0, 10);
      return taskDate === todayDateStr;
    });

    return filtered.map((t, idx) => {
      const timeStamps = ['06:00 AM', '08:00 AM', '10:00 AM', '01:00 PM', '03:00 PM', '06:00 PM', '08:00 PM', '09:30 PM'];
      const categories: ('Routine' | 'Daily' | 'One-time')[] = ['Routine', 'Daily', 'One-time', 'One-time', 'Daily'];
      const icons = [
        <Sun size={15} key="sun" />,
        <Dumbbell size={15} key="db" />,
        <BookOpen size={15} key="book" />,
        <Laptop size={15} key="laptop" />,
        <Moon size={15} key="moon" />,
      ];

      return {
        id: t.id,
        title: t.title,
        time: t.plannedStartTime || timeStamps[idx % timeStamps.length],
        category: (t.recurring === 'daily' ? 'Daily' : categories[idx % categories.length]) as 'Routine' | 'Daily' | 'One-time',
        icon: icons[idx % icons.length],
        isCompleted: t.status === 'completed',
        realTask: t,
      };
    });
  }, [tasks, todayDateStr]);

  const completedCount = todayMissions.filter((m) => m.isCompleted).length;
  const totalMissions = todayMissions.length;

  // Toggle mission completion with instant celebration
  const handleToggleMission = async (missionId: string, currentCompleted: boolean) => {
    await completeTask(missionId);

    if (!currentCompleted) {
      setCelebrationText('Task Completed! Great job! +10 XP');
      setTimeout(() => setCelebrationText(null), 3500);
    }
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
                  <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                    Your plan for today • {formattedDate}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => (onOpenTaskBuilder ? onOpenTaskBuilder() : onNavigateSection && onNavigateSection('tasks'))}
                className="btn btn-ghost btn-sm"
                style={{
                  color: '#c084fc',
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
                          ? 'rgba(16, 185, 129, 0.08)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: m.isCompleted
                          ? '1px solid rgba(16, 185, 129, 0.25)'
                          : '1px solid rgba(255, 255, 255, 0.06)',
                        transition: 'all 0.2s ease',
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
                            }}
                          >
                            {m.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {m.time}
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
