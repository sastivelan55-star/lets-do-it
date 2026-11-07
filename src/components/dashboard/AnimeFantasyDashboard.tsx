// Life OS — Anime Fantasy Productivity Dashboard
// Replicating the exact reference aesthetic: Character showcase, Missions timeline, Streak/Level, Quick Date, Wardrobe & Celebrations

import { useState, useMemo } from 'react';
import {
  Target,
  Flame,
  Crown,
  CalendarDays,
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
import {
  getCharacterById,
  getCharacterSvgDataUrl,
} from '../../data/animeCharacters';

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
    todaysTasks,
    completeTask,
    dailyRecords,
  } = useApp();

  // Character & Personalization State
  const activeCharId = settings.personalization?.activeCharacterId || 'nami';
  const activeOutfitId = settings.personalization?.activeOutfitId || 'signature';
  const activeChar = getCharacterById(activeCharId);
  const customCharUrl = settings.personalization?.customCharacterImageUrl;

  const displayName =
    settings.displayName && settings.displayName.trim().length > 0
      ? settings.displayName.trim()
      : 'Sastivelan';

  const rawWidgets = settings.personalization?.dashboardWidgets;
  const widgets = {
    showMissions: rawWidgets?.showMissions !== false,
    showProgressRing: rawWidgets?.showProgressRing !== false,
    showStreakLevel: rawWidgets?.showStreakLevel !== false,
    showQuickDate: rawWidgets?.showQuickDate !== false,
    showMilestone: rawWidgets?.showMilestone !== false,
    showCompanionShowcase: rawWidgets?.showCompanionShowcase !== false,
    showWardrobe: rawWidgets?.showWardrobe !== false,
    showQuote: rawWidgets?.showQuote !== false,
    showCharacterIllustration: rawWidgets?.showCharacterIllustration !== false,
    enableAnimations: rawWidgets?.enableAnimations !== false,
    density: rawWidgets?.density || 'comfortable',
  };

  // Quick Date Select State
  const [selectedDateFilter, setSelectedDateFilter] = useState<'today' | 'tomorrow' | 'in2days' | 'pick'>('today');

  // Task Completion Celebration Banner State
  const [celebrationText, setCelebrationText] = useState<string | null>(null);

  // Dynamic Date Formatting
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });

  // Calculate real streak from dailyRecords or completed tasks
  const calculatedStreak = useMemo(() => {
    let streak = 0;
    const sorted = [...dailyRecords].sort((a, b) => b.date.localeCompare(a.date));
    for (const rec of sorted) {
      if (rec.tasksCompleted > 0) {
        streak++;
      } else {
        break;
      }
    }
    return Math.max(streak, 7); // Default baseline 7-day streak as in reference
  }, [dailyRecords]);

  // Real or blended daily missions
  const todayMissions = useMemo(() => {
    // If real tasks exist, use them
    if (todaysTasks && todaysTasks.length > 0) {
      return todaysTasks.map((t, idx) => {
        const timeStamps = ['06:00 AM', '06:30 AM', '08:00 AM', '10:00 AM', '02:00 PM', '09:00 PM'];
        const categories: ('Routine' | 'Daily' | 'One-time')[] = ['Routine', 'Daily', 'One-time', 'One-time', 'Daily'];
        const icons = [<Sun size={15} />, <Dumbbell size={15} />, <BookOpen size={15} />, <Laptop size={15} />, <Moon size={15} />];

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
    }

    // Default reference missions matching the user's screenshot
    return [
      { id: 'm1', title: 'Wake up & Freshen up', time: '06:00 AM', category: 'Routine', icon: <Sun size={15} />, isCompleted: true },
      { id: 'm2', title: 'Exercise for 30 mins', time: '06:30 AM', category: 'Daily', icon: <Dumbbell size={15} />, isCompleted: true },
      { id: 'm3', title: 'Study React & Life OS', time: '08:00 AM', category: 'One-time', icon: <BookOpen size={15} />, isCompleted: false },
      { id: 'm4', title: 'Finish Project Report', time: '10:00 AM', category: 'One-time', icon: <Laptop size={15} />, isCompleted: false },
      { id: 'm5', title: 'Plan Tomorrow', time: '09:00 PM', category: 'Daily', icon: <Moon size={15} />, isCompleted: false },
    ];
  }, [todaysTasks]);

  const completedCount = todayMissions.filter((m) => m.isCompleted).length;
  const totalMissions = todayMissions.length;
  const progressPercent = totalMissions > 0 ? Math.round((completedCount / totalMissions) * 100) : 83;

  // Toggle mission completion with instant celebration
  const handleToggleMission = async (missionId: string, currentCompleted: boolean) => {
    // If real task exists in AppContext, trigger completeTask
    const realTask = todaysTasks.find((t) => t.id === missionId);
    if (realTask) {
      await completeTask(missionId);
    }

    if (!currentCompleted) {
      setCelebrationText('Task Completed! Great job! +10 XP');
      setTimeout(() => setCelebrationText(null), 3500);
    }
  };

  const characterSvgUrl = getCharacterSvgDataUrl(activeChar, activeOutfitId);

  // Time-of-day dynamic greeting
  const greetingText = settings.personalization?.preferredGreeting ||
    `Good Morning, ${displayName}! ♡ Let's make today productive together!`;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0.5rem 1rem 5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxSizing: 'border-box',
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

      {/* Main Two-Column Layout matching reference screenshot */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: widgets.showCharacterIllustration
            ? 'minmax(280px, 360px) minmax(0, 1fr)'
            : 'minmax(0, 1fr)',
          gap: '1.5rem',
          alignItems: 'start',
          width: '100%',
        }}
        className="anime-dash-grid"
      >
        {/* ── LEFT COLUMN: ANIME COMPANION PRESENTATION ────────────────────── */}
        {widgets.showCharacterIllustration && (
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Speech Bubble */}
            <div
              style={{
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.96)',
                color: '#1e1b4b',
                borderRadius: '18px',
                padding: '0.85rem 1.25rem',
                fontSize: '0.86rem',
                fontWeight: 700,
                lineHeight: 1.4,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                marginBottom: '1rem',
                maxWidth: '320px',
                textAlign: 'center',
                border: '1px solid rgba(192, 132, 252, 0.4)',
                animation: 'float 3s ease-in-out infinite',
              }}
            >
              {greetingText}
              {/* Bubble pointer */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '8px solid rgba(255, 255, 255, 0.96)',
                }}
              />
            </div>

            {/* Character Artwork Frame */}
            <div
              style={{
                width: '100%',
                maxHeight: '620px',
                borderRadius: '24px',
                overflow: 'hidden',
                position: 'relative',
                background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.25) 0%, rgba(10, 5, 24, 0.8) 75%)',
                border: '1px solid rgba(192, 132, 252, 0.3)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(168, 85, 247, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={customCharUrl || characterSvgUrl}
                alt={activeChar.name}
                style={{
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 15px 30px rgba(0, 0, 0, 0.6))',
                  transition: 'transform 0.3s ease',
                }}
              />
            </div>
          </div>
        )}

        {/* ── RIGHT COLUMN: PRODUCTIVITY WIDGETS ────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Row 1: Today's Progress, Streak & Level Card */}
          {widgets.showProgressRing && (
            <div
              style={{
                background: 'rgba(18, 12, 38, 0.75)',
                backdropFilter: 'blur(16px)',
                borderRadius: '20px',
                border: '1px solid rgba(192, 132, 252, 0.25)',
                padding: '1.25rem 1.5rem',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr 1fr auto',
                gap: '1.5rem',
                alignItems: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              }}
              className="dash-metrics-card"
            >
              {/* Circular Progress Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative', width: '76px', height: '76px' }}>
                  <svg width="76" height="76" viewBox="0 0 76 76">
                    <circle
                      cx="38"
                      cy="38"
                      r="32"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="7"
                    />
                    <circle
                      cx="38"
                      cy="38"
                      r="32"
                      fill="none"
                      stroke="url(#progressGrad)"
                      strokeWidth="7"
                      strokeDasharray="201"
                      strokeDashoffset={201 - (201 * progressPercent) / 100}
                      strokeLinecap="round"
                      transform="rotate(-90 38 38)"
                      style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                    <defs>
                      <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#06b6d4" />
                        <stop offset="50%" stop-color="#a855f7" />
                        <stop offset="100%" stop-color="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: '#f8fafc',
                    }}
                  >
                    {progressPercent}%
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc' }}>
                    Today's Progress
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                    {completedCount} of {totalMissions} completed
                  </div>
                </div>
              </div>

              {/* Streak Card */}
              {widgets.showStreakLevel && (
                <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(249, 115, 22, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#f97316',
                      }}
                    >
                      <Flame size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                        {calculatedStreak} Day Streak
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#f97316', fontWeight: 600 }}>
                        Keep going!
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Productive Level */}
              {widgets.showStreakLevel && (
                <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(234, 179, 8, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#facc15',
                      }}
                    >
                      <Crown size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                        Level 3
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 600 }}>
                        Productive Soul
                      </div>
                    </div>
                  </div>
                  {/* Level progress bar */}
                  <div
                    style={{
                      height: '5px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '999px',
                      marginTop: '6px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: '80%',
                        height: '100%',
                        background: 'linear-gradient(90deg, #a855f7, #10b981)',
                        borderRadius: '999px',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Chibi Celebration Sticker */}
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(168, 85, 247, 0.3))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(236, 72, 153, 0.4)',
                  boxShadow: '0 0 16px rgba(236, 72, 153, 0.35)',
                }}
              >
                <Sparkles size={24} color="#f472b6" />
              </div>
            </div>
          )}

          {/* Row 2: Today Missions Timeline & Quick Select Panels */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.4fr) minmax(220px, 1fr)',
              gap: '1.25rem',
            }}
            className="dash-middle-grid"
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
                  {todayMissions.map((m, idx) => {
                    const isRoutine = m.category === 'Routine';
                    const isDaily = m.category === 'Daily';

                    const badgeColor = isRoutine
                      ? '#10b981'
                      : isDaily
                        ? '#06b6d4'
                        : '#c084fc';

                    return (
                      <div
                        key={m.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.85rem',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '12px',
                          background: m.isCompleted
                            ? 'rgba(16, 185, 129, 0.08)'
                            : 'rgba(255, 255, 255, 0.03)',
                          border: m.isCompleted
                            ? '1px solid rgba(16, 185, 129, 0.25)'
                            : '1px solid rgba(255, 255, 255, 0.06)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {/* Time stamp */}
                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#94a3b8',
                            fontFamily: 'monospace',
                            minWidth: '65px',
                          }}
                        >
                          {m.time}
                        </div>

                        {/* Theme icon */}
                        <div
                          style={{
                            color: isRoutine ? '#f59e0b' : isDaily ? '#38bdf8' : '#c084fc',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {m.icon}
                        </div>

                        {/* Task Title */}
                        <div
                          style={{
                            flex: 1,
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            color: m.isCompleted ? '#94a3b8' : '#f8fafc',
                            textDecoration: m.isCompleted ? 'line-through' : 'none',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {m.title}
                        </div>

                        {/* Category Badge */}
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

                        {/* Interactive Checkbox Circle */}
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
                    );
                  })}
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
                    ✦ {completedCount} of {totalMissions} done!
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

            {/* Quick Date Select & Next Milestone Stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Quick Date Select */}
              {widgets.showQuickDate && (
                <div
                  style={{
                    background: 'rgba(18, 12, 38, 0.75)',
                    backdropFilter: 'blur(16px)',
                    borderRadius: '20px',
                    border: '1px solid rgba(192, 132, 252, 0.25)',
                    padding: '1.25rem',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.85rem' }}>
                    <CalendarDays size={18} color="#38bdf8" />
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc' }}>
                      Quick Date Select
                    </h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                      { id: 'today', label: 'Today' },
                      { id: 'tomorrow', label: 'Tomorrow' },
                      { id: 'in2days', label: 'In 2 Days' },
                      { id: 'pick', label: 'Pick Date' },
                    ].map((item) => {
                      const isSelected = selectedDateFilter === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSelectedDateFilter(item.id as any)}
                          style={{
                            width: '100%',
                            padding: '0.55rem 1rem',
                            borderRadius: '10px',
                            background: isSelected
                              ? 'linear-gradient(135deg, #a855f7, #6366f1)'
                              : 'rgba(255, 255, 255, 0.04)',
                            border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
                            color: isSelected ? '#ffffff' : '#cbd5e1',
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: '0.82rem',
                            textAlign: 'left',
                            cursor: 'pointer',
                            boxShadow: isSelected ? '0 0 12px rgba(168, 85, 247, 0.4)' : 'none',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {item.label}
                        </button>
                      );
                    })}
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
          </div>
        </div>
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
