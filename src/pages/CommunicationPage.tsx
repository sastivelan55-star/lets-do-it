import { useState, useEffect } from 'react';
import { MessageSquare, Check, Mic } from 'lucide-react';
import ProgressRing from '../components/ui/ProgressRing';
import Modal from '../components/ui/Modal';
import type { CommunicationEntry } from '../types';
import { getAllFromStore, saveToStore } from '../db/storage';
import { today } from '../utils/dates';
import { nanoid } from '../utils/nanoid';

const DAILY_ENGLISH: { title: string; time: string; desc: string }[] = [
  { title: 'Speak for 2–5 minutes', time: '5 min', desc: 'Talk about your day, thoughts or any topic.' },
  { title: 'Learn 5 new phrases/words', time: '5 min', desc: 'Use them in your daily conversation.' },
  { title: 'Watch a short English video', time: '10 min', desc: 'Summarize it in your own words (speak aloud).' },
  { title: 'Explain one technical concept', time: '5 min', desc: 'Try explaining it in simple English.' },
  { title: 'Practice real conversations', time: '10 min', desc: 'Use apps, friends or language partners.' },
  { title: 'Improve grammar & vocabulary', time: '5 min', desc: 'Use a notebook or app (e.g., Grammarly, Duolingo).' },
];

const EVERYDAY_PROFESSIONAL: { title: string; time: string; desc: string }[] = [
  { title: 'Listen actively', time: '5 min', desc: "Don't interrupt. Understand first." },
  { title: 'Ask better questions', time: '5 min', desc: 'Be curious, not just reactive.' },
  { title: 'Express your opinion', time: '5 min', desc: 'Share your thoughts respectfully.' },
  { title: 'Learn to disagree', time: '5 min', desc: 'Be polite, calm and solution-focused.' },
  { title: 'Write short & polite messages', time: '5 min', desc: 'Keep it clear, simple and professional.' },
  { title: 'Work on teamwork', time: '5 min', desc: 'Give updates, ask for help, support others.' },
];

const ENTRY_TYPES: { value: CommunicationEntry['type']; label: string }[] = [
  { value: 'speaking',     label: 'Speaking' },
  { value: 'listening',    label: 'Listening' },
  { value: 'vocabulary',   label: 'Vocabulary' },
  { value: 'writing',      label: 'Writing' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'reflection',   label: 'Weekly Reflection' },
];

