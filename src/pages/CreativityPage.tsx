import { useState, useEffect, useMemo } from 'react';
import {
  Palette,
  Plus,
  Edit2,
  Trash2,
  Sliders,
  Check,
  ExternalLink,
  Lock,
  Search,
} from 'lucide-react';
import ProgressRing from '../components/ui/ProgressRing';
import Modal from '../components/ui/Modal';
import type { ContentItem } from '../types';
import { getAllFromStore, saveToStore, deleteFromStore, getStoredChecklist, saveStoredChecklist } from '../db/storage';
import { today } from '../utils/dates';
import { nanoid } from '../utils/nanoid';

export interface CreativePillarConfig {
  id: string;
  type: string;
  label: string;
  icon: string;
  color: string;
}

export interface CreativeRoutineItem {
  id: string;
  task: string;
  time: string;
}

export interface CreativeMilestoneItem {
  id: string;
  title: string;
  targetDate?: string;
  isCompleted: boolean;
}

const DEFAULT_PILLARS: CreativePillarConfig[] = [
  { id: '1', type: 'writing', label: 'Writing & Books', icon: '📖', color: '#f59e0b' },
  { id: '2', type: 'media', label: 'Video & Audio Content', icon: '🎬', color: '#8b5cf6' },
  { id: '3', type: 'tech-writing', label: 'Tech Articles & Tutorials', icon: '💻', color: '#0ea5e9' },
  { id: '4', type: 'design', label: 'Design & Visual Arts', icon: '🎨', color: '#ec4899' },
  { id: '5', type: 'identity', label: 'Culture & Personal Voice', icon: '🌟', color: '#10b981' },
];

const DEFAULT_ROUTINES: CreativeRoutineItem[] = [
  { id: '1', time: '10 min', task: 'Capture one fresh creative idea or outline' },
  { id: '2', time: '15 min', task: 'Draft a section, edit a clip, or refine a concept' },
  { id: '3', time: '5 min', task: 'Curate high-signal inspirations and creative references' },
];

const DEFAULT_MILESTONES: CreativeMilestoneItem[] = [
  { id: '1', title: 'Complete first 3 draft chapters of book / long-form project', isCompleted: false },
  { id: '2', title: 'Publish 5 educational tech videos or essays', isCompleted: false },
  { id: '3', title: 'Establish consistent personal brand portfolio', isCompleted: false },
];

const ITEM_STATUSES: { value: ContentItem['status']; label: string; color: string }[] = [
  { value: 'idea', label: 'Idea', color: '#64748b' },
  { value: 'draft', label: 'Draft', color: '#f59e0b' },
  { value: 'scheduled', label: 'Scheduled', color: '#6366f1' },
  { value: 'published', label: 'Completed / Published', color: '#10b981' },
];

