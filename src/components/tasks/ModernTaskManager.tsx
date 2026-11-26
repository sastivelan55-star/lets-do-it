// Life OS — Modern Task Management System (Google Tasks-Inspired + Life OS Productivity Engine)
// Full task management: Views (All, My Day, Upcoming, Daily Routines, Starred, Completed, Lists),
// Floating Set Time, Individual Daily button, Subtasks, Priority, Search, Sort & Detail Slide-Over.

import React, { useState, useMemo, useEffect } from 'react';
import {
  ListTodo,
  Calendar,
  Clock,
  Star,
  CheckCircle2,
  Circle,
  Plus,
  Search,
  Trash2,
  Repeat,
  Sparkles,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import type { Task, LifeArea, TaskPriority, CustomTaskList } from '../../types';
import { today, formatDate, formatTime } from '../../utils/dates';
import FloatingTimePicker, { type TimePickerResult } from '../common/FloatingTimePicker';
import DailyRecurrenceToggle from '../common/DailyRecurrenceToggle';
import {
  fetchUserCustomLists,
  saveUserCustomList,
  deleteUserCustomList,
  DEFAULT_CUSTOM_LISTS,
} from '../../services/taskService';

export type TaskViewId =
  | 'all'
  | 'my-day'
  | 'upcoming'
  | 'routines'
  | 'starred'
  | 'completed'
  | `list-${string}`;

const AREA_COLOR: Record<string, string> = {
  technical: '#6366f1',
  communication: '#06b6d4',
  career: '#f59e0b',
  creativity: '#ec4899',
  health: '#10b981',
};

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#64748b',
};

interface ModernTaskManagerProps {
  onOpenTaskBuilderView?: () => void;
  onNavigateSection?: (section: string) => void;
}

