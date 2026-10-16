/* oxlint-disable react/only-export-components */
import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { AppSettings, Task, RoadmapMilestone, Project, DailyRecord, ScheduleEntry, Note } from '../types';
import { useAuth } from './AuthContext';
import {
  fetchUserTasks,
  createCloudTask,
  updateCloudTask,
  deleteCloudTask,
  subscribeToUserTasks,
  seedStarterTasks,
  STARTER_TASKS,
} from '../services/taskService';
import {
  fetchUserSchedules,
  createCloudSchedule,
  updateCloudSchedule,
  deleteCloudSchedule,
} from '../services/scheduleService';
import {
  fetchUserNotes,
  createCloudNote,
  updateCloudNote,
  deleteCloudNote,
} from '../services/noteService';
import { nanoid } from '../utils/nanoid';
import {
  getSettings,
  saveSettings,
  getAllTasks,
  saveTask,
  deleteTask,
  getAllSchedules,
  saveSchedule,
  deleteSchedule,
  getAllNotes,
  saveNote,
  deleteNote,
  getAllMilestones,
  saveMilestone,
  getAllProjects,
  saveProject,
  deleteProject,
  getAllDailyRecords,
  saveDailyRecord,
  getDefaultSettings,
  exportAllData,
  importAllData,
  clearAllData,
} from '../db/storage';
import { INITIAL_MILESTONES, INITIAL_PROJECTS } from '../db/seedData';
import { today, nowISO } from '../utils/dates';

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'offline';

interface AppContextValue {
  // State
  settings: AppSettings;
  tasks: Task[];
  schedules: ScheduleEntry[];
  notes: Note[];
  milestones: RoadmapMilestone[];
  projects: Project[];
  dailyRecords: DailyRecord[];
  isLoading: boolean;
  error: string | null;
  syncStatus: SyncStatus;

  // Settings
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;

  // Tasks CRUD
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (task: Task) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  rescheduleTask: (id: string, newDate: string) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  loadStarterPack: () => Promise<void>;
  todaysTasks: Task[];
  overdueTasks: Task[];

