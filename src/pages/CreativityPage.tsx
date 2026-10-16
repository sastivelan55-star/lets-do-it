import { useState, useEffect } from 'react';
import { Plus, Palette, Check, Lock } from 'lucide-react';
import ProgressRing from '../components/ui/ProgressRing';
import Modal from '../components/ui/Modal';
import type { ContentItem } from '../types';
import { getAllFromStore, saveToStore, deleteFromStore, getStoredChecklist, saveStoredChecklist } from '../db/storage';
import { today } from '../utils/dates';
import { nanoid } from '../utils/nanoid';

const CREATIVE_PILLARS = [
  { type: 'instagram' as const, icon: '📸', label: 'Instagram & Personal Brand', color: '#ec4899' },
  { type: 'tamil-book' as const, icon: '📖', label: 'Tamil Book Writing', color: '#f59e0b' },
  { type: 'youtube' as const, icon: '▶️', label: 'Tamil YouTube Channel', color: '#ef4444' },
  { type: 'video-editing' as const, icon: '🎬', label: 'Creative Editing', color: '#8b5cf6' },
  { type: 'linkedin' as const, icon: '💼', label: 'LinkedIn Writing', color: '#0ea5e9' },
  { type: 'personal-photos' as const, icon: '🌟', label: 'Childhood Photos & Personal Posts', color: '#f97316' },
];

const ITEM_STATUSES: ContentItem['status'][] = ['idea', 'draft', 'scheduled', 'published'];

