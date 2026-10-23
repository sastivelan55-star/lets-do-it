import {
  LayoutDashboard,
  Map,
  CalendarDays,
  Clock,
  FileText,
  HardDrive,
  Code2,
  MessageSquare,
  Briefcase,
  Palette,
  Heart,
  FolderOpen,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
  Cloud,
  CloudOff,
  RefreshCw,
  User,
  ListTree,
} from 'lucide-react';
import type { NavSection } from '../../App';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import clsx from 'clsx';

interface SidebarProps {
  active: NavSection;
  onNavigate: (section: NavSection) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'today',        label: 'Today',              icon: <LayoutDashboard size={18} />, color: '#818cf8' },
  { id: 'task-builder', label: 'Task Builder',       icon: <ListTree size={18} />,        color: '#38bdf8' },
  { id: 'roadmap',      label: 'My Roadmap',         icon: <Map size={18} />,             color: '#60a5fa' },
  { id: 'planner',      label: 'Daily Planner',      icon: <CalendarDays size={18} />,    color: '#a78bfa' },
  { id: 'schedules',    label: 'Schedules',          icon: <Clock size={18} />,           color: '#38bdf8' },
  { id: 'notes',        label: 'Notes & Insights',   icon: <FileText size={18} />,        color: '#c084fc' },
  { id: 'uploads',      label: 'Media Vault',        icon: <HardDrive size={18} />,       color: '#14b8a6' },
  { id: 'technical',    label: 'Technical Mastery',  icon: <Code2 size={18} />,           color: '#6366f1' },
  { id: 'communication',label: 'Communication',      icon: <MessageSquare size={18} />,   color: '#06b6d4' },
  { id: 'career',       label: 'Career Readiness',   icon: <Briefcase size={18} />,       color: '#f59e0b' },
  { id: 'creativity',   label: 'Creativity & Identity',icon: <Palette size={18} />,       color: '#ec4899' },
  { id: 'health',       label: 'Health & Reflection',icon: <Heart size={18} />,           color: '#10b981' },
  { id: 'projects',     label: 'My Projects',        icon: <FolderOpen size={18} />,      color: '#f97316' },
  { id: 'review',       label: 'Weekly Review',      icon: <BarChart3 size={18} />,       color: '#8b5cf6' },
  { id: 'settings',     label: 'Settings & Data',    icon: <Settings size={18} />,        color: '#94a3b8' },
];


export default function Sidebar({ active, onNavigate, collapsed, onToggle }: SidebarProps) {
  const { user, signOut, isGuest } = useAuth();
  const { syncStatus } = useApp();

  return (
    <aside
      className="sidebar flex flex-col"
      style={{
        width: collapsed ? '60px' : '240px',
        minWidth: collapsed ? '60px' : '240px',
        transition: 'width 0.3s ease, min-width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? '1.2rem 0' : '1.2rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border)',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
          }}
        >
          <Zap size={18} color="white" />
        </div>
        {!collapsed && (
          <div>
            <div style={{ color: '#e2e8f0', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', lineHeight: 1 }}>
              LifeMap
            </div>
            <div style={{ color: 'rgba(148,163,184,0.7)', fontSize: '0.65rem', fontWeight: 500, marginTop: '2px' }}>
              Personal Progress OS
            </div>
          </div>
        )}
      </div>

      {/* Sync Status Badge */}
      {!collapsed && (
        <div
          style={{
            padding: '0.5rem 1rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {syncStatus === 'synced' && <Cloud size={13} color="#10b981" />}
            {syncStatus === 'syncing' && <RefreshCw size={13} color="#818cf8" className="animate-spin" />}
            {syncStatus === 'offline' && <CloudOff size={13} color="#f59e0b" />}
            {syncStatus === 'error' && <CloudOff size={13} color="#ef4444" />}
            <span
              style={{
                color:
                  syncStatus === 'synced'
                    ? '#10b981'
                    : syncStatus === 'syncing'
                    ? '#818cf8'
                    : syncStatus === 'error'
                    ? '#ef4444'
                    : '#f59e0b',
                fontWeight: 600,
              }}
            >
              {syncStatus === 'synced'
                ? 'Cloud Synced'
                : syncStatus === 'syncing'
                ? 'Syncing…'
                : syncStatus === 'error'
                ? 'Sync Error'
                : 'Local / Offline'}
            </span>
          </div>
          {isGuest && (
            <span style={{ color: '#f59e0b', fontSize: '0.68rem', fontWeight: 600 }}>Demo</span>
          )}
        </div>
      )}

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={clsx('nav-item', active === item.id && 'active')}
            onClick={() => onNavigate(item.id)}
            data-tooltip={collapsed ? item.label : undefined}
            style={{ justifyContent: collapsed ? 'center' : 'flex-start', marginBottom: '2px' }}
            aria-label={item.label}
            aria-current={active === item.id ? 'page' : undefined}
          >
            <span
              className="nav-icon"
              style={{ color: active === item.id ? item.color : undefined }}
            >
              {item.icon}
            </span>
            {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* User profile & Sign Out */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
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
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(99,102,241,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818cf8',
                  flexShrink: 0,
                }}
              >
                <User size={14} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={user?.email || (isGuest ? 'Guest User' : 'User')}
                >
                  {user?.email ? user.email.split('@')[0] : isGuest ? 'Guest Demo' : 'Account'}
                </p>
                <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {user ? 'Cloud Active' : 'Offline'}
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
                padding: '4px',
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
          borderTop: '1px solid var(--border)',
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
