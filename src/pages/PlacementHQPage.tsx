import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Trophy, Star, Zap, Plus, Trash2, Edit2, Check, ChevronRight,
  X, Play, BarChart3, Target, Brain, MessageSquare, Code2, Mic,
  Swords, Shield, Upload, TrendingUp, Award, Clock,
  CheckCircle2, Circle, Users,
} from 'lucide-react';
import { nanoid } from '../utils/nanoid';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrainingModule {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  glowColor: string;
  current: number;
  target: number;
  xpReward: number;
  characterAvatar: string;
  notes: string;
  category: string;
}

interface DayPlan {
  date: string;        // 'YYYY-MM-DD'
  label: string;       // 'Mon', 'Tue', …
  status: 'completed' | 'active' | 'pending';
  goals: { id: string; text: string; done: boolean }[];
}

interface Quest {
  id: string;
  text: string;
  done: boolean;
  xp: number;
  group: 'daily' | 'web';
}

interface PlacementState {
  xp: number;
  level: number;
  levelLabel: string;
  streak: number;
  lastActivityDate: string;
  modules: TrainingModule[];
  weekPlan: DayPlan[];
  quests: Quest[];
  expBoostActive: boolean;
  expBoostEnd: number;
  achievements: string[];
  heroBannerUrl: string;
  heroQuote: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const XP_PER_LEVEL = 500;

const LEVEL_LABELS: Record<number, string> = {
  1: 'Rookie Trainee',
  2: 'Rising Learner',
  3: 'Code Apprentice',
  4: 'Debug Warrior',
  5: 'Algorithm Knight',
  6: 'System Sage',
  7: 'Interview Master',
  8: 'Placement Legend',
};

const DEFAULT_MODULES: TrainingModule[] = [
  {
    id: 'dsa', title: 'DSA Training', subtitle: 'Solve Java problems',
    icon: 'code', color: '#6366f1', glowColor: 'rgba(99,102,241,0.4)',
    current: 2, target: 5, xpReward: 50, characterAvatar: '🐱', notes: '', category: 'Technical',
  },
  {
    id: 'apt', title: 'Aptitude Lab', subtitle: 'Logic & Quantitative',
    icon: 'brain', color: '#06b6d4', glowColor: 'rgba(6,182,212,0.4)',
    current: 1, target: 5, xpReward: 40, characterAvatar: '🦊', notes: '', category: 'Aptitude',
  },
  {
    id: 'comm', title: 'Communication', subtitle: 'Speak with confidence',
    icon: 'message', color: '#ec4899', glowColor: 'rgba(236,72,153,0.4)',
    current: 1, target: 3, xpReward: 45, characterAvatar: '🌸', notes: '', category: 'Soft Skills',
  },
  {
    id: 'cs', title: 'Core CS', subtitle: 'Java · DBMS · OS',
    icon: 'shield', color: '#10b981', glowColor: 'rgba(16,185,129,0.4)',
    current: 1, target: 4, xpReward: 60, characterAvatar: '🐉', notes: '', category: 'Technical',
  },
  {
    id: 'leet', title: 'LeetCode Tracker', subtitle: '75 essential problems',
    icon: 'zap', color: '#f59e0b', glowColor: 'rgba(245,158,11,0.4)',
    current: 0, target: 75, xpReward: 30, characterAvatar: '⚡', notes: '', category: 'Technical',
  },
  {
    id: 'mock', title: 'Mock Interview', subtitle: 'HR + Tech rounds',
    icon: 'mic', color: '#a855f7', glowColor: 'rgba(168,85,247,0.4)',
    current: 0, target: 6, xpReward: 100, characterAvatar: '👑', notes: '', category: 'Interview',
  },
];

function buildWeekPlan(existingWeekPlan?: DayPlan[]): DayPlan[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  return days.map((label, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    const dateStr = d.toISOString().slice(0, 10);
    const todayStr = today.toISOString().slice(0, 10);
    let status: DayPlan['status'] = 'pending';
    if (dateStr < todayStr) status = 'completed';
    if (dateStr === todayStr) status = 'active';
    const existingDay = existingWeekPlan?.find((day) => day.date === dateStr);
    return { date: dateStr, label, status, goals: existingDay?.goals ?? [] };
  });
}

const DEFAULT_QUESTS: Quest[] = [
  { id: 'q1', text: 'Solve 2 LeetCode problems', done: false, xp: 60, group: 'daily' },
  { id: 'q2', text: 'Review 1 CS concept (OS / DBMS)', done: false, xp: 40, group: 'daily' },
  { id: 'q3', text: 'Practice English speaking 10 min', done: false, xp: 30, group: 'web' },
];

const STORAGE_KEY = 'placement_hq_state_v3';

function getLevelLabel(level: number) {
  return LEVEL_LABELS[level] ?? `Elite Coder Lv.${level}`;
}

function computeLevel(xp: number): { level: number; label: string } {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  return { level, label: getLevelLabel(level) };
}

function loadState(): PlacementState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PlacementState;
      // Ensure weekPlan is never stale (rebuild each session while preserving saved goals)
      return { ...parsed, weekPlan: buildWeekPlan(parsed.weekPlan) };
    }
  } catch {}
  const { level, label } = computeLevel(1250);
  return {
    xp: 1250,
    level,
    levelLabel: label,
    streak: 12,
    lastActivityDate: new Date().toISOString().slice(0, 10),
    modules: DEFAULT_MODULES,
    weekPlan: buildWeekPlan(),
    quests: DEFAULT_QUESTS,
    expBoostActive: false,
    expBoostEnd: 0,
    achievements: [],
    heroBannerUrl: '',
    heroQuote: 'Discipline today, Dream job tomorrow.',
  };
}

// ─── Helper Sub-components ───────────────────────────────────────────────────

function HudBracket({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const br = '6px';
  const sz = '12px';
  const col = 'rgba(168,85,247,0.6)';
  const corners: React.CSSProperties[] = [
    { top: 0, left: 0, borderTop: `2px solid ${col}`, borderLeft: `2px solid ${col}`, borderTopLeftRadius: br, width: sz, height: sz },
    { top: 0, right: 0, borderTop: `2px solid ${col}`, borderRight: `2px solid ${col}`, borderTopRightRadius: br, width: sz, height: sz },
    { bottom: 0, left: 0, borderBottom: `2px solid ${col}`, borderLeft: `2px solid ${col}`, borderBottomLeftRadius: br, width: sz, height: sz },
    { bottom: 0, right: 0, borderBottom: `2px solid ${col}`, borderRight: `2px solid ${col}`, borderBottomRightRadius: br, width: sz, height: sz },
  ];
  return (
    <div style={{ position: 'relative', ...style }}>
      {corners.map((c, i) => <div key={i} style={{ position: 'absolute', ...c }} />)}
      {children}
    </div>
  );
}

function CircularProgress({ pct, size = 72, stroke = 6, color = '#a855f7' }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct, 100) / 100;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  );
}

function ModuleIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    code: <Code2 size={22} />, brain: <Brain size={22} />, message: <MessageSquare size={22} />,
    shield: <Shield size={22} />, zap: <Zap size={22} />, mic: <Mic size={22} />,
  };
  return <>{icons[type] ?? <Target size={22} />}</>;
}

// ─── Modals ──────────────────────────────────────────────────────────────────

function ModalWrapper({ open, onClose, title, children, maxW = '520px' }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; maxW?: string;
}) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: maxW,
          background: 'linear-gradient(135deg, rgba(15,10,35,0.98) 0%, rgba(20,10,45,0.98) 100%)',
          border: '1px solid rgba(168,85,247,0.35)', borderRadius: '16px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(168,85,247,0.15)',
          overflow: 'hidden',
        }}
      >
        <div style={{
          padding: '1rem 1.25rem', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', borderBottom: '1px solid rgba(168,85,247,0.15)',
        }}>
          <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.02em' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '1.25rem', maxHeight: '70vh', overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PlacementHQPage() {
  const [state, setState] = useState<PlacementState>(loadState);
  const [toast, setToast] = useState<{ text: string; xp?: number } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal states
  const [moduleModal, setModuleModal] = useState<{ open: boolean; editing: TrainingModule | null }>({ open: false, editing: null });
  const [practiceModal, setPracticeModal] = useState<TrainingModule | null>(null);
  const [dayModal, setDayModal] = useState<DayPlan | null>(null);
  const [bossModal, setBossModal] = useState(false);
  const [coopModal, setCoopModal] = useState(false);
  const [analyticsModal, setAnalyticsModal] = useState(false);
  const [bossTimer, setBossTimer] = useState(0);
  const bossIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Module form
  const [modForm, setModForm] = useState({ title: '', subtitle: '', color: '#a855f7', target: '5', xpReward: '50', avatar: '⚡', category: 'Technical', notes: '' });

  // Quest add input
  const [questInput, setQuestInput] = useState('');
  const [questGroup, setQuestGroup] = useState<'daily' | 'web'>('daily');

  // EXP boost countdown
  const [boostSecondsLeft, setBoostSecondsLeft] = useState(0);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // EXP Boost countdown
  useEffect(() => {
    if (!state.expBoostActive) { setBoostSecondsLeft(0); return; }
    const tick = () => {
      const left = Math.max(0, Math.floor((state.expBoostEnd - Date.now()) / 1000));
      setBoostSecondsLeft(left);
      if (left <= 0) {
        setState(s => ({ ...s, expBoostActive: false, expBoostEnd: 0 }));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state.expBoostActive, state.expBoostEnd]);

  // Boss battle timer
  useEffect(() => {
    if (!bossModal) {
      if (bossIntervalRef.current) clearInterval(bossIntervalRef.current);
      return;
    }
    setBossTimer(600); // 10 min
    bossIntervalRef.current = setInterval(() => {
      setBossTimer(t => {
        if (t <= 1) {
          clearInterval(bossIntervalRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (bossIntervalRef.current) clearInterval(bossIntervalRef.current); };
  }, [bossModal]);

  const showToast = useCallback((text: string, xp?: number) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ text, xp });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const addXP = useCallback((amount: number, reason: string) => {
    setState(s => {
      const bonus = s.expBoostActive ? amount * 2 : amount;
      const newXp = s.xp + bonus;
      const { level, label } = computeLevel(newXp);
      return { ...s, xp: newXp, level, levelLabel: label };
    });
    const bonus = state.expBoostActive ? amount * 2 : amount;
    showToast(reason, bonus);
  }, [state.expBoostActive, showToast]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const completedModules = state.modules.filter(m => m.current >= m.target).length;
  const overallPct = state.modules.length > 0
    ? Math.round((completedModules / state.modules.length) * 100)
    : 0;
  const xpThisLevel = state.xp % XP_PER_LEVEL;
  const xpProgress = Math.round((xpThisLevel / XP_PER_LEVEL) * 100);

  // ── Module CRUD ───────────────────────────────────────────────────────────

  function openAddModule() {
    setModForm({ title: '', subtitle: '', color: '#a855f7', target: '5', xpReward: '50', avatar: '⚡', category: 'Technical', notes: '' });
    setModuleModal({ open: true, editing: null });
  }

  function openEditModule(mod: TrainingModule) {
    setModForm({ title: mod.title, subtitle: mod.subtitle, color: mod.color, target: String(mod.target), xpReward: String(mod.xpReward), avatar: mod.characterAvatar, category: mod.category, notes: mod.notes });
    setModuleModal({ open: true, editing: mod });
  }

  function saveModule() {
    const { title, subtitle, color, target, xpReward, avatar, category, notes } = modForm;
    if (!title.trim()) return;
    setState(s => {
      if (moduleModal.editing) {
        return {
          ...s,
          modules: s.modules.map(m => m.id === moduleModal.editing!.id
            ? { ...m, title, subtitle, color, target: parseInt(target) || 5, xpReward: parseInt(xpReward) || 50, characterAvatar: avatar, category, notes, glowColor: color + '66' }
            : m),
        };
      }
      const newMod: TrainingModule = {
        id: nanoid(8), title, subtitle, color,
        glowColor: color + '66',
        current: 0, target: parseInt(target) || 5,
        xpReward: parseInt(xpReward) || 50,
        characterAvatar: avatar, notes, category, icon: 'zap',
      };
      return { ...s, modules: [...s.modules, newMod] };
    });
    setModuleModal({ open: false, editing: null });
  }

  function deleteModule(id: string) {
    if (!window.confirm('Delete this training module?')) return;
    setState(s => ({ ...s, modules: s.modules.filter(m => m.id !== id) }));
  }

  function incrementProgress(modId: string) {
    setState(s => {
      const mod = s.modules.find(m => m.id === modId);
      if (!mod || mod.current >= mod.target) return s;
      const updated = s.modules.map(m => m.id === modId ? { ...m, current: m.current + 1 } : m);
      return { ...s, modules: updated };
    });
    const mod = state.modules.find(m => m.id === modId);
    if (mod && mod.current < mod.target) {
      addXP(mod.xpReward, `+${state.expBoostActive ? mod.xpReward * 2 : mod.xpReward} XP — ${mod.title} progress!`);
    }
  }

  function decrementProgress(modId: string) {
    setState(s => ({
      ...s,
      modules: s.modules.map(m => m.id === modId && m.current > 0 ? { ...m, current: m.current - 1 } : m),
    }));
  }

  // ── Quests CRUD ───────────────────────────────────────────────────────────

  function toggleQuest(id: string) {
    setState(s => {
      const quest = s.quests.find(q => q.id === id);
      if (!quest || quest.done) return s;
      const updated = s.quests.map(q => q.id === id ? { ...q, done: true } : q);
      return { ...s, quests: updated };
    });
    const quest = state.quests.find(q => q.id === id);
    if (quest && !quest.done) addXP(quest.xp, `Quest complete! +${state.expBoostActive ? quest.xp * 2 : quest.xp} XP`);
  }

  function addQuest() {
    if (!questInput.trim()) return;
    const q: Quest = { id: nanoid(8), text: questInput.trim(), done: false, xp: 40, group: questGroup };
    setState(s => ({ ...s, quests: [...s.quests, q] }));
    setQuestInput('');
  }

  function deleteQuest(id: string) {
    setState(s => ({ ...s, quests: s.quests.filter(q => q.id !== id) }));
  }

  // ── Day Plan ──────────────────────────────────────────────────────────────

  function cycleDay(date: string) {
    setState(s => {
      const updated = s.weekPlan.map(d => {
        if (d.date !== date) return d;
        const next: DayPlan['status'] = d.status === 'pending' ? 'completed' : d.status === 'completed' ? 'active' : 'pending';
        return { ...d, status: next };
      });
      return { ...s, weekPlan: updated };
    });
  }

  function openDayModal(day: DayPlan) {
    setDayModal({ ...day });
  }

  function saveDayGoal(goal: string) {
    if (!dayModal || !goal.trim()) return;
    const newGoal = { id: nanoid(6), text: goal.trim(), done: false };
    setState(s => ({
      ...s,
      weekPlan: s.weekPlan.map(d => d.date === dayModal.date ? { ...d, goals: [...d.goals, newGoal] } : d),
    }));
    setDayModal(dm => dm ? { ...dm, goals: [...dm.goals, newGoal] } : dm);
  }

  function toggleDayGoal(goalId: string) {
    if (!dayModal) return;
    setState(s => ({
      ...s,
      weekPlan: s.weekPlan.map(d =>
        d.date === dayModal.date
          ? { ...d, goals: d.goals.map(g => g.id === goalId ? { ...g, done: !g.done } : g) }
          : d
      ),
    }));
    setDayModal(dm => dm ? { ...dm, goals: dm.goals.map(g => g.id === goalId ? { ...g, done: !g.done } : g) } : dm);
  }

  function deleteDayGoal(goalId: string) {
    if (!dayModal) return;
    setState(s => ({
      ...s,
      weekPlan: s.weekPlan.map(d =>
        d.date === dayModal.date ? { ...d, goals: d.goals.filter(g => g.id !== goalId) } : d
      ),
    }));
    setDayModal(dm => dm ? { ...dm, goals: dm.goals.filter(g => g.id !== goalId) } : dm);
  }

  // ── EXP Boost ─────────────────────────────────────────────────────────────

  function activateBoost() {
    const dur = 5 * 60 * 1000; // 5 min
    setState(s => ({ ...s, expBoostActive: true, expBoostEnd: Date.now() + dur }));
    showToast('⚡ EXP Boost activated! 2× XP for 5 minutes!');
  }

  // ── Boss Challenge ─────────────────────────────────────────────────────────

  function completeBoss() {
    if (bossIntervalRef.current) clearInterval(bossIntervalRef.current);
    setBossModal(false);
    addXP(500, '🏆 Boss Challenge conquered! +500 XP!');
    setState(s => ({ ...s, achievements: [...s.achievements, `Boss Challenge - ${new Date().toLocaleDateString()}`] }));
  }

  // ── Banner Upload ──────────────────────────────────────────────────────────

  function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setState(s => ({ ...s, heroBannerUrl: url }));
  }

  // ── Streak ────────────────────────────────────────────────────────────────

  function triggerStreak() {
    setState(s => ({ ...s, streak: s.streak + 1, lastActivityDate: new Date().toISOString().slice(0, 10) }));
    showToast('🔥 Streak +1! Keep going!');
  }

  // ─── Colors & Helpers ─────────────────────────────────────────────────────
  const glassCard = 'rgba(20,14,42,0.68)';
  const border = '1px solid rgba(168,85,247,0.2)';
  const textPrimary = '#f1f5f9';
  const textSec = 'rgba(203,213,225,0.7)';
  const accent = '#a855f7';
  const cyan = '#06b6d4';
  const emerald = '#10b981';
  const magenta = '#ec4899';

  function fmt(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,85,247,0.25)',
    borderRadius: '8px', padding: '0.5rem 0.75rem', color: textPrimary, fontSize: '0.9rem', outline: 'none',
  };

  const btnPrimary: React.CSSProperties = {
    background: 'linear-gradient(135deg, #a855f7, #6366f1)', border: 'none', borderRadius: '8px',
    color: '#fff', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
    boxShadow: '0 0 16px rgba(168,85,247,0.3)',
  };

  const dailyQuests = state.quests.filter(q => q.group === 'daily');
  const webQuests = state.quests.filter(q => q.group === 'web');

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #090714 0%, #120d26 50%, #0d0a20 100%)',
      color: textPrimary, fontFamily: "'Outfit','Inter',sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Animated background particles */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {[...Array(20)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            background: i % 3 === 0 ? accent : i % 3 === 1 ? cyan : emerald,
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.5 + 0.1,
            filter: 'blur(1px)',
            animation: `floatParticle ${5 + Math.random() * 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes floatParticle { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes pulseGlow { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes flameDance { 0%,100%{transform:rotate(-3deg) scale(1)} 50%{transform:rotate(3deg) scale(1.1)} }
        @keyframes xpPulse { 0%,100%{box-shadow:0 0 8px rgba(168,85,247,0.4)} 50%{box-shadow:0 0 20px rgba(168,85,247,0.8)} }
        @keyframes bossFlash { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .hq-module-card:hover .hq-card-actions{opacity:1!important}
        .hq-module-card:hover{transform:translateY(-3px)!important;box-shadow:0 12px 40px rgba(0,0,0,0.5)!important}
        .hq-day-node:hover{transform:scale(1.05);cursor:pointer}
        .hq-quest-row:hover .hq-quest-del{opacity:1!important}
        .pbar-fill{transition:width 0.6s cubic-bezier(0.4,0,0.2,1)}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '5rem', right: '1.5rem', zIndex: 9999,
          background: 'linear-gradient(135deg, rgba(15,8,40,0.97), rgba(25,12,50,0.97))',
          border: '1px solid rgba(168,85,247,0.5)', borderRadius: '12px',
          padding: '0.75rem 1.25rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(168,85,247,0.3)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          animation: 'slideUp 0.35s ease',
        }}>
          <span style={{ fontSize: '1.1rem' }}>⚡</span>
          <div>
            <div style={{ color: textPrimary, fontWeight: 600, fontSize: '0.9rem' }}>{toast.text}</div>
            {toast.xp && <div style={{ color: accent, fontSize: '0.8rem', fontWeight: 700 }}>+{toast.xp} XP earned!</div>}
          </div>
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1, padding: '1.25rem', maxWidth: '1600px', margin: '0 auto' }}>

        {/* ── HERO BANNER ─────────────────────────────────────────── */}
        <HudBracket style={{ marginBottom: '1.25rem', borderRadius: '18px', overflow: 'hidden' }}>
          <div style={{
            background: state.heroBannerUrl
              ? `linear-gradient(to right, rgba(9,7,20,0.9) 40%, rgba(9,7,20,0.3) 100%), url(${state.heroBannerUrl}) center/cover`
              : 'linear-gradient(135deg, rgba(10,6,25,0.9) 0%, rgba(30,15,60,0.8) 50%, rgba(10,6,25,0.9) 100%)',
            padding: '1.75rem 2rem', borderRadius: '18px', border,
            backdropFilter: 'blur(12px)', position: 'relative', overflow: 'hidden', minHeight: '180px',
          }}>
            {/* Grid overlay */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.04,
              backgroundImage: 'linear-gradient(rgba(168,85,247,1) 1px,transparent 1px),linear-gradient(90deg,rgba(168,85,247,1) 1px,transparent 1px)',
              backgroundSize: '40px 40px',
            }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
              {/* Left */}
              <div style={{ flex: '1 1 300px' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)',
                  borderRadius: '20px', padding: '0.3rem 0.9rem', marginBottom: '1rem',
                }}>
                  <Zap size={12} color={accent} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: accent, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Placement Training HQ
                  </span>
                </div>
                <h1 style={{
                  fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', fontWeight: 900, margin: '0 0 0.3rem',
                  letterSpacing: '-0.03em', lineHeight: 1.15, color: '#fff',
                }}>
                  Train Today.{' '}
                  <span style={{ background: `linear-gradient(90deg, ${accent}, ${cyan})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Get Placed Tomorrow.
                  </span>
                </h1>
                <p style={{ color: textSec, fontSize: '0.95rem', margin: '0 0 1.25rem' }}>
                  Build Skills&nbsp;•&nbsp;Solve Problems&nbsp;•&nbsp;Level Up
                </p>
                {/* Telemetry Row */}
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                  {/* Overall Progress */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: glassCard, border, borderRadius: '12px', padding: '0.6rem 1rem' }}>
                    <div style={{ position: 'relative', width: 48, height: 48 }}>
                      <CircularProgress pct={overallPct} size={48} stroke={4} color={accent} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: '#fff' }}>
                        {overallPct}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: textSec }}>Overall Progress</div>
                      <div style={{ fontWeight: 700, color: textPrimary, fontSize: '0.88rem' }}>{completedModules}/{state.modules.length} Modules</div>
                    </div>
                  </div>
                  {/* Streak */}
                  <div onClick={triggerStreak} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: glassCard, border, borderRadius: '12px', padding: '0.6rem 1rem', cursor: 'pointer' }}>
                    <div style={{ fontSize: '1.6rem', animation: 'flameDance 1.5s ease-in-out infinite' }}>🔥</div>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: textSec }}>Day Streak</div>
                      <div style={{ fontWeight: 800, color: '#fb923c', fontSize: '1.1rem' }}>{state.streak}</div>
                    </div>
                  </div>
                  {/* Level */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: glassCard, border, borderRadius: '12px', padding: '0.6rem 1rem' }}>
                    <Trophy size={22} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.6))' }} />
                    <div>
                      <div style={{ fontSize: '0.78rem', color: textSec }}>Level {state.level}</div>
                      <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.85rem' }}>{state.levelLabel}</div>
                      <div style={{ width: '80px', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '3px' }}>
                        <div style={{ height: '100%', width: `${xpProgress}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: '2px' }} className="pbar-fill" />
                      </div>
                    </div>
                  </div>
                  {/* XP */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)',
                    borderRadius: '12px', padding: '0.6rem 1rem', animation: 'xpPulse 2s ease infinite',
                  }}>
                    <Zap size={18} color={accent} />
                    <div>
                      <div style={{ fontSize: '0.72rem', color: textSec }}>Total XP</div>
                      <div style={{ fontWeight: 800, color: accent, fontSize: '1rem' }}>{state.xp.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Quote + change banner */}
              <div style={{ flex: '0 1 240px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                <div style={{
                  background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)',
                  borderRadius: '14px', padding: '0.9rem 1rem', maxWidth: '220px', textAlign: 'right',
                }}>
                  <div style={{ fontSize: '0.8rem', color: textPrimary, fontStyle: 'italic', lineHeight: 1.5 }}>
                    "{state.heroQuote}"
                  </div>
                  <div style={{ fontSize: '0.72rem', color: accent, marginTop: '0.4rem' }}>— Sastivelan</div>
                </div>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.06)', border, borderRadius: '8px',
                  padding: '0.4rem 0.8rem', fontSize: '0.78rem', color: textSec,
                }}>
                  <Upload size={12} />
                  Change Banner
                  <input type="file" accept="image/*" onChange={handleBannerUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          </div>
        </HudBracket>

        {/* ── MAIN GRID ───────────────────────────────────────────── */}
        <div className="placement-main-grid" style={{ display: 'grid', gap: '1.25rem', alignItems: 'start', minWidth: 0 }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ── Training Modules ──────────────────────────────── */}
            <HudBracket>
              <div style={{ background: glassCard, border, borderRadius: '16px', padding: '1.25rem', backdropFilter: 'blur(12px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <BarChart3 size={18} color={accent} />
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: textPrimary }}>Training Modules</span>
                    <span style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '20px', padding: '0.15rem 0.6rem', fontSize: '0.75rem', color: accent }}>{state.modules.length}</span>
                  </div>
                  <button onClick={openAddModule} style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Plus size={14} /> Add Module
                  </button>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '1rem',
                }}>
                  {state.modules.map(mod => {
                    const pct = Math.round((mod.current / mod.target) * 100);
                    return (
                      <div
                        key={mod.id}
                        className="hq-module-card"
                        style={{
                          background: `linear-gradient(135deg, rgba(14,10,30,0.9) 0%, ${mod.color}18 100%)`,
                          border: `1px solid ${mod.color}50`,
                          borderRadius: '14px', padding: '1rem',
                          position: 'relative', transition: 'all 0.25s ease',
                          boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px ${mod.color}20`,
                        }}
                      >
                        {/* Card Actions (hover) */}
                        <div
                          className="hq-card-actions"
                          style={{
                            position: 'absolute', top: '0.6rem', right: '0.6rem',
                            display: 'flex', gap: '0.3rem', opacity: 0, transition: 'opacity 0.2s',
                          }}
                        >
                          <button
                            onClick={() => openEditModule(mod)}
                            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '6px', padding: '4px', cursor: 'pointer', color: textSec }}
                          ><Edit2 size={12} /></button>
                          <button
                            onClick={() => deleteModule(mod.id)}
                            style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: '6px', padding: '4px', cursor: 'pointer', color: '#f87171' }}
                          ><Trash2 size={12} /></button>
                        </div>

                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
                            background: `${mod.color}22`, border: `1px solid ${mod.color}44`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: mod.color,
                            boxShadow: `0 0 10px ${mod.glowColor}`,
                          }}>
                            <ModuleIcon type={mod.icon} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: textPrimary, marginBottom: '2px' }}>{mod.title}</div>
                            <div style={{ fontSize: '0.76rem', color: textSec }}>{mod.subtitle}</div>
                          </div>
                        </div>

                        {/* Progress */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.78rem', color: textSec }}>Progress</span>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: mod.color }}>{mod.current}<span style={{ color: textSec, fontWeight: 400 }}>/{mod.target}</span></span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginBottom: '0.75rem' }}>
                          <div
                            className="pbar-fill"
                            style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${mod.color}, ${mod.color}bb)`, borderRadius: '2px', boxShadow: `0 0 6px ${mod.glowColor}` }}
                          />
                        </div>

                        {/* Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            onClick={() => setPracticeModal(mod)}
                            style={{
                              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                              background: `${mod.color}22`, border: `1px solid ${mod.color}44`, borderRadius: '8px',
                              padding: '0.45rem', color: mod.color, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                              transition: 'all 0.2s',
                            }}
                          >
                            <Play size={12} /> Start Practice
                          </button>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            <button
                              onClick={() => decrementProgress(mod.id)}
                              style={{ width: 28, height: 28, borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: 'none', color: textSec, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 }}
                            >−</button>
                            <button
                              onClick={() => incrementProgress(mod.id)}
                              style={{ width: 28, height: 28, borderRadius: '6px', background: `${mod.color}22`, border: `1px solid ${mod.color}44`, color: mod.color, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 }}
                            >+</button>
                          </div>
                        </div>

                        {/* Avatar badge */}
                        <div style={{
                          position: 'absolute', bottom: '0.6rem', right: '0.6rem',
                          fontSize: '1.1rem', opacity: 0.6,
                        }}>{mod.characterAvatar}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </HudBracket>

            {/* ── Weekly Planner ────────────────────────────────── */}
            <HudBracket>
              <div style={{ background: glassCard, border, borderRadius: '16px', padding: '1.25rem', backdropFilter: 'blur(12px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                  <Clock size={18} color={cyan} />
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: textPrimary }}>Weekly Training Planner</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: textSec }}>This Week</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                  {state.weekPlan.map(day => {
                    const isComplete = day.status === 'completed';
                    const isActive = day.status === 'active';
                    return (
                      <div
                        key={day.date}
                        className="hq-day-node"
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                          background: isActive
                            ? 'rgba(168,85,247,0.15)'
                            : isComplete ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                          border: isActive
                            ? '1px solid rgba(168,85,247,0.6)'
                            : isComplete ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '12px', padding: '0.75rem 0.4rem',
                          transition: 'all 0.2s', boxShadow: isActive ? '0 0 16px rgba(168,85,247,0.3)' : 'none',
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', color: textSec, fontWeight: 600, textTransform: 'uppercase' }}>{day.label}</div>
                        <div style={{ fontSize: '0.68rem', color: textSec, opacity: 0.6 }}>
                          {new Date(day.date + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                        </div>
                        <button
                          onClick={() => cycleDay(day.date)}
                          style={{
                            width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                            background: isActive ? accent : isComplete ? emerald : 'rgba(255,255,255,0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: isActive ? `0 0 14px ${accent}` : isComplete ? `0 0 10px ${emerald}` : 'none',
                            transition: 'all 0.2s',
                          }}
                        >
                          {isComplete ? <Check size={16} color="#fff" />
                            : isActive ? <Star size={16} color="#fff" fill="#fff" />
                              : <Circle size={14} color="rgba(255,255,255,0.3)" />}
                        </button>
                        <button
                          onClick={() => openDayModal(day)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.68rem', color: textSec, padding: '2px 4px' }}
                        >
                          {day.goals.length > 0 ? `${day.goals.filter(g => g.done).length}/${day.goals.length} goals` : '+ Goals'}
                        </button>
                        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: isActive ? accent : isComplete ? emerald : 'rgba(255,255,255,0.3)' }}>
                          {isActive ? 'Today' : isComplete ? 'Done' : 'Pending'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </HudBracket>

          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* EXP Boost */}
            <HudBracket>
              <div style={{ background: glassCard, border, borderRadius: '14px', padding: '1rem', backdropFilter: 'blur(12px)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: textPrimary, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap size={15} color="#f59e0b" /> EXP Boost Zone
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {!state.expBoostActive ? (
                    <>
                      <button
                        onClick={activateBoost}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                          background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,191,36,0.1))',
                          border: '1px solid rgba(245,158,11,0.4)', borderRadius: '8px',
                          padding: '0.5rem', color: '#fbbf24', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
                        }}
                      >
                        <Zap size={13} /> +EXP Boost (5 min)
                      </button>
                      <button
                        onClick={activateBoost}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                          background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.08))',
                          border: '1px solid rgba(6,182,212,0.4)', borderRadius: '8px',
                          padding: '0.5rem', color: cyan, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
                        }}
                      >
                        <Zap size={13} /> +EXP Boost x2
                      </button>
                    </>
                  ) : (
                    <div style={{
                      flex: 1, textAlign: 'center',
                      background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)',
                      borderRadius: '8px', padding: '0.5rem', color: '#fbbf24', fontWeight: 700,
                    }}>
                      ⚡ BOOST ACTIVE — {fmt(boostSecondsLeft)}
                    </div>
                  )}
                </div>
              </div>
            </HudBracket>

            {/* Quests */}
            <HudBracket>
              <div style={{ background: glassCard, border, borderRadius: '14px', padding: '1rem', backdropFilter: 'blur(12px)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: textPrimary, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={15} color={emerald} /> Daily Quests
                </div>

                {/* Daily group */}
                <div style={{ marginBottom: '0.5rem', fontSize: '0.72rem', color: textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Daily</div>
                {dailyQuests.map(q => (
                  <div key={q.id} className="hq-quest-row" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', position: 'relative' }}>
                    <button
                      onClick={() => toggleQuest(q.id)}
                      style={{
                        width: 20, height: 20, borderRadius: '5px', flexShrink: 0,
                        background: q.done ? emerald : 'rgba(255,255,255,0.05)',
                        border: q.done ? 'none' : '1px solid rgba(16,185,129,0.4)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: q.done ? `0 0 8px ${emerald}` : 'none',
                      }}
                    >
                      {q.done && <Check size={11} color="#fff" />}
                    </button>
                    <span style={{ flex: 1, fontSize: '0.82rem', color: q.done ? textSec : textPrimary, textDecoration: q.done ? 'line-through' : 'none', opacity: q.done ? 0.6 : 1 }}>
                      {q.text}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: emerald, fontWeight: 700 }}>+{q.xp}XP</span>
                    <button
                      className="hq-quest-del"
                      onClick={() => deleteQuest(q.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', opacity: 0, transition: 'opacity 0.2s', padding: '2px' }}
                    ><X size={12} /></button>
                  </div>
                ))}

                {/* Web group */}
                {webQuests.length > 0 && (
                  <>
                    <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem', fontSize: '0.72rem', color: textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Web</div>
                    {webQuests.map(q => (
                      <div key={q.id} className="hq-quest-row" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', position: 'relative' }}>
                        <button
                          onClick={() => toggleQuest(q.id)}
                          style={{
                            width: 20, height: 20, borderRadius: '5px', flexShrink: 0,
                            background: q.done ? emerald : 'rgba(255,255,255,0.05)',
                            border: q.done ? 'none' : '1px solid rgba(16,185,129,0.4)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: q.done ? `0 0 8px ${emerald}` : 'none',
                          }}
                        >
                          {q.done && <Check size={11} color="#fff" />}
                        </button>
                        <span style={{ flex: 1, fontSize: '0.82rem', color: q.done ? textSec : textPrimary, textDecoration: q.done ? 'line-through' : 'none', opacity: q.done ? 0.6 : 1 }}>
                          {q.text}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: emerald, fontWeight: 700 }}>+{q.xp}XP</span>
                        <button
                          className="hq-quest-del"
                          onClick={() => deleteQuest(q.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', opacity: 0, transition: 'opacity 0.2s', padding: '2px' }}
                        ><X size={12} /></button>
                      </div>
                    ))}
                  </>
                )}

                {/* Add Quest */}
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem' }}>
                  <input
                    value={questInput}
                    onChange={e => setQuestInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addQuest()}
                    placeholder="+ Add quest..."
                    style={{ ...inputStyle, flex: 1, fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                  />
                  <select
                    value={questGroup}
                    onChange={e => setQuestGroup(e.target.value as 'daily' | 'web')}
                    style={{ ...inputStyle, width: 'auto', padding: '0.4rem 0.5rem', fontSize: '0.78rem' }}
                  >
                    <option value="daily">Daily</option>
                    <option value="web">Web</option>
                  </select>
                  <button onClick={addQuest} style={{ ...btnPrimary, padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </HudBracket>

            {/* Boss + Coop */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Co-op */}
              <button
                onClick={() => setCoopModal(true)}
                style={{
                  background: `linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))`,
                  border: '1px solid rgba(6,182,212,0.4)', borderRadius: '14px',
                  padding: '1rem', cursor: 'pointer', textAlign: 'left', color: textPrimary,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Users size={18} color={cyan} />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Co-Op Raids</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: textSec }}>Squad coding challenges</div>
                <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <ChevronRight size={14} color={cyan} />
                  <span style={{ fontSize: '0.75rem', color: cyan, fontWeight: 600 }}>Enter Raid</span>
                </div>
              </button>

              {/* Boss */}
              <button
                onClick={() => setBossModal(true)}
                style={{
                  background: `linear-gradient(135deg, rgba(236,72,153,0.15), rgba(236,72,153,0.05))`,
                  border: '1px solid rgba(236,72,153,0.5)', borderRadius: '14px',
                  padding: '1rem', cursor: 'pointer', textAlign: 'left', color: textPrimary,
                  transition: 'all 0.2s', boxShadow: '0 0 20px rgba(236,72,153,0.1)',
                  animation: 'bossFlash 3s ease-in-out infinite',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Swords size={18} color={magenta} />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Boss Challenge</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: textSec }}>+500 XP on victory</div>
                <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <ChevronRight size={14} color={magenta} />
                  <span style={{ fontSize: '0.75rem', color: magenta, fontWeight: 600 }}>Challenge →</span>
                </div>
              </button>
            </div>

            {/* Achievements */}
            {state.achievements.length > 0 && (
              <HudBracket>
                <div style={{ background: glassCard, border, borderRadius: '14px', padding: '1rem', backdropFilter: 'blur(12px)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: textPrimary, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Award size={15} color="#f59e0b" /> Achievements ({state.achievements.length})
                  </div>
                  {state.achievements.map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.8rem', color: textSec }}>
                      <span>🏆</span> {a}
                    </div>
                  ))}
                </div>
              </HudBracket>
            )}

          </div>
        </div>

        {/* ── Bottom Bar ──────────────────────────────────────── */}
        <div style={{
          marginTop: '1.25rem', background: glassCard, border, borderRadius: '16px',
          padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <TrendingUp size={20} color={accent} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: textPrimary }}>Level Up Your Career</div>
              <div style={{ fontSize: '0.78rem', color: textSec }}>Keep training daily to unlock new ranks and achievements</div>
            </div>
          </div>
          <button
            onClick={() => setAnalyticsModal(true)}
            style={{ ...btnPrimary, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}
          >
            <BarChart3 size={15} /> View Detailed Progress →
          </button>
        </div>
      </div>

      {/* ═══════════════ MODALS ═══════════════ */}

      {/* Add/Edit Module Modal */}
      <ModalWrapper open={moduleModal.open} onClose={() => setModuleModal({ open: false, editing: null })} title={moduleModal.editing ? 'Edit Module' : 'Add New Training Module'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: textSec, display: 'block', marginBottom: '0.3rem' }}>Title *</label>
            <input style={inputStyle} placeholder="e.g. System Design" value={modForm.title} onChange={e => setModForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: textSec, display: 'block', marginBottom: '0.3rem' }}>Subtitle</label>
            <input style={inputStyle} placeholder="e.g. Architecture Patterns" value={modForm.subtitle} onChange={e => setModForm(f => ({ ...f, subtitle: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: textSec, display: 'block', marginBottom: '0.3rem' }}>Theme Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="color" value={modForm.color} onChange={e => setModForm(f => ({ ...f, color: e.target.value }))} style={{ width: 36, height: 36, border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }} />
                <input style={{ ...inputStyle, flex: 1 }} value={modForm.color} onChange={e => setModForm(f => ({ ...f, color: e.target.value }))} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: textSec, display: 'block', marginBottom: '0.3rem' }}>Category</label>
              <select style={inputStyle} value={modForm.category} onChange={e => setModForm(f => ({ ...f, category: e.target.value }))}>
                <option>Technical</option><option>Aptitude</option><option>Soft Skills</option>
                <option>Interview</option><option>Projects</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: textSec, display: 'block', marginBottom: '0.3rem' }}>Target Count</label>
              <input style={inputStyle} type="number" min="1" value={modForm.target} onChange={e => setModForm(f => ({ ...f, target: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: textSec, display: 'block', marginBottom: '0.3rem' }}>XP Reward</label>
              <input style={inputStyle} type="number" min="10" value={modForm.xpReward} onChange={e => setModForm(f => ({ ...f, xpReward: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: textSec, display: 'block', marginBottom: '0.3rem' }}>Avatar Emoji</label>
              <input style={inputStyle} value={modForm.avatar} onChange={e => setModForm(f => ({ ...f, avatar: e.target.value }))} placeholder="⚡" />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: textSec, display: 'block', marginBottom: '0.3rem' }}>Notes (optional)</label>
            <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={modForm.notes} onChange={e => setModForm(f => ({ ...f, notes: e.target.value }))} placeholder="Study resources, links, etc." />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button onClick={() => setModuleModal({ open: false, editing: null })} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border, borderRadius: '8px', color: textSec, padding: '0.6rem', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            <button onClick={saveModule} style={{ ...btnPrimary, flex: 1 }}>
              {moduleModal.editing ? 'Save Changes' : 'Create Module'}
            </button>
          </div>
        </div>
      </ModalWrapper>

      {/* Practice Session Modal */}
      <ModalWrapper open={!!practiceModal} onClose={() => setPracticeModal(null)} title={`Practice: ${practiceModal?.title ?? ''}`} maxW="560px">
        {practiceModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              background: `${practiceModal.color}15`, border: `1px solid ${practiceModal.color}40`,
              borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem',
            }}>
              <div style={{ position: 'relative', width: 72, height: 72 }}>
                <CircularProgress pct={Math.round((practiceModal.current / practiceModal.target) * 100)} size={72} stroke={5} color={practiceModal.color} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>
                  {Math.round((practiceModal.current / practiceModal.target) * 100)}%
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: textPrimary }}>{practiceModal.title}</div>
                <div style={{ fontSize: '0.82rem', color: textSec, marginBottom: '0.4rem' }}>{practiceModal.subtitle}</div>
                <div style={{ fontWeight: 600, color: practiceModal.color }}>{practiceModal.current} / {practiceModal.target} completed</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border, borderRadius: '12px', padding: '0.75rem 1rem' }}>
              <span style={{ fontWeight: 600, color: textPrimary, fontSize: '0.9rem' }}>Log Progress</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => { decrementProgress(practiceModal.id); setPracticeModal(m => m ? { ...m, current: Math.max(0, m.current - 1) } : m); }}
                  style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700 }}
                >−</button>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: textPrimary, minWidth: '2ch', textAlign: 'center' }}>{practiceModal.current}</span>
                <button
                  onClick={() => {
                    if (practiceModal.current < practiceModal.target) {
                      incrementProgress(practiceModal.id);
                      setPracticeModal(m => m ? { ...m, current: Math.min(m.target, m.current + 1) } : m);
                    }
                  }}
                  disabled={practiceModal.current >= practiceModal.target}
                  style={{
                    width: 36, height: 36, borderRadius: '8px',
                    background: `${practiceModal.color}30`, border: `1px solid ${practiceModal.color}50`,
                    color: practiceModal.color, cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700,
                    opacity: practiceModal.current >= practiceModal.target ? 0.4 : 1,
                  }}
                >+</button>
              </div>
            </div>

            {practiceModal.notes && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border, borderRadius: '10px', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.78rem', color: textSec, marginBottom: '0.35rem', fontWeight: 600 }}>Notes</div>
                <div style={{ fontSize: '0.85rem', color: textPrimary }}>{practiceModal.notes}</div>
              </div>
            )}

            <div style={{ background: `rgba(168,85,247,0.08)`, border: '1px solid rgba(168,85,247,0.2)', borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: textSec }}>XP per completion</div>
              <div style={{ fontWeight: 800, color: accent, fontSize: '1.1rem' }}>+{state.expBoostActive ? practiceModal.xpReward * 2 : practiceModal.xpReward} XP{state.expBoostActive ? ' (2×)' : ''}</div>
            </div>

            {practiceModal.current >= practiceModal.target && (
              <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '10px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check size={16} color={emerald} />
                <span style={{ color: emerald, fontWeight: 600, fontSize: '0.88rem' }}>Module Complete! Excellent work! 🎉</span>
              </div>
            )}
          </div>
        )}
      </ModalWrapper>

      {/* Day Plan Modal */}
      <ModalWrapper open={!!dayModal} onClose={() => setDayModal(null)} title={dayModal ? `${dayModal.label} — Training Goals` : ''}>
        {dayModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['pending', 'active', 'completed'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => {
                    setState(st => ({
                      ...st, weekPlan: st.weekPlan.map(d => d.date === dayModal.date ? { ...d, status: s } : d),
                    }));
                    setDayModal(dm => dm ? { ...dm, status: s } : dm);
                    if (s === 'completed') addXP(80, '📅 Day marked complete! +80 XP');
                  }}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
                    background: dayModal.status === s
                      ? (s === 'completed' ? emerald : s === 'active' ? accent : 'rgba(255,255,255,0.12)')
                      : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${dayModal.status === s ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                    color: dayModal.status === s ? '#fff' : textSec,
                    textTransform: 'capitalize',
                  }}
                >{s}</button>
              ))}
            </div>

            <div>
              <div style={{ fontWeight: 600, color: textPrimary, fontSize: '0.88rem', marginBottom: '0.6rem' }}>Goals</div>
              {dayModal.goals.map(g => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <button
                    onClick={() => toggleDayGoal(g.id)}
                    style={{ width: 20, height: 20, borderRadius: '5px', background: g.done ? emerald : 'rgba(255,255,255,0.05)', border: g.done ? 'none' : border, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >{g.done && <Check size={11} color="#fff" />}</button>
                  <span style={{ flex: 1, fontSize: '0.85rem', color: g.done ? textSec : textPrimary, textDecoration: g.done ? 'line-through' : 'none' }}>{g.text}</span>
                  <button onClick={() => deleteDayGoal(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: '2px' }}><X size={12} /></button>
                </div>
              ))}
              <form onSubmit={e => { e.preventDefault(); const inp = (e.target as HTMLFormElement).querySelector('input') as HTMLInputElement; saveDayGoal(inp.value); inp.value = ''; }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input style={{ ...inputStyle, flex: 1 }} placeholder="Add a training goal..." />
                  <button type="submit" style={btnPrimary}><Plus size={14} /></button>
                </div>
              </form>
            </div>
          </div>
        )}
      </ModalWrapper>

      {/* Boss Challenge Modal */}
      <ModalWrapper open={bossModal} onClose={() => setBossModal(false)} title="⚔️ Boss Challenge — Technical Interview Battle">
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
          <div style={{ fontSize: '4rem', animation: 'flameDance 1s ease-in-out infinite' }}>👹</div>
          <div style={{
            fontSize: '3.5rem', fontWeight: 900, fontFamily: 'monospace',
            color: bossTimer < 60 ? magenta : bossTimer < 180 ? '#f59e0b' : '#fff',
            letterSpacing: '0.08em', animation: bossTimer < 60 ? 'bossFlash 0.5s ease infinite' : 'none',
          }}>
            {fmt(bossTimer)}
          </div>
          <div style={{ color: textSec, fontSize: '0.9rem', maxWidth: '340px' }}>
            Solve the tech interview problem before the timer runs out. Award: <strong style={{ color: magenta }}>+500 XP</strong> + Achievement Badge
          </div>
          <div style={{
            background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.3)',
            borderRadius: '12px', padding: '1rem', width: '100%', textAlign: 'left',
          }}>
            <div style={{ fontWeight: 700, color: textPrimary, marginBottom: '0.5rem' }}>📋 Challenge:</div>
            <div style={{ color: textSec, fontSize: '0.88rem', lineHeight: 1.6 }}>
              Implement a function <code style={{ color: magenta }}>twoSum(nums, target)</code> that returns indices of two numbers that add up to target. Explain your approach, write the code, and analyze time/space complexity.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
            <button onClick={() => setBossModal(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border, borderRadius: '8px', color: textSec, padding: '0.6rem', cursor: 'pointer', fontWeight: 600 }}>Retreat</button>
            <button onClick={completeBoss} style={{ ...btnPrimary, flex: 2, background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}>
              🏆 Submit Solution (+500 XP)
            </button>
          </div>
        </div>
      </ModalWrapper>

      {/* Co-Op Raids Modal */}
      <ModalWrapper open={coopModal} onClose={() => setCoopModal(false)} title="🤝 Co-Op Raids — Squad Challenges">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { name: 'Array Avengers', challenge: 'Binary Search Mastery', progress: 65, members: ['🐱', '🦊', '🐉'], color: cyan },
            { name: 'DSA Dragons', challenge: 'Dynamic Programming Boss', progress: 30, members: ['⚡', '👑', '🌸'], color: accent },
            { name: 'System Squad', challenge: 'System Design Interview', progress: 80, members: ['🐱', '🐉', '⚡'], color: emerald },
          ].map((raid, i) => (
            <div key={i} style={{ background: `${raid.color}10`, border: `1px solid ${raid.color}30`, borderRadius: '12px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 700, color: textPrimary }}>{raid.name}</div>
                <div style={{ display: 'flex', gap: '0.2rem' }}>{raid.members.map((m, j) => <span key={j} style={{ fontSize: '1.1rem' }}>{m}</span>)}</div>
              </div>
              <div style={{ fontSize: '0.82rem', color: textSec, marginBottom: '0.6rem' }}>{raid.challenge}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px' }}>
                  <div style={{ height: '100%', width: `${raid.progress}%`, background: `linear-gradient(90deg, ${raid.color}, ${raid.color}bb)`, borderRadius: '3px', boxShadow: `0 0 6px ${raid.color}66` }} />
                </div>
                <span style={{ fontSize: '0.78rem', color: raid.color, fontWeight: 700 }}>{raid.progress}%</span>
                <button onClick={() => { addXP(80, `Co-Op Raid contribution! +80 XP`); setCoopModal(false); }} style={{ ...btnPrimary, fontSize: '0.78rem', padding: '0.35rem 0.75rem', background: `linear-gradient(135deg, ${raid.color}, ${raid.color}bb)` }}>
                  Join
                </button>
              </div>
            </div>
          ))}
        </div>
      </ModalWrapper>

      {/* Analytics Modal */}
      <ModalWrapper open={analyticsModal} onClose={() => setAnalyticsModal(false)} title="📊 Detailed Progress Analytics" maxW="640px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {[
              { label: 'Total XP', value: state.xp.toLocaleString(), color: accent, icon: '⚡' },
              { label: 'Level', value: state.level, color: '#f59e0b', icon: '🏆' },
              { label: 'Streak', value: `${state.streak} days`, color: '#fb923c', icon: '🔥' },
              { label: 'Modules', value: `${completedModules}/${state.modules.length}`, color: emerald, icon: '📚' },
              { label: 'Quests Done', value: state.quests.filter(q => q.done).length, color: cyan, icon: '✅' },
              { label: 'Achievements', value: state.achievements.length, color: magenta, icon: '🎖️' },
            ].map((s, i) => (
              <div key={i} style={{ background: `${s.color}10`, border: `1px solid ${s.color}30`, borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem' }}>{s.icon}</div>
                <div style={{ fontWeight: 800, color: s.color, fontSize: '1.1rem' }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: textSec }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Module breakdown */}
          <div>
            <div style={{ fontWeight: 700, color: textPrimary, marginBottom: '0.75rem', fontSize: '0.9rem' }}>Module Breakdown</div>
            {state.modules.map(mod => {
              const pct = Math.round((mod.current / mod.target) * 100);
              return (
                <div key={mod.id} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.84rem', color: textPrimary }}>{mod.title}</span>
                    <span style={{ fontSize: '0.82rem', color: mod.color, fontWeight: 700 }}>{mod.current}/{mod.target} ({pct}%)</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px' }}>
                    <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${mod.color}, ${mod.color}bb)`, borderRadius: '3px', boxShadow: `0 0 6px ${mod.glowColor}`, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* XP to next level */}
          <div style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600, color: textPrimary, fontSize: '0.88rem' }}>Progress to Level {state.level + 1}</span>
              <span style={{ color: accent, fontWeight: 700, fontSize: '0.88rem' }}>{xpThisLevel} / {XP_PER_LEVEL} XP</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }}>
              <div style={{ height: '100%', width: `${xpProgress}%`, background: `linear-gradient(90deg, ${accent}, #6366f1)`, borderRadius: '4px', boxShadow: '0 0 8px rgba(168,85,247,0.5)', transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ fontSize: '0.78rem', color: textSec, marginTop: '0.4rem' }}>
              {XP_PER_LEVEL - xpThisLevel} XP needed to reach {getLevelLabel(state.level + 1)}
            </div>
          </div>
        </div>
      </ModalWrapper>

    </div>
  );
}