export default function CreativityPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [form, setForm] = useState({
    type: 'instagram' as ContentItem['type'],
    title: '', idea: '', draft: '', plannedDate: '', status: 'idea' as ContentItem['status'],
    link: '', isPrivate: true, notes: '',
  });
  const [filter, setFilter] = useState<ContentItem['type'] | 'all'>('all');
  const [dailyChecked, setDailyChecked] = useState<Record<string, boolean>>(() =>
    getStoredChecklist('creativity_' + today())
  );

  useEffect(() => {
    getAllFromStore<ContentItem>('contentItems').then(setItems);
  }, []);

  const published = items.filter((i) => i.status === 'published').length;
  const pct = items.length ? Math.round((published / items.length) * 100) : 0;

  const filtered = filter === 'all' ? items : items.filter((i) => i.type === filter);

  const saveItem = async () => {
    if (!form.title.trim()) return;
    if (editingItem) {
      const updated: ContentItem = {
        ...editingItem,
        ...form,
        title: form.title.trim(),
      };
      await saveToStore('contentItems', updated);
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } else {
      const item: ContentItem = {
        id: nanoid(),
        ...form,
        title: form.title.trim(),
        createdAt: new Date().toISOString(),
      };
      await saveToStore('contentItems', item);
      setItems((prev) => [...prev, item]);
    }
    setForm({ type: 'instagram', title: '', idea: '', draft: '', plannedDate: '', status: 'idea', link: '', isPrivate: true, notes: '' });
    setEditingItem(null);
    setShowAdd(false);
  };

  const startEdit = (item: ContentItem) => {
    setEditingItem(item);
    setForm({
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
    setShowAdd(true);
  };

  const deleteItem = async (id: string) => {
    await deleteFromStore('contentItems', id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateStatus = async (id: string, status: ContentItem['status']) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const updated = { ...item, status };
    await saveToStore('contentItems', updated);
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
  };

  const toggleDaily = (task: string) => {
    setDailyChecked((prev) => {
      const next = { ...prev, [task]: !prev[task] };
      saveStoredChecklist('creativity_' + today(), next);
      return next;
    });
  };

  const DAILY_ROUTINE = [
    { time: '5 min', task: 'Capture one creative idea' },
    { time: '10 min', task: 'Practice writing, editing or storytelling' },
    { time: '5 min', task: 'Save useful inspiration and references' },
    { time: '5 min', task: 'Review or improve an existing creation' },
  ];

  return (
    <div className="page-container pb-safe">
      {/* Hero */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(236,72,153,0.03))', borderColor: 'rgba(236,72,153,0.25)', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <ProgressRing value={pct} size={100} strokeWidth={10} color="#ec4899" trackColor="rgba(236,72,153,0.12)" label={`${pct}%`} sublabel="Published" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Palette size={20} color="#ec4899" />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              Creativity & Identity <span style={{ color: '#ec4899' }}>— 10%</span>
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Create · Express · Share · Inspire</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.75rem' }}>
            "A Computer Science student who builds useful technology, celebrates Tamil language and culture, and shares knowledge creatively."
          </p>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <div><p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Items</p><p style={{ fontWeight: 800, color: '#ec4899' }}>{items.length}</p></div>
            <div><p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Published</p><p style={{ fontWeight: 800, color: '#10b981' }}>{published}</p></div>
            <div><p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>In Draft</p><p style={{ fontWeight: 800, color: '#f59e0b' }}>{items.filter((i) => i.status === 'draft').length}</p></div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ background: 'linear-gradient(135deg,#ec4899,#8b5cf6)' }}>
          <Plus size={15} /> Add Content
        </button>
      </div>

      {/* Creative Pillars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {CREATIVE_PILLARS.map((p) => {
          const count = items.filter((i) => i.type === p.type).length;
          return (
            <button
              key={p.type}
              onClick={() => setFilter(filter === p.type ? 'all' : p.type)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                padding: '1rem',
                background: filter === p.type ? `${p.color}18` : 'var(--bg-surface)',
                border: `1px solid ${filter === p.type ? p.color + '50' : 'var(--border)'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>{p.icon}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: filter === p.type ? p.color : 'var(--text-primary)', lineHeight: 1.3 }}>{p.label}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{count} item{count !== 1 ? 's' : ''}</span>
            </button>
          );
        })}
      </div>

      {/* Content items */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>
            {filter === 'all' ? '🎨 All Content' : CREATIVE_PILLARS.find(p=>p.type===filter)?.label}
          </h2>
          <button className="btn btn-sm btn-ghost" onClick={() => setFilter('all')} style={{ display: filter === 'all' ? 'none' : 'flex' }}>Clear filter</button>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <Palette size={28} />
            <p style={{ fontWeight: 600, marginTop: '0.5rem' }}>No content yet</p>
            <p style={{ fontSize: '0.82rem', marginBottom: '0.875rem' }}>Start capturing your creative ideas!</p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setEditingItem(null);
                setForm({ type: filter !== 'all' ? filter : 'instagram', title: '', idea: '', draft: '', plannedDate: '', status: 'idea', link: '', isPrivate: true, notes: '' });
                setShowAdd(true);
              }}
            >
              <Plus size={14} /> Add First Idea
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {filtered.map((item) => {
              const pillar = CREATIVE_PILLARS.find((p) => p.type === item.type);
              return (
                <div key={item.id} style={{ display: 'flex', gap: '0.75rem', padding: '0.875rem', background: 'var(--bg-surface-2)', borderRadius: '10px', border: '1px solid var(--border)', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{pillar?.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <p className="task-title" style={{ fontWeight: 700, fontSize: '0.9rem', flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{item.title}</p>
                      {item.isPrivate && <Lock size={12} color="var(--text-muted)" />}
                    </div>
                    {item.idea && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.idea}</p>}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                      <select
                        className="input select"
                        style={{ width: 'auto', fontSize: '0.78rem', padding: '0.2rem 1.5rem 0.2rem 0.5rem' }}
                        value={item.status}
                        onChange={(e) => updateStatus(item.id, e.target.value as ContentItem['status'])}
                      >
                        {ITEM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {item.plannedDate && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📅 {item.plannedDate}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => startEdit(item)} title="Edit item">✏️</button>
                    <button className="btn btn-ghost btn-sm btn-icon" style={{ color: '#ef4444' }} onClick={() => deleteItem(item.id)} title="Delete item">🗑</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Daily creative routine */}
      <div className="card">
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.875rem' }}>⚡ Daily Creative Routine (25 min)</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {DAILY_ROUTINE.map((r) => (
            <label key={r.task} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem 0.75rem', background: dailyChecked[r.task] ? 'rgba(236,72,153,0.07)' : 'var(--bg-surface-2)', borderRadius: '8px' }}>
              <div onClick={() => toggleDaily(r.task)} style={{ width: 18, height: 18, borderRadius: '4px', border: `2px solid ${dailyChecked[r.task] ? '#ec4899' : 'var(--border)'}`, background: dailyChecked[r.task] ? '#ec4899' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                {dailyChecked[r.task] && <Check size={10} color="white" />}
              </div>
              <span className="badge" style={{ background: 'rgba(236,72,153,0.12)', color: '#ec4899', flexShrink: 0 }}>{r.time}</span>
              <span style={{ fontSize: '0.85rem', color: dailyChecked[r.task] ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: dailyChecked[r.task] ? 'line-through' : 'none' }}>{r.task}</span>
            </label>
          ))}
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
          📌 Note: Not every creative pillar needs attention daily. தமிழ் என்றும் நம் உயிர்
        </p>
      </div>

      {/* Add Content Modal */}
      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setEditingItem(null); }} title={editingItem ? "Edit Creative Content" : "Add Creative Content"}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div className="form-grid-2">
            <div>
              <label>Type</label>
              <select className="input select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ContentItem['type'] }))}>
                {CREATIVE_PILLARS.map((p) => <option key={p.type} value={p.type}>{p.icon} {p.label}</option>)}
              </select>
            </div>
            <div>
              <label>Status</label>
              <select className="input select" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ContentItem['status'] }))}>
                {ITEM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label>Title *</label>
            <input className="input" placeholder="e.g. Video: Explaining recursion in Tamil" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label>Idea / Concept</label>
            <textarea className="input" style={{ minHeight: '72px' }} placeholder="Your idea, angle, or hook…" value={form.idea} onChange={(e) => setForm((f) => ({ ...f, idea: e.target.value }))} />
          </div>
          <div className="form-grid-2">
            <div>
              <label>Planned Date</label>
              <input type="date" className="input" value={form.plannedDate} onChange={(e) => setForm((f) => ({ ...f, plannedDate: e.target.value }))} />
            </div>
            <div>
              <label>Link (optional)</label>
              <input className="input" placeholder="https://..." value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={form.isPrivate} onChange={(e) => setForm((f) => ({ ...f, isPrivate: e.target.checked }))} />
            Keep this private (excluded from exports)
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => { setShowAdd(false); setEditingItem(null); }}>Cancel</button>
            <button className="btn btn-primary" onClick={saveItem}>{editingItem ? 'Save Changes' : 'Add Content'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
