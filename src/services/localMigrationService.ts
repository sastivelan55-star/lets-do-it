// LifeMap — Safe Non-Destructive Local-to-Cloud Data Migration Service
// Preserves all existing user records on web and mobile devices, ensuring zero data loss.
import type { Task, Project, RoadmapMilestone, ScheduleEntry, Note, DailyRecord } from '../types';
import {
  getAllTasks,
  getAllProjects,
  getAllMilestones,
  getAllSchedules,
  getAllNotes,
  getAllDailyRecords,
} from '../db/storage';
import { createCloudTask } from './taskService';
import { createCloudProject } from './projectService';
import { saveCloudMilestone } from './milestoneService';
import { createCloudSchedule } from './scheduleService';
import { createCloudNote } from './noteService';
import { saveCloudDailyRecord } from './dailyRecordService';
import { logSafeError } from '../utils/errorUtils';

// Track migrations per user in sessionStorage so we don't spam requests repeatedly
const MIGRATED_USERS_KEY = 'lifeos_migrated_users';

function hasMigratedForSession(userId: string): boolean {
  try {
    const raw = sessionStorage.getItem(MIGRATED_USERS_KEY);
    if (!raw) return false;
    const set = JSON.parse(raw);
    return Array.isArray(set) && set.includes(userId);
  } catch {
    return false;
  }
}

function markMigratedForSession(userId: string): void {
  try {
    const raw = sessionStorage.getItem(MIGRATED_USERS_KEY);
    const set: string[] = raw ? JSON.parse(raw) : [];
    if (!set.includes(userId)) {
      set.push(userId);
      sessionStorage.setItem(MIGRATED_USERS_KEY, JSON.stringify(set));
    }
  } catch {}
}

export interface MigrationSummary {
  tasksMigrated: number;
  projectsMigrated: number;
  milestonesMigrated: number;
  schedulesMigrated: number;
  notesMigrated: number;
  dailyRecordsMigrated: number;
}

/**
 * Safely migrates any local IndexedDB records that exist only on this device
 * up to the centralized Supabase database without overwriting existing cloud records.
 */
export async function migrateLocalDataToCloud(
  userId: string,
  cloudData: {
    tasks: Task[];
    projects: Project[];
    milestones: RoadmapMilestone[];
    schedules: ScheduleEntry[];
    notes: Note[];
    dailyRecords: DailyRecord[];
  }
): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    tasksMigrated: 0,
    projectsMigrated: 0,
    milestonesMigrated: 0,
    schedulesMigrated: 0,
    notesMigrated: 0,
    dailyRecordsMigrated: 0,
  };

  if (!userId || userId === 'guest') return summary;
  if (hasMigratedForSession(userId)) return summary;

  try {
    const [localTasks, localProjects, localMilestones, localSchedules, localNotes, localRecords] =
      await Promise.all([
        getAllTasks(),
        getAllProjects(),
        getAllMilestones(),
        getAllSchedules(),
        getAllNotes(),
        getAllDailyRecords(),
      ]);

    const cloudTaskIdSet = new Set(cloudData.tasks.map((t) => t.id));
    const cloudProjectIdSet = new Set(cloudData.projects.map((p) => p.id));
    const cloudMilestoneIdSet = new Set(cloudData.milestones.map((m) => m.id));
    const cloudScheduleIdSet = new Set(cloudData.schedules.map((s) => s.id));
    const cloudNoteIdSet = new Set(cloudData.notes.map((n) => n.id));
    const cloudRecordDateSet = new Set(cloudData.dailyRecords.map((r) => r.date));

    // 1. Migrate Local Tasks that don't exist in cloud
    for (const lt of localTasks) {
      if (!cloudTaskIdSet.has(lt.id) && lt.title && lt.title.trim().length > 0) {
        try {
          await createCloudTask(lt, userId);
          summary.tasksMigrated++;
        } catch (err) {
          logSafeError('migrateLocalData: task', err);
        }
      }
    }

    // 2. Migrate Local Projects
    for (const lp of localProjects) {
      if (!cloudProjectIdSet.has(lp.id) && lp.name && lp.name.trim().length > 0) {
        try {
          await createCloudProject(lp, userId);
          summary.projectsMigrated++;
        } catch (err) {
          logSafeError('migrateLocalData: project', err);
        }
      }
    }

    // 3. Migrate Local Milestones
    for (const lm of localMilestones) {
      if (!cloudMilestoneIdSet.has(lm.id) && lm.title && lm.title.trim().length > 0) {
        try {
          await saveCloudMilestone(lm, userId);
          summary.milestonesMigrated++;
        } catch (err) {
          logSafeError('migrateLocalData: milestone', err);
        }
      }
    }

    // 4. Migrate Local Schedules
    for (const ls of localSchedules) {
      if (!cloudScheduleIdSet.has(ls.id) && ls.title && ls.title.trim().length > 0) {
        try {
          await createCloudSchedule(ls, userId);
          summary.schedulesMigrated++;
        } catch (err) {
          logSafeError('migrateLocalData: schedule', err);
        }
      }
    }

    // 5. Migrate Local Notes
    for (const ln of localNotes) {
      if (!cloudNoteIdSet.has(ln.id) && ln.title && ln.title.trim().length > 0) {
        try {
          await createCloudNote(ln, userId);
          summary.notesMigrated++;
        } catch (err) {
          logSafeError('migrateLocalData: note', err);
        }
      }
    }

    // 6. Migrate Local Daily Records
    for (const lr of localRecords) {
      if (!cloudRecordDateSet.has(lr.date)) {
        try {
          await saveCloudDailyRecord(lr, userId);
          summary.dailyRecordsMigrated++;
        } catch (err) {
          logSafeError('migrateLocalData: dailyRecord', err);
        }
      }
    }

    markMigratedForSession(userId);
  } catch (err) {
    logSafeError('migrateLocalDataToCloud global', err);
  }

  return summary;
}
