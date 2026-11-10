import React from 'react';
import {
  LayoutDashboard,
  ListTree,
  FileText,
  Calendar,
  FolderKanban,
  Rocket,
  Heart,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  CloudOff,
  RefreshCw,
  AlertCircle,
  Globe,
  FileBox,
} from 'lucide-react';
import type { NavSection } from '../../App';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { getCharacterById } from '../../data/animeCharacters';

interface SidebarProps {
  active: NavSection;
  onNavigate: (section: NavSection) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'home',       label: 'Home',       icon: <LayoutDashboard size={18} />, color: '#c084fc' },
  { id: 'tasks',      label: 'Tasks',      icon: <ListTree size={18} />,        color: '#38bdf8' },
  { id: 'pulse',      label: 'News',       icon: <Globe size={18} />,           color: '#38bdf8' },
  { id: 'notes',      label: 'Notes',      icon: <FileText size={18} />,        color: '#a855f7' },
  { id: 'vault',      label: 'Vault',      icon: <FileBox size={18} />,         color: '#c084fc' },
  { id: 'calendar',   label: 'Calendar',   icon: <Calendar size={18} />,        color: '#38bdf8' },
  { id: 'projects',   label: 'Projects',   icon: <FolderKanban size={18} />,    color: '#ec4899' },
  { id: 'roadmap',    label: 'Roadmap',    icon: <Rocket size={18} />,          color: '#f59e0b' },
  { id: 'reflection', label: 'Reflection', icon: <Heart size={18} />,           color: '#10b981' },
  { id: 'settings',   label: 'Settings',   icon: <Settings size={18} />,        color: '#94a3b8' },
];

