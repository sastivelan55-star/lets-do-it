import type { ReactNode } from 'react';
import { LayoutDashboard, CalendarDays, Code2, FolderOpen, Settings } from 'lucide-react';
import type { NavSection } from '../../App';

interface MobileNavProps {
  active: NavSection;
  onNavigate: (section: NavSection) => void;
}

const MOBILE_NAV: { id: NavSection; label: string; icon: ReactNode }[] = [
  { id: 'today',        label: 'Today',    icon: <LayoutDashboard size={20} /> },
  { id: 'planner',      label: 'Planner',  icon: <CalendarDays size={20} /> },
  { id: 'technical',    label: 'Learn',    icon: <Code2 size={20} /> },
  { id: 'projects',     label: 'Projects', icon: <FolderOpen size={20} /> },
  { id: 'settings',     label: 'More',     icon: <Settings size={20} /> },
];

export default function MobileNav({ active, onNavigate }: MobileNavProps) {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--bg-sidebar)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      aria-label="Mobile navigation"
    >
      {MOBILE_NAV.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          aria-label={item.label}
          aria-current={active === item.id ? 'page' : undefined}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            padding: '0.6rem 0.25rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: active === item.id ? '#818cf8' : 'rgba(148,163,184,0.65)',
            fontSize: '0.65rem',
            fontWeight: 600,
            transition: 'color 0.15s ease',
          }}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
