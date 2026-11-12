/* oxlint-disable react/only-export-components */
import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type {
  AppSettings,
  Task,
  RoadmapMilestone,
  Project,
  DailyRecord,
  ScheduleEntry,
  Note,
  UserUpload,
  CustomLifeArea,
  AppearanceSettings,
  CommunicationSession,
  LifeArea,
  TaskPriority,
} from '../types';
import { DEFAULT_LIFE_AREAS, DEFAULT_APPEARANCE } from '../types';
import { useAuth } from './AuthContext';
import {
  fetchUserTasks,
  createCloudTask,
  updateCloudTask,
  softDeleteCloudTasks,
  restoreCloudTasks,
  permanentDeleteCloudTasks,
  emptyCloudRecycleBin,
  updateCloudTaskOrder,
  subscribeToUserTasks,
  seedStarterTasks,
  STARTER_TASKS,
} from '../services/taskService';
import { getAllDescendantIds } from '../utils/taskTreeUtils';
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
import {
  fetchUserUploads,
  uploadUserFile,
  deleteUserUpload,
  updateUserUploadMetadata,
  getUploadSignedUrl,
} from '../services/uploadService';
import {
  fetchUserCommunicationSessions,
  createCommunicationSession,
  updateCommunicationSession as updateCloudCommSession,
  deleteCommunicationSession as deleteCloudCommSession,
} from '../services/communicationService';
import {
  fetchUserProjects,
  updateCloudProject,
  deleteCloudProject,
  subscribeToUserProjects,
} from '../services/projectService';
import {
  fetchUserMilestones,
  saveCloudMilestone,
  subscribeToUserMilestones,
} from '../services/milestoneService';
import {
  fetchUserDailyRecords,
  saveCloudDailyRecord,
  subscribeToUserDailyRecords,
} from '../services/dailyRecordService';
import {
  fetchUserSettings,
  saveCloudSettings,
  subscribeToUserSettings,
} from '../services/settingsService';
import { subscribeToUserSchedules } from '../services/scheduleService';
import { subscribeToUserNotes } from '../services/noteService';
import { migrateLocalDataToCloud } from '../services/localMigrationService';
import { extractErrorInfo, formatSafeErrorMessage, logSafeError } from '../utils/errorUtils';
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
  uploads: UserUpload[];
  milestones: RoadmapMilestone[];
  projects: Project[];
  dailyRecords: DailyRecord[];
  communicationSessions: CommunicationSession[];
  isLoading: boolean;
  error: string | null;
  syncStatus: SyncStatus;

  // Settings & Customization
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  customLifeAreas: CustomLifeArea[];
  updateLifeAreas: (areas: CustomLifeArea[]) => Promise<void>;
  restoreDefaultLifeAreas: () => Promise<void>;
  updateAppearance: (appearance: Partial<AppearanceSettings>) => Promise<void>;

  // Tasks CRUD
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (task: Task) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  rescheduleTask: (id: string, newDate: string) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  restoreTask: (id: string) => Promise<void>;
  permanentDeleteTask: (id: string) => Promise<void>;
  emptyRecycleBin: () => Promise<void>;
  reorderTasks: (updates: { id: string; orderIndex: number }[]) => Promise<void>;
  loadStarterPack: () => Promise<void>;
  moveTaskArea: (taskId: string, targetArea: LifeArea) => Promise<void>;
  assignTask: (
    taskId: string,
    updates: {
      lifeArea?: LifeArea;
      roadmapMonth?: number | null;
      projectId?: string | null;
      dueDate?: string;
      priority?: TaskPriority;
    }
  ) => Promise<void>;
  rescheduleAllOverdueTasks: (newDate: string) => Promise<{ count: number }>;
  todaysTasks: Task[];
  overdueTasks: Task[];
  deletedTasks: Task[];

  // Schedules CRUD
  addSchedule: (data: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ScheduleEntry>;
  updateSchedule: (schedule: ScheduleEntry) => Promise<void>;
  removeSchedule: (id: string) => Promise<void>;

  // Notes CRUD
  addNote: (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note>;
  updateNote: (note: Note) => Promise<void>;
  removeNote: (id: string) => Promise<void>;

  // Communication Practice & Attendance Tracking
  addCommunicationSession: (session: Omit<CommunicationSession, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CommunicationSession>;
  updateCommunicationSession: (session: CommunicationSession) => Promise<void>;
  removeCommunicationSession: (id: string) => Promise<void>;

  // Uploads & Media Vault
  uploadFile: (file: File, description?: string, onProgress?: (percent: number) => void) => Promise<UserUpload>;
  removeUpload: (upload: UserUpload) => Promise<void>;
  updateUpload: (id: string, updates: { fileName?: string; description?: string }) => Promise<void>;
  getDownloadUrl: (filePath: string) => Promise<string>;

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
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const tasks = useMemo(() => allTasks.filter((t) => !t.isDeleted), [allTasks]);
  const deletedTasks = useMemo(
    () =>
      allTasks
        .filter((t) => Boolean(t.isDeleted))
        .sort((a, b) => (b.deletedAt || '').localeCompare(a.deletedAt || '')),
    [allTasks]
  );
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [uploads, setUploads] = useState<UserUpload[]>([]);
  const [milestones, setMilestones] = useState<RoadmapMilestone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [communicationSessions, setCommunicationSessions] = useState<CommunicationSession[]>([]);
  // Start loading=true until auth resolves, so we never flash stale/offline data
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');

  // Track previous user id so we can detect account switches
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  // ── Apply Theme & Appearance ──────────────────────────────────────────────
  function applyTheme(theme: AppSettings['theme'], appearance?: AppearanceSettings) {
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

    if (appearance) {
      if (appearance.themePreset) {
        root.setAttribute('data-theme-preset', appearance.themePreset);
      }
      if (appearance.accentColor) {
        root.style.setProperty('--accent', appearance.accentColor);
        root.style.setProperty('--accent-glow', `${appearance.accentColor}33`);
      }
      if (appearance.secondaryAccent) {
        root.style.setProperty('--accent-secondary', appearance.secondaryAccent);
      }
      if (typeof appearance.glassBlur === 'number') {
        root.style.setProperty('--glass-blur', `${appearance.glassBlur}px`);
      }
      if (typeof appearance.cardTransparency === 'number') {
        const alpha = Math.max(0.2, Math.min(0.95, 1 - appearance.cardTransparency));
        root.style.setProperty('--glass-bg', `rgba(18, 10, 40, ${alpha})`);
      }

      // Resolve background wallpaper URL
      let resolvedBgUrl = appearance.backgroundImageUrl?.trim() || '';
      if (!resolvedBgUrl && appearance.wallpaperId && appearance.wallpaperId !== 'none') {
        resolvedBgUrl = `/wallpapers/${appearance.wallpaperId}.svg`;
      }

      if (resolvedBgUrl) {
        root.style.setProperty('--user-bg-image', `url("${resolvedBgUrl}")`);
        root.style.setProperty('--user-bg-overlay-display', 'block');
        const raw = typeof appearance.backgroundOverlayOpacity === 'number'
          ? appearance.backgroundOverlayOpacity
          : 0.25;
        const normalized = raw > 1 ? raw / 100 : raw;
        const clamped = Math.min(0.85, Math.max(0.05, normalized));
        root.style.setProperty('--user-bg-overlay-opacity', String(clamped));
        if (appearance.wallpaperScaling) {
          root.style.setProperty('--user-bg-size', appearance.wallpaperScaling);
        }
        if (appearance.wallpaperPosition) {
          root.style.setProperty('--user-bg-position', appearance.wallpaperPosition);
        }
      } else {
        root.style.removeProperty('--user-bg-image');
        root.style.setProperty('--user-bg-overlay-display', 'none');
        root.style.setProperty('--user-bg-overlay-opacity', '0');
      }
    } else {
      root.style.removeProperty('--user-bg-image');
      root.style.setProperty('--user-bg-overlay-display', 'none');
      root.style.setProperty('--user-bg-overlay-opacity', '0');
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
        applyTheme(s.theme, s.appearance);

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
        logSafeError('Initial bootstrap', e);
        setError(formatSafeErrorMessage(e, 'Failed to load settings'));
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

        const [
          tasksRes,
          schedulesRes,
          notesRes,
          uploadsRes,
          commRes,
          projectsRes,
          milestonesRes,
          recordsRes,
          settingsRes,
        ] = await Promise.allSettled([
          fetchUserTasks(user.id),
          fetchUserSchedules(user.id),
          fetchUserNotes(user.id),
          fetchUserUploads(user.id),
          fetchUserCommunicationSessions(user.id),
          fetchUserProjects(user.id),
          fetchUserMilestones(user.id),
          fetchUserDailyRecords(user.id),
          fetchUserSettings(user.id),
        ]);

        let hasCriticalTaskError = false;
        let taskErrorMessage = '';

        // 1. Process Tasks
        if (tasksRes.status === 'fulfilled') {
          setAllTasks(tasksRes.value);
          // Mirror to local IndexedDB for fast offline cache
          for (const t of tasksRes.value) {
            saveTask(t).catch(() => {});
          }
        } else {
          hasCriticalTaskError = true;
          logSafeError('Load User Tasks', tasksRes.reason);
          const info = extractErrorInfo(tasksRes.reason, 'Load tasks');
          if (info.isSchemaMissing) {
            taskErrorMessage = "Database tasks table is not yet initialized in Supabase. Please execute the database migration in supabase/migrations/20261011000000_create_tasks_table.sql.";
          } else if (info.isAuthError) {
            taskErrorMessage = 'Authentication failed when connecting to Supabase. Check your Supabase API credentials.';
          } else {
            taskErrorMessage = formatSafeErrorMessage(tasksRes.reason, 'Failed to load tasks from Supabase');
          }
        }

        // 2. Process Schedules
        if (schedulesRes.status === 'fulfilled') {
          setSchedules(schedulesRes.value);
          for (const s of schedulesRes.value) {
            saveSchedule(s).catch(() => {});
          }
        } else {
          logSafeError('Load User Schedules', schedulesRes.reason);
          setSchedules([]);
        }

        // 3. Process Notes
        if (notesRes.status === 'fulfilled') {
          setNotes(notesRes.value);
          for (const n of notesRes.value) {
            saveNote(n).catch(() => {});
          }
        } else {
          logSafeError('Load User Notes', notesRes.reason);
          setNotes([]);
        }

        // 4. Process Uploads
        if (uploadsRes.status === 'fulfilled') {
          setUploads(uploadsRes.value);
        } else {
          logSafeError('Load User Uploads', uploadsRes.reason);
          setUploads([]);
        }

        // 5. Process Communication Sessions
        if (commRes.status === 'fulfilled') {
          setCommunicationSessions(commRes.value);
        } else {
          logSafeError('Load User Communication Sessions', commRes.reason);
          setCommunicationSessions([]);
        }

        // 6. Process Projects (Cloud + Local Mirror)
        if (projectsRes.status === 'fulfilled') {
          setProjects(projectsRes.value.projects);
        }

        // 7. Process Roadmap Milestones (Cloud + Local Mirror)
        if (milestonesRes.status === 'fulfilled') {
          setMilestones(milestonesRes.value.milestones);
        }

        // 8. Process Daily Records (Cloud + Local Mirror)
        if (recordsRes.status === 'fulfilled') {
          setDailyRecords(recordsRes.value.records);
        }

        // 9. Process User Settings (Cloud + Local Mirror)
        if (settingsRes.status === 'fulfilled') {
          setSettings(settingsRes.value.settings);
          applyTheme(settingsRes.value.settings.theme, settingsRes.value.settings.appearance);
        }

        // 10. Safe Non-Destructive Local-to-Cloud Migration
        // Safely push any local records that only exist on this device up to Supabase
        migrateLocalDataToCloud(user.id, {
          tasks: tasksRes.status === 'fulfilled' ? tasksRes.value : [],
          projects: projectsRes.status === 'fulfilled' ? projectsRes.value.projects : [],
          milestones: milestonesRes.status === 'fulfilled' ? milestonesRes.value.milestones : [],
          schedules: schedulesRes.status === 'fulfilled' ? schedulesRes.value : [],
          notes: notesRes.status === 'fulfilled' ? notesRes.value : [],
          dailyRecords: recordsRes.status === 'fulfilled' ? recordsRes.value.records : [],
        }).catch((err) => logSafeError('Data migration error', err));

        if (hasCriticalTaskError) {
          setError(taskErrorMessage);
          setSyncStatus('error');
        } else {
          setSyncStatus('synced');
          setError(null);
        }
      } else {
        // Fallback to local storage (Guest mode or Supabase not configured)
        setSyncStatus('offline');
        const [localTasks, localSchedules, localNotes, localComm, localProjects, localMilestones, localRecords, localSettings] =
          await Promise.all([
            getAllTasks(),
            getAllSchedules(),
            getAllNotes(),
            fetchUserCommunicationSessions(''),
            getAllProjects(),
            getAllMilestones(),
            getAllDailyRecords(),
            getSettings(),
          ]);
        setAllTasks(localTasks);
        setSchedules(localSchedules);
        setNotes(localNotes);
        setUploads([]);
        setCommunicationSessions(localComm);
        setProjects(localProjects.length > 0 ? localProjects : INITIAL_PROJECTS);
        setMilestones(localMilestones.length > 0 ? localMilestones : INITIAL_MILESTONES);
        setDailyRecords(localRecords);
        if (localSettings) {
          setSettings(localSettings);
          applyTheme(localSettings.theme, localSettings.appearance);
        }
      }
    } catch (err: unknown) {
      logSafeError('Bootstrap User Data', err);
      const msg = formatSafeErrorMessage(err, 'Failed to load user data');
      setError(msg);
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [user, isConfigured, authIsLoading]);

  // Guard: clear state immediately when user identity changes to prevent cross-account flash
  useEffect(() => {
    const prevId = prevUserIdRef.current;
    const currentId = user?.id ?? null;

    if (prevId !== undefined && prevId !== currentId) {
      setAllTasks([]);
      setSchedules([]);
      setNotes([]);
      setUploads([]);
      setCommunicationSessions([]);
      setProjects([]);
      setMilestones([]);
      setDailyRecords([]);
      setSyncStatus('synced');
      setError(null);
    }
    prevUserIdRef.current = currentId;
  }, [user]);

  useEffect(() => {
    if (!authIsLoading) {
      queueMicrotask(() => {
        loadUserData();
      });
    }
  }, [loadUserData, authIsLoading]);

  // ── Multi-Module Realtime Subscriptions for Authenticated User ───────────
  useEffect(() => {
    if (!user || !isConfigured || authIsLoading) return;

    const unsubs: (() => void)[] = [];

    // 1. Tasks Realtime
    unsubs.push(
      subscribeToUserTasks(user.id, () => {
        fetchUserTasks(user.id)
          .then((fresh) => {
            setAllTasks(fresh);
            setSyncStatus('synced');
          })
          .catch((err) => logSafeError('Realtime refresh tasks', err));
      })
    );

    // 2. Schedules Realtime
    unsubs.push(
      subscribeToUserSchedules(user.id, () => {
        fetchUserSchedules(user.id)
          .then((fresh) => {
            setSchedules(fresh);
            setSyncStatus('synced');
          })
          .catch((err) => logSafeError('Realtime refresh schedules', err));
      })
    );

    // 3. Notes Realtime
    unsubs.push(
      subscribeToUserNotes(user.id, () => {
        fetchUserNotes(user.id)
          .then((fresh) => {
            setNotes(fresh);
            setSyncStatus('synced');
          })
          .catch((err) => logSafeError('Realtime refresh notes', err));
      })
    );

    // 4. Projects Realtime
    unsubs.push(
      subscribeToUserProjects(user.id, () => {
        fetchUserProjects(user.id)
          .then((res) => {
            setProjects(res.projects);
            setSyncStatus('synced');
          })
          .catch((err) => logSafeError('Realtime refresh projects', err));
      })
    );

    // 5. Milestones Realtime
    unsubs.push(
      subscribeToUserMilestones(user.id, () => {
        fetchUserMilestones(user.id)
          .then((res) => {
            setMilestones(res.milestones);
            setSyncStatus('synced');
          })
          .catch((err) => logSafeError('Realtime refresh milestones', err));
      })
    );

    // 6. Daily Records Realtime
    unsubs.push(
      subscribeToUserDailyRecords(user.id, () => {
        fetchUserDailyRecords(user.id)
          .then((res) => {
            setDailyRecords(res.records);
            setSyncStatus('synced');
          })
          .catch((err) => logSafeError('Realtime refresh daily records', err));
      })
    );

    // 7. Settings Realtime
    unsubs.push(
      subscribeToUserSettings(user.id, (freshSettings) => {
        setSettings(freshSettings);
        applyTheme(freshSettings.theme, freshSettings.appearance);
      })
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [user, isConfigured, authIsLoading]);

  // ── Auto-Sync on Tab Focus & Mobile App Resume ───────────────────────────
  useEffect(() => {
    if (!user || !isConfigured || authIsLoading) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const handleResume = () => {
      if (document.visibilityState === 'visible') {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          loadUserData();
        }, 300);
      }
    };

    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('focus', handleResume);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('focus', handleResume);
    };
  }, [user, isConfigured, authIsLoading, loadUserData]);

  // ── Settings & Customization ─────────────────────────────────────────────
  const updateSettings = useCallback(
    async (partial: Partial<AppSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };
        applyTheme(next.theme, next.appearance);
        if (user && isConfigured) {
          saveCloudSettings(next, user.id).catch((err) => logSafeError('saveCloudSettings', err));
        } else {
          saveSettings(next);
        }
        return next;
      });
    },
    [user, isConfigured]
  );

  const customLifeAreas = useMemo(() => {
    return settings.lifeAreas && settings.lifeAreas.length > 0
      ? settings.lifeAreas
      : DEFAULT_LIFE_AREAS;
  }, [settings.lifeAreas]);

  const updateLifeAreas = useCallback(
    async (areas: CustomLifeArea[]) => {
      const weights: Record<string, number> = {};
      for (const a of areas) {
        weights[a.id] = a.weight;
      }
      await updateSettings({ lifeAreas: areas, lifeAreaWeights: weights as any });
    },
    [updateSettings]
  );

  const restoreDefaultLifeAreas = useCallback(async () => {
    const defaultWeights = {
      technical: 50,
      communication: 15,
      career: 15,
      creativity: 10,
      health: 10,
    };
    await updateSettings({ lifeAreas: DEFAULT_LIFE_AREAS, lifeAreaWeights: defaultWeights });
  }, [updateSettings]);

  const updateAppearance = useCallback(
    async (partial: Partial<AppearanceSettings>) => {
      const nextAppearance: AppearanceSettings = {
        ...(settings.appearance || DEFAULT_APPEARANCE),
        ...partial,
      };
      await updateSettings({ appearance: nextAppearance, theme: nextAppearance.theme });
    },
    [settings.appearance, updateSettings]
  );

  // ── Tasks Operations (with Optimistic UI + Server Rollback) ──────────────
  const addTask = useCallback(
    async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
      setSyncStatus('syncing');
      setError(null);

      const assigned = taskData.scheduledDate || taskData.targetDate || taskData.dueDate || today();
      const startTime = taskData.startTime !== undefined ? taskData.startTime : taskData.plannedStartTime;
      const enrichedData = {
        ...taskData,
        dueDate: assigned,
        targetDate: assigned,
        scheduledDate: assigned,
        startTime: startTime,
        plannedStartTime: startTime,
      };

      if (user && isConfigured) {
        try {
          const savedTask = await createCloudTask(enrichedData, user.id);
          const fullSaved: Task = {
            ...savedTask,
            targetDate: savedTask.targetDate || savedTask.dueDate || assigned,
            dueDate: savedTask.dueDate || assigned,
          };
          setAllTasks((prev) => [fullSaved, ...prev]);
          saveTask(fullSaved).catch(() => {});
          setSyncStatus('synced');
          return fullSaved;
        } catch (err: unknown) {
          setSyncStatus('error');
          logSafeError('Create Task', err);
          const msg = formatSafeErrorMessage(err, 'Failed to create cloud task');
          setError(msg);
          throw err;
        }
      } else {
        // Offline / Guest Mode
        const task: Task = {
          ...enrichedData,
          id: nanoid(),
          createdAt: nowISO(),
          updatedAt: nowISO(),
        };
        await saveTask(task);
        setAllTasks((prev) => [task, ...prev]);
        setSyncStatus('offline');
        return task;
      }
    },
    [user, isConfigured]
  );

  const updateTask = useCallback(
    async (task: Task) => {
      const assigned = task.scheduledDate || task.targetDate || task.dueDate || today();
      const startTime = task.startTime !== undefined ? task.startTime : task.plannedStartTime;
      const updated: Task = {
        ...task,
        targetDate: assigned,
        dueDate: assigned,
        scheduledDate: assigned,
        startTime: startTime,
        plannedStartTime: startTime,
        updatedAt: nowISO(),
      };

      // Optimistic state update — capture original entity for targeted rollback
      let originalTask: Task | undefined;
      setAllTasks((prev) => {
        originalTask = prev.find((t) => t.id === task.id);
        return prev.map((t) => (t.id === task.id ? updated : t));
      });
      setSyncStatus('syncing');

      if (user && isConfigured) {
        try {
          const saved = await updateCloudTask(updated, user.id);
          setAllTasks((prev) => prev.map((t) => (t.id === task.id ? saved : t)));
          saveTask(saved).catch(() => {});
          setSyncStatus('synced');
        } catch (err: unknown) {
          // Targeted rollback: revert only this task without wiping other concurrent changes
          if (originalTask) {
            setAllTasks((prev) => prev.map((t) => (t.id === task.id ? originalTask! : t)));
          }
          setSyncStatus('error');
          logSafeError('Update Task', err);
          const msg = formatSafeErrorMessage(err, 'Failed to update cloud task');
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
      const current = allTasks.find((t) => t.id === id);
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
    [allTasks, updateTask]
  );

  const rescheduleTask = useCallback(
    async (id: string, newDate: string) => {
      const current = allTasks.find((t) => t.id === id);
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
    [allTasks, updateTask]
  );

  // Soft Delete: Move task and all its subtasks to Recycle Bin
  const removeTask = useCallback(
    async (id: string) => {
      const descendantIds = getAllDescendantIds(id, allTasks);
      const allIdsToDelete = new Set([id, ...descendantIds]);
      const deletionTime = nowISO();

      // Optimistic update
      let prevSnapshot: Task[] = [];
      setAllTasks((prev) => {
        prevSnapshot = prev;
        return prev.map((t) =>
          allIdsToDelete.has(t.id)
            ? { ...t, isDeleted: true, deletedAt: deletionTime, updatedAt: deletionTime }
            : t
        );
      });
      setSyncStatus('syncing');

      if (user && isConfigured) {
        try {
          await softDeleteCloudTasks(Array.from(allIdsToDelete), user.id, deletionTime);
          setSyncStatus('synced');
        } catch (err: unknown) {
          setAllTasks(prevSnapshot);
          setSyncStatus('error');
          logSafeError('Delete Task', err);
          const msg = formatSafeErrorMessage(err, 'Failed to move task to Recycle Bin');
          setError(msg);
          throw err;
        }
      } else {
        for (const taskId of allIdsToDelete) {
          const item = allTasks.find((t) => t.id === taskId);
          if (item) {
            await saveTask({
              ...item,
              isDeleted: true,
              deletedAt: deletionTime,
              updatedAt: deletionTime,
            });
          }
        }
        setSyncStatus('offline');
      }
    },
    [user, isConfigured, allTasks]
  );

  // Restore: Move task and all its subtasks back to active tasks
  const restoreTask = useCallback(
    async (id: string) => {
      const target = allTasks.find((t) => t.id === id);
      if (!target) return;

      const descendantIds = getAllDescendantIds(id, allTasks);
      const allIdsToRestore = new Set([id, ...descendantIds]);

      // Check if parent is active or still in recycle bin; if parent is deleted, re-parent to top level
      const activeParent = target.parentId
        ? allTasks.find((t) => t.id === target.parentId && !t.isDeleted)
        : null;
      const shouldReparentRoot = Boolean(target.parentId && !activeParent);

      const restoreTime = nowISO();
      const restorePayloads: { id: string; parentId?: string | null }[] = [];
      allIdsToRestore.forEach((tId) => {
        if (tId === id && shouldReparentRoot) {
          restorePayloads.push({ id: tId, parentId: null });
        } else {
          restorePayloads.push({ id: tId });
        }
      });

      let prevSnapshot: Task[] = [];
      setAllTasks((prev) => {
        prevSnapshot = prev;
        return prev.map((t) => {
          if (allIdsToRestore.has(t.id)) {
            return {
              ...t,
              isDeleted: false,
              deletedAt: undefined,
              parentId: t.id === id && shouldReparentRoot ? null : t.parentId,
              updatedAt: restoreTime,
            };
          }
          return t;
        });
      });
      setSyncStatus('syncing');

      if (user && isConfigured) {
        try {
          await restoreCloudTasks(restorePayloads, user.id);
          setSyncStatus('synced');
        } catch (err: unknown) {
          setAllTasks(prevSnapshot);
          setSyncStatus('error');
          logSafeError('Restore Task', err);
          const msg = formatSafeErrorMessage(err, 'Failed to restore task');
          setError(msg);
          throw err;
        }
      } else {
        for (const item of restorePayloads) {
          const found = allTasks.find((t) => t.id === item.id);
          if (found) {
            await saveTask({
              ...found,
              isDeleted: false,
              deletedAt: undefined,
              parentId: item.parentId !== undefined ? item.parentId : found.parentId,
              updatedAt: restoreTime,
            });
          }
        }
        setSyncStatus('offline');
      }
    },
    [user, isConfigured, allTasks]
  );

  // Permanent Delete: Hard delete task and all its subtasks
  const permanentDeleteTask = useCallback(
    async (id: string) => {
      const descendantIds = getAllDescendantIds(id, allTasks);
      const allIdsToDelete = new Set([id, ...descendantIds]);
      const idList = Array.from(allIdsToDelete);

      let prevSnapshot: Task[] = [];
      setAllTasks((prev) => {
        prevSnapshot = prev;
        return prev.filter((t) => !allIdsToDelete.has(t.id));
      });
      setSyncStatus('syncing');

      if (user && isConfigured) {
        try {
          await permanentDeleteCloudTasks(idList, user.id);
          setSyncStatus('synced');
        } catch (err: unknown) {
          setAllTasks(prevSnapshot);
          setSyncStatus('error');
          logSafeError('Permanent Delete Task', err);
          const msg = formatSafeErrorMessage(err, 'Failed to permanently delete task');
          setError(msg);
          throw err;
        }
      } else {
        for (const tId of idList) {
          await deleteTask(tId);
        }
        setSyncStatus('offline');
      }
    },
    [user, isConfigured, allTasks]
  );

  // Empty Recycle Bin: Permanently delete all soft-deleted tasks for the authenticated user
  const emptyRecycleBin = useCallback(async () => {
    const deletedIds = allTasks.filter((t) => Boolean(t.isDeleted)).map((t) => t.id);
    if (deletedIds.length === 0) return;

    let prevSnapshot: Task[] = [];
    setAllTasks((prev) => {
      prevSnapshot = prev;
      return prev.filter((t) => !t.isDeleted);
    });
    setSyncStatus('syncing');

    if (user && isConfigured) {
      try {
        await emptyCloudRecycleBin(user.id);
        setSyncStatus('synced');
      } catch (err: unknown) {
        setAllTasks(prevSnapshot);
        setSyncStatus('error');
        logSafeError('Empty Recycle Bin', err);
        const msg = formatSafeErrorMessage(err, 'Failed to empty Recycle Bin');
        setError(msg);
        throw err;
      }
    } else {
      for (const tId of deletedIds) {
        await deleteTask(tId);
      }
      setSyncStatus('offline');
    }
  }, [user, isConfigured, allTasks]);

  const reorderTasks = useCallback(
    async (updates: { id: string; orderIndex: number }[]) => {
      if (updates.length === 0) return;
      const orderMap = new Map(updates.map((u) => [u.id, u.orderIndex]));

      // Optimistic update
      let prevSnapshot: Task[] = [];
      setAllTasks((prev) => {
        prevSnapshot = prev;
        return prev.map((t) => {
          if (orderMap.has(t.id)) {
            return { ...t, orderIndex: orderMap.get(t.id)!, updatedAt: nowISO() };
          }
          return t;
        });
      });
      setSyncStatus('syncing');

      if (user && isConfigured) {
        try {
          await updateCloudTaskOrder(updates, user.id);
          setSyncStatus('synced');
        } catch (err: unknown) {
          setAllTasks(prevSnapshot);
          setSyncStatus('error');
          logSafeError('Reorder Tasks', err);
          const msg = formatSafeErrorMessage(err, 'Failed to update task order');
          setError(msg);
          throw err;
        }
      } else {
        for (const u of updates) {
          const item = allTasks.find((t) => t.id === u.id);
          if (item) {
            await saveTask({ ...item, orderIndex: u.orderIndex, updatedAt: nowISO() });
          }
        }
        setSyncStatus('offline');
      }
    },
    [user, isConfigured, allTasks]
  );

  const loadStarterPack = useCallback(async () => {
    if (user && isConfigured) {
      setSyncStatus('syncing');
      try {
        const seeded = await seedStarterTasks(user.id);
        setAllTasks((prev) => [...seeded, ...prev]);
        setSyncStatus('synced');
      } catch (err: unknown) {
        setSyncStatus('error');
        logSafeError('Load Starter Pack', err);
        const msg = formatSafeErrorMessage(err, 'Failed to load starter pack');
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
      setAllTasks((prev) => [...localSeeded, ...prev]);
    }
  }, [user, isConfigured]);

  const moveTaskArea = useCallback(
    async (taskId: string, targetArea: LifeArea) => {
      const task = allTasks.find((t) => t.id === taskId);
      if (!task) return;
      const updated: Task = {
        ...task,
        lifeArea: targetArea,
        updatedAt: nowISO(),
      };
      await updateTask(updated);
    },
    [allTasks, updateTask]
  );

  const assignTask = useCallback(
    async (
      taskId: string,
      updates: {
        lifeArea?: LifeArea;
        roadmapMonth?: number | null;
        projectId?: string | null;
        dueDate?: string;
        priority?: TaskPriority;
      }
    ) => {
      const task = allTasks.find((t) => t.id === taskId);
      if (!task) return;
      const updated: Task = {
        ...task,
        ...(updates.lifeArea !== undefined ? { lifeArea: updates.lifeArea } : {}),
        ...(updates.roadmapMonth !== undefined ? { roadmapMonth: updates.roadmapMonth ?? undefined } : {}),
        ...(updates.projectId !== undefined ? { projectId: updates.projectId ?? undefined } : {}),
        ...(updates.dueDate !== undefined ? { dueDate: updates.dueDate } : {}),
        ...(updates.priority !== undefined ? { priority: updates.priority } : {}),
        updatedAt: nowISO(),
      };
      await updateTask(updated);
    },
    [allTasks, updateTask]
  );

  const rescheduleAllOverdueTasks = useCallback(
    async (newDate: string): Promise<{ count: number }> => {
      const todayStr = today();
      const toReschedule = allTasks.filter(
        (t) => !t.isDeleted && t.dueDate < todayStr && t.status !== 'completed' && t.status !== 'rescheduled'
      );

      if (toReschedule.length === 0) return { count: 0 };

      setSyncStatus('syncing');
      const updateTime = nowISO();
      for (const task of toReschedule) {
        const updated: Task = {
          ...task,
          dueDate: newDate,
          status: 'rescheduled',
          rescheduledFrom: task.dueDate,
          rescheduledTo: newDate,
          updatedAt: updateTime,
        };
        await updateTask(updated);
      }
      setSyncStatus('synced');
      return { count: toReschedule.length };
    },
    [allTasks, updateTask]
  );

  // ── Computed Lists & Metrics ─────────────────────────────────────────────
  const currentDate = today();

  const todaysTasks = tasks.filter(
    (t) => (t.targetDate || t.dueDate) === currentDate && t.status !== 'rescheduled'
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

  // ── Milestones & Projects (Cloud Sync + Local Mirror) ───────────────────
  const updateMilestone = useCallback(
    async (milestone: RoadmapMilestone) => {
      setMilestones((prev) => prev.map((m) => (m.id === milestone.id ? milestone : m)));
      if (user && isConfigured) {
        await saveCloudMilestone(milestone, user.id);
      } else {
        await saveMilestone(milestone);
      }
    },
    [user, isConfigured]
  );

  const updateProject = useCallback(
    async (project: Project) => {
      const updated = { ...project, updatedAt: nowISO() };
      setProjects((prev) => {
        const exists = prev.some((p) => p.id === project.id);
        return exists ? prev.map((p) => (p.id === project.id ? updated : p)) : [updated, ...prev];
      });
      if (user && isConfigured) {
        await updateCloudProject(updated, user.id);
      } else {
        await saveProject(updated);
      }
    },
    [user, isConfigured]
  );

  const removeProject = useCallback(
    async (id: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (user && isConfigured) {
        await deleteCloudProject(id, user.id);
      } else {
        await deleteProject(id);
      }
    },
    [user, isConfigured]
  );

  // ── Daily Record / Reflections (Cloud Sync + Local Mirror) ───────────────
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
    setDailyRecords((prev) => {
      const exists = prev.findIndex((r) => r.date === today());
      return exists >= 0 ? prev.map((r, i) => (i === exists ? record : r)) : [...prev, record];
    });
    if (user && isConfigured) {
      await saveCloudDailyRecord(record, user.id);
    } else {
      await saveDailyRecord(record);
    }
  }, [todaysTasks, user, isConfigured]);

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
          saveSchedule(savedSchedule).catch(() => {});
          setSyncStatus('synced');
          return savedSchedule;
        } catch (err: unknown) {
          setSyncStatus('error');
          logSafeError('Create Schedule', err);
          const msg = formatSafeErrorMessage(err, 'Failed to create cloud schedule');
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
          saveSchedule(saved).catch(() => {});
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
          logSafeError('Update Schedule', err);
          const msg = formatSafeErrorMessage(err, 'Failed to update cloud schedule');
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
          deleteSchedule(id).catch(() => {});
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
          logSafeError('Delete Schedule', err);
          const msg = formatSafeErrorMessage(err, 'Failed to delete schedule from cloud');
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
          saveNote(savedNote).catch(() => {});
          setSyncStatus('synced');
          return savedNote;
        } catch (err: unknown) {
          setSyncStatus('error');
          logSafeError('Create Note', err);
          const msg = formatSafeErrorMessage(err, 'Failed to create cloud note');
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
          saveNote(saved).catch(() => {});
          setSyncStatus('synced');
        } catch (err: unknown) {
          if (originalNote) {
            setNotes((prev) => prev.map((n) => (n.id === note.id ? originalNote! : n)));
          }
          setSyncStatus('error');
          logSafeError('Update Note', err);
          const msg = formatSafeErrorMessage(err, 'Failed to update cloud note');
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
          deleteNote(id).catch(() => {});
          setSyncStatus('synced');
        } catch (err: unknown) {
          if (originalNote) {
            setNotes((prev) => (prev.some((n) => n.id === id) ? prev : [originalNote!, ...prev]));
          }
          setSyncStatus('error');
          logSafeError('Delete Note', err);
          const msg = formatSafeErrorMessage(err, 'Failed to delete note from cloud');
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

  // ── Communication Practice & Attendance Tracking Operations ────────────
  const addCommunicationSession = useCallback(
    async (
      sessionData: Omit<CommunicationSession, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<CommunicationSession> => {
      setSyncStatus('syncing');
      try {
        const created = await createCommunicationSession(sessionData, user?.id);
        setCommunicationSessions((prev) => [created, ...prev.filter((s) => s.id !== created.id)]);
        setSyncStatus(user && isConfigured ? 'synced' : 'offline');
        return created;
      } catch (err: unknown) {
        setSyncStatus('error');
        logSafeError('Create Communication Session', err);
        const msg = formatSafeErrorMessage(err, 'Failed to save communication session');
        setError(msg);
        throw err;
      }
    },
    [user, isConfigured]
  );

  const updateCommunicationSession = useCallback(
    async (session: CommunicationSession): Promise<void> => {
      setSyncStatus('syncing');
      try {
        const updated = await updateCloudCommSession(session, user?.id);
        setCommunicationSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        setSyncStatus(user && isConfigured ? 'synced' : 'offline');
      } catch (err: unknown) {
        setSyncStatus('error');
        logSafeError('Update Communication Session', err);
        const msg = formatSafeErrorMessage(err, 'Failed to update communication session');
        setError(msg);
        throw err;
      }
    },
    [user, isConfigured]
  );

  const removeCommunicationSession = useCallback(
    async (id: string): Promise<void> => {
      setSyncStatus('syncing');
      try {
        await deleteCloudCommSession(id, user?.id);
        setCommunicationSessions((prev) => prev.filter((s) => s.id !== id));
        setSyncStatus(user && isConfigured ? 'synced' : 'offline');
      } catch (err: unknown) {
        setSyncStatus('error');
        logSafeError('Delete Communication Session', err);
        const msg = formatSafeErrorMessage(err, 'Failed to delete communication session');
        setError(msg);
        throw err;
      }
    },
    [user, isConfigured]
  );

  // ── Uploads & Media Vault Operations ─────────────────────────────────────
  const uploadFile = useCallback(
    async (file: File, description?: string, onProgress?: (percent: number) => void): Promise<UserUpload> => {
      if (!user || !isConfigured) {
        throw new Error('Cloud Media Vault requires an authenticated account. Please Sign In to upload files.');
      }
      setSyncStatus('syncing');
      setError(null);
      try {
        const saved = await uploadUserFile(file, user.id, description, onProgress);
        setUploads((prev) => [saved, ...prev]);
        setSyncStatus('synced');
        return saved;
      } catch (err: unknown) {
        setSyncStatus('error');
        logSafeError('Upload File', err);
        const msg = formatSafeErrorMessage(err, 'Upload failed');
        setError(msg);
        throw err;
      }
    },
    [user, isConfigured]
  );

  const removeUpload = useCallback(
    async (upload: UserUpload) => {
      if (!user || !isConfigured) {
        throw new Error('Cloud Media Vault requires an authenticated account.');
      }
      let originalUpload: UserUpload | undefined;
      setUploads((prev) => {
        originalUpload = prev.find((u) => u.id === upload.id);
        return prev.filter((u) => u.id !== upload.id);
      });
      setSyncStatus('syncing');
      try {
        await deleteUserUpload(upload, user.id);
        setSyncStatus('synced');
      } catch (err: unknown) {
        if (originalUpload) {
          setUploads((prev) => (prev.some((u) => u.id === upload.id) ? prev : [originalUpload!, ...prev]));
        }
        setSyncStatus('error');
        logSafeError('Delete Upload', err);
        const msg = formatSafeErrorMessage(err, 'Failed to delete upload');
        setError(msg);
        throw err;
      }
    },
    [user, isConfigured]
  );

  const updateUpload = useCallback(
    async (id: string, updates: { fileName?: string; description?: string }) => {
      if (!user || !isConfigured) {
        throw new Error('Cloud Media Vault requires an authenticated account.');
      }
      let originalUpload: UserUpload | undefined;
      setUploads((prev) => {
        originalUpload = prev.find((u) => u.id === id);
        return prev.map((u) => (u.id === id ? { ...u, ...updates, updatedAt: nowISO() } : u));
      });
      setSyncStatus('syncing');
      try {
        const updated = await updateUserUploadMetadata(id, user.id, updates);
        setUploads((prev) => prev.map((u) => (u.id === id ? updated : u)));
        setSyncStatus('synced');
      } catch (err: unknown) {
        if (originalUpload) {
          setUploads((prev) => prev.map((u) => (u.id === id ? originalUpload! : u)));
        }
        setSyncStatus('error');
        logSafeError('Update Upload', err);
        const msg = formatSafeErrorMessage(err, 'Failed to update upload');
        setError(msg);
        throw err;
      }
    },
    [user, isConfigured]
  );

  const getDownloadUrl = useCallback(
    async (filePath: string): Promise<string> => {
      return getUploadSignedUrl(filePath, 3600);
    },
    []
  );

  // ── Backup / Export / Import / Reset ─────────────────────────────────────
  const exportData = useCallback(async () => {
    const data = await exportAllData();
    data.tasks = tasks; // Export live tasks
    data.schedules = schedules; // Export live schedules
    data.notes = notes; // Export live notes
    data.uploads = uploads; // Export live uploads
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-os-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [tasks, schedules, notes, uploads]);

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
    const [t, sc, nt, ms, ps, dr, s, comm] = await Promise.all([
      getAllTasks(),
      getAllSchedules(),
      getAllNotes(),
      getAllMilestones(),
      getAllProjects(),
      getAllDailyRecords(),
      getSettings(),
      fetchUserCommunicationSessions(''),
    ]);
    setAllTasks(t);
    setSchedules(sc);
    setNotes(nt);
    setMilestones(ms);
    setProjects(ps);
    setDailyRecords(dr);
    setCommunicationSessions(comm);
    if (s) {
      setSettings(s);
      applyTheme(s.theme, s.appearance);
    }
  }, []);

  const resetData = useCallback(async () => {
    await clearAllData();
    const s = getDefaultSettings();
    await saveSettings(s);
    setSettings(s);
    applyTheme(s.theme, s.appearance);
    setAllTasks([]);
    setSchedules([]);
    setNotes([]);
    setUploads([]);
    setDailyRecords([]);
    setCommunicationSessions([]);
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
        uploads,
        milestones,
        projects,
        dailyRecords,
        communicationSessions,
        isLoading,
        error,
        syncStatus,
        updateSettings,
        customLifeAreas,
        updateLifeAreas,
        restoreDefaultLifeAreas,
        updateAppearance,
        addTask,
        updateTask,
        completeTask,
        rescheduleTask,
        removeTask,
        restoreTask,
        permanentDeleteTask,
        emptyRecycleBin,
        reorderTasks,
        loadStarterPack,
        moveTaskArea,
        assignTask,
        rescheduleAllOverdueTasks,
        todaysTasks,
        overdueTasks,
        deletedTasks,
        addSchedule,
        updateSchedule,
        removeSchedule,
        addNote,
        updateNote,
        removeNote,
        addCommunicationSession,
        updateCommunicationSession,
        removeCommunicationSession,
        uploadFile,
        removeUpload,
        updateUpload,
        getDownloadUrl,
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
