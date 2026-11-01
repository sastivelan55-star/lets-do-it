import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  ListTree,
  FileText,
  FolderOpen,
  Map,
  Clock,
  Compass,
  CornerDownLeft,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { NavSection } from '../../App';

export interface SearchResultItem {
  id: string;
  type: 'navigation' | 'task' | 'note' | 'project' | 'roadmap' | 'schedule';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  destination: NavSection;
  badge: string;
  action: () => void;
}

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: NavSection) => void;
}

export default function UniversalSearchModal({
  isOpen,
  onClose,
  onNavigate,
}: UniversalSearchModalProps) {
  const { tasks, notes, projects, milestones, schedules } = useApp();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via custom event if closed
          window.dispatchEvent(new CustomEvent('lifeos:open-search'));
        }
      }
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Top static navigation destinations
  const NAV_DESTINATIONS: SearchResultItem[] = useMemo(() => [
    {
      id: 'nav-home',
      type: 'navigation',
      title: 'Home Dashboard',
      subtitle: 'Today command center, real-time clock, daily priorities & focus',
      icon: <Compass size={15} color="#818cf8" />,
      color: '#818cf8',
      destination: 'home',
      badge: 'Destination',
      action: () => { onNavigate('home'); onClose(); },
    },
    {
      id: 'nav-tasks',
      type: 'navigation',
      title: 'Tasks Builder',
      subtitle: 'Unlimited hierarchical task tree, subtask nesting, and recycle bin',
      icon: <ListTree size={15} color="#38bdf8" />,
      color: '#38bdf8',
      destination: 'tasks',
      badge: 'Destination',
      action: () => { onNavigate('tasks'); onClose(); },
    },
    {
      id: 'nav-journey',
      type: 'navigation',
      title: 'My Journey',
      subtitle: '8-month learning roadmap, technical drills, projects & career readiness',
      icon: <Map size={15} color="#6366f1" />,
      color: '#6366f1',
      destination: 'journey',
      badge: 'Destination',
      action: () => { onNavigate('journey'); onClose(); },
    },
    {
      id: 'nav-personal',
      type: 'navigation',
      title: 'Personal Life',
      subtitle: 'Communication fluency, attendance, health routines & reflection',
      icon: <Sparkles size={15} color="#10b981" />,
      color: '#10b981',
      destination: 'personal',
      badge: 'Destination',
      action: () => { onNavigate('personal'); onClose(); },
    },
    {
      id: 'nav-knowledge',
      type: 'navigation',
      title: 'Notes & Knowledge',
      subtitle: 'Technical notes, DSA patterns, personal insights, and media vault',
      icon: <FileText size={15} color="#c084fc" />,
      color: '#c084fc',
      destination: 'knowledge',
      badge: 'Destination',
      action: () => { onNavigate('knowledge'); onClose(); },
    },
    {
      id: 'nav-explore',
      type: 'navigation',
      title: 'Explore & News',
      subtitle: 'Curated tech and engineering RSS news feeds & external insights',
      icon: <Compass size={15} color="#14b8a6" />,
      color: '#14b8a6',
      destination: 'explore',
      badge: 'Destination',
      action: () => { onNavigate('explore'); onClose(); },
    },
    {
      id: 'nav-review',
      type: 'navigation',
      title: 'Review & Settings',
      subtitle: 'Weekly retrospectives, life areas, appearance themes & account data',
      icon: <Layers size={15} color="#94a3b8" />,
      color: '#94a3b8',
      destination: 'review',
      badge: 'Destination',
      action: () => { onNavigate('review'); onClose(); },
    },
  ], [onNavigate, onClose]);

  // Search Results across all live entities
  const results: SearchResultItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return NAV_DESTINATIONS;
    }

    const matchedNav = NAV_DESTINATIONS.filter(
      (n) => n.title.toLowerCase().includes(q) || n.subtitle.toLowerCase().includes(q)
    );

    const matchedTasks: SearchResultItem[] = tasks
      .filter((t) => t.title.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q)))
      .slice(0, 8)
      .map((t) => ({
        id: `task-${t.id}`,
        type: 'task',
        title: t.title,
        subtitle: `${t.priority.toUpperCase()} priority · Area: ${t.lifeArea} · ${t.status}`,
        icon: <ListTree size={15} color="#38bdf8" />,
        color: '#38bdf8',
        destination: 'tasks',
        badge: t.parentId ? 'Subtask' : 'Task',
        action: () => { onNavigate('tasks'); onClose(); },
      }));

    const matchedNotes: SearchResultItem[] = notes
      .filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || (n.category && n.category.toLowerCase().includes(q)))
      .slice(0, 6)
      .map((n) => ({
        id: `note-${n.id}`,
        type: 'note',
        title: n.title,
        subtitle: `Category: ${n.category || 'General'} · ${n.content.slice(0, 60)}…`,
        icon: <FileText size={15} color="#c084fc" />,
        color: '#c084fc',
        destination: 'knowledge',
        badge: 'Note',
        action: () => { onNavigate('knowledge'); onClose(); },
      }));

    const matchedProjects: SearchResultItem[] = projects
      .filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.technologies.some((t) => t.toLowerCase().includes(q)))
      .slice(0, 5)
      .map((p) => ({
        id: `proj-${p.id}`,
        type: 'project',
        title: p.name,
        subtitle: `Status: ${p.status} · Stack: ${p.technologies.join(', ') || 'General'}`,
        icon: <FolderOpen size={15} color="#f97316" />,
        color: '#f97316',
        destination: 'journey',
        badge: 'Project',
        action: () => { onNavigate('journey'); onClose(); },
      }));

    const matchedMilestones: SearchResultItem[] = milestones
      .filter((m) => m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q))
      .slice(0, 4)
      .map((m) => ({
        id: `ms-${m.id}`,
        type: 'roadmap',
        title: `Month ${m.month}: ${m.title}`,
        subtitle: `${m.status.toUpperCase()} · ${m.subtasks.length} Subtasks scheduled`,
        icon: <Map size={15} color="#60a5fa" />,
        color: '#60a5fa',
        destination: 'journey',
        badge: 'Roadmap',
        action: () => { onNavigate('journey'); onClose(); },
      }));

    const matchedSchedules: SearchResultItem[] = schedules
      .filter((s) => s.title.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q)))
      .slice(0, 4)
      .map((s) => ({
        id: `sched-${s.id}`,
        type: 'schedule',
        title: s.title,
        subtitle: `${s.date} · ${s.startTime}–${s.endTime}`,
        icon: <Clock size={15} color="#10b981" />,
        color: '#10b981',
        destination: 'home',
        badge: 'Schedule',
        action: () => { onNavigate('home'); onClose(); },
      }));

    return [
      ...matchedNav,
      ...matchedTasks,
      ...matchedProjects,
      ...matchedNotes,
      ...matchedMilestones,
      ...matchedSchedules,
    ];
  }, [query, NAV_DESTINATIONS, tasks, notes, projects, milestones, schedules, onNavigate, onClose]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((idx) => (idx + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((idx) => (idx - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(4, 7, 16, 0.75)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '10vh 1rem 1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(129, 140, 248, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '75vh',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            gap: '0.75rem',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <Search size={18} color="#818cf8" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks, notes, projects, roadmap & destinations… (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: '0.95rem',
              fontWeight: 500,
            }}
          />
          {query && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setQuery('')}
              style={{ padding: '0.2rem 0.4rem' }}
            >
              <X size={14} />
            </button>
          )}
          <kbd
            style={{
              padding: '2px 6px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-muted)',
              fontSize: '0.7rem',
              fontWeight: 600,
              fontFamily: 'monospace',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {results.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Search size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
              <p style={{ fontWeight: 600, fontSize: '0.92rem', margin: '0 0 4px' }}>
                No matching results found
              </p>
              <p style={{ fontSize: '0.78rem', margin: 0 }}>
                Try searching for a task name, project tag, technical note, or life area.
              </p>
            </div>
          ) : (
            results.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '9px',
                    background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                    border: isSelected ? '1px solid rgba(129, 140, 248, 0.35)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        background: `${item.color}18`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: '0.86rem',
                            color: isSelected ? '#ffffff' : 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.title}
                        </span>
                        <span
                          style={{
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '999px',
                            background: `${item.color}22`,
                            color: item.color,
                            flexShrink: 0,
                          }}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: '0.73rem',
                          color: 'var(--text-muted)',
                          margin: '2px 0 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {isSelected && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: '#818cf8',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontWeight: 600,
                        }}
                      >
                        Open <CornerDownLeft size={11} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div
          style={{
            padding: '0.6rem 1.25rem',
            borderTop: '1px solid var(--border)',
            background: 'rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
            <span><kbd>↵</kbd> to select</span>
            <span><kbd>esc</kbd> to dismiss</span>
          </div>
          <span>Life OS Omnibox</span>
        </div>
      </div>
    </div>
  );
}
