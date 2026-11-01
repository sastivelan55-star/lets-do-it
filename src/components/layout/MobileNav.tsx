import React, { useState } from 'react';
import {
  LayoutDashboard,
  ListTree,
  Map,
  Heart,
  FileText,
  Newspaper,
  Settings,
  MoreHorizontal,
  X,
  LogOut,
  User,
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
  { id: 'journey',  label: 'Journey',  icon: <Map size={20} /> },
  { id: 'personal', label: 'Personal', icon: <Heart size={20} /> },
];

// Sections accessible from the "More" drawer
const MORE_NAV: { id: NavSection; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'knowledge', label: 'Notes & Knowledge', icon: <FileText size={20} />,  color: '#c084fc' },
  { id: 'explore',   label: 'Explore',           icon: <Newspaper size={20} />, color: '#14b8a6' },
  { id: 'review',    label: 'Review & Settings', icon: <Settings size={20} />,  color: '#94a3b8' },
];

const MORE_SECTION_IDS: NavSection[] = ['knowledge', 'explore', 'review'];

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
        {PRIMARY_NAV.map((item) => (
          <button
            key={item.id}
            className={`mobile-nav-btn${active === item.id ? ' active' : ''}`}
            onClick={() => handleNavigate(item.id)}
            aria-label={item.label}
            aria-current={active === item.id ? 'page' : undefined}
            style={{ position: 'relative' }}
          >
            <span className="mobile-nav-indicator" />
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}

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
                color: 'rgba(148,163,184,0.5)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.75rem',
                textAlign: 'center',
              }}
            >
              Destinations & Account
            </p>
            <div className="mobile-drawer-grid">
              {MORE_NAV.map((item) => (
                <button
                  key={item.id}
                  className={`mobile-drawer-item${active === item.id ? ' active' : ''}`}
                  onClick={() => handleNavigate(item.id)}
                  aria-label={item.label}
                  aria-current={active === item.id ? 'page' : undefined}
                >
                  <span style={{ color: active === item.id ? item.color : undefined }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Account & Sign out bar */}
            <div
              style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, overflow: 'hidden' }}>
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'rgba(99,102,241,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#818cf8',
                    flexShrink: 0,
                  }}
                >
                  <User size={13} />
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
                  <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)' }}>
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
