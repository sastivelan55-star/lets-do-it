import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Zap,
  Crosshair,
  Flame,
  Coins,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Plus,
  Trash2,
  Search,
  Check,
  Sparkles,
  Shield,
  IdCard,
  Skull,
  Scroll,
  Moon,
  Cpu,
  X,
  User,
  Archive,
  Calendar,
  Edit3,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import TaskRecycleBinModal from '../components/taskBuilder/TaskRecycleBinModal';
import { today } from '../utils/dates';
import type { Task, LifeArea } from '../types';

interface QuestItem {
  id: string;
  title: string;
  rank: 'S' | 'A' | 'B' | 'C';
  element: 'Void' | 'Tech' | 'Fire' | 'Shadow';
  stage: 'notice' | 'combat' | 'victory';
  cleared: boolean;
  expReward: number;
  goldReward: number;
  duration: number;
  notes?: string;
  subtasks: { id: string; title: string; done: boolean }[];
  realTaskId?: string;
  targetDate?: string;
}

export default function TaskBuilderPage() {
  const {
    tasks,
    deletedTasks,
    addTask,
    updateTask,
    completeTask,
    removeTask,
    restoreTask,
    permanentDeleteTask,
    emptyRecycleBin,
    settings,
  } = useApp();

  // Navigation tab
  const [currentView, setCurrentView] = useState<'board' | 'bounty' | 'matrix' | 'hunterCard'>('board');

  // Filters
  const [filterRank, setFilterRank] = useState<'ALL' | 'S' | 'A' | 'B' | 'C'>('ALL');
  const [filterElem, setFilterElem] = useState<'all' | 'Void' | 'Tech' | 'Fire'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Target task for Awaken Focus
  const [targetQuestId, setTargetQuestId] = useState<string | null>(null);

  // Modals
  const [isDetailedModalOpen, setIsDetailedModalOpen] = useState(false);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);

  // Sound FX State & Web Audio Synth
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playAnimeSound = (type: 'slash' | 'levelup' | 'click') => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'slash') {
        // Katana Sword Slash + Crystal Chime
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(800, now);
        osc1.frequency.exponentialRampToValueAtTime(120, now + 0.18);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1046.5, now);
        osc2.frequency.exponentialRampToValueAtTime(2093, now + 0.22);

        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.22);
        osc2.stop(now + 0.22);
      } else if (type === 'levelup') {
        // Shonen Level Up Arpeggio
        const notes = [440, 554.37, 659.25, 880, 1108.73];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.08, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.2);
        });
      } else if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch {}
  };

  // ── RPG HUNTER STATE ────────────────────────────────────────────────────────
  const [hunter, setHunter] = useState(() => {
    const saved = localStorage.getItem('quest_zero_hunter_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      name: settings.displayName || 'SHADOW MONARCH',
      level: 28,
      currentExp: 1820,
      maxExp: 2500,
      gold: 2450,
      streak: 4,
      rank: 'S-RANK',
    };
  });

  const gainRewards = (exp: number, gold: number) => {
    setHunter((prev: typeof hunter) => {
      let currentExp = prev.currentExp + exp;
      let level = prev.level;
      let maxExp = prev.maxExp;

      if (currentExp >= maxExp) {
        level += 1;
        currentExp -= maxExp;
        maxExp = Math.floor(maxExp * 1.35);
        playAnimeSound('levelup');
      }

      const updated = {
        ...prev,
        level,
        currentExp,
        maxExp,
        gold: prev.gold + gold,
        streak: prev.streak + 1,
      };
      localStorage.setItem('quest_zero_hunter_v3', JSON.stringify(updated));
      return updated;
    });
  };

  // ── AWAKEN FOCUS (POMODORO) ENGINE ──────────────────────────────────────────
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [initialTimerSeconds, setInitialTimerSeconds] = useState(25 * 60);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            playAnimeSound('levelup');
            return initialTimerSeconds;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, initialTimerSeconds]);

  const toggleAwakenTimer = () => {
    if (!timerRunning) {
      playAnimeSound('slash');
      setTimerRunning(true);
    } else {
      playAnimeSound('click');
      setTimerRunning(false);
    }
  };

  const resetAwakenTimer = () => {
    playAnimeSound('click');
    setTimerRunning(false);
    setTimerSeconds(initialTimerSeconds);
  };

  const setAwakenPreset = (minutes: number) => {
    playAnimeSound('click');
    setTimerRunning(false);
    const secs = minutes * 60;
    setInitialTimerSeconds(secs);
    setTimerSeconds(secs);
  };

  // ── MAPPING REAL TASKS TO QUESTS ────────────────────────────────────────────
  // Map AppContext tasks into hunter quests so all data stays synchronized
  const quests: QuestItem[] = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return [];
    }

    // Map real AppContext tasks (root tasks as main quests, child tasks as subtasks)
    const childMap = new Map<string, Task[]>();
    tasks.forEach((t) => {
      if (t.parentId) {
        const list = childMap.get(t.parentId) || [];
        list.push(t);
        childMap.set(t.parentId, list);
      }
    });

    const rootTasks = tasks.filter((t) => !t.parentId && !t.isDeleted);

    return rootTasks.map((t) => {
      const children = childMap.get(t.id) || [];
      const rank: 'S' | 'A' | 'B' | 'C' =
        t.priority === 'critical' ? 'S' : t.priority === 'high' ? 'A' : t.priority === 'medium' ? 'B' : 'C';

      const element: 'Void' | 'Tech' | 'Fire' | 'Shadow' =
        t.lifeArea === 'growth' || t.lifeArea === 'technical'
          ? 'Tech'
          : t.lifeArea === 'career'
          ? 'Fire'
          : t.lifeArea === 'health'
          ? 'Shadow'
          : 'Void';

      const isCompleted = t.status === 'completed';
      const stage: 'notice' | 'combat' | 'victory' = isCompleted
        ? 'victory'
        : t.status === 'in-progress'
        ? 'combat'
        : 'notice';

      const baseExp = { S: 450, A: 300, B: 200, C: 120 }[rank];

      return {
        id: t.id,
        title: t.title,
        rank,
        element,
        stage,
        cleared: isCompleted,
        expReward: baseExp,
        goldReward: Math.floor(baseExp * 1.3),
        duration: t.estimatedMinutes || 25,
        notes: t.description,
        subtasks: children.map((c) => ({
          id: c.id,
          title: c.title,
          done: c.status === 'completed',
        })),
        realTaskId: t.id,
        targetDate: t.targetDate || t.dueDate || today(),
      };
    });
  }, [tasks]);

  // Set default target quest if none
  useEffect(() => {
    if (!targetQuestId && quests.length > 0) {
      const active = quests.find((q) => !q.cleared);
      setTargetQuestId(active ? active.id : quests[0].id);
    }
  }, [quests, targetQuestId]);

  // Filtered Quests
  const filteredQuests = useMemo(() => {
    return quests.filter((q) => {
      if (filterRank !== 'ALL' && q.rank !== filterRank) return false;
      if (filterElem !== 'all' && q.element !== filterElem) return false;
      if (searchQuery.trim()) {
        const text = searchQuery.toLowerCase();
        const inTitle = q.title.toLowerCase().includes(text);
        const inNotes = (q.notes || '').toLowerCase().includes(text);
        if (!inTitle && !inNotes) return false;
      }
      return true;
    });
  }, [quests, filterRank, filterElem, searchQuery]);

  // ── QUEST ACTIONS ───────────────────────────────────────────────────────────
  const handleToggleClear = async (q: QuestItem) => {
    if (!q.cleared) {
      playAnimeSound('slash');
      // Visual slash effect on card
      const el = document.getElementById(`quest-card-${q.id}`);
      if (el) {
        const slash = document.createElement('div');
        slash.className = 'slash-effect';
        el.appendChild(slash);
        setTimeout(() => slash.remove(), 450);
      }
      gainRewards(q.expReward, q.goldReward);
      if (q.realTaskId) {
        await completeTask(q.realTaskId);
      }
    } else {
      playAnimeSound('click');
      if (q.realTaskId) {
        const original = tasks.find((t) => t.id === q.realTaskId);
        if (original) {
          await updateTask({ ...original, status: 'not-started' });
        }
      }
    }
  };

  const handleDeleteQuest = async (q: QuestItem) => {
    playAnimeSound('click');
    if (targetQuestId === q.id) {
      setTargetQuestId(null);
    }
    if (q.realTaskId) {
      await removeTask(q.realTaskId);
    }
  };

  const handleSubtaskToggle = async (_parentId: string, subId: string, currentDone: boolean) => {
    playAnimeSound('click');
    const childTask = tasks.find((t) => t.id === subId);
    if (childTask) {
      await updateTask({
        ...childTask,
        status: currentDone ? 'not-started' : 'completed',
      });
    }
  };

  const [addingSubtaskQuestId, setAddingSubtaskQuestId] = useState<string | null>(null);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  const handleAddSubtask = async (parentId: string) => {
    if (!newSubtaskText.trim()) return;
    const parentTask = tasks.find((t) => t.id === parentId);
    await addTask({
      title: newSubtaskText.trim(),
      parentId,
      priority: parentTask?.priority || 'medium',
      lifeArea: parentTask?.lifeArea || 'growth',
      status: 'not-started',
      dueDate: today(),
    });
    playAnimeSound('slash');
    setNewSubtaskText('');
    setAddingSubtaskQuestId(null);
  };

  // Quick Command input
  const [quickTitle, setQuickTitle] = useState('');
  const [quickRank, setQuickRank] = useState<'S' | 'A' | 'B' | 'C'>('B');
  const [quickDate, setQuickDate] = useState(today());

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const priorityMap = { S: 'critical', A: 'high', B: 'medium', C: 'low' } as const;
    const areaMap: Record<'S' | 'A' | 'B' | 'C', LifeArea> = {
      S: 'growth',
      A: 'career',
      B: 'growth',
      C: 'health',
    };

    const chosenDate = quickDate || today();

    await addTask({
      title: quickTitle.trim(),
      priority: priorityMap[quickRank],
      status: 'not-started',
      lifeArea: areaMap[quickRank],
      dueDate: chosenDate,
      targetDate: chosenDate,
      estimatedMinutes: 30,
    });

    playAnimeSound('slash');
    setQuickTitle('');
  };

  // Detailed Modal form state
  const [mTitle, setMTitle] = useState('');
  const [mRank, setMRank] = useState<'S' | 'A' | 'B' | 'C'>('B');
  const [mElem, setMElem] = useState<'Void' | 'Tech' | 'Fire' | 'Shadow'>('Tech');
  const [mDur, setMDur] = useState(25);
  const [mNotes, setMNotes] = useState('');
  const [mDate, setMDate] = useState(today());

  const handleDetailedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle.trim()) return;

    const priorityMap = { S: 'critical', A: 'high', B: 'medium', C: 'low' } as const;
    const chosenDate = mDate || today();

    await addTask({
      title: mTitle.trim(),
      priority: priorityMap[mRank],
      status: 'not-started',
      lifeArea: 'growth',
      dueDate: chosenDate,
      targetDate: chosenDate,
      estimatedMinutes: mDur,
      description: mNotes.trim() ? `${mNotes.trim()}\n[Element: ${mElem}]` : `[Element: ${mElem}]`,
    });

    playAnimeSound('slash');
    setIsDetailedModalOpen(false);
    setMTitle('');
    setMNotes('');
    setMDate(today());
  };

  // Edit Quest Modal state
  const [editingQuest, setEditingQuest] = useState<QuestItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editRank, setEditRank] = useState<'S' | 'A' | 'B' | 'C'>('B');
  const [editElem, setEditElem] = useState<'Void' | 'Tech' | 'Fire' | 'Shadow'>('Tech');
  const [editDur, setEditDur] = useState(25);
  const [editDate, setEditDate] = useState(today());
  const [editNotes, setEditNotes] = useState('');

  const openEditModal = (q: QuestItem) => {
    playAnimeSound('click');
    setEditingQuest(q);
    setEditTitle(q.title);
    setEditRank(q.rank);
    setEditElem(q.element);
    setEditDur(q.duration);
    setEditDate(q.targetDate || today());
    setEditNotes(q.notes || '');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuest || !editingQuest.realTaskId || !editTitle.trim()) return;

    const original = tasks.find((t) => t.id === editingQuest.realTaskId);
    if (!original) return;

    const priorityMap = { S: 'critical', A: 'high', B: 'medium', C: 'low' } as const;
    const chosenDate = editDate || today();

    await updateTask({
      ...original,
      title: editTitle.trim(),
      priority: priorityMap[editRank],
      dueDate: chosenDate,
      targetDate: chosenDate,
      estimatedMinutes: editDur,
      description: editNotes.trim(),
    });

    playAnimeSound('slash');
    setEditingQuest(null);
  };

  // ── PARTICLES BACKGROUND CANVAS ─────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const petals: any[] = [];
    for (let i = 0; i < 35; i++) {
      petals.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 5 + 3,
        speedX: Math.random() * 1.5 - 0.5,
        speedY: Math.random() * 1.2 + 0.8,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 2 - 1,
        color: Math.random() > 0.4 ? 'rgba(255, 112, 166, 0.4)' : 'rgba(0, 240, 255, 0.35)',
        isHex: Math.random() > 0.6,
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      petals.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * w;
        }
        if (p.x > w + 20) p.x = -20;
        if (p.x < -20) p.x = w + 20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.isHex) {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 1.8, Math.PI / 4, 0, 2 * Math.PI);
          ctx.fill();
        }
        ctx.restore();
      });
      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Helpers
  const getRankConfig = (rank: 'S' | 'A' | 'B' | 'C') => {
    switch (rank) {
      case 'S':
        return {
          color: 'text-anime-crimson',
          border: 'border-pink-500/50',
          badge: 'bg-pink-500/20 text-pink-400 border-pink-500/40',
          tag: 's-rank',
          label: 'S-RANK [BOSS]',
        };
      case 'A':
        return {
          color: 'text-amber-400',
          border: 'border-amber-400/50',
          badge: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
          tag: 'a-rank',
          label: 'A-RANK [ELITE]',
        };
      case 'B':
        return {
          color: 'text-cyan-400',
          border: 'border-cyan-400/50',
          badge: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40',
          tag: 'b-rank',
          label: 'B-RANK [MAJOR]',
        };
      case 'C':
      default:
        return {
          color: 'text-emerald-400',
          border: 'border-emerald-400/50',
          badge: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40',
          tag: 'c-rank',
          label: 'C-RANK [MINOR]',
        };
    }
  };

  const getElementConfig = (elem: 'Void' | 'Tech' | 'Fire' | 'Shadow') => {
    switch (elem) {
      case 'Void':
        return { icon: <Moon size={11} />, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
      case 'Fire':
        return { icon: <Flame size={11} />, color: 'text-pink-500 bg-pink-500/10 border-pink-500/30' };
      case 'Shadow':
        return { icon: <Shield size={11} />, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
      case 'Tech':
      default:
        return { icon: <Cpu size={11} />, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
    }
  };

  const targetQuest = quests.find((q) => q.id === targetQuestId);
  const clearedCount = quests.filter((q) => q.cleared).length;
  const expPercent = Math.min(100, Math.round((hunter.currentExp / hunter.maxExp) * 100));

  // Timer format
  const tMin = Math.floor(timerSeconds / 60);
  const tSec = timerSeconds % 60;
  const timeFormatted = `${String(tMin).padStart(2, '0')}:${String(tSec).padStart(2, '0')}`;
  const ringCircumference = 389.5;
  const ringProgress = 1 - timerSeconds / initialTimerSeconds;

  return (
    <div
      className="task-builder-page-scroll"
      style={{
        flex: 1,
        minHeight: 0,
        height: '100%',
        width: '100%',
        position: 'relative',
        color: '#E2E8F0',
        fontFamily: 'Rajdhani, Inter, sans-serif',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        overscrollBehaviorY: 'contain',
        paddingBottom: '6rem',
      }}
    >
      {/* Background Particles Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.65,
        }}
      />
      <div className="fixed inset-0 scanlines z-10 pointer-events-none opacity-30" />

      {/* ── TOP CYBER-GUILD COMMAND BAR ─────────────────────────────────────── */}
      <header
        style={{
          height: '64px',
          padding: '0 1.5rem',
          borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
          background: 'rgba(7, 10, 18, 0.92)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        {/* Brand Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              position: 'relative',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              padding: '1.5px',
              background: 'linear-gradient(135deg, #FF2A85, #00F0FF, #FFD700)',
              boxShadow: '0 0 16px rgba(0, 240, 255, 0.4)',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: '#070A12',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  background: 'linear-gradient(90deg, #00F0FF, #FFFFFF, #FF2A85)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                QZ
              </span>
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                fontSize: '8px',
                fontFamily: 'monospace',
                padding: '1px 3px',
                background: '#FF2A85',
                color: '#000000',
                fontWeight: 900,
                borderRadius: '3px',
              }}
            >
              S-SYS
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontWeight: 900,
                  fontSize: '1rem',
                  letterSpacing: '0.06em',
                  color: '#ffffff',
                }}
              >
                QUEST // ZERO
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: 'rgba(0, 240, 255, 0.1)',
                  color: '#00F0FF',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                }}
              >
                ギルド・OS
              </span>
            </div>
            <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', letterSpacing: '0.08em' }}>
              HUNTER TASK FORCE • SYSTEM ONLINE
            </div>
          </div>
        </div>

        {/* Center View Navigation Tabs */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '3px',
            borderRadius: '12px',
            background: 'rgba(12, 16, 31, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {[
            { id: 'board', label: '任務 QUESTS', icon: <Scroll size={13} /> },
            { id: 'bounty', label: '討伐 BOUNTY', icon: <Skull size={13} /> },
            { id: 'matrix', label: '作戦 RAID ZONES', icon: <Shield size={13} /> },
            { id: 'hunterCard', label: '冒険者 HUNTER LICENCE', icon: <IdCard size={13} /> },
          ].map((tab) => {
            const active = currentView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  playAnimeSound('click');
                  setCurrentView(tab.id as any);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  border: active ? '1px solid rgba(0, 240, 255, 0.45)' : '1px solid transparent',
                  background: active ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(138, 43, 226, 0.2))' : 'transparent',
                  color: active ? '#00F0FF' : '#94a3b8',
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Telemetry & Sound Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Combo Multiplier */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              background: 'rgba(255, 42, 133, 0.12)',
              border: '1px solid rgba(255, 42, 133, 0.35)',
              fontSize: '0.75rem',
            }}
          >
            <Flame size={14} color="#FF2A85" />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '8px', fontFamily: 'monospace', color: '#94a3b8', lineHeight: 1 }}>COMBO</div>
              <div style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 800, fontSize: '0.8rem', color: '#ffffff' }}>
                x{(1 + hunter.streak * 0.1).toFixed(1)}
              </div>
            </div>
          </div>

          {/* Gold Counter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.35)',
              color: '#FFD700',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            <Coins size={14} />
            <span>{hunter.gold.toLocaleString()}G</span>
          </div>

          {/* Sound FX Toggle */}
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              playAnimeSound('click');
            }}
            title={soundEnabled ? 'Mute Sounds' : 'Enable Audio'}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#0C101F',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              color: soundEnabled ? '#00F0FF' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {/* Recycle Bin Button */}
          <button
            type="button"
            onClick={() => setIsRecycleBinOpen(true)}
            title="Recycle Bin"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#0C101F',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Archive size={15} />
          </button>

          {/* New Mission Persona Button */}
          <button
            type="button"
            onClick={() => {
              playAnimeSound('click');
              setIsDetailedModalOpen(true);
            }}
            className="persona-btn"
            style={{
              padding: '0.55rem 1.15rem',
              color: '#ffffff',
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            <span>NEW MISSION</span>
          </button>
        </div>
      </header>

      {/* ── MAIN INTERFACE GRID ──────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 20,
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 340px) minmax(0, 1fr)',
          gap: '1.5rem',
          alignItems: 'start',
        }}
        className="cal-layout-grid"
      >
        {/* ── LEFT SIDEBAR: HUNTER STATUS & AWAKEN MODE ──────────────────────── */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Hunter Profile & Rank Card */}
          <div className="anime-glass" style={{ borderRadius: '20px', padding: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#00F0FF',
                    boxShadow: '0 0 10px #00F0FF',
                  }}
                />
                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1' }}>
                  HUNTER STATUS
                </span>
              </div>
              <span
                className="anime-badge"
                style={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontWeight: 900,
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  background: 'linear-gradient(90deg, #FF2A85, #8A2BE2)',
                  color: '#ffffff',
                }}
              >
                S-RANK
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '14px',
                  padding: '2px',
                  background: 'linear-gradient(135deg, #00F0FF, #FF2A85, #FFD700)',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: '#0C101F',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00F0FF',
                  }}
                >
                  <User size={28} />
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {hunter.name}
                </h3>
                <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#00F0FF', marginTop: '2px' }}>
                  TITLE: AWAKENED SOVEREIGN
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8', marginTop: '2px' }}>
                  LVL <span style={{ color: '#ffffff', fontWeight: 800 }}>{hunter.level}</span> • Supreme Slayer
                </div>
              </div>
            </div>

            {/* EXP Gauge */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'monospace', marginBottom: '4px' }}>
                <span style={{ color: '#94a3b8' }}>EXP GAUGE 経験値</span>
                <span style={{ color: '#00FFA3', fontWeight: 800 }}>
                  {hunter.currentExp} / {hunter.maxExp}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  background: '#070A12',
                  borderRadius: '999px',
                  border: '1px solid rgba(0, 255, 163, 0.3)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${expPercent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #00F0FF, #00FFA3, #FFD700)',
                    boxShadow: '0 0 10px #00FFA3',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* Guild Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center', fontFamily: 'monospace' }}>
              <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(12, 16, 31, 0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Cleared</span>
                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.9rem', fontWeight: 800, color: '#00FFA3' }}>
                  {clearedCount}
                </span>
              </div>
              <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(12, 16, 31, 0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Active</span>
                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.9rem', fontWeight: 800, color: '#00F0FF' }}>
                  {quests.length - clearedCount}
                </span>
              </div>
              <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(12, 16, 31, 0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Win Rate</span>
                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.9rem', fontWeight: 800, color: '#FFD700' }}>
                  {quests.length ? `${Math.round((clearedCount / quests.length) * 100)}%` : '100%'}
                </span>
              </div>
            </div>
          </div>

          {/* AWAKEN // DEEP FOCUS (ANIME POMODORO ENGINE) */}
          <div className={`anime-glass ${timerRunning ? 'awakened-mode' : ''}`} style={{ borderRadius: '20px', padding: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} color="#FF2A85" />
                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.75rem', fontWeight: 800, color: '#ffffff' }}>
                  覚醒 AWAKEN FOCUS
                </span>
              </div>
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: timerRunning ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 42, 133, 0.15)',
                  color: timerRunning ? '#00F0FF' : '#FF2A85',
                  border: timerRunning ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid rgba(255, 42, 133, 0.3)',
                  textTransform: 'uppercase',
                }}
              >
                {timerRunning ? 'ACTIVE AURA' : 'STANDBY'}
              </span>
            </div>

            {/* Circular Countdown Ring */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0.5rem 0' }}>
              <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: '140px', height: '140px', transform: 'rotate(-90deg)' }}>
                  <circle stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="transparent" r="58" cx="70" cy="70" />
                  <circle
                    stroke="url(#auraGrad)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    fill="transparent"
                    r="58"
                    cx="70"
                    cy="70"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringCircumference * (1 - ringProgress)}
                    style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                  />
                  <defs>
                    <linearGradient id="auraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FF2A85" />
                      <stop offset="50%" stopColor="#8A2BE2" />
                      <stop offset="100%" stopColor="#00F0FF" />
                    </linearGradient>
                  </defs>
                </svg>

                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: '1.45rem', color: '#ffffff' }}>
                    {timeFormatted}
                  </span>
                  <span style={{ fontSize: '8px', fontFamily: 'monospace', color: '#00F0FF', letterSpacing: '0.1em' }}>
                    DOMAIN EXPANSION
                  </span>
                </div>
              </div>
            </div>

            {/* Target Task Lock-in */}
            <div
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '12px',
                background: 'rgba(12, 16, 31, 0.9)',
                border: '1px solid rgba(0, 240, 255, 0.25)',
                marginBottom: '1rem',
              }}
            >
              <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Crosshair size={11} color="#FF2A85" />
                <span>CURRENT HUNTER TARGET</span>
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffffff', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {targetQuest ? `${targetQuest.rank}-Rank: ${targetQuest.title}` : 'None Locked In'}
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <button
                type="button"
                onClick={toggleAwakenTimer}
                className="persona-btn"
                style={{
                  padding: '0.65rem',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {timerRunning ? <Pause size={12} /> : <Play size={12} />}
                <span>{timerRunning ? 'PAUSE' : 'AWAKEN'}</span>
              </button>

              <button
                type="button"
                onClick={resetAwakenTimer}
                style={{
                  padding: '0.65rem',
                  borderRadius: '10px',
                  background: 'rgba(12, 16, 31, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                RESET
              </button>
            </div>

            {/* Presets */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', fontFamily: 'monospace', fontSize: '10px' }}>
              <button
                type="button"
                onClick={() => setAwakenPreset(25)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: initialTimerSeconds === 25 * 60 ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255,255,255,0.05)',
                  color: initialTimerSeconds === 25 * 60 ? '#00F0FF' : '#94a3b8',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  cursor: 'pointer',
                }}
              >
                25M
              </button>
              <button
                type="button"
                onClick={() => setAwakenPreset(50)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: initialTimerSeconds === 50 * 60 ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255,255,255,0.05)',
                  color: initialTimerSeconds === 50 * 60 ? '#00F0FF' : '#94a3b8',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                }}
              >
                50M
              </button>
              <button
                type="button"
                onClick={() => setAwakenPreset(5)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: initialTimerSeconds === 5 * 60 ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255,255,255,0.05)',
                  color: initialTimerSeconds === 5 * 60 ? '#00F0FF' : '#94a3b8',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                }}
              >
                5M REST
              </button>
            </div>
          </div>

          {/* Elemental Guild Tags */}
          <div className="anime-glass" style={{ borderRadius: '20px', padding: '1rem' }}>
            <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
              <span>ELEMENTAL GUILD TAGS</span>
              <span style={{ color: '#00F0FF' }}>属性</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', fontFamily: 'monospace' }}>
              <button
                type="button"
                onClick={() => {
                  playAnimeSound('click');
                  setFilterElem('all');
                }}
                style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  background: filterElem === 'all' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(12, 16, 31, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <span>All Elements</span>
                <span style={{ color: '#94a3b8' }}>{quests.length}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playAnimeSound('click');
                  setFilterElem('Void');
                }}
                style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  background: filterElem === 'Void' ? 'rgba(138, 43, 226, 0.25)' : 'rgba(12, 16, 31, 0.6)',
                  border: '1px solid rgba(138, 43, 226, 0.35)',
                  color: '#a855f7',
                  display: 'flex',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <span>Void 虚無</span>
                <span style={{ color: '#94a3b8' }}>{quests.filter((q) => q.element === 'Void').length}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playAnimeSound('click');
                  setFilterElem('Tech');
                }}
                style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  background: filterElem === 'Tech' ? 'rgba(0, 240, 255, 0.25)' : 'rgba(12, 16, 31, 0.6)',
                  border: '1px solid rgba(0, 240, 255, 0.35)',
                  color: '#00F0FF',
                  display: 'flex',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <span>Tech 機電</span>
                <span style={{ color: '#94a3b8' }}>{quests.filter((q) => q.element === 'Tech').length}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playAnimeSound('click');
                  setFilterElem('Fire');
                }}
                style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  background: filterElem === 'Fire' ? 'rgba(255, 42, 133, 0.25)' : 'rgba(12, 16, 31, 0.6)',
                  border: '1px solid rgba(255, 42, 133, 0.35)',
                  color: '#FF2A85',
                  display: 'flex',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <span>Flame 劫火</span>
                <span style={{ color: '#94a3b8' }}>{quests.filter((q) => q.element === 'Fire').length}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ── RIGHT MAIN STAGE ──────────────────────────────────────────────── */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Command Capture Bar */}
          <div className="anime-glass" style={{ borderRadius: '20px', padding: '1.25rem' }}>
            <form onSubmit={handleQuickSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <Sparkles
                  size={15}
                  color="#00F0FF"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="Post a new directive: e.g. Defeat Database latency beast #Tech !S @60m..."
                  style={{
                    width: '100%',
                    background: 'rgba(7, 10, 18, 0.85)',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '12px',
                    padding: '0.65rem 1rem 0.65rem 2.4rem',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <select
                  value={quickRank}
                  onChange={(e) => setQuickRank(e.target.value as any)}
                  style={{
                    background: '#070A12',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '12px',
                    padding: '0.55rem 0.85rem',
                    color: '#FFD700',
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="S">S-RANK (Boss)</option>
                  <option value="A">A-RANK (Elite)</option>
                  <option value="B">B-RANK (Major)</option>
                  <option value="C">C-RANK (Minor)</option>
                </select>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Calendar
                    size={13}
                    color="#00F0FF"
                    style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }}
                  />
                  <input
                    type="date"
                    value={quickDate}
                    onChange={(e) => setQuickDate(e.target.value)}
                    title="Target Operation Date (Synced with Home)"
                    style={{
                      background: '#070A12',
                      border: '1px solid rgba(0, 240, 255, 0.35)',
                      borderRadius: '12px',
                      padding: '0.52rem 0.75rem 0.52rem 2rem',
                      color: '#00F0FF',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      outline: 'none',
                      cursor: 'pointer',
                      colorScheme: 'dark',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="persona-btn"
                  style={{
                    padding: '0.55rem 1.25rem',
                    color: '#ffffff',
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  ISSUE
                </button>
              </div>
            </form>

            {/* Filters Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '0.85rem',
                marginTop: '0.85rem',
              }}
            >
              {/* Rank Filter Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(7, 10, 18, 0.6)',
                  borderRadius: '10px',
                  padding: '3px',
                }}
              >
                {(['ALL', 'S', 'A', 'B', 'C'] as const).map((r) => {
                  const active = filterRank === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        playAnimeSound('click');
                        setFilterRank(r);
                      }}
                      style={{
                        border: active ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid transparent',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '10px',
                        fontFamily: 'Orbitron, sans-serif',
                        fontWeight: 700,
                        background: active ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                        color: active ? '#00F0FF' : '#94a3b8',
                        cursor: 'pointer',
                      }}
                    >
                      {r === 'ALL' ? 'ALL' : `${r}-RANK`}
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', width: '220px' }}>
                <Search
                  size={12}
                  color="#64748b"
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search quest log..."
                  style={{
                    width: '100%',
                    background: 'rgba(7, 10, 18, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '0.4rem 0.65rem 0.4rem 1.8rem',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── VIEW 1: QUEST LOG BOARD ───────────────────────────────────────── */}
          {currentView === 'board' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredQuests.length === 0 ? (
                <div className="anime-glass" style={{ borderRadius: '20px', padding: '3rem', textAlign: 'center' }}>
                  <Scroll size={36} color="rgba(0, 240, 255, 0.5)" style={{ margin: '0 auto 0.75rem' }} />
                  <h3 style={{ margin: '0 0 0.5rem', fontFamily: 'Orbitron, sans-serif', fontSize: '0.95rem', color: '#ffffff' }}>
                    NO QUEST DIRECTIVES IN RANGE
                  </h3>
                  <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                    Post a new bounty using the quick bar above or click below to launch your next mission.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      playAnimeSound('click');
                      setIsDetailedModalOpen(true);
                    }}
                    className="persona-btn"
                    style={{
                      padding: '0.65rem 1.4rem',
                      color: '#ffffff',
                      fontFamily: 'Orbitron, sans-serif',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={16} /> + NEW MISSION
                  </button>
                </div>
              ) : (
                filteredQuests.map((q) => {
                  const rConf = getRankConfig(q.rank);
                  const eConf = getElementConfig(q.element);
                  const isTarget = q.id === targetQuestId;
                  const completedSubs = q.subtasks.filter((s) => s.done).length;

                  return (
                    <div
                      key={q.id}
                      id={`quest-card-${q.id}`}
                      className={`quest-card ${rConf.tag}`}
                      style={{
                        borderRadius: '14px',
                        padding: '1.15rem 1.25rem',
                        opacity: q.cleared ? 0.6 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                        {/* Checkbox & Content */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                          <button
                            type="button"
                            onClick={() => handleToggleClear(q)}
                            style={{
                              marginTop: '2px',
                              width: '24px',
                              height: '24px',
                              borderRadius: '8px',
                              border: q.cleared ? 'none' : '1px solid rgba(255, 255, 255, 0.25)',
                              background: q.cleared ? '#00FFA3' : '#070A12',
                              color: q.cleared ? '#070A12' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Check size={14} strokeWidth={3} />
                          </button>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <span className={`anime-badge ${rConf.badge}`} style={{ fontSize: '10px', fontFamily: 'Orbitron, sans-serif', fontWeight: 800, padding: '2px 8px' }}>
                                {rConf.label}
                              </span>
                              <span style={{ fontSize: '10px', fontFamily: 'monospace', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '4px' }} className={eConf.color}>
                                {eConf.icon} {q.element}
                              </span>
                              <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#FFD700', background: 'rgba(255, 215, 0, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255, 215, 0, 0.2)' }}>
                                +{q.expReward} EXP • {q.goldReward}G
                              </span>
                              {q.targetDate && (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontFamily: 'monospace',
                                    color: q.targetDate === today() ? '#00FFA3' : '#38bdf8',
                                    background: q.targetDate === today() ? 'rgba(0, 255, 163, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    border: `1px solid ${q.targetDate === today() ? 'rgba(0, 255, 163, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Calendar size={10} />
                                  {q.targetDate === today() ? 'TODAY' : q.targetDate}
                                </span>
                              )}
                              {isTarget && (
                                <span style={{ fontSize: '10px', fontFamily: 'Orbitron, sans-serif', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 42, 133, 0.2)', color: '#FF2A85', border: '1px solid rgba(255, 42, 133, 0.4)' }}>
                                  AWAKEN TARGET
                                </span>
                              )}
                            </div>

                            <h4
                              style={{
                                margin: '0 0 4px',
                                fontFamily: 'Orbitron, sans-serif',
                                fontSize: '0.92rem',
                                fontWeight: 700,
                                color: q.cleared ? '#64748b' : '#ffffff',
                                textDecoration: q.cleared ? 'line-through' : 'none',
                                lineHeight: 1.3,
                              }}
                            >
                              {q.title}
                            </h4>

                            {q.notes && (
                              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                                {q.notes}
                              </p>
                            )}

                            {/* Subtasks */}
                            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', marginTop: '8px', paddingTop: '8px' }}>
                              {q.subtasks.length > 0 && (
                                <>
                                  <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', marginBottom: '4px' }}>
                                    Checkpoints: {completedSubs} / {q.subtasks.length}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '6px' }}>
                                    {q.subtasks.map((st) => (
                                      <div
                                        key={st.id}
                                        onClick={() => handleSubtaskToggle(q.id, st.id, st.done)}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          fontSize: '0.75rem',
                                          color: st.done ? '#64748b' : '#cbd5e1',
                                          textDecoration: st.done ? 'line-through' : 'none',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        <span
                                          style={{
                                            width: '14px',
                                            height: '14px',
                                            borderRadius: '4px',
                                            border: st.done ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
                                            background: st.done ? '#00F0FF' : 'transparent',
                                            color: '#000000',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '8px',
                                            fontWeight: 800,
                                          }}
                                        >
                                          {st.done ? '✓' : ''}
                                        </span>
                                        <span>{st.title}</span>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}

                              {addingSubtaskQuestId === q.id ? (
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    if (q.realTaskId) handleAddSubtask(q.realTaskId);
                                  }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}
                                >
                                  <input
                                    type="text"
                                    autoFocus
                                    value={newSubtaskText}
                                    onChange={(e) => setNewSubtaskText(e.target.value)}
                                    placeholder="Add checkpoint title..."
                                    style={{
                                      background: 'rgba(7, 10, 18, 0.9)',
                                      border: '1px solid rgba(0, 240, 255, 0.4)',
                                      borderRadius: '6px',
                                      padding: '3px 8px',
                                      fontSize: '0.72rem',
                                      color: '#fff',
                                      outline: 'none',
                                      flex: 1,
                                    }}
                                  />
                                  <button
                                    type="submit"
                                    style={{
                                      background: '#00F0FF',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '3px 8px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      color: '#000',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Add
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddingSubtaskQuestId(null);
                                      setNewSubtaskText('');
                                    }}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: '#94a3b8',
                                      fontSize: '0.72rem',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    ✕
                                  </button>
                                </form>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddingSubtaskQuestId(q.id);
                                    setNewSubtaskText('');
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    color: '#00F0FF',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    opacity: 0.85,
                                  }}
                                >
                                  + Add Checkpoint
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => {
                              playAnimeSound('click');
                              setTargetQuestId(q.id);
                            }}
                            title="Lock as Awaken Focus"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: isTarget ? '1px solid #00F0FF' : '1px solid rgba(255, 255, 255, 0.1)',
                              background: isTarget ? '#00F0FF' : '#0C101F',
                              color: isTarget ? '#000000' : '#94a3b8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <Crosshair size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(q)}
                            title="Edit Directive"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: '1px solid rgba(0, 240, 255, 0.3)',
                              background: '#0C101F',
                              color: '#00F0FF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <Edit3 size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteQuest(q)}
                            title="Dismiss Mission"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              background: '#0C101F',
                              color: '#94a3b8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── VIEW 2: BOUNTY BOARD (KANBAN) ─────────────────────────────────── */}
          {currentView === 'bounty' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', minHeight: '480px' }} className="cal-layout-grid">
              {[
                { key: 'notice', label: '手配 NOTICE BOARD', desc: 'Awaiting Hunter engagement', borderTop: '3px solid #00F0FF' },
                { key: 'combat', label: '交戦 IN COMBAT', desc: 'Active execution in field', borderTop: '3px solid #FF2A85' },
                { key: 'victory', label: '討伐完了 VICTORY', desc: 'Bounty claimed & verified', borderTop: '3px solid #00FFA3' },
              ].map((st) => {
                const stageTasks = filteredQuests.filter((q) => q.stage === st.key);
                return (
                  <div
                    key={st.key}
                    className="anime-glass"
                    style={{
                      borderRadius: '20px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      borderTop: st.borderTop,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ margin: 0, fontFamily: 'Orbitron, sans-serif', fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
                          {st.label}
                        </h4>
                        <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>{st.desc}</span>
                      </div>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', color: '#00F0FF' }}>
                        {stageTasks.length}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                      {stageTasks.map((q) => {
                        const rConf = getRankConfig(q.rank);
                        return (
                          <div
                            key={q.id}
                            className={`quest-card ${rConf.tag}`}
                            onClick={() => handleToggleClear(q)}
                            style={{
                              borderRadius: '12px',
                              padding: '0.85rem',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span className={`anime-badge ${rConf.badge}`} style={{ fontSize: '9px', fontFamily: 'Orbitron, sans-serif', fontWeight: 800, padding: '2px 6px' }}>
                                {q.rank}-RANK
                              </span>
                              <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#FFD700' }}>
                                +{q.expReward} EXP
                              </span>
                            </div>
                            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', textDecoration: q.cleared ? 'line-through' : 'none' }}>
                              {q.title}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px' }}>
                              <span>{q.duration} min</span>
                              <span style={{ color: '#00F0FF' }}>{st.key.toUpperCase()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── VIEW 3: RAID MATRIX (EISENHOWER TACTICAL ZONES) ───────────────── */}
          {currentView === 'matrix' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }} className="cal-layout-grid">
              {[
                { title: 'BOSS RAID 討伐 (Urgent & Major)', rank: 'S', desc: 'Critical path blockers requiring ultimate skills', badge: 'bg-pink-500/20 text-pink-400 border-pink-500/40', items: filteredQuests.filter((q) => q.rank === 'S' && !q.cleared) },
                { title: 'TRAINING ARC 修業 (Important, Planned)', rank: 'A', desc: 'Core architecture and long-term mastery', badge: 'bg-amber-400/20 text-amber-300 border-amber-400/40', items: filteredQuests.filter((q) => q.rank === 'A' && !q.cleared) },
                { title: 'SKIRMISH 掃討 (Tactical, Fast)', rank: 'B', desc: 'Immediate quick tasks and minor bugs', badge: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40', items: filteredQuests.filter((q) => q.rank === 'B' && !q.cleared) },
                { title: 'TAVERN REST 酒場 (Low Impact)', rank: 'C', desc: 'Routine housekeeping and leisure reading', badge: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40', items: filteredQuests.filter((q) => q.rank === 'C' && !q.cleared) },
              ].map((z) => (
                <div key={z.title} className="anime-glass" style={{ borderRadius: '20px', padding: '1.25rem', minHeight: '220px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.65rem', marginBottom: '0.85rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontFamily: 'Orbitron, sans-serif', fontSize: '0.82rem', fontWeight: 800, color: '#ffffff' }}>
                        {z.title}
                      </h4>
                      <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>{z.desc}</span>
                    </div>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }} className={z.badge}>
                      {z.items.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {z.items.length === 0 ? (
                      <p style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', textAlign: 'center', padding: '1.5rem 0' }}>
                        Zone Secured
                      </p>
                    ) : (
                      z.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleClear(item)}
                          style={{
                            padding: '0.65rem 0.85rem',
                            borderRadius: '10px',
                            background: 'rgba(12, 16, 31, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{ fontSize: '0.8rem', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.title}
                          </span>
                          <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#FFD700', flexShrink: 0 }}>
                            +{item.expReward} EXP
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── VIEW 4: HOLOGRAPHIC HUNTER LICENCE ────────────────────────────── */}
          {currentView === 'hunterCard' && (
            <div
              className="anime-glass"
              style={{
                maxWidth: '680px',
                margin: '0 auto',
                borderRadius: '24px',
                padding: '2rem',
                border: '2px solid rgba(0, 240, 255, 0.45)',
                boxShadow: '0 0 50px rgba(0, 240, 255, 0.2)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  right: '-60px',
                  bottom: '-60px',
                  width: '240px',
                  height: '240px',
                  borderRadius: '50%',
                  background: 'rgba(255, 42, 133, 0.15)',
                  filter: 'blur(50px)',
                  pointerEvents: 'none',
                }}
              />

              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 240, 255, 0.3)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.12em', color: '#00F0FF', textTransform: 'uppercase' }}>
                    INTERNATIONAL HUNTER GUILD FEDERATION
                  </div>
                  <h2 style={{ margin: '4px 0 0', fontFamily: 'Orbitron, sans-serif', fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.04em' }}>
                    RANK S HUNTER LICENCE
                  </h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.6rem', fontWeight: 900, color: '#FFD700' }}>
                    S-RANK
                  </div>
                  <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#94a3b8' }}>
                    CLASS: AWAKENED
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1.5rem', alignItems: 'center' }}>
                <div
                  style={{
                    width: '140px',
                    height: '140px',
                    borderRadius: '16px',
                    background: '#0C101F',
                    border: '2px solid rgba(0, 240, 255, 0.4)',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <User size={56} color="#00F0FF" />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      background: '#FF2A85',
                      color: '#ffffff',
                      fontFamily: 'monospace',
                      fontSize: '9px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 800,
                    }}
                  >
                    VERIFIED
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'monospace', fontSize: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                    <span style={{ color: '#94a3b8' }}>Hunter Alias:</span>
                    <span style={{ color: '#ffffff', fontWeight: 800 }}>{hunter.name}</span>
                    <span style={{ color: '#94a3b8' }}>Level Rank:</span>
                    <span style={{ color: '#00FFA3', fontWeight: 800 }}>LVL {hunter.level}</span>
                    <span style={{ color: '#94a3b8' }}>Affinity:</span>
                    <span style={{ color: '#a855f7', fontWeight: 800 }}>Void / Sovereign</span>
                    <span style={{ color: '#94a3b8' }}>Gold Treasury:</span>
                    <span style={{ color: '#FFD700', fontWeight: 800 }}>{hunter.gold.toLocaleString()}G</span>
                  </div>

                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: 1.5, fontFamily: 'Rajdhani, sans-serif' }}>
                    Authorized for planetary raids, complex system deployments, and sovereign deep-work campaigns.
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '1.5rem' }}>
                <span>REGISTRATION CODE: #QZ-99042-S</span>
                <span style={{ color: '#00F0FF' }}>GUILD DIRECTIVE OS 4.0</span>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── MODAL: ISSUE GUILD CONTRACT ──────────────────────────────────────── */}
      {isDetailedModalOpen && (
        <div
          onClick={() => setIsDetailedModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="anime-glass"
            style={{
              maxWidth: '520px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '20px',
              padding: '1.5rem',
              border: '1px solid rgba(0, 240, 255, 0.4)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scroll size={16} color="#FFD700" />
                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>
                  ISSUE GUILD CONTRACT 討伐依頼
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailedModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleDetailedSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}>
                  Quest Title / Target Entity
                </label>
                <input
                  type="text"
                  required
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  placeholder="Ex: Slay the Memory Leak Leviathan"
                  style={{
                    width: '100%',
                    background: '#070A12',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#00F0FF', marginBottom: '4px' }}>
                  <Calendar size={12} color="#00F0FF" />
                  Target Date / Operation Date (Linked to Home)
                </label>
                <input
                  type="date"
                  required
                  value={mDate}
                  onChange={(e) => setMDate(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#070A12',
                    border: '1px solid rgba(0, 240, 255, 0.4)',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    color: '#00F0FF',
                    fontFamily: 'monospace',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box',
                    colorScheme: 'dark',
                    cursor: 'pointer',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}>
                    Rank Tier
                  </label>
                  <select
                    value={mRank}
                    onChange={(e) => setMRank(e.target.value as any)}
                    style={{
                      width: '100%',
                      background: '#070A12',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '0.55rem',
                      color: '#ffffff',
                      outline: 'none',
                    }}
                  >
                    <option value="S">S-Rank (Boss)</option>
                    <option value="A">A-Rank (Elite)</option>
                    <option value="B">B-Rank (Major)</option>
                    <option value="C">C-Rank (Minor)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}>
                    Element
                  </label>
                  <select
                    value={mElem}
                    onChange={(e) => setMElem(e.target.value as any)}
                    style={{
                      width: '100%',
                      background: '#070A12',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '0.55rem',
                      color: '#ffffff',
                      outline: 'none',
                    }}
                  >
                    <option value="Void">Void (虚無)</option>
                    <option value="Tech">Tech (機電)</option>
                    <option value="Fire">Flame (劫火)</option>
                    <option value="Shadow">Shadow (影法)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}>
                    Est. Time
                  </label>
                  <select
                    value={mDur}
                    onChange={(e) => setMDur(parseInt(e.target.value, 10))}
                    style={{
                      width: '100%',
                      background: '#070A12',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '0.55rem',
                      color: '#ffffff',
                      outline: 'none',
                    }}
                  >
                    <option value="15">15 min</option>
                    <option value="25">25 min</option>
                    <option value="50">50 min</option>
                    <option value="90">90 min</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}>
                  Briefing / Tactical Notes
                </label>
                <textarea
                  rows={3}
                  value={mNotes}
                  onChange={(e) => setMNotes(e.target.value)}
                  placeholder="Acceptance criteria, code links, or boss weak points..."
                  style={{
                    width: '100%',
                    background: '#070A12',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.85rem' }}>
                <button
                  type="button"
                  onClick={() => setIsDetailedModalOpen(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  DISMISS
                </button>
                <button
                  type="submit"
                  className="persona-btn"
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  DEPLOY MISSION
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT GUILD CONTRACT ────────────────────────────────────────── */}
      {editingQuest && (
        <div
          onClick={() => setEditingQuest(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(8px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="anime-glass"
            style={{
              maxWidth: '520px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '20px',
              padding: '1.5rem',
              border: '1px solid rgba(0, 240, 255, 0.5)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 240, 255, 0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={16} color="#00F0FF" />
                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>
                  RECONFIGURE DIRECTIVE 任務変更
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingQuest(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}>
                  Quest Title / Target Entity
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#070A12',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#00F0FF', marginBottom: '4px' }}>
                  <Calendar size={12} color="#00F0FF" />
                  Target Date / Operation Date (Linked to Home)
                </label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#070A12',
                    border: '1px solid rgba(0, 240, 255, 0.4)',
                    borderRadius: '10px',
                    padding: '0.6rem 0.85rem',
                    color: '#00F0FF',
                    fontFamily: 'monospace',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    outline: 'none',
                    boxSizing: 'border-box',
                    colorScheme: 'dark',
                    cursor: 'pointer',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}>
                    Rank Tier
                  </label>
                  <select
                    value={editRank}
                    onChange={(e) => setEditRank(e.target.value as any)}
                    style={{
                      width: '100%',
                      background: '#070A12',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '0.55rem',
                      color: '#ffffff',
                      outline: 'none',
                    }}
                  >
                    <option value="S">S-Rank (Boss)</option>
                    <option value="A">A-Rank (Elite)</option>
                    <option value="B">B-Rank (Major)</option>
                    <option value="C">C-Rank (Minor)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}>
                    Element
                  </label>
                  <select
                    value={editElem}
                    onChange={(e) => setEditElem(e.target.value as any)}
                    style={{
                      width: '100%',
                      background: '#070A12',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '0.55rem',
                      color: '#ffffff',
                      outline: 'none',
                    }}
                  >
                    <option value="Void">Void (虚無)</option>
                    <option value="Tech">Tech (機電)</option>
                    <option value="Fire">Flame (劫火)</option>
                    <option value="Shadow">Shadow (影法)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}>
                    Est. Time
                  </label>
                  <select
                    value={editDur}
                    onChange={(e) => setEditDur(parseInt(e.target.value, 10))}
                    style={{
                      width: '100%',
                      background: '#070A12',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '0.55rem',
                      color: '#ffffff',
                      outline: 'none',
                    }}
                  >
                    <option value="15">15 min</option>
                    <option value="25">25 min</option>
                    <option value="50">50 min</option>
                    <option value="90">90 min</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}>
                  Briefing / Tactical Notes
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Acceptance criteria, code links, or boss weak points..."
                  style={{
                    width: '100%',
                    background: '#070A12',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.85rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingQuest(null)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="persona-btn"
                  style={{
                    padding: '0.55rem 1.35rem',
                    color: '#ffffff',
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  SAVE CHANGES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RECYCLE BIN MODAL ────────────────────────────────────────────────── */}
      <TaskRecycleBinModal
        isOpen={isRecycleBinOpen}
        onClose={() => setIsRecycleBinOpen(false)}
        deletedTasks={deletedTasks}
        onRestore={restoreTask}
        onPermanentDelete={permanentDeleteTask}
        onEmptyRecycleBin={emptyRecycleBin}
      />
    </div>
  );
}
