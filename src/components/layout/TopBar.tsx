import {
  Search,
  Zap,
  Moon,
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

const THEME_CYCLE: ThemePreset[] = ['navy-purple', 'dark-slate', 'midnight-oled'];

const SECTION_LABELS: Record<NavSection, string> = {
  home: 'Command Center',
  tasks: 'Task System',
  journey: 'My Journey',
  personal: 'Personal Life',
  knowledge: 'Knowledge Base',
  explore: 'Tech & Updates',
  review: 'Review & Settings',
};

export default function TopBar({
  onOpenSearch,
  onOpenQuickCapture,
  onNavigate,
  activeSection,
}: TopBarProps) {
  const { user, isGuest } = useAuth();
  const { settings, updateAppearance } = useApp();

  const currentTheme = settings.appearance?.themePreset || 'navy-purple';

  const handleCycleTheme = async () => {
    const currentIndex = THEME_CYCLE.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
    const nextTheme = THEME_CYCLE[nextIndex];
    await updateAppearance({
      ...settings.appearance,
      themePreset: nextTheme,
    });
  };

  const userInitial = user?.email
    ? user.email[0].toUpperCase()
    : isGuest
    ? 'G'
    : 'U';

  const displayName = user?.email
    ? user.email.split('@')[0]
    : isGuest
    ? 'Guest Demo'
    : 'Account';

  return (
    <header
      className="top-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.65rem 1.25rem',
        background: 'rgba(8, 12, 24, 0.75)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
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
            color: '#818cf8',
            background: 'rgba(129, 140, 248, 0.1)',
            padding: '3px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(129, 140, 248, 0.25)',
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
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '999px',
          padding: '0.45rem 1rem',
          color: 'var(--text-muted)',
          fontSize: '0.84rem',
          cursor: 'pointer',
          flex: 1,
          maxWidth: '440px',
          minWidth: '160px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(129, 140, 248, 0.4)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
        }}
      >
        <Search size={15} color="#818cf8" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Search anything…
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            fontSize: '0.68rem',
            background: 'rgba(255, 255, 255, 0.07)',
            padding: '2px 6px',
            borderRadius: '5px',
            color: 'var(--text-muted)',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
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
            padding: '0.45rem 0.85rem',
            borderRadius: '999px',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
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
          title={`Current Theme: ${currentTheme}. Click to cycle themes.`}
          aria-label="Cycle visual theme preset"
          style={{
            width: '34px',
            height: '34px',
            padding: 0,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border)',
            background: 'rgba(255, 255, 255, 0.03)',
            color: 'var(--text-secondary)',
          }}
        >
          <Moon size={15} color="#818cf8" />
        </button>

        {/* User Account Pill */}
        <button
          type="button"
          onClick={() => onNavigate('review')}
          className="btn btn-ghost btn-sm"
          title={`Logged in as ${displayName}. Click to open account settings.`}
          aria-label="User Account"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '0.25rem 0.6rem 0.25rem 0.35rem',
            borderRadius: '999px',
            border: '1px solid var(--border)',
            background: 'rgba(255, 255, 255, 0.03)',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {userInitial}
          </div>
          <span
            style={{
              fontSize: '0.76rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              maxWidth: '100px',
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
