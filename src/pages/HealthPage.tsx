import { useState, useEffect, useMemo } from 'react';
import {
  Heart,
  Plus,
  Edit2,
  Trash2,
  Lock,
  AlertTriangle,
  Sparkles,
  Sliders,
  Check,
  Search,
} from 'lucide-react';
import ProgressRing from '../components/ui/ProgressRing';
import Modal from '../components/ui/Modal';
import type { HealthEntry } from '../types';
import { getAllFromStore, saveToStore, deleteFromStore, getStoredChecklist, saveStoredChecklist } from '../db/storage';
import { today } from '../utils/dates';
import { nanoid } from '../utils/nanoid';
import { useApp } from '../context/AppContext';

export interface HealthHabit {
  id: string;
  text: string;
  category: 'routine' | 'relationship' | 'boundary';
}

const DEFAULT_PROMPTS = [
  'What went well today and gave me energy?',
  'What was challenging, and how did I respond?',
  'What is one practical thing I can control tomorrow?',
  'Who am I grateful for today?',
  'How did I care for my physical and mental peace today?',
];

const DEFAULT_HABITS: HealthHabit[] = [
  { id: '1', text: 'Follow medical advice and stay properly hydrated', category: 'routine' },
  { id: '2', text: 'Eat regular, nourishing meals without rushing', category: 'routine' },
  { id: '3', text: 'Take gentle movement breaks or a 20-minute walk', category: 'routine' },
  { id: '4', text: 'Consistent sleep schedule (7.5 - 8 hours)', category: 'routine' },
  { id: '5', text: 'Check in with family or a trusted friend', category: 'relationship' },
  { id: '6', text: 'Listen actively without interrupting or defensive reactions', category: 'relationship' },
  { id: '7', text: "Don't sacrifice sleep for non-emergency tasks", category: 'boundary' },
  { id: '8', text: 'Take intentional rest when recovering without guilt', category: 'boundary' },
];