export default function Sidebar({ active, onNavigate, collapsed, onToggle }: SidebarProps) {
  const { user, signOut, isGuest } = useAuth();
  const { syncStatus, tasks, settings } = useApp();

  // Map legacy routes to current 9 items
  const isItemActive = (id: NavSection): boolean => {
    if (active === id) return true;
    if (id === 'pulse' && active === 'explore') return true;
    if (id === 'projects' && active === 'journey') return true;
    if (id === 'reflection' && active === 'personal') return true;
    if (id === 'notes' && active === 'knowledge') return true;
    if (id === 'vault' && active === 'uploads') return true;
    if (id === 'settings' && active === 'review') return true;
    return false;
  };

  const pendingTasksCount = tasks.filter((t) => !t.isDeleted && t.status !== 'completed').length;
  const activeChar = getCharacterById(settings.personalization?.activeCharacterId || 'nami');
  const showSidebarDeco = settings.personalization?.sidebarDecorationEnabled !== false;

  return (
    <aside
      className="sidebar flex flex-col"
      style={{
        width: collapsed ? '68px' : '230px',
        minWidth: collapsed ? '68px' : '230px',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(8, 5, 20, 0.78)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(168, 85, 247, 0.18)',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.35)',
        zIndex: 20,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: collapsed ? '1.25rem 0' : '1.25rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid rgba(168, 85, 247, 0.15)',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 16px rgba(168, 85, 247, 0.55)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          <Sparkles size={20} color="white" />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                color: '#f8fafc',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.15rem',
                lineHeight: 1.1,
                letterSpacing: '0.02em',
                textShadow: '0 0 12px rgba(192, 132, 252, 0.5)',
              }}
            >
              Life OS
            </div>
            <div
              style={{
                color: '#c084fc',
                fontSize: '0.68rem',
                fontWeight: 600,
                marginTop: '3px',
                letterSpacing: '0.04em',
              }}
            >
              Dream • Plan • Achieve
            </div>
          </div>
        )}
      </div>

      {/* Sync Status Strip */}
      {!collapsed && syncStatus !== 'synced' && (
        <div
          style={{
            padding: '0.45rem 1rem',
            background: syncStatus === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid rgba(168, 85, 247, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {syncStatus === 'syncing' && <RefreshCw size={13} color="#c084fc" className="animate-spin" />}
            {syncStatus === 'offline' && <CloudOff size={13} color="#f59e0b" />}
            {syncStatus === 'error' && <AlertCircle size={13} color="#ef4444" />}
            <span
              style={{
                color:
                  syncStatus === 'syncing'
                    ? '#c084fc'
                    : syncStatus === 'error'
                    ? '#ef4444'
                    : '#f59e0b',
                fontWeight: 600,
              }}
            >
              {syncStatus === 'syncing'
                ? 'Syncing changes…'
                : syncStatus === 'error'
                ? 'Sync Error — offline mode'
                : 'Offline mode'}
            </span>
          </div>
          {isGuest && (
            <span style={{ color: '#f59e0b', fontSize: '0.68rem', fontWeight: 600 }}>Demo</span>
          )}
        </div>
      )}

      {/* Nav items — 8 anime fantasy destinations */}
      <nav style={{ flex: 1, padding: '0.85rem 0.55rem', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_ITEMS.map((item) => {
          const activeItem = isItemActive(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              data-tooltip={collapsed ? item.label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.55rem 0.85rem',
                borderRadius: '12px',
                border: activeItem
                  ? '1px solid rgba(192, 132, 252, 0.5)'
                  : '1px solid transparent',
                background: activeItem
                  ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.36), rgba(99, 102, 241, 0.28))'
                  : 'transparent',
                boxShadow: activeItem
                  ? '0 0 16px rgba(168, 85, 247, 0.35), inset 0 0 10px rgba(168, 85, 247, 0.18)'
                  : 'none',
                color: activeItem ? '#ffffff' : 'rgba(203, 213, 225, 0.75)',
                fontWeight: activeItem ? 700 : 500,
                fontSize: '0.86rem',
                cursor: 'pointer',
                marginBottom: '4px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                position: 'relative',
                transition: 'all 0.2s ease',
              }}
              aria-label={item.label}
              aria-current={activeItem ? 'page' : undefined}
            >
              <span
                style={{
                  color: activeItem ? '#ffffff' : item.color,
                  display: 'flex',
                  alignItems: 'center',
                  filter: activeItem ? 'drop-shadow(0 0 8px rgba(192, 132, 252, 0.6))' : 'none',
                }}
              >
                {item.icon}
              </span>

              {!collapsed && (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
                  {item.label}
                </span>
              )}

              {/* Tasks Count Badge */}
              {!collapsed && item.id === 'tasks' && pendingTasksCount > 0 && (
                <span
                  style={{
                    background: activeItem ? '#ec4899' : 'rgba(168, 85, 247, 0.25)',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '1px 7px',
                    borderRadius: '999px',
                    border: '1px solid rgba(236, 72, 153, 0.4)',
                    boxShadow: '0 0 8px rgba(236, 72, 153, 0.3)',
                  }}
                >
                  {pendingTasksCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Anime Encouragement Note */}
      {!collapsed && showSidebarDeco && (
        <div
          style={{
            padding: '0.75rem 1rem',
            textAlign: 'center',
            borderTop: '1px solid rgba(168, 85, 247, 0.12)',
            background: 'linear-gradient(180deg, transparent, rgba(168, 85, 247, 0.08))',
          }}
        >
          <div
            style={{
              fontFamily: 'cursive, var(--font-display), sans-serif',
              fontSize: '0.88rem',
              color: '#f472b6',
              fontWeight: 600,
              letterSpacing: '0.02em',
              textShadow: '0 0 10px rgba(244, 114, 182, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            You're doing amazing! ♡
          </div>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '3px' }}>
            ✦ {activeChar.name} is with you ✦
          </div>
        </div>
      )}

      {/* User profile & Sign Out */}
      <div
        style={{
          borderTop: '1px solid rgba(168, 85, 247, 0.15)',
          padding: collapsed ? '0.75rem 0.25rem' : '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: '0.5rem',
        }}
      >
        {!collapsed ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  flexShrink: 0,
                  boxShadow: '0 0 10px rgba(168, 85, 247, 0.4)',
                }}
              >
                {settings.displayName ? settings.displayName[0].toUpperCase() : 'S'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#f8fafc',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={settings.displayName || user?.email || 'User'}
                >
                  {settings.displayName || (user?.email ? user.email.split('@')[0] : 'Sastivelan')}
                </p>
                <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(192, 132, 252, 0.8)' }}>
                  {user ? 'Cloud Active' : 'Offline Mode'}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              title="Sign Out"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '5px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <button
            onClick={() => signOut()}
            title="Sign Out"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <LogOut size={16} />
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.6rem',
          borderTop: '1px solid rgba(168, 85, 247, 0.12)',
          background: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          borderBottom: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'color 0.15s',
        }}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
