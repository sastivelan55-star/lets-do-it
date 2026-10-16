import { useState, useEffect } from 'react';
import { Plus, Heart, Lock, AlertTriangle, Trash2 } from 'lucide-react';
import ProgressRing from '../components/ui/ProgressRing';
import Modal from '../components/ui/Modal';
import type { HealthEntry } from '../types';
import { getAllFromStore, saveToStore, deleteFromStore, getStoredChecklist, saveStoredChecklist } from '../db/storage';
import { today } from '../utils/dates';
import { nanoid } from '../utils/nanoid';

const REFLECTION_PROMPTS = [
  'What went well today?',
  'What did I learn?',
  'What is worrying me?',
  'What can I control tomorrow?',
  'What is one thing I am grateful for?',
];

export default function HealthPage() {
  const [entries, setEntries] = useState<HealthEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
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
    getAllFromStore<HealthEntry>('healthEntries').then(setEntries);
  }, []);

  const todayEntry = entries.find((e) => e.date === today());
  const totalDays = entries.length;
  const withReflection = entries.filter((e) => e.reflection).length;
  const pct = totalDays ? Math.round((withReflection / totalDays) * 100) : 0;

  const openLogModal = () => {
    if (todayEntry) {
      setForm({
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
      setForm({
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
    setShowAdd(true);
  };

  const saveEntry = async () => {
    const entry: HealthEntry = {
      id: todayEntry ? todayEntry.id : nanoid(),
      date: today(),
      sleepHours: form.sleepHours ? Number(form.sleepHours) : undefined,
      energyNote: form.energyNote.trim() || undefined,
      moodNote: form.moodNote.trim() || undefined,
      movement: form.movement.trim() || undefined,
      relationships: form.relationships.trim() || undefined,
      reflection: form.reflection.trim() || undefined,
      gratitude: form.gratitude.trim() || undefined,
      isPrivate: form.isPrivate,
      createdAt: todayEntry ? todayEntry.createdAt : new Date().toISOString(),
    };
    await saveToStore('healthEntries', entry);
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.date === today());
      return idx >= 0 ? prev.map((e, i) => (i === idx ? entry : e)) : [...prev, entry];
    });
    setShowAdd(false);
  };

  const deleteEntry = async (id: string) => {
    await deleteFromStore('healthEntries', id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const toggleDaily = (item: string) => {
    setDailyChecked((prev) => {
      const next = { ...prev, [item]: !prev[item] };
      saveStoredChecklist('health_' + today(), next);
      return next;
    });
  };

  const DAILY_HEALTH = [
    'Follow medical advice and prescribed treatment',
    'Drink fluids according to your clinician\'s advice',
    'Eat regular, balanced meals',
    'Take gentle movement breaks when appropriate',
    'Maintain a consistent sleep schedule',
    'Make time for personal hygiene and relaxation',
  ];

  const RELATIONSHIPS = [
    'Give family members your undivided attention',
    'Check in with a friend regularly',
    'Listen without interrupting',
    'Express gratitude',
    'Communicate boundaries respectfully',
    'Spend quality time with people who respect you',
  ];

  return (
    <div className="page-container pb-safe">
      {/* Hero */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.03))', borderColor: 'rgba(16,185,129,0.25)', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <ProgressRing value={pct} size={100} strokeWidth={10} color="#10b981" trackColor="rgba(16,185,129,0.12)" label={`${pct}%`} sublabel="Reflection" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Heart size={20} color="#10b981" />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              Health & Reflection <span style={{ color: '#10b981' }}>— 10%</span>
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.35rem' }}>
            Protect Your Health · Nurture Relationships · Find Your Balance
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.75rem' }}>
            "Build a successful future without sacrificing your health, peace of mind or relationships."
          </p>
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div><p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Days logged</p><p style={{ fontWeight: 800, color: '#10b981' }}>{totalDays}</p></div>
            <div><p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Reflections</p><p style={{ fontWeight: 800, color: '#10b981' }}>{withReflection}</p></div>
            {todayEntry && <div><p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Today</p><p style={{ fontWeight: 800, color: '#34d399' }}>✓ Logged</p></div>}
          </div>
        </div>
        <button className="btn btn-primary" onClick={openLogModal} style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }}>
          <Plus size={15} /> {todayEntry ? 'Update Today' : 'Log Today'}
        </button>
      </div>

      {/* Important health notice */}
      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '0.875rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ef4444', marginBottom: '0.25rem' }}>Important Health Reminder</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            If you cannot pass urine at all, especially with a painful or swollen lower abdomen, seek emergency medical care immediately.
            This app does not diagnose medical conditions. Always follow your doctor's instructions.
          </p>
        </div>
      </div>

      <div className="grid-2col" style={{ marginBottom: '1.25rem' }}>
        {/* Daily health */}
        <div className="card">
          <h2 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.875rem' }}>🏥 Daily Health Routine</h2>
          {DAILY_HEALTH.map((item) => (
            <label key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
              <div onClick={() => toggleDaily(item)} style={{ width: 18, height: 18, borderRadius: '4px', border: `2px solid ${dailyChecked[item] ? '#10b981' : 'var(--border)'}`, background: dailyChecked[item] ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, cursor: 'pointer' }}>
                {dailyChecked[item] && <span style={{ fontSize: '10px', color: 'white' }}>✓</span>}
              </div>
              <span style={{ fontSize: '0.82rem', color: dailyChecked[item] ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: dailyChecked[item] ? 'line-through' : 'none', lineHeight: 1.4 }}>
                {item}
              </span>
            </label>
          ))}
        </div>

        {/* Relationships */}
        <div className="card">
          <h2 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.875rem' }}>👥 Relationships & Social Wellbeing</h2>
          {RELATIONSHIPS.map((item) => (
            <label key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
              <div onClick={() => toggleDaily(item)} style={{ width: 18, height: 18, borderRadius: '4px', border: `2px solid ${dailyChecked[item] ? '#ec4899' : 'var(--border)'}`, background: dailyChecked[item] ? '#ec4899' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, cursor: 'pointer' }}>
                {dailyChecked[item] && <span style={{ fontSize: '10px', color: 'white' }}>✓</span>}
              </div>
              <span style={{ fontSize: '0.82rem', color: dailyChecked[item] ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: dailyChecked[item] ? 'line-through' : 'none', lineHeight: 1.4 }}>
                {item}
              </span>
            </label>
          ))}
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>
            💚 Good people make life better
          </p>
        </div>
      </div>

      {/* Reflection prompt */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(6,182,212,0.04))', borderColor: 'rgba(16,185,129,0.2)', marginBottom: '1.25rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>✍️ Evening Reflection (Every evening, answer)</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {REFLECTION_PROMPTS.map((q, i) => (
            <div key={q} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.6rem 0.75rem', background: 'var(--bg-surface-2)', borderRadius: '8px' }}>
              <span style={{ fontWeight: 700, color: '#10b981', flexShrink: 0 }}>{i + 1}.</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{q}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontStyle: 'italic' }}>
          ⏱ Keep journaling simple: 3–5 minutes daily.
        </p>
      </div>

      {/* Healthy boundaries */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>🛡️ Healthy Boundaries</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0.6rem' }}>
          {[
            { icon: '🛏️', text: "Don't sacrifice sleep for unnecessary work" },
            { icon: '⚖️', text: "Don't compare your progress with others" },
            { icon: '⚠️', text: "Avoid ignoring symptoms to meet deadlines" },
            { icon: '🔄', text: 'Reduce commitments when recovering' },
            { icon: '🤝', text: 'Ask for help instead of handling everything alone' },
            { icon: '🏥', text: 'Remember that medical care is a priority, not a reward' },
          ].map((b) => (
            <div key={b.text} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', padding: '0.6rem', background: 'var(--bg-surface-2)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span style={{ flexShrink: 0 }}>{b.icon}</span>
              <span>{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent entries */}
      {entries.length > 0 ? (
        <div className="card">
          <h2 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.875rem' }}>📋 Recent Log Entries (Private)</h2>
          {entries.slice(-5).reverse().map((e) => (
            <div key={e.id} style={{ display: 'flex', gap: '0.75rem', padding: '0.6rem 0.75rem', background: 'var(--bg-surface-2)', borderRadius: '8px', marginBottom: '0.4rem', fontSize: '0.82rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{e.date}</span>
              {e.sleepHours && <span style={{ color: '#10b981' }}>😴 {e.sleepHours}h</span>}
              {e.energyNote && <span className="task-title" style={{ color: 'var(--text-secondary)', flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{e.energyNote}</span>}
              <Lock size={12} color="var(--text-muted)" />
              <button
                className="btn btn-ghost btn-sm btn-icon"
                style={{ color: '#ef4444', padding: '0.2rem', marginLeft: 'auto' }}
                onClick={() => deleteEntry(e.id)}
                title="Delete log entry"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          <Heart size={28} color="#10b981" style={{ margin: '0 auto 0.5rem auto' }} />
          <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>No reflections logged yet</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.875rem' }}>Take 3 minutes to reflect on how today went.</p>
          <button className="btn btn-primary btn-sm" onClick={openLogModal} style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }}>
            <Plus size={14} /> Log Today's Reflection
          </button>
        </div>
      )}

      {/* Log Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Log Today's Health & Reflection" maxWidth="600px">
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          All fields are optional. This data is private and never shared unless you choose to export it.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div className="form-grid-2">
            <div>
              <label>Sleep Hours</label>
              <input className="input" type="number" step={0.5} min={0} max={24} placeholder="e.g. 7.5" value={form.sleepHours} onChange={(e) => setForm((f) => ({ ...f, sleepHours: e.target.value }))} />
            </div>
            <div>
              <label>Energy (your words)</label>
              <input className="input" placeholder="e.g. Felt tired in the morning, better after lunch" value={form.energyNote} onChange={(e) => setForm((f) => ({ ...f, energyNote: e.target.value }))} />
            </div>
          </div>
          <div>
            <label>Mood / How did the day feel?</label>
            <input className="input" placeholder="e.g. Anxious about exam but calmer by evening" value={form.moodNote} onChange={(e) => setForm((f) => ({ ...f, moodNote: e.target.value }))} />
          </div>
          <div>
            <label>Gentle movement</label>
            <input className="input" placeholder="e.g. 20-minute walk" value={form.movement} onChange={(e) => setForm((f) => ({ ...f, movement: e.target.value }))} />
          </div>
          <div>
            <label>Relationships & meaningful time</label>
            <input className="input" placeholder="e.g. Called mom, had a good chat with a friend" value={form.relationships} onChange={(e) => setForm((f) => ({ ...f, relationships: e.target.value }))} />
          </div>
          <div>
            <label>Short reflection</label>
            <textarea className="input" style={{ minHeight: '72px' }} placeholder="What went well? What did you learn? What are you grateful for?" value={form.reflection} onChange={(e) => setForm((f) => ({ ...f, reflection: e.target.value }))} />
          </div>
          <div>
            <label>One thing I'm grateful for</label>
            <input className="input" placeholder="e.g. A quiet evening to study" value={form.gratitude} onChange={(e) => setForm((f) => ({ ...f, gratitude: e.target.value }))} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={form.isPrivate} onChange={(e) => setForm((f) => ({ ...f, isPrivate: e.target.checked }))} />
            Keep this entry private
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveEntry} style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }}>Save Entry</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