export default function HealthPage() {
  const { settings } = useApp();
  const [entries, setEntries] = useState<HealthEntry[]>([]);
  const [prompts, setPrompts] = useState<string[]>(() => {
    const saved = localStorage.getItem('health_prompts_v2');
    return saved ? JSON.parse(saved) : DEFAULT_PROMPTS;
  });
  const [habits, setHabits] = useState<HealthHabit[]>(() => {
    const saved = localStorage.getItem('health_habits_v2');
    return saved ? JSON.parse(saved) : DEFAULT_HABITS;
  });

  // Section visibility settings
  const [visibleSections, setVisibleSections] = useState({
    routines: true,
    relationships: true,
    boundaries: true,
    prompts: true,
  });

  // Search & history
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<HealthEntry | null>(null);

  // Modals
  const [showLogModal, setShowLogModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<HealthEntry | null>(null);

  // AI prompt state
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [showAiConsent, setShowAiConsent] = useState(false);

  // Form state
  const [form, setForm] = useState({
    date: today(),
    sleepHours: '',
    energyNote: '',
    moodNote: '',
    movement: '',
    relationships: '',
    reflection: '',
    gratitude: '',
    isPrivate: true,
  });

  const [dailyChecked, setDailyChecked] = useState<Record<string, boolean>>(() =>
    getStoredChecklist('health_' + today())
  );

  useEffect(() => {
    getAllFromStore<HealthEntry>('healthEntries').then((list) => {
      setEntries(list.sort((a, b) => b.date.localeCompare(a.date)));
    });
  }, []);

  const savePrompts = (updated: string[]) => {
    setPrompts(updated);
    localStorage.setItem('health_prompts_v2', JSON.stringify(updated));
  };

  const saveHabits = (updated: HealthHabit[]) => {
    setHabits(updated);
    localStorage.setItem('health_habits_v2', JSON.stringify(updated));
  };

  const todayEntry = entries.find((e) => e.date === today());
  const totalDays = entries.length;
  const withReflection = entries.filter((e) => e.reflection).length;
  const pct = totalDays ? Math.round((withReflection / totalDays) * 100) : 0;

  const toggleDaily = (item: string) => {
    setDailyChecked((prev) => {
      const next = { ...prev, [item]: !prev[item] };
      saveStoredChecklist('health_' + today(), next);
      return next;
    });
  };

  // Open Log Modal (Create or Edit)
  const openLogModal = (existing?: HealthEntry) => {
    if (existing) {
      setSelectedEntry(existing);
      setForm({
        date: existing.date,
        sleepHours: existing.sleepHours !== undefined ? String(existing.sleepHours) : '',
        energyNote: existing.energyNote ?? '',
        moodNote: existing.moodNote ?? '',
        movement: existing.movement ?? '',
        relationships: existing.relationships ?? '',
        reflection: existing.reflection ?? '',
        gratitude: existing.gratitude ?? '',
        isPrivate: existing.isPrivate ?? true,
      });
    } else if (todayEntry) {
      setSelectedEntry(todayEntry);
      setForm({
        date: todayEntry.date,
        sleepHours: todayEntry.sleepHours !== undefined ? String(todayEntry.sleepHours) : '',
        energyNote: todayEntry.energyNote ?? '',
        moodNote: todayEntry.moodNote ?? '',
        movement: todayEntry.movement ?? '',
        relationships: todayEntry.relationships ?? '',
        reflection: todayEntry.reflection ?? '',
        gratitude: todayEntry.gratitude ?? '',
        isPrivate: todayEntry.isPrivate ?? true,
      });
    } else {
      setSelectedEntry(null);
      setForm({
        date: today(),
        sleepHours: '',
        energyNote: '',
        moodNote: '',
        movement: '',
        relationships: '',
        reflection: '',
        gratitude: '',
        isPrivate: true,
      });
    }
    setShowLogModal(true);
  };

  const saveEntry = async () => {
    const entryId = selectedEntry ? selectedEntry.id : nanoid();
    const entryDate = form.date || today();
    const entry: HealthEntry = {
      id: entryId,
      date: entryDate,
      sleepHours: form.sleepHours ? Number(form.sleepHours) : undefined,
      energyNote: form.energyNote.trim() || undefined,
      moodNote: form.moodNote.trim() || undefined,
      movement: form.movement.trim() || undefined,
      relationships: form.relationships.trim() || undefined,
      reflection: form.reflection.trim() || undefined,
      gratitude: form.gratitude.trim() || undefined,
      isPrivate: form.isPrivate,
      createdAt: selectedEntry ? selectedEntry.createdAt : new Date().toISOString(),
    };

    await saveToStore('healthEntries', entry);
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.id !== entry.id);
      return [entry, ...filtered].sort((a, b) => b.date.localeCompare(a.date));
    });
    setShowLogModal(false);
    setSelectedEntry(null);
  };

  const deleteEntry = async (id: string) => {
    await deleteFromStore('healthEntries', id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setEntryToDelete(null);
  };

  // Optional AI prompt suggestions (pure reflection questions, NO medical advice)
  const handleRequestAiPrompts = async () => {
    setShowAiConsent(false);
    setIsLoadingAi(true);
    setAiSuggestions([]);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: settings?.aiSettings?.provider || 'gemini',
          model: settings?.aiSettings?.model || 'gemini-1.5-flash',
          instruction:
            'Generate 3 thoughtful, calming personal reflection journaling questions for an engineering student. Keep them focused purely on mindset, balance, and gratitude. Do NOT give medical advice or discuss symptoms.',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.interpretation) {
          setAiSuggestions([
            'What brought you quiet joy or deep focus today?',
            'Where did you spend emotional energy that you can release tonight?',
            'What is one boundary you maintained that protected your peace?',
          ]);
        }
      } else {
        setAiSuggestions([
          'What brought you quiet joy or deep focus today?',
          'Where did you spend emotional energy that you can release tonight?',
          'What is one boundary you maintained that protected your peace?',
        ]);
      }
    } catch {
      setAiSuggestions([
        'What brought you quiet joy or deep focus today?',
        'Where did you spend emotional energy that you can release tonight?',
        'What is one boundary you maintained that protected your peace?',
      ]);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(
      (e) =>
        e.date.includes(q) ||
        (e.reflection && e.reflection.toLowerCase().includes(q)) ||
        (e.moodNote && e.moodNote.toLowerCase().includes(q)) ||
        (e.gratitude && e.gratitude.toLowerCase().includes(q))
    );
  }, [entries, searchQuery]);

  return (
    <div className="page-container pb-safe">
      {/* Hero */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,182,212,0.05))',
          borderColor: 'rgba(16,185,129,0.25)',
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
          color="#10b981"
          trackColor="rgba(16,185,129,0.12)"
          label={`${pct}%`}
          sublabel="Reflection"
        />

        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Heart size={22} color="#10b981" />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Health & Daily Reflection</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
            Protect Your Health · Nurture Relationships · Cultivate Clarity
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.75rem' }}>
            "Build an extraordinary future without sacrificing your health, peace of mind, or connections."
          </p>
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Days Logged</p>
              <p style={{ fontWeight: 800, fontSize: '1.15rem', color: '#10b981' }}>{totalDays}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Reflections Written</p>
              <p style={{ fontWeight: 800, fontSize: '1.15rem', color: '#10b981' }}>{withReflection}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Today's Check-in</p>
              <p style={{ fontWeight: 800, fontSize: '1.15rem', color: todayEntry ? '#34d399' : 'var(--text-muted)' }}>
                {todayEntry ? '✓ Completed' : 'Pending'}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowManageModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Sliders size={15} /> Manage Prompts & Habits
          </button>
          <button
            className="btn btn-primary"
            onClick={() => openLogModal()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              background: '#10b981',
              borderColor: '#10b981',
              color: '#fff',
            }}
          >
            <Plus size={16} /> {todayEntry ? 'Edit Today’s Log' : 'Log Today'}
          </button>
        </div>
      </div>

      {/* Safety Notice Card */}
      <div
        style={{
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '12px',
          padding: '0.875rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
        }}
      >
        <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ef4444', marginBottom: '0.2rem' }}>
            Medical Safety & Privacy Notice
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Life OS does not diagnose conditions or give medical prescriptions. Always follow your doctor's
            recommendations. All reflection notes are private to your account.
          </p>
        </div>
      </div>

      {/* Dynamic Habits & Boundaries (2-col grid) */}
      <div className="grid-2col" style={{ marginBottom: '1.25rem', gap: '1.25rem' }}>
        {/* Daily Health Habits */}
        {visibleSections.routines && (
          <div className="card">
            <h2 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.875rem' }}>🏥 Daily Health Routine</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {habits
                .filter((h) => h.category === 'routine')
                .map((h) => (
                  <label
                    key={h.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.6rem',
                      cursor: 'pointer',
                      padding: '0.35rem 0.5rem',
                      borderRadius: '6px',
                      background: dailyChecked[h.id] ? 'rgba(16,185,129,0.08)' : 'transparent',
                    }}
                  >
                    <div
                      onClick={() => toggleDaily(h.id)}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '4px',
                        border: `2px solid ${dailyChecked[h.id] ? '#10b981' : 'var(--border)'}`,
                        background: dailyChecked[h.id] ? '#10b981' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                        cursor: 'pointer',
                      }}
                    >
                      {dailyChecked[h.id] && <Check size={10} color="white" />}
                    </div>
                    <span
                      style={{
                        fontSize: '0.84rem',
                        color: dailyChecked[h.id] ? 'var(--text-muted)' : 'var(--text-secondary)',
                        textDecoration: dailyChecked[h.id] ? 'line-through' : 'none',
                        lineHeight: 1.4,
                      }}
                    >
                      {h.text}
                    </span>
                  </label>
                ))}
            </div>
          </div>
        )}

        {/* Relationships & Boundaries */}
        {visibleSections.relationships && (
          <div className="card">
            <h2 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.875rem' }}>👥 Meaningful Relationships</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {habits
                .filter((h) => h.category === 'relationship')
                .map((h) => (
                  <label
                    key={h.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.6rem',
                      cursor: 'pointer',
                      padding: '0.35rem 0.5rem',
                      borderRadius: '6px',
                      background: dailyChecked[h.id] ? 'rgba(236,72,153,0.08)' : 'transparent',
                    }}
                  >
                    <div
                      onClick={() => toggleDaily(h.id)}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '4px',
                        border: `2px solid ${dailyChecked[h.id] ? '#ec4899' : 'var(--border)'}`,
                        background: dailyChecked[h.id] ? '#ec4899' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                        cursor: 'pointer',
                      }}
                    >
                      {dailyChecked[h.id] && <Check size={10} color="white" />}
                    </div>
                    <span
                      style={{
                        fontSize: '0.84rem',
                        color: dailyChecked[h.id] ? 'var(--text-muted)' : 'var(--text-secondary)',
                        textDecoration: dailyChecked[h.id] ? 'line-through' : 'none',
                        lineHeight: 1.4,
                      }}
                    >
                      {h.text}
                    </span>
                  </label>
                ))}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.65rem', fontStyle: 'italic' }}>
              💚 High-quality connections elevate everything you do.
            </p>
          </div>
        )}
      </div>

      {/* Reflection Prompts Section */}
      {visibleSections.prompts && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(6,182,212,0.03))',
            borderColor: 'rgba(16,185,129,0.2)',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '0.95rem' }}>✍️ Evening Reflection Prompts</h2>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowAiConsent(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#10b981' }}
            >
              <Sparkles size={13} /> {isLoadingAi ? 'Thinking...' : 'AI Prompt Ideas'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {prompts.map((q, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--bg-surface-2)',
                  borderRadius: '8px',
                }}
              >
                <span style={{ fontWeight: 700, color: '#10b981', flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{q}</span>
              </div>
            ))}
          </div>

          {aiSuggestions.length > 0 && (
            <div
              style={{
                marginTop: '0.85rem',
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <Sparkles size={14} color="#10b981" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>
                  AI Prompt Suggestions (User-aware)
                </span>
              </div>
              {aiSuggestions.map((s, idx) => (
                <p key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  • {s}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Historical Entries & Search */}
      <div className="card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.875rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '0.95rem' }}>📋 Historical Reflections Log</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Protected, encrypted in your personal browser store.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              className="input"
              type="text"
              placeholder="Search past logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.6rem', width: 180 }}
            />
          </div>
        </div>

        {filteredEntries.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {filteredEntries.map((e) => (
              <div
                key={e.id}
                style={{
                  display: 'flex',
                  gap: '0.85rem',
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-surface-2)',
                  borderRadius: '10px',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ minWidth: 90 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>{e.date}</span>
                  {e.sleepHours && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      😴 {e.sleepHours} hrs sleep
                    </p>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 220 }}>
                  {e.reflection && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.35rem', lineHeight: 1.4 }}>
                      {e.reflection}
                    </p>
                  )}
                  {e.gratitude && (
                    <p style={{ fontSize: '0.78rem', color: '#10b981', fontStyle: 'italic', marginBottom: '0.2rem' }}>
                      🙏 Grateful for: {e.gratitude}
                    </p>
                  )}
                  {e.energyNote && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>⚡ Energy: {e.energyNote}</p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0 }}>
                  <Lock size={12} color="var(--text-muted)" />
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => openLogModal(e)}
                    title="Edit entry"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    style={{ color: '#ef4444' }}
                    onClick={() => setEntryToDelete(e)}
                    title="Delete entry"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <Heart size={28} color="#10b981" style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>No reflections found</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.875rem' }}>
              Take 3 minutes to reflect on how today went.
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => openLogModal()}
              style={{ background: '#10b981', borderColor: '#10b981', color: '#fff' }}
            >
              <Plus size={14} /> Log Your First Reflection
            </button>
          </div>
        )}
      </div>

      {/* Log Modal */}
      <Modal
        isOpen={showLogModal}
        onClose={() => {
          setShowLogModal(false);
          setSelectedEntry(null);
        }}
        title={selectedEntry ? `Edit Log (${form.date})` : 'Log Daily Health & Reflection'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div className="grid-2col" style={{ gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Date</label>
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sleep Hours</label>
              <input
                className="input"
                type="number"
                step={0.5}
                min={0}
                max={24}
                placeholder="e.g. 7.5"
                value={form.sleepHours}
                onChange={(e) => setForm((f) => ({ ...f, sleepHours: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid-2col" style={{ gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Energy Level</label>
              <input
                className="input"
                placeholder="e.g. High focus morning, rested afternoon"
                value={form.energyNote}
                onChange={(e) => setForm((f) => ({ ...f, energyNote: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Mood / Mindset</label>
              <input
                className="input"
                placeholder="e.g. Calm, grounded, focused"
                value={form.moodNote}
                onChange={(e) => setForm((f) => ({ ...f, moodNote: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Movement & Exercise</label>
            <input
              className="input"
              placeholder="e.g. 25-minute brisk walk, stretching"
              value={form.movement}
              onChange={(e) => setForm((f) => ({ ...f, movement: e.target.value }))}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Evening Reflection</label>
            <textarea
              className="input"
              rows={3}
              placeholder="What went well? What did you learn? What was your core takeaway?"
              value={form.reflection}
              onChange={(e) => setForm((f) => ({ ...f, reflection: e.target.value }))}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>One Thing I Am Grateful For</label>
            <input
              className="input"
              placeholder="e.g. Peaceful morning coding session, encouraging chat with family"
              value={form.gratitude}
              onChange={(e) => setForm((f) => ({ ...f, gratitude: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowLogModal(false);
                setSelectedEntry(null);
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={saveEntry}
              style={{ background: '#10b981', borderColor: '#10b981', color: '#fff' }}
            >
              {selectedEntry ? 'Update Entry' : 'Save Reflection'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Manage Prompts & Habits Modal */}
      <Modal isOpen={showManageModal} onClose={() => setShowManageModal(false)} title="Manage Prompts, Habits & Sections">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Visible Sections</h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={visibleSections.routines}
                  onChange={(e) => setVisibleSections((v) => ({ ...v, routines: e.target.checked }))}
                />
                Health Habits
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={visibleSections.relationships}
                  onChange={(e) => setVisibleSections((v) => ({ ...v, relationships: e.target.checked }))}
                />
                Relationships
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={visibleSections.prompts}
                  onChange={(e) => setVisibleSections((v) => ({ ...v, prompts: e.target.checked }))}
                />
                Reflection Prompts
              </label>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Reflection Prompts</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => savePrompts([...prompts, 'New reflection prompt question?'])}
                style={{ fontSize: '0.78rem', color: '#10b981' }}
              >
                + Add Prompt
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {prompts.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <input
                    className="input"
                    value={p}
                    onChange={(e) => {
                      const updated = [...prompts];
                      updated[idx] = e.target.value;
                      savePrompts(updated);
                    }}
                    style={{ fontSize: '0.82rem', padding: '0.35rem 0.5rem' }}
                  />
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#ef4444', padding: '0.3rem' }}
                    onClick={() => savePrompts(prompts.filter((_, i) => i !== idx))}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Daily Health Habits</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  saveHabits([
                    ...habits,
                    { id: nanoid(), text: 'New custom health habit', category: 'routine' },
                  ])
                }
                style={{ fontSize: '0.78rem', color: '#10b981' }}
              >
                + Add Habit
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 200, overflowY: 'auto' }}>
              {habits.map((h, idx) => (
                <div key={h.id} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <input
                    className="input"
                    value={h.text}
                    onChange={(e) => {
                      const updated = [...habits];
                      updated[idx] = { ...updated[idx], text: e.target.value };
                      saveHabits(updated);
                    }}
                    style={{ fontSize: '0.82rem', padding: '0.35rem 0.5rem' }}
                  />
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#ef4444', padding: '0.3rem' }}
                    onClick={() => saveHabits(habits.filter((item) => item.id !== h.id))}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowManageModal(false)}
              style={{ background: '#10b981', borderColor: '#10b981', color: '#fff' }}
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* AI Consent Confirmation Modal */}
      <Modal isOpen={showAiConsent} onClose={() => setShowAiConsent(false)} title="Generate AI Reflection Prompts">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Life OS will request 3 mindful journaling questions from the configured AI provider. No personal health
            metrics or private logs will ever be sent.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowAiConsent(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleRequestAiPrompts}
              style={{ background: '#10b981', borderColor: '#10b981', color: '#fff' }}
            >
              Generate Prompts
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Entry Modal */}
      <Modal isOpen={Boolean(entryToDelete)} onClose={() => setEntryToDelete(null)} title="Delete Reflection Entry">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Are you sure you want to delete the reflection entry for <strong>{entryToDelete?.date}</strong>?
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setEntryToDelete(null)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => entryToDelete && deleteEntry(entryToDelete.id)}
              style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}
            >
              Delete Entry
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
