import {
  Search,
  Zap,
  Moon,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import type { NavSection } from '../../App';
import type { ThemePreset } from '../../types';

interface TopBarProps {
  onOpenSearch: () => void;
  onOpenQuickCapture: () => void;
  onNavigate: (section: NavSection) => void;
  activeSection: NavSection;
}

const THEME_CYCLE: ThemePreset[] = [
  'purple-fantasy',
  'pink-sakura',
  'midnight-blue',
  'neon-cyberpunk',
  'lavender-dream',
  'cyan-galaxy',
];

const SECTION_LABELS: Record<NavSection, string> = {
  home: 'Anime Command Center',
  tasks: 'Task System',
  pulse: 'News — Live Intelligence Feeds',
  notes: 'Knowledge & Notes',
  calendar: 'Calendar Planner',
  projects: 'Projects Hub',
  roadmap: 'Roadmap & Milestones',
  reflection: 'Weekly Reflection',
  settings: 'Personalization & Settings',
  journey: 'My Journey',
  personal: 'Personal Life',
  knowledge: 'Knowledge Base',
  explore: 'News — Live Intelligence Feeds',
  review: 'Review & Settings',
};

export default function TopBar({
  onOpenSearch,
  onOpenQuickCapture,
  onNavigate,
  activeSection,
}: TopBarProps) {
  const { user } = useAuth();
  const { settings, updateAppearance, tasks } = useApp();

  const currentTheme = settings.appearance?.themePreset || 'purple-fantasy';

  const handleCycleTheme = async () => {
    const currentIndex = THEME_CYCLE.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
    const nextTheme = THEME_CYCLE[nextIndex];
    await updateAppearance({
      ...settings.appearance,
      themePreset: nextTheme,
    });
  };

  const displayName =
    settings.displayName && settings.displayName.trim().length > 0
      ? settings.displayName.trim()
      : user?.email
      ? user.email.split('@')[0]
      : 'Sastivelan';

  const userInitial = displayName[0].toUpperCase();
  const dueCount = tasks.filter((t) => !t.isDeleted && t.status !== 'completed').length;

  return (
    <header
      className="top-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.65rem 1.25rem',
        background: 'rgba(8, 5, 22, 0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(168, 85, 247, 0.18)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        gap: '0.75rem',
      }}
    >
      {/* Left: Active Section Indicator & Global Search Trigger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '520px' }}>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#c084fc',
            background: 'rgba(168, 85, 247, 0.15)',
            padding: '3px 10px',
            borderRadius: '8px',
            border: '1px solid rgba(192, 132, 252, 0.3)',
            whiteSpace: 'nowrap',
          }}
          className="hidden sm:inline-flex"
        >
          {SECTION_LABELS[activeSection] || 'Life OS'}
        </div>

        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search anything across Life OS (Ctrl + K)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: '999px',
            padding: '0.45rem 1.1rem',
            color: 'var(--text-muted)',
            fontSize: '0.84rem',
            cursor: 'pointer',
            flex: 1,
            maxWidth: '440px',
            minWidth: '160px',
            transition: 'all 0.2s ease',
            boxShadow: '0 0 12px rgba(168, 85, 247, 0.08)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.5)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
            e.currentTarget.style.boxShadow = '0 0 16px rgba(168, 85, 247, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.2)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(168, 85, 247, 0.08)';
          }}
        >
          <Search size={15} color="#c084fc" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Search anything... (Ctrl + K)
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '0.68rem',
              background: 'rgba(168, 85, 247, 0.15)',
              padding: '2px 6px',
              borderRadius: '5px',
              color: '#c084fc',
              fontWeight: 600,
              fontFamily: 'monospace',
              flexShrink: 0,
            }}
          >
            Ctrl+K
          </span>
        </button>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
        {/* Quick Capture Button */}
        <button
          type="button"
          onClick={onOpenQuickCapture}
          className="btn btn-primary btn-sm"
          title="Universal Quick Capture (Task, Note, Project, Idea)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            padding: '0.45rem 0.95rem',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 0 16px rgba(168, 85, 247, 0.45)',
          }}
        >
          <Zap size={13} color="#ffffff" />
          <span className="hidden sm:inline">Quick Capture</span>
          <span className="sm:hidden">Capture</span>
        </button>

        {/* Theme Preset Cycle */}
        <button
          type="button"
          onClick={handleCycleTheme}
          className="btn btn-ghost btn-sm"
          title={`Theme: ${currentTheme}. Click to cycle.`}
          aria-label="Cycle visual theme preset"
          style={{
            width: '34px',
            height: '34px',
            padding: 0,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            background: 'rgba(255, 255, 255, 0.04)',
            color: '#c084fc',
          }}
        >
          <Moon size={15} color="#c084fc" />
        </button>

        {/* Notification Bell Badge */}
        <button
          type="button"
          onClick={() => onNavigate('tasks')}
          className="btn btn-ghost btn-sm"
          title={`${dueCount} Tasks Due`}
          style={{
            width: '34px',
            height: '34px',
            padding: 0,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            background: 'rgba(255, 255, 255, 0.04)',
            color: '#cbd5e1',
            position: 'relative',
          }}
        >
          <Bell size={15} color="#cbd5e1" />
          {dueCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '13px',
                height: '13px',
                borderRadius: '50%',
                background: '#ef4444',
                color: 'white',
                fontSize: '0.58rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
              }}
            >
              {dueCount}
            </span>
          )}
        </button>

        {/* User Account Pill */}
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className="btn btn-ghost btn-sm"
          title={`Logged in as ${displayName}. Click to open Settings.`}
          aria-label="User Account"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.25rem 0.75rem 0.25rem 0.35rem',
            borderRadius: '999px',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            background: 'rgba(168, 85, 247, 0.1)',
            boxShadow: '0 0 12px rgba(168, 85, 247, 0.15)',
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              color: '#ffffff',
              fontSize: '0.74rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 8px rgba(168, 85, 247, 0.4)',
            }}
          >
            {userInitial}
          </div>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#f8fafc',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            className="hidden md:inline"
          >
            {displayName}
          </span>
        </button>
      </div>
    </header>
  );
}