export default function CreativityPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [pillars] = useState<CreativePillarConfig[]>(() => {
    const saved = localStorage.getItem('creativity_pillars_v2');
    return saved ? JSON.parse(saved) : DEFAULT_PILLARS;
  });
  const [routines, setRoutines] = useState<CreativeRoutineItem[]>(() => {
    const saved = localStorage.getItem('creativity_routines_v2');
    return saved ? JSON.parse(saved) : DEFAULT_ROUTINES;
  });
  const [milestones, setMilestones] = useState<CreativeMilestoneItem[]>(() => {
    const saved = localStorage.getItem('creativity_milestones_v2');
    return saved ? JSON.parse(saved) : DEFAULT_MILESTONES;
  });

  // Overview info
  const [creativeVision, setCreativeVision] = useState<string>(() => {
    return (
      localStorage.getItem('creativity_vision') ||
      'Build useful technology, explore storytelling, and create authentic cultural & technical content.'
    );
  });
  const [creativeTitle, setCreativeTitle] = useState<string>(() => {
    return localStorage.getItem('creativity_title') || 'Creative Projects & Identity Studio';
  });

  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [itemForm, setItemForm] = useState({
    type: 'writing' as ContentItem['type'],
    title: '',
    idea: '',
    draft: '',
    plannedDate: '',
    status: 'idea' as ContentItem['status'],
    link: '',
    isPrivate: false,
    notes: '',
  });

  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<CreativeRoutineItem | null>(null);
  const [routineForm, setRoutineForm] = useState({ task: '', time: '10 min' });

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<CreativeMilestoneItem | null>(null);
  const [milestoneForm, setMilestoneForm] = useState({ title: '', targetDate: '', isCompleted: false });

  const [dailyChecked, setDailyChecked] = useState<Record<string, boolean>>(() =>
    getStoredChecklist('creativity_' + today())
  );

  useEffect(() => {
    getAllFromStore<ContentItem>('contentItems').then(setItems);
  }, []);

  const saveRoutines = (updated: CreativeRoutineItem[]) => {
    setRoutines(updated);
    localStorage.setItem('creativity_routines_v2', JSON.stringify(updated));
  };

  const saveMilestones = (updated: CreativeMilestoneItem[]) => {
    setMilestones(updated);
    localStorage.setItem('creativity_milestones_v2', JSON.stringify(updated));
  };

  const toggleDaily = (id: string) => {
    setDailyChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveStoredChecklist('creativity_' + today(), next);
      return next;
    });
  };

  // Item CRUD
  const handleSaveItem = async () => {
    if (!itemForm.title.trim()) return;
    const now = new Date().toISOString();
    if (editingItem) {
      const updated: ContentItem = {
        ...editingItem,
        ...itemForm,
        title: itemForm.title.trim(),
      };
      await saveToStore('contentItems', updated);
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } else {
      const newItem: ContentItem = {
        id: nanoid(),
        ...itemForm,
        title: itemForm.title.trim(),
        createdAt: now,
      };
      await saveToStore('contentItems', newItem);
      setItems((prev) => [...prev, newItem]);
    }
    setShowItemModal(false);
    setEditingItem(null);
  };

  const handleDeleteItem = async (id: string) => {
    await deleteFromStore('contentItems', id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItemStatus = async (id: string, status: ContentItem['status']) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const updated = { ...item, status };
    await saveToStore('contentItems', updated);
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
  };

  // Routine Handlers
  const handleSaveRoutine = () => {
    if (!routineForm.task.trim()) return;
    if (editingRoutine) {
      const updated = routines.map((r) =>
        r.id === editingRoutine.id ? { ...r, task: routineForm.task.trim(), time: routineForm.time.trim() } : r
      );
      saveRoutines(updated);
    } else {
      saveRoutines([...routines, { id: nanoid(), task: routineForm.task.trim(), time: routineForm.time.trim() }]);
    }
    setShowRoutineModal(false);
    setEditingRoutine(null);
  };

  const handleDeleteRoutine = (id: string) => {
    saveRoutines(routines.filter((r) => r.id !== id));
  };

  // Milestone Handlers
  const handleSaveMilestone = () => {
    if (!milestoneForm.title.trim()) return;
    if (editingMilestone) {
      const updated = milestones.map((m) =>
        m.id === editingMilestone.id
          ? {
              ...m,
              title: milestoneForm.title.trim(),
              targetDate: milestoneForm.targetDate || undefined,
              isCompleted: milestoneForm.isCompleted,
            }
          : m
      );
      saveMilestones(updated);
    } else {
      saveMilestones([
        ...milestones,
        {
          id: nanoid(),
          title: milestoneForm.title.trim(),
          targetDate: milestoneForm.targetDate || undefined,
          isCompleted: milestoneForm.isCompleted,
        },
      ]);
    }
    setShowMilestoneModal(false);
    setEditingMilestone(null);
  };

  const toggleMilestone = (id: string) => {
    saveMilestones(milestones.map((m) => (m.id === id ? { ...m, isCompleted: !m.isCompleted } : m)));
  };

  const handleDeleteMilestone = (id: string) => {
    saveMilestones(milestones.filter((m) => m.id !== id));
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      if (filterType !== 'all' && i.type !== filterType) return false;
      if (filterStatus !== 'all' && i.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = i.title.toLowerCase().includes(q);
        const matchesIdea = i.idea ? i.idea.toLowerCase().includes(q) : false;
        const matchesNotes = i.notes ? i.notes.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesIdea && !matchesNotes) return false;
      }
      return true;
    });
  }, [items, filterType, filterStatus, searchQuery]);

  const completedCount = items.filter((i) => i.status === 'published').length;
  const pct = items.length ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="page-container pb-safe">
      {/* Hero Header */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(139,92,246,0.06))',
          borderColor: 'rgba(236,72,153,0.25)',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <ProgressRing
          value={pct}
          size={100}
          strokeWidth={10}
          color="#ec4899"
          trackColor="rgba(236,72,153,0.12)"
          label={`${pct}%`}
          sublabel="Published"
        />

        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Palette size={22} color="#ec4899" />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{creativeTitle}</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '0.5rem', lineHeight: 1.5 }}>
            {creativeVision}
          </p>
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Creations</p>
              <p style={{ fontWeight: 800, fontSize: '1.15rem', color: '#ec4899' }}>{items.length}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Published / Done</p>
              <p style={{ fontWeight: 800, fontSize: '1.15rem', color: '#10b981' }}>{completedCount}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>In Progress & Drafts</p>
              <p style={{ fontWeight: 800, fontSize: '1.15rem', color: '#f59e0b' }}>
                {items.filter((i) => i.status === 'draft' || i.status === 'scheduled').length}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Milestones Met</p>
              <p style={{ fontWeight: 800, fontSize: '1.15rem', color: '#8b5cf6' }}>
                {milestones.filter((m) => m.isCompleted).length} / {milestones.length}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowOverviewModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Sliders size={15} /> Manage
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingItem(null);
              setItemForm({
                type: 'writing',
                title: '',
                idea: '',
                draft: '',
                plannedDate: '',
                status: 'idea',
                link: '',
                isPrivate: false,
                notes: '',
              });
              setShowItemModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              background: '#ec4899',
              borderColor: '#ec4899',
              color: '#fff',
            }}
          >
            <Plus size={16} /> New Idea / Project
          </button>
        </div>
      </div>

      {/* Pillars / Categories Quick Filter Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        {pillars.map((p) => {
          const count = items.filter((i) => i.type === p.type).length;
          const isSelected = filterType === p.type;
          return (
            <button
              key={p.id}
              onClick={() => setFilterType(isSelected ? 'all' : p.type)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                padding: '0.875rem',
                background: isSelected ? `${p.color}18` : 'var(--bg-surface)',
                border: `1px solid ${isSelected ? p.color : 'var(--border)'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>{p.icon}</span>
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: isSelected ? p.color : 'var(--text-primary)',
                  lineHeight: 1.3,
                }}
              >
                {p.label}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {count} project{count !== 1 ? 's' : ''}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div
        className="card"
        style={{
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 200 }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            className="input"
            type="text"
            placeholder="Search projects, ideas, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="input select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }}
          >
            <option value="all">All Statuses</option>
            {ITEM_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {(filterType !== 'all' || filterStatus !== 'all' || searchQuery) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setFilterType('all');
                setFilterStatus('all');
                setSearchQuery('');
              }}
              style={{ fontSize: '0.78rem' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Projects & Creations List */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>🎨 Creative Projects & Ideas</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing {filteredItems.length} of {items.length}
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <Palette size={32} color="var(--text-muted)" style={{ opacity: 0.5, margin: '0 auto 0.5rem' }} />
            <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>No Creative Items Found</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Capture writing ideas, video scripts, design concepts, and creative experiments here.
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setEditingItem(null);
                setItemForm({
                  type: 'writing',
                  title: '',
                  idea: '',
                  draft: '',
                  plannedDate: '',
                  status: 'idea',
                  link: '',
                  isPrivate: false,
                  notes: '',
                });
                setShowItemModal(true);
              }}
              style={{ background: '#ec4899', borderColor: '#ec4899', color: '#fff' }}
            >
              <Plus size={14} /> Add First Project / Idea
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {filteredItems.map((item) => {
              const pillar = pillars.find((p) => p.type === item.type) || pillars[0];
              const statusCfg = ITEM_STATUSES.find((s) => s.value === item.status) || ITEM_STATUSES[0];

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: '0.85rem',
                    padding: '0.85rem 1rem',
                    background: 'var(--bg-surface-2)',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{pillar?.icon || '🎨'}</span>

                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <p
                        className="task-title"
                        style={{
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: 'var(--text-primary)',
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {item.title}
                      </p>
                      {item.isPrivate && (
                        <span title="Private">
                          <Lock size={12} color="var(--text-muted)" />
                        </span>
                      )}
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color: '#ec4899' }}>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>

                    {item.idea && (
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', lineHeight: 1.4 }}>
                        {item.idea}
                      </p>
                    )}

                    {item.notes && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.35rem' }}>
                        💡 {item.notes}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      <select
                        className="input select"
                        style={{
                          width: 'auto',
                          fontSize: '0.75rem',
                          padding: '0.2rem 1.4rem 0.2rem 0.5rem',
                          borderColor: `${statusCfg.color}40`,
                          color: statusCfg.color,
                          fontWeight: 600,
                        }}
                        value={item.status}
                        onChange={(e) => updateItemStatus(item.id, e.target.value as ContentItem['status'])}
                      >
                        {ITEM_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>

                      <span
                        className="badge"
                        style={{
                          background: `${pillar?.color || '#ec4899'}15`,
                          color: pillar?.color || '#ec4899',
                          fontSize: '0.72rem',
                        }}
                      >
                        {pillar?.label}
                      </span>

                      {item.plannedDate && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📅 {item.plannedDate}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexShrink: 0 }}>
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => {
                        setEditingItem(item);
                        setItemForm({
                          type: item.type,
                          title: item.title,
                          idea: item.idea ?? '',
                          draft: item.draft ?? '',
                          plannedDate: item.plannedDate ?? '',
                          status: item.status,
                          link: item.link ?? '',
                          isPrivate: item.isPrivate ?? false,
                          notes: item.notes ?? '',
                        });
                        setShowItemModal(true);
                      }}
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      style={{ color: '#ef4444' }}
                      onClick={() => handleDeleteItem(item.id)}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Daily Routine & Milestones Grid */}
      <div className="grid-2col" style={{ gap: '1.25rem' }}>
        {/* Daily Routine */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '0.95rem' }}>⚡ Daily Creative Habits</h2>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setEditingRoutine(null);
                setRoutineForm({ task: '', time: '10 min' });
                setShowRoutineModal(true);
              }}
              style={{ fontSize: '0.78rem', color: '#ec4899' }}
            >
              <Plus size={13} /> Add Habit
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {routines.map((r) => {
              const isChecked = Boolean(dailyChecked[r.id]);
              return (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.75rem',
                    background: isChecked ? 'rgba(236,72,153,0.08)' : 'var(--bg-surface-2)',
                    borderRadius: '8px',
                    border: `1px solid ${isChecked ? 'rgba(236,72,153,0.25)' : 'transparent'}`,
                  }}
                >
                  <div
                    onClick={() => toggleDaily(r.id)}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '4px',
                      border: `2px solid ${isChecked ? '#ec4899' : 'var(--border)'}`,
                      background: isChecked ? '#ec4899' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                  >
                    {isChecked && <Check size={10} color="white" />}
                  </div>

                  <span
                    className="badge"
                    style={{ background: 'rgba(236,72,153,0.12)', color: '#ec4899', fontSize: '0.72rem', flexShrink: 0 }}
                  >
                    {r.time}
                  </span>

                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: '0.84rem',
                      color: isChecked ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: isChecked ? 'line-through' : 'none',
                    }}
                  >
                    {r.task}
                  </span>

                  <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        setEditingRoutine(r);
                        setRoutineForm({ task: r.task, time: r.time });
                        setShowRoutineModal(true);
                      }}
                      style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleDeleteRoutine(r.id)}
                      style={{ padding: '0.2rem', color: '#ef4444' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestones */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '0.95rem' }}>🎯 Creative Milestones</h2>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setEditingMilestone(null);
                setMilestoneForm({ title: '', targetDate: '', isCompleted: false });
                setShowMilestoneModal(true);
              }}
              style={{ fontSize: '0.78rem', color: '#8b5cf6' }}
            >
              <Plus size={13} /> Add Milestone
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {milestones.map((m) => {
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.75rem',
                    background: m.isCompleted ? 'rgba(139,92,246,0.08)' : 'var(--bg-surface-2)',
                    borderRadius: '8px',
                    border: `1px solid ${m.isCompleted ? 'rgba(139,92,246,0.25)' : 'transparent'}`,
                  }}
                >
                  <div
                    onClick={() => toggleMilestone(m.id)}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '4px',
                      border: `2px solid ${m.isCompleted ? '#8b5cf6' : 'var(--border)'}`,
                      background: m.isCompleted ? '#8b5cf6' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                  >
                    {m.isCompleted && <Check size={10} color="white" />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        color: m.isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: m.isCompleted ? 'line-through' : 'none',
                      }}
                    >
                      {m.title}
                    </p>
                    {m.targetDate && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Target: {m.targetDate}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        setEditingMilestone(m);
                        setMilestoneForm({ title: m.title, targetDate: m.targetDate || '', isCompleted: m.isCompleted });
                        setShowMilestoneModal(true);
                      }}
                      style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleDeleteMilestone(m.id)}
                      style={{ padding: '0.2rem', color: '#ef4444' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal: Manage Overview */}
      <Modal isOpen={showOverviewModal} onClose={() => setShowOverviewModal(false)} title="Manage Creative Studio Overview">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Studio Title</label>
            <input
              className="input"
              value={creativeTitle}
              onChange={(e) => setCreativeTitle(e.target.value)}
              placeholder="e.g. Creative Projects & Identity Studio"
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Creative Vision & Manifesto</label>
            <textarea
              className="input"
              rows={3}
              value={creativeVision}
              onChange={(e) => setCreativeVision(e.target.value)}
              placeholder="Describe your creative focus, storytelling voice, or content goals..."
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                localStorage.setItem('creativity_title', creativeTitle);
                localStorage.setItem('creativity_vision', creativeVision);
                setShowOverviewModal(false);
              }}
              style={{ background: '#ec4899', borderColor: '#ec4899', color: '#fff' }}
            >
              Save Overview
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Add / Edit Item */}
      <Modal
        isOpen={showItemModal}
        onClose={() => {
          setShowItemModal(false);
          setEditingItem(null);
        }}
        title={editingItem ? 'Edit Project or Idea' : 'Add Creative Project / Idea'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div className="grid-2col" style={{ gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Category</label>
              <select
                className="input select"
                value={itemForm.type}
                onChange={(e) => setItemForm((f) => ({ ...f, type: e.target.value as ContentItem['type'] }))}
              >
                {pillars.map((p) => (
                  <option key={p.type} value={p.type}>
                    {p.icon} {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Status</label>
              <select
                className="input select"
                value={itemForm.status}
                onChange={(e) => setItemForm((f) => ({ ...f, status: e.target.value as ContentItem['status'] }))}
              >
                {ITEM_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Title *</label>
            <input
              className="input"
              placeholder="e.g. Interactive Data Structures visualizer, Tamil tech essay..."
              value={itemForm.title}
              onChange={(e) => setItemForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Concept / Hook</label>
            <textarea
              className="input"
              rows={2}
              placeholder="What makes this project special? Core premise or key outline..."
              value={itemForm.idea}
              onChange={(e) => setItemForm((f) => ({ ...f, idea: e.target.value }))}
            />
          </div>

          <div className="grid-2col" style={{ gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Planned Date</label>
              <input
                type="date"
                className="input"
                value={itemForm.plannedDate}
                onChange={(e) => setItemForm((f) => ({ ...f, plannedDate: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Link (optional)</label>
              <input
                className="input"
                placeholder="https://..."
                value={itemForm.link}
                onChange={(e) => setItemForm((f) => ({ ...f, link: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Notes & Resources</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Reference links, color schemes, draft notes..."
              value={itemForm.notes}
              onChange={(e) => setItemForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setShowItemModal(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveItem}
              style={{ background: '#ec4899', borderColor: '#ec4899', color: '#fff' }}
            >
              {editingItem ? 'Save Changes' : 'Add Creation'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Routine */}
      <Modal
        isOpen={showRoutineModal}
        onClose={() => setShowRoutineModal(false)}
        title={editingRoutine ? 'Edit Creative Habit' : 'Add Creative Habit'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Habit Description *</label>
            <input
              className="input"
              value={routineForm.task}
              onChange={(e) => setRoutineForm((f) => ({ ...f, task: e.target.value }))}
              placeholder="e.g. Write 200 words on tech architecture"
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Target Duration</label>
            <input
              className="input"
              value={routineForm.time}
              onChange={(e) => setRoutineForm((f) => ({ ...f, time: e.target.value }))}
              placeholder="e.g. 15 min"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setShowRoutineModal(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveRoutine}
              style={{ background: '#ec4899', borderColor: '#ec4899', color: '#fff' }}
            >
              Save Habit
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Milestone */}
      <Modal
        isOpen={showMilestoneModal}
        onClose={() => setShowMilestoneModal(false)}
        title={editingMilestone ? 'Edit Creative Milestone' : 'Add Creative Milestone'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Milestone Title *</label>
            <input
              className="input"
              value={milestoneForm.title}
              onChange={(e) => setMilestoneForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Finish writing script for video #1"
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Target Date (optional)</label>
            <input
              type="date"
              className="input"
              value={milestoneForm.targetDate}
              onChange={(e) => setMilestoneForm((f) => ({ ...f, targetDate: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="mComplete"
              checked={milestoneForm.isCompleted}
              onChange={(e) => setMilestoneForm((f) => ({ ...f, isCompleted: e.target.checked }))}
            />
            <label htmlFor="mComplete" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
              Mark as completed
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setShowMilestoneModal(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveMilestone}
              style={{ background: '#ec4899', borderColor: '#ec4899', color: '#fff' }}
            >
              Save Milestone
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
