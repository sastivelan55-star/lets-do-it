import {
  Search,
  Zap,
  Moon,
  Sun,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import type { NavSection } from '../../App';

interface TopBarProps {
  onOpenSearch: () => void;
  onOpenQuickCapture: () => void;
  onNavigate: (section: NavSection) => void;
  activeSection: NavSection;
}

const SECTION_LABELS: Partial<Record<NavSection, string>> = {
  tasks: 'Task System',
  pulse: 'News — Live Feeds',
  notes: 'Knowledge & Notes',
  projects: 'Projects Hub',
  roadmap: 'Roadmap & Milestones',
  settings: 'Settings & Preferences',
  journey: 'My Journey',
  personal: 'Personal Life',
  knowledge: 'Knowledge Base',
  explore: 'News',
  vault: 'Digital Vault',
  uploads: 'Media Vault',
  groceries: 'Grocery List',
};

export default function TopBar({
  onOpenSearch,
  onOpenQuickCapture,
  onNavigate,
  activeSection,
}: TopBarProps) {
  const { user } = useAuth();
  const { settings, updateSettings, tasks } = useApp();

  const isLight = settings.theme === 'light' || settings.appearance?.theme === 'light';

  const handleToggleTheme = async () => {
    const nextTheme = isLight ? 'dark' : 'light';
    const currentPreset = settings.appearance?.themePreset;
    const nextDarkPreset = currentPreset && currentPreset !== 'clean-light' ? currentPreset : 'purple-fantasy';
    await updateSettings({
      theme: nextTheme,
      appearance: {
        ...settings.appearance,
        theme: nextTheme,
        themePreset: nextTheme === 'light' ? 'clean-light' : nextDarkPreset,
      },
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
      className="top-bar app-topbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem clamp(0.6rem, 2vw, 1.25rem)',
        background: isLight ? 'rgba(255, 255, 255, 0.94)' : 'rgba(8, 5, 22, 0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: isLight ? '1px solid rgba(168, 85, 247, 0.15)' : '1px solid rgba(168, 85, 247, 0.18)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        gap: '0.45rem',
        maxWidth: '100vw',
        boxSizing: 'border-box',
      }}
    >
      {/* Left: Active Section Indicator & Global Search Trigger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, maxWidth: '520px', minWidth: 0 }}>
        {activeSection !== 'home' && SECTION_LABELS[activeSection] ? (
          <div
            className="topbar-section-label hidden sm:inline-flex"
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
          >
            {SECTION_LABELS[activeSection]}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search anything across Life OS (Ctrl + K)"
          className="topbar-search-btn topbar-search"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: '999px',
            padding: '0.45rem 0.95rem',
            color: 'var(--text-muted)',
            fontSize: '0.84rem',
            cursor: 'pointer',
            flex: 1,
            maxWidth: '440px',
            minWidth: 0,
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
          <span className="hidden md:inline" style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Search anything... (Ctrl + K)
          </span>
          <span className="md:hidden" style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Search...
          </span>
          <span
            className="hidden md:inline-flex"
            style={{
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
      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
        {/* Quick Capture Button */}
        <button
          type="button"
          onClick={onOpenQuickCapture}
          className="btn btn-primary btn-sm topbar-capture-btn"
          title="Universal Quick Capture (Task, Note, Project, Idea)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
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
        </button>

        {/* Light / Dark Mode Toggle */}
        <button
          type="button"
          onClick={handleToggleTheme}
          className="btn btn-ghost btn-sm topbar-ctrl-btn"
          title={isLight ? 'Light mode active. Click for Dark mode.' : 'Dark mode active. Click for Light mode.'}
          aria-label="Toggle light and dark theme"
          style={{
            width: '34px',
            height: '34px',
            padding: 0,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: isLight ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(168, 85, 247, 0.25)',
            background: isLight ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.05)',
            color: isLight ? '#f59e0b' : '#c084fc',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {isLight ? <Sun size={16} color="#f59e0b" /> : <Moon size={15} color="#c084fc" />}
        </button>

        {/* Notification Bell Badge */}
        <button
          type="button"
          onClick={() => onNavigate('tasks')}
          className="btn btn-ghost btn-sm topbar-ctrl-btn"
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
          className="btn btn-ghost btn-sm topbar-user-btn"
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
