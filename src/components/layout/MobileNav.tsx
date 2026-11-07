import React, { useState } from 'react';
import {
  LayoutDashboard,
  ListTree,
  Calendar,
  FolderKanban,
  FileText,
  Rocket,
  Heart,
  Settings,
  MoreHorizontal,
  X,
  LogOut,
  User,
  Globe,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { NavSection } from '../../App';

interface MobileNavProps {
  active: NavSection;
  onNavigate: (section: NavSection) => void;
}

// 4 primary tabs always shown in the mobile bottom bar alongside 'More'
const PRIMARY_NAV: { id: NavSection; label: string; icon: React.ReactNode }[] = [
  { id: 'home',     label: 'Home',     icon: <LayoutDashboard size={20} /> },
  { id: 'tasks',    label: 'Tasks',    icon: <ListTree size={20} /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar size={20} /> },
  { id: 'projects', label: 'Projects', icon: <FolderKanban size={20} /> },
];

// Sections accessible from the "More" drawer
const MORE_NAV: { id: NavSection; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'pulse',      label: 'News',                icon: <Globe size={20} />,        color: '#38bdf8' },
  { id: 'notes',      label: 'Notes',               icon: <FileText size={20} />,     color: '#c084fc' },
  { id: 'roadmap',    label: 'Roadmap & Goals',     icon: <Rocket size={20} />,       color: '#f59e0b' },
  { id: 'reflection', label: 'Weekly Reflection',   icon: <Heart size={20} />,        color: '#10b981' },
  { id: 'settings',   label: 'Anime & Settings',    icon: <Settings size={20} />,     color: '#ec4899' },
];

const MORE_SECTION_IDS: NavSection[] = [
  'pulse',
  'notes',
  'roadmap',
  'reflection',
  'settings',
  'knowledge',
  'explore',
  'review',
  'journey',
  'personal',
];

export default function MobileNav({ active, onNavigate }: MobileNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, isGuest, signOut } = useAuth();
  const moreIsActive = MORE_SECTION_IDS.includes(active);

  const handleNavigate = (id: NavSection) => {
    onNavigate(id);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {PRIMARY_NAV.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              className={`mobile-nav-btn${isActive ? ' active' : ''}`}
              onClick={() => handleNavigate(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              style={{ position: 'relative' }}
            >
              <span className="mobile-nav-indicator" />
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* More button */}
        <button
          className={`mobile-nav-btn${moreIsActive || drawerOpen ? ' active' : ''}`}
          onClick={() => setDrawerOpen((v) => !v)}
          aria-label="More destinations"
          aria-expanded={drawerOpen}
          style={{ position: 'relative' }}
        >
          <span className="mobile-nav-indicator" />
          {drawerOpen ? <X size={20} /> : <MoreHorizontal size={20} />}
          <span>More</span>
        </button>
      </nav>

      {/* Drawer for remaining destinations */}
      {drawerOpen && (
        <>
          <div
            className="mobile-drawer-backdrop"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="mobile-drawer" role="dialog" aria-label="More navigation">
            <p
              style={{
                fontSize: '0.72rem',
                color: 'rgba(192,132,252,0.7)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.75rem',
                textAlign: 'center',
              }}
            >
              Anime Destinations & Account
            </p>
            <div className="mobile-drawer-grid">
              {MORE_NAV.map((item) => {
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    className={`mobile-drawer-item${isActive ? ' active' : ''}`}
                    onClick={() => handleNavigate(item.id)}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span style={{ color: isActive ? item.color : undefined }}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Account & Sign out bar */}
            <div
              style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(168, 85, 247, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, overflow: 'hidden' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    flexShrink: 0,
                  }}
                >
                  <User size={14} />
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
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
                  >
                    {user?.email ?? (isGuest ? 'Guest Demo' : 'Account')}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.65rem', color: '#c084fc' }}>
                    {user ? 'Cloud Active' : 'Offline Mode'}
                  </p>
                </div>
              </div>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => {
                  setDrawerOpen(false);
                  signOut();
                }}
                id="mobile-signout-btn"
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0,
                }}
              >
                <LogOut size={13} />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