  // Schedules CRUD
  addSchedule: (data: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ScheduleEntry>;
  updateSchedule: (schedule: ScheduleEntry) => Promise<void>;
  removeSchedule: (id: string) => Promise<void>;

  // Notes CRUD
  addNote: (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note>;
  updateNote: (note: Note) => Promise<void>;
  removeNote: (id: string) => Promise<void>;

  // Milestones
  updateMilestone: (milestone: RoadmapMilestone) => Promise<void>;

  // Projects
  updateProject: (project: Project) => Promise<void>;
  removeProject: (id: string) => Promise<void>;

  // Daily records
  saveTodayRecord: () => Promise<void>;

  // Data management
  exportData: () => Promise<void>;
  importData: (file: File) => Promise<void>;
  resetData: () => Promise<void>;

  // Computed & Weighted progress
  todayCompletionRate: number;
  weightedTodayRate: number;
  weeklyCompletionRate: number;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, isConfigured, isLoading: authIsLoading } = useAuth();

  const [settings, setSettings] = useState<AppSettings>(getDefaultSettings());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [milestones, setMilestones] = useState<RoadmapMilestone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  // Start loading=true until auth resolves, so we never flash stale/offline data
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  // Track previous user id so we can detect account switches
  const prevUserIdRef = useRef<string | null | undefined>(undefined);


  // ── Apply Theme ──────────────────────────────────────────────────────────
  function applyTheme(theme: AppSettings['theme']) {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }

  // ── Initial Bootstrap (Settings, Milestones, Projects, Daily Records) ───
  useEffect(() => {
    (async () => {
      try {
        let s = await getSettings();
        if (!s) {
          s = getDefaultSettings();
          await saveSettings(s);
        }
        setSettings(s);
        applyTheme(s.theme);

        let ms = await getAllMilestones();
        if (ms.length === 0) {
          for (const m of INITIAL_MILESTONES) await saveMilestone(m);
          ms = INITIAL_MILESTONES;
        }
        setMilestones(ms);

        let ps = await getAllProjects();
        if (ps.length === 0) {
          for (const p of INITIAL_PROJECTS) await saveProject(p);
          ps = INITIAL_PROJECTS;
        }
        setProjects(ps);

        const dr = await getAllDailyRecords();
        setDailyRecords(dr);
      } catch (e) {
        setError(String(e));
      }
    })();
  }, []);

  // ── Load & Synchronize User Data based on Auth State ─────────────────────
  // IMPORTANT: Do NOT run while auth is still resolving — user could be transiently null
  // during session restoration, which would incorrectly fall through to offline mode.
  const loadUserData = useCallback(async () => {
    if (authIsLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      if (user && isConfigured) {
        setSyncStatus('syncing');

        const [cloudTasks, cloudSchedules, cloudNotes] = await Promise.all([
          fetchUserTasks(user.id),
          fetchUserSchedules(user.id).catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes('public.schedules') || msg.includes('schema cache')) {
              console.warn('[LifeMap] Schedules table not yet in Supabase schema cache.');
            } else {
              throw err;
            }
            return [];
          }),
          fetchUserNotes(user.id).catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes('public.notes') || msg.includes('schema cache')) {
              console.warn('[LifeMap] Notes table not yet in Supabase schema cache.');
            } else {
              throw err;
            }
            return [];
          }),
        ]);

        setTasks(cloudTasks);
        setSchedules(cloudSchedules);
        setNotes(cloudNotes);
        setSyncStatus('synced');
      } else {
        // Fallback to local storage (Guest mode or Supabase not configured)
        setSyncStatus('offline');
        const [localTasks, localSchedules, localNotes] = await Promise.all([
          getAllTasks(),
          getAllSchedules(),
          getAllNotes(),
        ]);
        setTasks(localTasks);
        setSchedules(localSchedules);
        setNotes(localNotes);
      }
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : 'Failed to load user data';
      if (msg.includes('public.tasks') || msg.includes('schema cache')) {
        msg = 'Database tasks table is not yet initialized in Supabase. Please execute the database migration via Supabase SQL Editor.';
      } else if (msg.includes('401') || msg.includes('Invalid API key') || msg.includes('JWT')) {
        msg = 'Authentication failed when connecting to Supabase. Check your Supabase API credentials.';
      }
      setError(msg);
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [user, isConfigured, authIsLoading]);

  // Guard: clear tasks, schedules, notes immediately when user identity changes to prevent cross-account flash
  useEffect(() => {
    const prevId = prevUserIdRef.current;
    const currentId = user?.id ?? null;

    if (prevId !== undefined && prevId !== currentId) {
      setTasks([]);
      setSchedules([]);
      setNotes([]);
      setSyncStatus('synced');
      setError(null);
    }
    prevUserIdRef.current = currentId;
  }, [user]);

  useEffect(() => {
    if (!authIsLoading) {
      // Use queueMicrotask to avoid synchronous setState inside render effect warning
      queueMicrotask(() => {
        loadUserData();
      });
    }
  }, [loadUserData, authIsLoading]);

  // ── Realtime Subscription for Authenticated User ─────────────────────────
  useEffect(() => {
    if (!user || !isConfigured || authIsLoading) return;

    const unsubscribe = subscribeToUserTasks(user.id, () => {
      fetchUserTasks(user.id)
        .then((fresh) => {
          setTasks(fresh);
          setSyncStatus('synced');
        })
        .catch((err: unknown) => {
          // Surface realtime refresh errors — do not silently swallow them
          const msg = err instanceof Error ? err.message : 'Realtime sync failed';
          console.error('[LifeMap] Realtime refresh error:', msg);
          setSyncStatus('error');
          setError(`Live sync failed: ${msg}`);
        });
    });

    return () => {
      unsubscribe();
    };
  }, [user, isConfigured, authIsLoading]);

  // ── Settings ─────────────────────────────────────────────────────────────
  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      if (partial.theme) applyTheme(partial.theme);
      return next;
    });
  }, []);

  // ── Tasks Operations (with Optimistic UI + Server Rollback) ──────────────
  const addTask = useCallback(
    async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
      setSyncStatus('syncing');
      setError(null);

      if (user && isConfigured) {
        try {
          const savedTask = await createCloudTask(taskData, user.id);
          setTasks((prev) => [savedTask, ...prev]);
          setSyncStatus('synced');
          return savedTask;
        } catch (err: unknown) {
          setSyncStatus('error');
          let msg = err instanceof Error ? err.message : 'Failed to create cloud task';
          if (msg.includes('public.tasks') || msg.includes('schema cache')) {
            msg = "Cannot save task: table 'tasks' does not exist in Supabase. Please run the SQL migration.";
          }
          setError(msg);
          throw err;
        }
      } else {
        // Offline / Guest Mode
        const task: Task = {
          ...taskData,
          id: nanoid(),
          createdAt: nowISO(),
          updatedAt: nowISO(),
        };
        await saveTask(task);
        setTasks((prev) => [task, ...prev]);
        setSyncStatus('offline');
        return task;
      }
    },
    [user, isConfigured]
  );

  const updateTask = useCallback(
    async (task: Task) => {
      const updated: Task = { ...task, updatedAt: nowISO() };

      // Optimistic state update — capture original entity for targeted rollback
      let originalTask: Task | undefined;
      setTasks((prev) => {
        originalTask = prev.find((t) => t.id === task.id);
        return prev.map((t) => (t.id === task.id ? updated : t));
      });
      setSyncStatus('syncing');

      if (user && isConfigured) {
        try {
          const saved = await updateCloudTask(updated, user.id);
          setTasks((prev) => prev.map((t) => (t.id === task.id ? saved : t)));
          setSyncStatus('synced');
        } catch (err: unknown) {
          // Targeted rollback: revert only this task without wiping other concurrent changes
          if (originalTask) {
            setTasks((prev) => prev.map((t) => (t.id === task.id ? originalTask! : t)));
          }
          setSyncStatus('error');
          let msg = err instanceof Error ? err.message : 'Failed to update cloud task';
          if (msg.includes('public.tasks') || msg.includes('schema cache')) {
            msg = "Cannot update task: table 'tasks' does not exist in Supabase. Please run the SQL migration.";
          } else if (msg.includes('401') || msg.includes('Invalid API key') || msg.includes('JWT')) {
            msg = 'Task update rejected: Supabase authentication failed. Check your VITE_SUPABASE_ANON_KEY.';
          }
          setError(msg);
          throw err;
        }
      } else {
        await saveTask(updated);
        setSyncStatus('offline');
      }
    },
    [user, isConfigured]
  );

  const completeTask = useCallback(
    async (id: string) => {
      const current = tasks.find((t) => t.id === id);
      if (!current) return;

      const isCompleted = current.status === 'completed';
      const newStatus = isCompleted ? 'not-started' : 'completed';
      const updated: Task = {
        ...current,
        status: newStatus,
        completedAt: newStatus === 'completed' ? nowISO() : undefined,
        updatedAt: nowISO(),
      };

      try {
        await updateTask(updated);
      } catch {
        // Rollback and error display are already handled inside updateTask
      }
    },
    [tasks, updateTask]
  );

  const rescheduleTask = useCallback(
    async (id: string, newDate: string) => {
      const current = tasks.find((t) => t.id === id);
      if (!current) return;

      const updated: Task = {
        ...current,
        status: 'rescheduled',
        rescheduledFrom: current.dueDate,
        rescheduledTo: newDate,
        dueDate: newDate,
        updatedAt: nowISO(),
      };

      try {
        await updateTask(updated);
      } catch {
        // Rollback and error handled in updateTask
      }
    },
    [tasks, updateTask]
  );

  const removeTask = useCallback(
    async (id: string) => {
      // Optimistic delete — capture original entity for targeted rollback
      let originalTask: Task | undefined;
      setTasks((prev) => {
        originalTask = prev.find((t) => t.id === id);
        return prev.filter((t) => t.id !== id);
      });
      setSyncStatus('syncing');

      if (user && isConfigured) {
        try {
          await deleteCloudTask(id, user.id);
          setSyncStatus('synced');
        } catch (err: unknown) {
          // Targeted rollback: restore only the deleted task
          if (originalTask) {
            setTasks((prev) => (prev.some((t) => t.id === id) ? prev : [originalTask!, ...prev]));
          }
          setSyncStatus('error');
          const msg = err instanceof Error ? err.message : 'Failed to delete task from cloud';
          setError(msg);
          throw err;
        }
      } else {
        await deleteTask(id);
        setSyncStatus('offline');
      }
    },
    [user, isConfigured]
  );

  const loadStarterPack = useCallback(async () => {
    if (user && isConfigured) {
      setSyncStatus('syncing');
      try {
        const seeded = await seedStarterTasks(user.id);
        setTasks((prev) => [...seeded, ...prev]);
        setSyncStatus('synced');
      } catch (err: unknown) {
        setSyncStatus('error');
        const msg = err instanceof Error ? err.message : 'Failed to load starter pack';
        setError(msg);
      }
    } else {
      // Local seed
      const localSeeded: Task[] = [];
      for (const st of STARTER_TASKS) {
        const t: Task = {
          ...st,
          id: nanoid(),
          createdAt: nowISO(),
          updatedAt: nowISO(),
        };
        await saveTask(t);
        localSeeded.push(t);
      }
      setTasks((prev) => [...localSeeded, ...prev]);
    }
  }, [user, isConfigured]);

  // ── Computed Lists & Metrics ─────────────────────────────────────────────
  const currentDate = today();

  const todaysTasks = tasks.filter(
    (t) => t.dueDate === currentDate && t.status !== 'rescheduled'
  );

  const overdueTasks = tasks.filter(
    (t) =>
      t.dueDate < currentDate &&
      t.status !== 'completed' &&
      t.status !== 'rescheduled'
  );

  const todayCompletionRate = todaysTasks.length
    ? Math.round(
        (todaysTasks.filter((t) => t.status === 'completed').length / todaysTasks.length) * 100
      )
    : 0;

  // Weighted Today completion based on LifeArea planning weights (50, 15, 15, 10, 10)
  const weightedTodayRate = (() => {
    if (!todaysTasks.length) return 0;
    const weights = settings.lifeAreaWeights;
    const areas = Object.keys(weights) as (keyof typeof weights)[];

    let totalWeightActive = 0;
    let earnedWeight = 0;

    for (const area of areas) {
      const areaTasks = todaysTasks.filter((t) => t.lifeArea === area);
      if (areaTasks.length > 0) {
        const areaWeight = weights[area] || 0;
        totalWeightActive += areaWeight;
        const completedInArea = areaTasks.filter((t) => t.status === 'completed').length;
        const ratio = completedInArea / areaTasks.length;
        earnedWeight += ratio * areaWeight;
      }
    }

    if (totalWeightActive === 0) return 0;
    return Math.round((earnedWeight / totalWeightActive) * 100);
  })();

  const weeklyCompletionRate = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    const sevenDaysAgo = d.toISOString().slice(0, 10);
    const weekDueTasks = tasks.filter((t) => t.dueDate >= sevenDaysAgo);
    const weekCompleted = weekDueTasks.filter((t) => t.status === 'completed').length;
    return weekDueTasks.length ? Math.round((weekCompleted / weekDueTasks.length) * 100) : 0;
  }, [tasks, currentDate]);

  // ── Milestones & Projects ────────────────────────────────────────────────
  const updateMilestone = useCallback(async (milestone: RoadmapMilestone) => {
    await saveMilestone(milestone);
    setMilestones((prev) => prev.map((m) => (m.id === milestone.id ? milestone : m)));
  }, []);

  const updateProject = useCallback(async (project: Project) => {
    const updated = { ...project, updatedAt: nowISO() };
    await saveProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === project.id ? updated : p)));
  }, []);

  const removeProject = useCallback(async (id: string) => {
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ── Daily Record ─────────────────────────────────────────────────────────
  const saveTodayRecord = useCallback(async () => {
    const record: DailyRecord = {
      date: today(),
      tasksCompleted: todaysTasks.filter((t) => t.status === 'completed').length,
      tasksTotal: todaysTasks.length,
      minutesSpent: todaysTasks
        .filter((t) => t.status === 'completed')
        .reduce((sum, t) => sum + (t.actualMinutes ?? t.estimatedMinutes ?? 0), 0),
      savedAt: nowISO(),
    };
    await saveDailyRecord(record);
    setDailyRecords((prev) => {
      const exists = prev.findIndex((r) => r.date === today());
      return exists >= 0 ? prev.map((r, i) => (i === exists ? record : r)) : [...prev, record];
    });
  }, [todaysTasks]);

  // ── Schedules Operations (with Optimistic UI + Server Rollback) ─────────
  const addSchedule = useCallback(
    async (scheduleData: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduleEntry> => {
      setSyncStatus('syncing');
      setError(null);

      if (user && isConfigured) {
        try {
          const savedSchedule = await createCloudSchedule(scheduleData, user.id);
          setSchedules((prev) =>
            [...prev, savedSchedule].sort(
              (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
            )
          );
          setSyncStatus('synced');
          return savedSchedule;
        } catch (err: unknown) {
          setSyncStatus('error');
          let msg = err instanceof Error ? err.message : 'Failed to create cloud schedule';
          if (msg.includes('public.schedules') || msg.includes('schema cache')) {
            msg =
              "Cannot save schedule: table 'schedules' does not exist in Supabase. Please run the SQL migration in supabase/migrations/20261016000000_create_schedules_and_notes_tables.sql.";
          }
          setError(msg);
          throw err;
        }
      } else {
        const schedule: ScheduleEntry = {
          ...scheduleData,
          id: nanoid(),
          createdAt: nowISO(),
          updatedAt: nowISO(),
        };
        await saveSchedule(schedule);
        setSchedules((prev) =>
          [...prev, schedule].sort(
            (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
          )
        );
        setSyncStatus('offline');
        return schedule;
      }
    },
    [user, isConfigured]
  );

  const updateSchedule = useCallback(
    async (schedule: ScheduleEntry) => {
      const updated: ScheduleEntry = { ...schedule, updatedAt: nowISO() };
      let originalSchedule: ScheduleEntry | undefined;
      setSchedules((prev) => {
        originalSchedule = prev.find((s) => s.id === schedule.id);
        return prev
          .map((s) => (s.id === schedule.id ? updated : s))
          .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
      });
      setSyncStatus('syncing');

      if (user && isConfigured) {
        try {
          const saved = await updateCloudSchedule(updated, user.id);
          setSchedules((prev) =>
            prev
              .map((s) => (s.id === schedule.id ? saved : s))
              .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
          );
          setSyncStatus('synced');
        } catch (err: unknown) {
          if (originalSchedule) {
            setSchedules((prev) =>
              prev
                .map((s) => (s.id === schedule.id ? originalSchedule! : s))
                .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
            );
          }
          setSyncStatus('error');
          let msg = err instanceof Error ? err.message : 'Failed to update cloud schedule';
          if (msg.includes('public.schedules') || msg.includes('schema cache')) {
            msg = "Cannot update schedule: table 'schedules' does not exist in Supabase. Please run the SQL migration.";
          }
          setError(msg);
          throw err;
        }
      } else {
        await saveSchedule(updated);
        setSyncStatus('offline');
      }
    },
    [user, isConfigured]
  );

  const removeSchedule = useCallback(
    async (id: string) => {
      let originalSchedule: ScheduleEntry | undefined;
      setSchedules((prev) => {
        originalSchedule = prev.find((s) => s.id === id);
        return prev.filter((s) => s.id !== id);
      });
      setSyncStatus('syncing');

      if (user && isConfigured) {
        try {
          await deleteCloudSchedule(id, user.id);
          setSyncStatus('synced');
        } catch (err: unknown) {
          if (originalSchedule) {
            setSchedules((prev) =>
              (prev.some((s) => s.id === id) ? prev : [...prev, originalSchedule!]).sort(
                (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
              )
            );
          }
          setSyncStatus('error');
          const msg = err instanceof Error ? err.message : 'Failed to delete schedule from cloud';
          setError(msg);
          throw err;
        }
      } else {
        await deleteSchedule(id);
        setSyncStatus('offline');
      }
    },
    [user, isConfigured]
  );

  // ── Notes Operations (with Optimistic UI + Server Rollback) ──────────────
  const addNote = useCallback(
    async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
      setSyncStatus('syncing');
      setError(null);

      if (user && isConfigured) {
        try {
          const savedNote = await createCloudNote(noteData, user.id);
          setNotes((prev) => [savedNote, ...prev]);
          setSyncStatus('synced');
          return savedNote;
        } catch (err: unknown) {
          setSyncStatus('error');
          let msg = err instanceof Error ? err.message : 'Failed to create cloud note';
          if (msg.includes('public.notes') || msg.includes('schema cache')) {
            msg =
              "Cannot save note: table 'notes' does not exist in Supabase. Please run the SQL migration in supabase/migrations/20261016000000_create_schedules_and_notes_tables.sql.";
          }
          setError(msg);
          throw err;
        }
      } else {
        const note: Note = {
          ...noteData,
          id: nanoid(),
          createdAt: nowISO(),
          updatedAt: nowISO(),
        };
        await saveNote(note);
        setNotes((prev) => [note, ...prev]);
        setSyncStatus('offline');
        return note;
      }
    },
    [user, isConfigured]
  );

  const updateNote = useCallback(
    async (note: Note) => {
      const updated: Note = { ...note, updatedAt: nowISO() };
      let originalNote: Note | undefined;
      setNotes((prev) => {
        originalNote = prev.find((n) => n.id === note.id);
        return prev.map((n) => (n.id === note.id ? updated : n));
      });
      setSyncStatus('syncing');

      if (user && isConfigured) {
        try {
          const saved = await updateCloudNote(updated, user.id);
          setNotes((prev) => prev.map((n) => (n.id === note.id ? saved : n)));
          setSyncStatus('synced');
        } catch (err: unknown) {
          if (originalNote) {
            setNotes((prev) => prev.map((n) => (n.id === note.id ? originalNote! : n)));
          }
          setSyncStatus('error');
          let msg = err instanceof Error ? err.message : 'Failed to update cloud note';
          if (msg.includes('public.notes') || msg.includes('schema cache')) {
            msg = "Cannot update note: table 'notes' does not exist in Supabase. Please run the SQL migration.";
          }
          setError(msg);
          throw err;
        }
      } else {
        await saveNote(updated);
        setSyncStatus('offline');
      }
    },
    [user, isConfigured]
  );

  const removeNote = useCallback(
    async (id: string) => {
      let originalNote: Note | undefined;
      setNotes((prev) => {
        originalNote = prev.find((n) => n.id === id);
        return prev.filter((n) => n.id !== id);
      });
      setSyncStatus('syncing');

      if (user && isConfigured) {
        try {
          await deleteCloudNote(id, user.id);
          setSyncStatus('synced');
        } catch (err: unknown) {
          if (originalNote) {
            setNotes((prev) => (prev.some((n) => n.id === id) ? prev : [originalNote!, ...prev]));
          }
          setSyncStatus('error');
          const msg = err instanceof Error ? err.message : 'Failed to delete note from cloud';
          setError(msg);
          throw err;
        }
      } else {
        await deleteNote(id);
        setSyncStatus('offline');
      }
    },
    [user, isConfigured]
  );

  // ── Backup / Export / Import / Reset ─────────────────────────────────────
  const exportData = useCallback(async () => {
    const data = await exportAllData();
    data.tasks = tasks; // Export live tasks
    data.schedules = schedules; // Export live schedules
    data.notes = notes; // Export live notes
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifemap-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [tasks, schedules, notes]);

  const importData = useCallback(async (file: File) => {
    const text = await file.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Invalid JSON file format');
    }
    await importAllData(data as Parameters<typeof importAllData>[0]);
    // Reload state
    const [t, sc, nt, ms, ps, dr, s] = await Promise.all([
      getAllTasks(),
      getAllSchedules(),
      getAllNotes(),
      getAllMilestones(),
      getAllProjects(),
      getAllDailyRecords(),
      getSettings(),
    ]);
    setTasks(t);
    setSchedules(sc);
    setNotes(nt);
    setMilestones(ms);
    setProjects(ps);
    setDailyRecords(dr);
    if (s) setSettings(s);
  }, []);

  const resetData = useCallback(async () => {
    await clearAllData();
    const s = getDefaultSettings();
    await saveSettings(s);
    setSettings(s);
    setTasks([]);
    setSchedules([]);
    setNotes([]);
    setDailyRecords([]);
    for (const m of INITIAL_MILESTONES) await saveMilestone(m);
    for (const p of INITIAL_PROJECTS) await saveProject(p);
    setMilestones(INITIAL_MILESTONES);
    setProjects(INITIAL_PROJECTS);
  }, []);

  return (
    <AppContext.Provider
      value={{
        settings,
        tasks,
        schedules,
        notes,
        milestones,
        projects,
        dailyRecords,
        isLoading,
        error,
        syncStatus,
        updateSettings,
        addTask,
        updateTask,
        completeTask,
        rescheduleTask,
        removeTask,
        loadStarterPack,
        todaysTasks,
        overdueTasks,
        addSchedule,
        updateSchedule,
        removeSchedule,
        addNote,
        updateNote,
        removeNote,
        updateMilestone,
        updateProject,
        removeProject,
        saveTodayRecord,
        exportData,
        importData,
        resetData,
        todayCompletionRate,
        weightedTodayRate,
        weeklyCompletionRate,
      }}
    >
      {children}
    </AppContext.Provider>
  );

}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
