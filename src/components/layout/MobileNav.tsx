import { useState } from 'react';
import {
  LayoutDashboard, CalendarDays, Map, FolderOpen,
  MoreHorizontal, Code2, MessageSquare, Briefcase, Palette, Heart,
  BarChart3, Settings, X,
} from 'lucide-react';
import type { NavSection } from '../../App';

interface MobileNavProps {
  active: NavSection;
  onNavigate: (section: NavSection) => void;
}

// Primary 4 tabs always shown in the bottom bar alongside More
const PRIMARY_NAV: { id: NavSection; label: string; icon: React.ReactNode }[] = [
  { id: 'today',     label: 'Today',    icon: <LayoutDashboard size={20} /> },
  { id: 'planner',   label: 'Planner',  icon: <CalendarDays size={20} /> },
  { id: 'technical', label: 'Learn',    icon: <Code2 size={20} /> },
  { id: 'projects',  label: 'Projects', icon: <FolderOpen size={20} /> },
];

// All sections accessible from the "More" drawer
const MORE_NAV: { id: NavSection; label: string; icon: React.ReactNode }[] = [
  { id: 'roadmap',      label: 'Roadmap',       icon: <Map size={20} /> },
  { id: 'communication',label: 'Communication', icon: <MessageSquare size={20} /> },
  { id: 'career',       label: 'Career',        icon: <Briefcase size={20} /> },
  { id: 'creativity',   label: 'Creativity',    icon: <Palette size={20} /> },
  { id: 'health',       label: 'Health',        icon: <Heart size={20} /> },
  { id: 'review',       label: 'Review',        icon: <BarChart3 size={20} /> },
  { id: 'settings',     label: 'Settings',      icon: <Settings size={20} /> },
];

// All sections not in the primary bar
const MORE_SECTION_IDS = MORE_NAV.map(n => n.id) as NavSection[];

export default function MobileNav({ active, onNavigate }: MobileNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const moreIsActive = MORE_SECTION_IDS.includes(active);

  const handleNavigate = (id: NavSection) => {
    onNavigate(id);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Bottom Nav Bar */}
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
          onClick={() => setDrawerOpen(v => !v)}
          aria-label="More sections"
          aria-expanded={drawerOpen}
          style={{ position: 'relative' }}
        >
          <span className="mobile-nav-indicator" />
          {drawerOpen ? <X size={20} /> : <MoreHorizontal size={20} />}
          <span>More</span>
        </button>
      </nav>

      {/* More drawer */}
      {drawerOpen && (
        <>
          <div
            className="mobile-drawer-backdrop"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="mobile-drawer" role="dialog" aria-label="More navigation">
            <p style={{ fontSize: '0.72rem', color: 'rgba(148,163,184,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem', textAlign: 'center' }}>
              Life Areas & More
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
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