export default function CommunicationPage() {
  const [entries, setEntries] = useState<CommunicationEntry[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [form, setForm] = useState({ topic: '', minutes: '30', confidence: '', notes: '', type: 'speaking' as CommunicationEntry['type'] });
  const [dailyChecked, setDailyChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getAllFromStore<CommunicationEntry>('communicationEntries').then(setEntries);
  }, []);

  const totalMinutes = entries.reduce((s, e) => s + e.practiceMinutes, 0);
  const targetMinutes = 30 * 30; // 30 min/day for 30 days
  const pct = Math.min(Math.round((totalMinutes / targetMinutes) * 100), 100);

  const logEntry = async () => {
    if (!form.topic.trim()) return;
    const entry: CommunicationEntry = {
      id: nanoid(),
      date: today(),
      topic: form.topic.trim(),
      practiceMinutes: Number(form.minutes) || 30,
      confidenceNote: form.confidence.trim() || undefined,
      notes: form.notes.trim() || undefined,
      type: form.type,
    };
    await saveToStore('communicationEntries', entry);
    setEntries((prev) => [...prev, entry]);
    setForm({ topic: '', minutes: '30', confidence: '', notes: '', type: 'speaking' });
    setShowLog(false);
  };

  const toggleDaily = (title: string) => {
    setDailyChecked((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '960px', margin: '0 auto' }}>
      {/* Hero */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(6,182,212,0.04))',
          borderColor: 'rgba(6,182,212,0.25)',
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
          color="#06b6d4"
          trackColor="rgba(6,182,212,0.12)"
          label={`${pct}%`}
          sublabel="Progress"
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <MessageSquare size={20} color="#06b6d4" />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              Communication <span style={{ color: '#06b6d4' }}>— 15%</span>
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Speak · Express · Connect · Grow
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>
            "Better communication = More opportunities + Stronger relationships + Greater confidence"
          </p>
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Practice</p>
              <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#06b6d4' }}>{totalMinutes}m</p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sessions</p>
              <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#06b6d4' }}>{entries.length}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Daily Goal</p>
              <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#06b6d4' }}>30–45 min</p>
            </div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowLog(true)}>
          <Mic size={15} /> Log Practice
        </button>
      </div>

      {/* Why it matters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="card">
          <h2 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>🎯 Why It Matters</h2>
          {[
            'Helps you in interviews & placements',
            'Builds confidence in real-life situations',
            'Improves teamwork and leadership',
            'Helps you explain your ideas clearly',
            'Opens doors to better opportunities',
          ].map((item) => (
            <p key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              <Check size={13} color="#06b6d4" style={{ flexShrink: 0, marginTop: 2 }} />
              {item}
            </p>
          ))}
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.07), rgba(6,182,212,0.02))', borderColor: 'rgba(6,182,212,0.2)' }}>
          <h2 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem' }}>🏔️ Your Goal</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Become a confident and clear communicator in both English and everyday life — so you can express your ideas, build connections and create opportunities for yourself.
          </p>
          <p style={{ fontSize: '0.8rem', color: '#06b6d4', marginTop: '0.75rem', fontWeight: 600 }}>
            Consistency &gt; Perfection
          </p>
        </div>
      </div>

      {/* Daily checklists */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <DailyChecklist
          title="🗣️ English Communication (Daily)"
          subtitle="Speak better. Think better. Express better."
          color="#6366f1"
          items={DAILY_ENGLISH}
          checked={dailyChecked}
          onToggle={toggleDaily}
        />
        <DailyChecklist
          title="👥 Everyday & Professional (Daily)"
          subtitle="Be clear. Be kind. Be confident."
          color="#8b5cf6"
          items={EVERYDAY_PROFESSIONAL}
          checked={dailyChecked}
          onToggle={toggleDaily}
        />
      </div>

      {/* 4-Week Plan */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem' }}>📅 4-Week Focus Plan</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          {[
            { week: 'Week 1', theme: 'Build the Habit', color: '#06b6d4', items: ['Self-introduction', 'Basic vocabulary', 'Daily speaking', 'Listening habit'] },
            { week: 'Week 2', theme: 'Deepen Skills', color: '#6366f1', items: ['Grammar & fluency', 'Real conversations', 'Asking questions', 'Summary practice'] },
            { week: 'Week 3', theme: 'Technical English', color: '#8b5cf6', items: ['Technical explanation', 'Presentations', 'Group discussion', 'Email writing'] },
            { week: 'Week 4', theme: 'Interview Ready', color: '#ec4899', items: ['Interview practice', 'HR answers', 'Professional messages', 'Confidence & flow'] },
          ].map((w) => (
            <div key={w.week} style={{ background: `${w.color}10`, border: `1px solid ${w.color}25`, borderRadius: '10px', padding: '0.875rem' }}>
              <p style={{ fontWeight: 700, fontSize: '0.82rem', color: w.color, marginBottom: '0.25rem' }}>{w.week}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>{w.theme}</p>
              {w.items.map((item) => (
                <p key={item} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>• {item}</p>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Recent sessions */}
      {entries.length > 0 && (
        <div className="card">
          <h2 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.875rem' }}>📋 Recent Practice Sessions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {entries.slice(-5).reverse().map((e) => (
              <div key={e.id} style={{ display: 'flex', gap: '1rem', padding: '0.6rem 0.75rem', background: 'var(--bg-surface-2)', borderRadius: '8px', fontSize: '0.83rem', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', width: '80px' }}>{e.date}</span>
                <span className="badge" style={{ background: 'rgba(6,182,212,0.12)', color: '#06b6d4', flexShrink: 0 }}>{e.type}</span>
                <span style={{ flex: 1, color: 'var(--text-primary)' }}>{e.topic}</span>
                <span style={{ color: '#06b6d4', fontWeight: 700, whiteSpace: 'nowrap' }}>{e.practiceMinutes}m</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log Modal */}
      <Modal isOpen={showLog} onClose={() => setShowLog(false)} title="Log Practice Session">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label>Type</label>
            <select className="input select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CommunicationEntry['type'] }))}>
              {ENTRY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label>Topic / What did you practice?</label>
            <input className="input" placeholder="e.g. Explained binary search in English" value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} />
          </div>
          <div>
            <label>Minutes practiced</label>
            <input className="input" type="number" min={1} value={form.minutes} onChange={(e) => setForm((f) => ({ ...f, minutes: e.target.value }))} />
          </div>
          <div>
            <label>How did it feel? (optional — your own words)</label>
            <input className="input" placeholder="e.g. Started slow but got more fluent toward the end" value={form.confidence} onChange={(e) => setForm((f) => ({ ...f, confidence: e.target.value }))} />
          </div>
          <div>
            <label>Notes (optional)</label>
            <textarea className="input" style={{ minHeight: '60px' }} placeholder="Words learned, improvements noticed…" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowLog(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={logEntry}>Save Session</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DailyChecklist({
  title, subtitle, color, items, checked, onToggle,
}: {
  title: string; subtitle: string; color: string;
  items: { title: string; time: string; desc: string }[];
  checked: Record<string, boolean>;
  onToggle: (title: string) => void;
}) {
  return (
    <div className="card" style={{ borderTop: `3px solid ${color}` }}>
      <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color, marginBottom: '0.2rem' }}>{title}</h3>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.875rem' }}>{subtitle}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map((item) => (
          <label
            key={item.title}
            style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer' }}
          >
            <div
              onClick={() => onToggle(item.title)}
              style={{
                width: 18,
                height: 18,
                borderRadius: '4px',
                border: `2px solid ${checked[item.title] ? color : 'var(--border)'}`,
                background: checked[item.title] ? color : 'transparent',
                flexShrink: 0,
                marginTop: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {checked[item.title] && <Check size={10} color="white" />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.83rem', fontWeight: 600, color: checked[item.title] ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: checked[item.title] ? 'line-through' : 'none' }}>
                  {item.title}
                </span>
                <span className="badge" style={{ background: `${color}15`, color, fontSize: '0.68rem', flexShrink: 0 }}>{item.time}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
