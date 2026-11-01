import React from 'react';
import {
  LayoutDashboard,
  ListTree,
  Map,
  Heart,
  FileText,
  Newspaper,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  CloudOff,
  RefreshCw,
  User,
  AlertCircle,
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
  { id: 'home',      label: 'Home',               icon: <LayoutDashboard size={18} />, color: '#818cf8' },
  { id: 'tasks',     label: 'Tasks',              icon: <ListTree size={18} />,        color: '#38bdf8' },
  { id: 'journey',   label: 'My Journey',         icon: <Map size={18} />,             color: '#6366f1' },
  { id: 'personal',  label: 'Personal Life',      icon: <Heart size={18} />,           color: '#10b981' },
  { id: 'knowledge', label: 'Notes & Knowledge',  icon: <FileText size={18} />,        color: '#c084fc' },
  { id: 'explore',   label: 'Explore',            icon: <Newspaper size={18} />,       color: '#14b8a6' },
  { id: 'review',    label: 'Review & Settings',  icon: <Settings size={18} />,        color: '#94a3b8' },
];

export default function Sidebar({ active, onNavigate, collapsed, onToggle }: SidebarProps) {
  const { user, signOut, isGuest } = useAuth();
  const { syncStatus } = useApp();

  return (
    <aside
      className="sidebar flex flex-col"
      style={{
        width: collapsed ? '62px' : '230px',
        minWidth: collapsed ? '62px' : '230px',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: collapsed ? '1.25rem 0' : '1.25rem 1rem',
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
            boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
          }}
        >
          <Sparkles size={18} color="white" />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#f8fafc', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', lineHeight: 1 }}>
              Life OS
            </div>
            <div style={{ color: 'rgba(148,163,184,0.7)', fontSize: '0.66rem', fontWeight: 500, marginTop: '3px', letterSpacing: '0.02em' }}>
              Command Center
            </div>
          </div>
        )}
      </div>

      {/* Sync Status Strip */}
      {!collapsed && syncStatus !== 'synced' && (
        <div
          style={{
            padding: '0.45rem 1rem',
            background: syncStatus === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {syncStatus === 'syncing' && <RefreshCw size={13} color="#818cf8" className="animate-spin" />}
            {syncStatus === 'offline' && <CloudOff size={13} color="#f59e0b" />}
            {syncStatus === 'error' && <AlertCircle size={13} color="#ef4444" />}
            <span
              style={{
                color:
                  syncStatus === 'syncing'
                    ? '#818cf8'
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

      {/* Nav items — Exactly 7 destinations */}
      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={clsx('nav-item', active === item.id && 'active')}
            onClick={() => onNavigate(item.id)}
            data-tooltip={collapsed ? item.label : undefined}
            style={{ justifyContent: collapsed ? 'center' : 'flex-start', marginBottom: '3px' }}
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