export default function ModernTaskManager({
  onOpenTaskBuilderView,
  onNavigateSection: _onNavigateSection,
}: ModernTaskManagerProps) {
  const { tasks, addTask, updateTask, completeTask, removeTask, settings } = useApp();
  const { user } = useAuth();
  const isLight = settings.theme === 'light' || settings.appearance?.theme === 'light';
  const panelBg = isLight ? 'var(--bg-surface)' : 'rgba(18, 12, 38, 0.75)';
  const panelBorder = isLight ? '1px solid var(--border)' : '1px solid rgba(192, 132, 252, 0.22)';
  const textMain = isLight ? '#0f172a' : '#f8fafc';
  const textSub = isLight ? '#475569' : '#94a3b8';
  const optionBg = isLight ? '#ffffff' : '#1e1438';

  // Navigation Views
  const [activeView, setActiveView] = useState<TaskViewId>('all');
  const [customLists, setCustomLists] = useState<CustomTaskList[]>(DEFAULT_CUSTOM_LISTS);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | TaskPriority>('all');
  const [filterArea] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'manual' | 'priority' | 'date' | 'title'>('manual');

  // Quick Inline Add Task State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDate, setQuickDate] = useState(today());
  const [quickPriority] = useState<TaskPriority>('medium');
  const [quickArea] = useState<LifeArea>('technical');

  // Floating Set Time State
  const [floatingTimeTask, setFloatingTimeTask] = useState<Task | null>(null);
  const [floatingAnchorRect, setFloatingAnchorRect] = useState<DOMRect | null>(null);

  // Detailed Task Panel / Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // New List Modal State
  const [isNewListOpen, setIsNewListOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState('#8b5cf6');
  const [compactWorkspace, setCompactWorkspace] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1099px)').matches : true,
  );

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1099px)');
    const apply = () => setCompactWorkspace(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  // Load custom task lists
  useEffect(() => {
    fetchUserCustomLists(user?.id).then((lists) => {
      if (lists && lists.length > 0) {
        setCustomLists(lists);
      }
    });
  }, [user?.id]);

  // Keep selectedTask fresh when tasks update in AppContext
  useEffect(() => {
    if (selectedTask) {
      const fresh = tasks.find((t) => t.id === selectedTask.id);
      if (fresh) setSelectedTask(fresh);
    }
  }, [tasks]);

  // ── VIEW FILTERING ──────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    const todayStr = today();

    return tasks.filter((t) => {
      if (t.isDeleted) return false;

      // View filtering
      if (activeView === 'my-day') {
        const isTodayDate = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10) === todayStr;
        const isDailyRecurring = t.recurring === 'daily' || t.recurring === 'weekdays';
        if (!isTodayDate && !isDailyRecurring) return false;
      } else if (activeView === 'upcoming') {
        const taskDate = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
        if (!taskDate || taskDate <= todayStr || t.recurring === 'daily') return false;
      } else if (activeView === 'routines') {
        if (!t.recurring || t.recurring === 'none') return false;
      } else if (activeView === 'starred') {
        if (!t.isStarred) return false;
      } else if (activeView === 'completed') {
        if (t.status !== 'completed') return false;
      } else if (activeView.startsWith('list-')) {
        const listId = activeView;
        if (t.listId !== listId) return false;
      }

      // Hide completed tasks in non-completed views unless user searched
      if (activeView !== 'completed' && t.status === 'completed' && !searchQuery) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q) || false;
        const matchNotes = t.notes?.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchDesc && !matchNotes) return false;
      }

      // Priority Filter
      if (filterPriority !== 'all' && t.priority !== filterPriority) {
        return false;
      }

      // Area Filter
      if (filterArea !== 'all' && t.lifeArea !== filterArea) {
        return false;
      }

      return true;
    });
  }, [tasks, activeView, searchQuery, filterPriority, filterArea]);

  // ── SORTING ─────────────────────────────────────────────────────────────────
  const sortedTasks = useMemo(() => {
    const list = [...filteredTasks];

    if (sortBy === 'priority') {
      const pRank: Record<TaskPriority, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      list.sort((a, b) => pRank[b.priority] - pRank[a.priority]);
    } else if (sortBy === 'date') {
      list.sort((a, b) => {
        const da = a.scheduledDate || a.targetDate || a.dueDate || '9999';
        const db = b.scheduledDate || b.targetDate || b.dueDate || '9999';
        return da.localeCompare(db);
      });
    } else if (sortBy === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Manual / creation index
      list.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    }

    return list;
  }, [filteredTasks, sortBy]);

  // Counts for sidebar badges
  const counts = useMemo(() => {
    const todayStr = today();
    const active = tasks.filter((t) => !t.isDeleted && t.status !== 'completed');

    return {
      all: active.length,
      myDay: active.filter(
        (t) =>
          (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10) === todayStr ||
          t.recurring === 'daily' ||
          t.recurring === 'weekdays'
      ).length,
      upcoming: active.filter((t) => {
        const d = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10);
        return d > todayStr && (!t.recurring || t.recurring === 'none');
      }).length,
      routines: active.filter((t) => t.recurring && t.recurring !== 'none').length,
      starred: active.filter((t) => t.isStarred).length,
      completed: tasks.filter((t) => !t.isDeleted && t.status === 'completed').length,
    };
  }, [tasks]);

  // ── QUICK ADD TASK ──────────────────────────────────────────────────────────
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    let targetListId: string | undefined = undefined;
    if (activeView.startsWith('list-')) {
      targetListId = activeView;
    }

    await addTask({
      title: quickTitle.trim(),
      lifeArea: quickArea,
      priority: quickPriority,
      status: 'not-started',
      dueDate: quickDate,
      targetDate: quickDate,
      scheduledDate: quickDate,
      recurring: activeView === 'routines' ? 'daily' : 'none',
      isRoutine: activeView === 'routines' ? true : undefined,
      isRoutineActive: activeView === 'routines' ? true : undefined,
      isStarred: activeView === 'starred',
      listId: targetListId,
    });

    setQuickTitle('');
  };

  // ── TOGGLE STARRED ──────────────────────────────────────────────────────────
  const handleToggleStar = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateTask({
      ...task,
      isStarred: !task.isStarred,
      updatedAt: new Date().toISOString(),
    });
  };

  // ── FLOATING SET TIME TRIGGER ───────────────────────────────────────────────
  const handleOpenFloatingTime = (task: Task, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setFloatingAnchorRect(rect);
    setFloatingTimeTask(task);
  };

  const handleSaveFloatingTime = async (result: TimePickerResult) => {
    if (!floatingTimeTask) return;

    if (result.clearSchedule) {
      await updateTask({
        ...floatingTimeTask,
        startTime: undefined,
        plannedStartTime: undefined,
        endTime: undefined,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    const assignedDate = result.targetDate || floatingTimeTask.scheduledDate || floatingTimeTask.targetDate || floatingTimeTask.dueDate || today();

    await updateTask({
      ...floatingTimeTask,
      startTime: result.startTime,
      plannedStartTime: result.startTime,
      endTime: result.endTime,
      targetDate: assignedDate,
      dueDate: assignedDate,
      scheduledDate: assignedDate,
      updatedAt: new Date().toISOString(),
    });
  };

  // ── SUBTASKS MANAGEMENT ─────────────────────────────────────────────────────
  const handleToggleInlineSubtask = async (task: Task, subtaskId: string) => {
    const subs = task.inlineSubtasks || [];
    const updatedSubs = subs.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );

    await updateTask({
      ...task,
      inlineSubtasks: updatedSubs,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddInlineSubtask = async (task: Task, title: string) => {
    if (!title.trim()) return;
    const subs = task.inlineSubtasks || [];
    const newSub = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      completed: false,
    };

    await updateTask({
      ...task,
      inlineSubtasks: [...subs, newSub],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteInlineSubtask = async (task: Task, subtaskId: string) => {
    const subs = task.inlineSubtasks || [];
    const filtered = subs.filter((s) => s.id !== subtaskId);

    await updateTask({
      ...task,
      inlineSubtasks: filtered,
      updatedAt: new Date().toISOString(),
    });
  };

  // ── CUSTOM LIST CREATION ────────────────────────────────────────────────────
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    const newList: CustomTaskList = {
      id: `list-${Date.now()}`,
      name: newListName.trim(),
      color: newListColor,
      orderIndex: customLists.length,
      createdAt: new Date().toISOString(),
    };

    const saved = await saveUserCustomList(newList, user?.id);
    setCustomLists((prev) => [...prev, saved]);
    setActiveView(saved.id as TaskViewId);
    setNewListName('');
    setIsNewListOpen(false);
  };

  const handleDeleteList = async (listId: string) => {
    if (confirm('Delete this list? Tasks in this list will remain available in All Tasks.')) {
      await deleteUserCustomList(listId, user?.id);
      setCustomLists((prev) => prev.filter((l) => l.id !== listId));
      if (activeView === listId) {
        setActiveView('all');
      }
    }
  };

  const primaryViews = useMemo(() => [
    { id: 'all' as TaskViewId, label: 'All Tasks', icon: <ListTodo size={15} />, count: counts.all, color: '#818cf8' },
    { id: 'my-day' as TaskViewId, label: 'My Day', icon: <Sparkles size={15} />, count: counts.myDay, color: '#38bdf8' },
    { id: 'upcoming' as TaskViewId, label: 'Upcoming', icon: <Calendar size={15} />, count: counts.upcoming, color: '#a855f7' },
    { id: 'routines' as TaskViewId, label: 'Daily Routines', icon: <Repeat size={15} />, count: counts.routines, color: '#ec4899' },
    { id: 'starred' as TaskViewId, label: 'Starred', icon: <Star size={15} />, count: counts.starred, color: '#facc15' },
    { id: 'completed' as TaskViewId, label: 'Completed', icon: <CheckCircle2 size={15} />, count: counts.completed, color: '#34d399' },
  ], [counts]);

  const activeViewLabel = useMemo(() => {
    const found = primaryViews.find((v) => v.id === activeView);
    if (found) return found.label;
    if (activeView.startsWith('list-')) {
      const list = customLists.find((l) => l.id === activeView);
      if (list) return list.name;
    }
    return 'Tasks';
  }, [activeView, primaryViews, customLists]);

  return (
    <div
      className="modern-task-manager"
      style={{
        display: 'grid',
        gridTemplateColumns: compactWorkspace ? 'minmax(0, 1fr)' : 'minmax(220px, 260px) minmax(0, 1fr)',
        gap: compactWorkspace ? '0.75rem' : '1.25rem',
        width: '100%',
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0.25rem 0.5rem calc(80px + env(safe-area-inset-bottom, 20px))',
        boxSizing: 'border-box',
      }}
    >
      {/* ─── SIDEBAR NAVIGATION (Desktop: Persistent Left Panel) ─────────── */}
      {!compactWorkspace && (
        <aside
          className="task-manager-sidebar"
          style={{
            background: panelBg,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '20px',
            border: panelBorder,
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            height: 'fit-content',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: textMain, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ListTodo size={18} color="#c084fc" /> Task Hub
            </span>
            {onOpenTaskBuilderView && (
              <button
                type="button"
                onClick={onOpenTaskBuilderView}
                style={{
                  background: 'rgba(236, 72, 153, 0.15)',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                  borderRadius: '6px',
                  padding: '2px 6px',
                  color: '#ec4899',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                title="Switch to RPG Quest Board"
              >
                RPG Mode
              </button>
            )}
          </div>

          {/* Primary Views */}
          <nav className="task-manager-views" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {primaryViews.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: isActive ? `1px solid ${item.color}55` : '1px solid transparent',
                    background: isActive ? `${item.color}1f` : 'transparent',
                    color: isActive ? textMain : textSub,
                    fontSize: '0.82rem',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: isActive ? item.color : '#94a3b8', display: 'flex' }}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.count > 0 && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: isActive ? item.color : 'rgba(255, 255, 255, 0.08)',
                        color: isActive ? '#ffffff' : '#94a3b8',
                        padding: '1px 6px',
                        borderRadius: '999px',
                      }}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Custom Lists Section */}
          <div className="task-manager-lists" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', padding: '0 4px' }}>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Lists
              </span>
              <button
                type="button"
                onClick={() => setIsNewListOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                }}
                title="Create new list"
              >
                <Plus size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {customLists.map((l) => {
                const isActive = activeView === l.id;
                const listCount = tasks.filter((t) => !t.isDeleted && t.status !== 'completed' && t.listId === l.id).length;

                return (
                  <div
                    key={l.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      background: isActive ? `${l.color}22` : 'transparent',
                      border: isActive ? `1px solid ${l.color}55` : '1px solid transparent',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveView(l.id as TaskViewId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isActive ? '#f8fafc' : '#cbd5e1',
                        fontSize: '0.8rem',
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flex: 1,
                        minWidth: 0,
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.name}
                      </span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {listCount > 0 && (
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.06)', padding: '0 5px', borderRadius: '4px' }}>
                          {listCount}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteList(l.id)}
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}
                        title="Delete list"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      )}

      {/* ─── MAIN CONTENT AREA ────────────────────────────────────────────── */}
      <main className="task-manager-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
        {/* Mobile / Tablet Compact View Selector Bar */}
        {compactWorkspace && (
          <div
            className="task-manager-mobile-selector"
            style={{
              background: panelBg,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: '16px',
              border: panelBorder,
              padding: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}
          >
            {/* Header row: Current View Title & Quick Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <ListTodo size={17} color="#c084fc" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    color: textMain,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {activeViewLabel}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    background: 'rgba(168, 85, 247, 0.2)',
                    color: '#c084fc',
                    padding: '1px 7px',
                    borderRadius: '999px',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    flexShrink: 0,
                  }}
                >
                  {sortedTasks.length}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setIsNewListOpen(true)}
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '8px',
                    padding: '3px 8px',
                    color: '#38bdf8',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Create new list"
                >
                  <Plus size={12} />
                  <span>List</span>
                </button>

                {onOpenTaskBuilderView && (
                  <button
                    type="button"
                    onClick={onOpenTaskBuilderView}
                    style={{
                      background: 'rgba(236, 72, 153, 0.15)',
                      border: '1px solid rgba(236, 72, 153, 0.3)',
                      borderRadius: '8px',
                      padding: '3px 8px',
                      color: '#ec4899',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title="Switch to RPG Quest Board"
                  >
                    RPG Mode
                  </button>
                )}
              </div>
            </div>

            {/* Horizontal Scrolling Filter Pills */}
            <div
              className="task-manager-views"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                paddingBottom: '2px',
              }}
            >
              {primaryViews.map((item) => {
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveView(item.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      borderRadius: '999px',
                      border: isActive ? `1px solid ${item.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                      background: isActive ? `${item.color}25` : 'rgba(255, 255, 255, 0.04)',
                      color: isActive ? '#ffffff' : '#94a3b8',
                      fontSize: '0.75rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ color: isActive ? item.color : '#94a3b8', display: 'flex' }}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {item.count > 0 && (
                      <span
                        style={{
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          background: isActive ? item.color : 'rgba(255, 255, 255, 0.1)',
                          color: '#ffffff',
                          padding: '0 5px',
                          borderRadius: '999px',
                          marginLeft: '2px',
                        }}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Custom Lists in the scrollable bar */}
              {customLists.map((l) => {
                const isActive = activeView === l.id;
                const listCount = tasks.filter((t) => !t.isDeleted && t.status !== 'completed' && t.listId === l.id).length;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setActiveView(l.id as TaskViewId)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      borderRadius: '999px',
                      border: isActive ? `1px solid ${l.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                      background: isActive ? `${l.color}25` : 'rgba(255, 255, 255, 0.04)',
                      color: isActive ? '#ffffff' : '#cbd5e1',
                      fontSize: '0.75rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: l.color }} />
                    <span>{l.name}</span>
                    {listCount > 0 && (
                      <span
                        style={{
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          background: isActive ? l.color : 'rgba(255, 255, 255, 0.1)',
                          color: '#ffffff',
                          padding: '0 5px',
                          borderRadius: '999px',
                          marginLeft: '2px',
                        }}
                      >
                        {listCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {/* Top Control Bar: Search, Filters, Sort */}
        <div
          className="task-manager-controls"
          style={{
            background: panelBg,
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            border: panelBorder,
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          {/* Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(192, 132, 252, 0.25)',
              borderRadius: '10px',
              padding: '6px 10px',
              flex: '1 1 200px',
            }}
          >
            <Search size={15} color="#c084fc" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: textMain,
                fontSize: '0.82rem',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          {/* Filters & Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(192, 132, 252, 0.25)',
                borderRadius: '8px',
                color: isLight ? '#334155' : '#cbd5e1',
                fontSize: '0.75rem',
                padding: '6px 8px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all" style={{ background: optionBg }}>Priority: All</option>
              <option value="critical" style={{ background: optionBg }}>Critical</option>
              <option value="high" style={{ background: optionBg }}>High</option>
              <option value="medium" style={{ background: optionBg }}>Medium</option>
              <option value="low" style={{ background: optionBg }}>Low</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(192, 132, 252, 0.25)',
                borderRadius: '8px',
                color: isLight ? '#334155' : '#cbd5e1',
                fontSize: '0.75rem',
                padding: '6px 8px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="manual" style={{ background: optionBg }}>Sort: Manual</option>
              <option value="priority" style={{ background: optionBg }}>Sort: Priority</option>
              <option value="date" style={{ background: optionBg }}>Sort: Due Date</option>
              <option value="title" style={{ background: optionBg }}>Sort: Title</option>
            </select>
          </div>
        </div>

        {/* Quick Add Task Input Box (Google Tasks-Style) */}
        <form
          className="task-manager-quick-add"
          onSubmit={handleQuickAdd}
          style={{
            background: isLight ? 'var(--bg-surface)' : 'rgba(18, 12, 38, 0.85)',
            border: '1px solid rgba(192, 132, 252, 0.35)',
            borderRadius: '16px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              flexShrink: 0,
            }}
          >
            <Plus size={16} />
          </div>

          <input
            type="text"
            placeholder="Add a new task (e.g., 'Study Java Collections', 'Complete CS assignment')..."
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: textMain,
              fontSize: '0.88rem',
              fontWeight: 600,
              outline: 'none',
              flex: 1,
              minWidth: 0,
            }}
          />

          <input
            type="date"
            value={quickDate}
            onChange={(e) => setQuickDate(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(192, 132, 252, 0.25)',
              borderRadius: '8px',
              color: '#c084fc',
              fontSize: '0.74rem',
              fontWeight: 600,
              padding: '4px 6px',
              outline: 'none',
              cursor: 'pointer',
            }}
            title="Set Due Date"
          />

          <button
            type="submit"
            disabled={!quickTitle.trim()}
            style={{
              background: quickTitle.trim() ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              color: quickTitle.trim() ? '#ffffff' : '#64748b',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: quickTitle.trim() ? 'pointer' : 'default',
              transition: 'all 0.15s',
            }}
          >
            Add
          </button>
        </form>

        {/* Task List Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sortedTasks.length === 0 ? (
            <div
              style={{
                padding: '3rem 1rem',
                textAlign: 'center',
                background: isLight ? 'var(--bg-surface-2)' : 'rgba(18, 12, 38, 0.5)',
                borderRadius: '16px',
                border: '1px dashed rgba(192, 132, 252, 0.25)',
                color: '#94a3b8',
              }}
            >
              <CheckCircle2 size={32} color="#818cf8" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                No tasks found in this view
              </div>
              <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                Add a task above or switch views from the left navigation.
              </div>
            </div>
          ) : (
            sortedTasks.map((task) => {
              const isRoutineOrRecurring = Boolean(
                task.isRoutine || (task.recurring && task.recurring !== 'none')
              );
              const todayStr = today();
              const isCompleted = isRoutineOrRecurring
                ? task.lastCompletedDate === todayStr
                : task.status === 'completed';
              const isPausedRoutine = isRoutineOrRecurring && task.isRoutineActive === false;
              const lifeColor = AREA_COLOR[task.lifeArea] || '#818cf8';
              const pColor = PRIORITY_COLOR[task.priority] || '#94a3b8';
              const subtasks = task.inlineSubtasks || [];
              const completedSubtasks = subtasks.filter((s) => s.completed).length;

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  style={{
                    background: isCompleted ? (isLight ? 'var(--bg-surface-2)' : 'rgba(18, 12, 38, 0.45)') : panelBg,
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(192, 132, 252, 0.18)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.45)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.18)';
                  }}
                >
                  {/* Color strip on left */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '3px',
                      background: lifeColor,
                      borderRadius: '14px 0 0 14px',
                    }}
                  />

                  {/* Top Row: Checkbox, Title, Star, Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      {isRoutineOrRecurring && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTask({
                              ...task,
                              isRoutine: true,
                              isRoutineActive: isPausedRoutine ? true : false,
                              updatedAt: new Date().toISOString(),
                            });
                          }}
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '999px',
                            border: isPausedRoutine ? '1px solid rgba(148,163,184,0.4)' : '1px solid rgba(236,72,153,0.45)',
                            background: isPausedRoutine ? 'rgba(148,163,184,0.12)' : 'rgba(236,72,153,0.15)',
                            color: isPausedRoutine ? '#94a3b8' : '#ec4899',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                          title={isPausedRoutine ? 'Resume daily routine' : 'Pause daily routine'}
                        >
                          {isPausedRoutine ? 'Paused' : 'Routine'}
                        </button>
                      )}
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (isRoutineOrRecurring) {
                            await updateTask({
                              ...task,
                              lastCompletedDate: isCompleted ? undefined : today(),
                              completedAt: isCompleted ? undefined : new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                            });
                          } else if (!isCompleted) {
                            await completeTask(task.id, true);
                            await removeTask(task.id);
                          } else {
                            await completeTask(task.id, false);
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: isCompleted ? '#34d399' : 'rgba(192, 132, 252, 0.4)',
                          display: 'flex',
                          padding: 0,
                          flexShrink: 0,
                        }}
                        title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </button>

                      {/* Title */}
                      <span
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          color: isCompleted ? textSub : textMain,
                          textDecoration: isCompleted ? 'line-through' : 'none',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          opacity: isPausedRoutine ? 0.55 : 1,
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                      >
                        {task.title}
                      </span>
                    </div>

                    {/* Star & Delete Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={(e) => handleToggleStar(task, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: task.isStarred ? '#facc15' : '#64748b',
                          cursor: 'pointer',
                          display: 'flex',
                          padding: '2px',
                        }}
                        title={task.isStarred ? 'Unstar task' : 'Star task'}
                      >
                        <Star size={16} fill={task.isStarred ? '#facc15' : 'none'} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTask(task.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          display: 'flex',
                          padding: '2px',
                        }}
                        title="Delete task"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Row: Metadata & Controls */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      flexWrap: 'wrap',
                      paddingLeft: '30px',
                    }}
                  >
                    {/* Left Badges: Category, Priority, Date, Subtasks */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.66rem',
                          color: lifeColor,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontWeight: 600,
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: lifeColor }} />
                        {task.lifeArea}
                      </span>

                      <span
                        style={{
                          fontSize: '0.64rem',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: `${pColor}18`,
                          color: pColor,
                          border: `1px solid ${pColor}33`,
                          textTransform: 'uppercase',
                        }}
                      >
                        {task.priority}
                      </span>

                      {task.dueDate && (
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Calendar size={11} color="#38bdf8" /> {formatDate(task.dueDate)}
                        </span>
                      )}

                      {task.startTime && (
                        <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={11} /> {formatTime(task.startTime)}
                        </span>
                      )}

                      {subtasks.length > 0 && (
                        <span style={{ fontSize: '0.66rem', color: isLight ? '#334155' : '#cbd5e1', background: 'rgba(255, 255, 255, 0.06)', padding: '1px 5px', borderRadius: '4px' }}>
                          {completedSubtasks}/{subtasks.length} subtasks
                        </span>
                      )}
                    </div>

                    {/* Right Interactive Buttons: [Daily] and [Set Time] */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {/* Individual Daily Recurrence Button */}
                      <DailyRecurrenceToggle task={task} onUpdate={updateTask} compact />

                      {/* Floating Set Time Button (anchored popover trigger) */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenFloatingTime(task, e)}
                        style={{
                          background: task.startTime ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          border: task.startTime ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          padding: '2px 7px',
                          color: task.startTime ? '#38bdf8' : '#c084fc',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          whiteSpace: 'nowrap',
                        }}
                        title="Set schedule time (Floating Picker)"
                      >
                        <Clock size={11} /> {task.startTime ? task.startTime : 'Set Time'}
                      </button>
                    </div>
                  </div>

                  {/* Inline Subtasks Checklist (if any exist) */}
                  {subtasks.length > 0 && (
                    <div
                      style={{
                        paddingLeft: '30px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        marginTop: '4px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        paddingTop: '6px',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {subtasks.map((sub) => (
                        <div
                          key={sub.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.76rem',
                            color: sub.completed ? '#64748b' : '#cbd5e1',
                          }}
                        >
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={sub.completed}
                              onChange={() => handleToggleInlineSubtask(task, sub.id)}
                              style={{ cursor: 'pointer' }}
                            />
                            <span style={{ textDecoration: sub.completed ? 'line-through' : 'none' }}>
                              {sub.title}
                            </span>
                          </label>

                          <button
                            type="button"
                            onClick={() => handleDeleteInlineSubtask(task, sub.id)}
                            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '1px' }}
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* ─── FLOATING SET TIME POPOVER (PORTAL) ────────────────────────────── */}
      <FloatingTimePicker
        isOpen={Boolean(floatingTimeTask)}
        anchorRect={floatingAnchorRect}
        initialStartTime={floatingTimeTask?.startTime || floatingTimeTask?.plannedStartTime || '09:00'}
        initialEndTime={floatingTimeTask?.endTime || ''}
        initialDate={floatingTimeTask?.scheduledDate || floatingTimeTask?.targetDate || floatingTimeTask?.dueDate || today()}
        taskTitle={floatingTimeTask?.title || ''}
        onSave={handleSaveFloatingTime}
        onClose={() => {
          setFloatingTimeTask(null);
          setFloatingAnchorRect(null);
        }}
      />

      {/* ─── TASK DETAIL SLIDE-OVER / MODAL ───────────────────────────────── */}
      {selectedTask && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="task-detail-sheet"
            style={{
              width: '100%',
              maxWidth: '480px',
              height: '100%',
              background: '#0f0a24',
              borderLeft: '1px solid rgba(192, 132, 252, 0.35)',
              padding: '1.5rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => completeTask(selectedTask.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: selectedTask.status === 'completed' ? '#34d399' : '#c084fc', display: 'flex' }}
                >
                  {selectedTask.status === 'completed' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8' }}>
                  {selectedTask.status === 'completed' ? 'Completed' : 'Pending'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Title & Notes Input */}
            <div>
              <input
                type="text"
                value={selectedTask.title}
                onChange={(e) => updateTask({ ...selectedTask, title: e.target.value })}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: textMain,
                  outline: 'none',
                }}
              />
              <textarea
                placeholder="Add notes or description..."
                value={selectedTask.notes || selectedTask.description || ''}
                onChange={(e) => updateTask({ ...selectedTask, notes: e.target.value, description: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(192, 132, 252, 0.2)',
                  borderRadius: '10px',
                  color: isLight ? '#334155' : '#cbd5e1',
                  fontSize: '0.82rem',
                  padding: '8px 10px',
                  marginTop: '8px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Quick Properties */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Due Date</label>
                <input
                  type="date"
                  value={selectedTask.dueDate || ''}
                  onChange={(e) => updateTask({ ...selectedTask, dueDate: e.target.value, targetDate: e.target.value, scheduledDate: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(192, 132, 252, 0.25)',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '6px',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Priority</label>
                <select
                  value={selectedTask.priority}
                  onChange={(e) => updateTask({ ...selectedTask, priority: e.target.value as any })}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(192, 132, 252, 0.25)',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '6px',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                >
                  <option value="critical" style={{ background: optionBg }}>Critical</option>
                  <option value="high" style={{ background: optionBg }}>High</option>
                  <option value="medium" style={{ background: optionBg }}>Medium</option>
                  <option value="low" style={{ background: optionBg }}>Low</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Life Area</label>
                <select
                  value={selectedTask.lifeArea}
                  onChange={(e) => updateTask({ ...selectedTask, lifeArea: e.target.value as any })}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(192, 132, 252, 0.25)',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '6px',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                >
                  <option value="technical" style={{ background: optionBg }}>Technical</option>
                  <option value="communication" style={{ background: optionBg }}>Communication</option>
                  <option value="career" style={{ background: optionBg }}>Career</option>
                  <option value="creativity" style={{ background: optionBg }}>Creativity</option>
                  <option value="health" style={{ background: optionBg }}>Health</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Custom List</label>
                <select
                  value={selectedTask.listId || ''}
                  onChange={(e) => updateTask({ ...selectedTask, listId: e.target.value || undefined })}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(192, 132, 252, 0.25)',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '6px',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                >
                  <option value="" style={{ background: optionBg }}>None</option>
                  {customLists.map((l) => (
                    <option key={l.id} value={l.id} style={{ background: optionBg }}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recurrence Control */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: textMain, marginBottom: '6px' }}>
                Recurrence & Routine Configuration
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DailyRecurrenceToggle task={selectedTask} onUpdate={updateTask} />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  {selectedTask.recurring === 'daily'
                    ? 'Repeats every calendar day on Home Dashboard'
                    : 'One-time task'}
                </span>
              </div>
            </div>

            {/* Subtasks Section */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: textMain, marginBottom: '8px' }}>
                Subtasks Checklist
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(selectedTask.inlineSubtasks || []).map((sub) => (
                  <div
                    key={sub.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '8px',
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: sub.completed ? '#64748b' : '#f8fafc' }}>
                      <input
                        type="checkbox"
                        checked={sub.completed}
                        onChange={() => handleToggleInlineSubtask(selectedTask, sub.id)}
                      />
                      <span style={{ textDecoration: sub.completed ? 'line-through' : 'none' }}>
                        {sub.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteInlineSubtask(selectedTask, sub.id)}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                <input
                  type="text"
                  placeholder="+ Add new subtask..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddInlineSubtask(selectedTask, e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px dashed rgba(192, 132, 252, 0.25)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    color: '#fff',
                    fontSize: '0.78rem',
                    outline: 'none',
                    marginTop: '4px',
                  }}
                />
              </div>
            </div>

            {/* Footer Delete Action */}
            <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
              <button
                type="button"
                onClick={() => {
                  removeTask(selectedTask.id);
                  setSelectedTask(null);
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  color: '#f87171',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Trash2 size={14} /> Move to Recycle Bin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATE NEW LIST MODAL ────────────────────────────────────────── */}
      {isNewListOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setIsNewListOpen(false)}
        >
          <form
            onSubmit={handleCreateList}
            style={{
              background: '#160e2e',
              border: '1px solid rgba(192, 132, 252, 0.4)',
              borderRadius: '16px',
              padding: '1.25rem',
              width: '100%',
              maxWidth: '360px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                Create Custom List
              </span>
              <button type="button" onClick={() => setIsNewListOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: isLight ? '#334155' : '#cbd5e1', marginBottom: '4px' }}>
                List Name
              </label>
              <input
                type="text"
                placeholder="e.g. Tamil Exam Prep, Personal Goals"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(192, 132, 252, 0.3)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  color: '#fff',
                  fontSize: '0.82rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: isLight ? '#334155' : '#cbd5e1', marginBottom: '4px' }}>
                Theme Color
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['#ec4899', '#8b5cf6', '#38bdf8', '#10b981', '#f59e0b', '#f43f5e'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewListColor(c)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: c,
                      border: newListColor === c ? '2px solid #ffffff' : 'none',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setIsNewListOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                Create List
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
