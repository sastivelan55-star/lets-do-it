// LifeMap Storage Layer — IndexedDB via idb
// This module is UI-framework-agnostic. All DB interactions go here.

import { openDB, type IDBPDatabase } from 'idb';
import type { AppData, AppSettings, Task, RoadmapMilestone, Project, DailyRecord } from '../types';

const DB_NAME = 'lifemap-db';
const DB_VERSION = 1;

const STORES = {
  settings: 'settings',
  tasks: 'tasks',
  dailyRecords: 'dailyRecords',
  roadmapMilestones: 'roadmapMilestones',
  communicationEntries: 'communicationEntries',
  careerItems: 'careerItems',
  internshipApplications: 'internshipApplications',
  projects: 'projects',
  contentItems: 'contentItems',
  healthEntries: 'healthEntries',
  weeklyReviews: 'weeklyReviews',
} as const;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Settings store (single object with key 'app')
        if (!db.objectStoreNames.contains(STORES.settings)) {
          db.createObjectStore(STORES.settings);
        }
        // Tasks store
        if (!db.objectStoreNames.contains(STORES.tasks)) {
          const tasksStore = db.createObjectStore(STORES.tasks, { keyPath: 'id' });
          tasksStore.createIndex('dueDate', 'dueDate');
          tasksStore.createIndex('lifeArea', 'lifeArea');
          tasksStore.createIndex('status', 'status');
          tasksStore.createIndex('projectId', 'projectId');
        }
        // Daily records
        if (!db.objectStoreNames.contains(STORES.dailyRecords)) {
          db.createObjectStore(STORES.dailyRecords, { keyPath: 'date' });
        }
        // Roadmap milestones
        if (!db.objectStoreNames.contains(STORES.roadmapMilestones)) {
          const ms = db.createObjectStore(STORES.roadmapMilestones, { keyPath: 'id' });
          ms.createIndex('month', 'month');
        }
        // Communication entries
        if (!db.objectStoreNames.contains(STORES.communicationEntries)) {
          const ce = db.createObjectStore(STORES.communicationEntries, { keyPath: 'id' });
          ce.createIndex('date', 'date');
        }
        // Career items
        if (!db.objectStoreNames.contains(STORES.careerItems)) {
          db.createObjectStore(STORES.careerItems, { keyPath: 'id' });
        }
        // Internship applications
        if (!db.objectStoreNames.contains(STORES.internshipApplications)) {
          const ia = db.createObjectStore(STORES.internshipApplications, { keyPath: 'id' });
          ia.createIndex('appliedDate', 'appliedDate');
        }
        // Projects
        if (!db.objectStoreNames.contains(STORES.projects)) {
          db.createObjectStore(STORES.projects, { keyPath: 'id' });
        }
        // Content items
        if (!db.objectStoreNames.contains(STORES.contentItems)) {
          const ci = db.createObjectStore(STORES.contentItems, { keyPath: 'id' });
          ci.createIndex('type', 'type');
        }
        // Health entries
        if (!db.objectStoreNames.contains(STORES.healthEntries)) {
          const he = db.createObjectStore(STORES.healthEntries, { keyPath: 'id' });
          he.createIndex('date', 'date');
        }
        // Weekly reviews
        if (!db.objectStoreNames.contains(STORES.weeklyReviews)) {
          const wr = db.createObjectStore(STORES.weeklyReviews, { keyPath: 'id' });
          wr.createIndex('weekStart', 'weekStart');
        }
      },
    });
  }
  return dbPromise;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings | undefined> {
  const db = await getDB();
  return db.get(STORES.settings, 'app');
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put(STORES.settings, settings, 'app');
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function getAllTasks(): Promise<Task[]> {
  const db = await getDB();
  return db.getAll(STORES.tasks);
}

export async function getTasksByDate(date: string): Promise<Task[]> {
  const db = await getDB();
  const index = db.transaction(STORES.tasks).store.index('dueDate');
  return index.getAll(date);
}

export async function saveTask(task: Task): Promise<void> {
  const db = await getDB();
  await db.put(STORES.tasks, task);
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.tasks, id);
}

// ─── Daily Records ────────────────────────────────────────────────────────────

export async function getAllDailyRecords(): Promise<DailyRecord[]> {
  const db = await getDB();
  return db.getAll(STORES.dailyRecords);
}

export async function getDailyRecord(date: string): Promise<DailyRecord | undefined> {
  const db = await getDB();
  return db.get(STORES.dailyRecords, date);
}

export async function saveDailyRecord(record: DailyRecord): Promise<void> {
  const db = await getDB();
  await db.put(STORES.dailyRecords, record);
}

// ─── Roadmap Milestones ───────────────────────────────────────────────────────

export async function getAllMilestones(): Promise<RoadmapMilestone[]> {
  const db = await getDB();
  const all = await db.getAll(STORES.roadmapMilestones);
  return all.sort((a, b) => a.month - b.month);
}

export async function saveMilestone(milestone: RoadmapMilestone): Promise<void> {
  const db = await getDB();
  await db.put(STORES.roadmapMilestones, milestone);
}

// ─── Projects ────────────────────────────────────────────────────────────────

export async function getAllProjects(): Promise<Project[]> {
  const db = await getDB();
  return db.getAll(STORES.projects);
}

export async function saveProject(project: Project): Promise<void> {
  const db = await getDB();
  await db.put(STORES.projects, project);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.projects, id);
}

// ─── Generic store helpers ────────────────────────────────────────────────────

export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await getDB();
  return db.getAll(storeName);
}

export async function saveToStore<T>(storeName: string, item: T): Promise<void> {
  const db = await getDB();
  await db.put(storeName, item);
}

export async function deleteFromStore(storeName: string, id: string): Promise<void> {
  const db = await getDB();
  await db.delete(storeName, id);
}

// ─── Export / Import ──────────────────────────────────────────────────────────

export async function exportAllData(): Promise<AppData> {
  const db = await getDB();
  const [
    settings,
    tasks,
    dailyRecords,
    roadmapMilestones,
    communicationEntries,
    careerItems,
    internshipApplications,
    projects,
    contentItems,
    healthEntries,
    weeklyReviews,
  ] = await Promise.all([
    db.get(STORES.settings, 'app'),
    db.getAll(STORES.tasks),
    db.getAll(STORES.dailyRecords),
    db.getAll(STORES.roadmapMilestones),
    db.getAll(STORES.communicationEntries),
    db.getAll(STORES.careerItems),
    db.getAll(STORES.internshipApplications),
    db.getAll(STORES.projects),
    db.getAll(STORES.contentItems),
    db.getAll(STORES.healthEntries),
    db.getAll(STORES.weeklyReviews),
  ]);

  return {
    settings: settings ?? getDefaultSettings(),
    tasks,
    dailyRecords,
    roadmapMilestones,
    communicationEntries,
    careerItems,
    internshipApplications,
    projects,
    contentItems,
    healthEntries,
    weeklyReviews,
  };
}

export async function importAllData(data: AppData): Promise<void> {
  // Validate basic structure
  if (!data || typeof data !== 'object') throw new Error('Invalid data: not an object');
  if (!Array.isArray(data.tasks)) throw new Error('Invalid data: tasks must be an array');
  if (!Array.isArray(data.projects)) throw new Error('Invalid data: projects must be an array');

  const db = await getDB();

  // Clear and repopulate each store
  const tx = db.transaction(Object.values(STORES), 'readwrite');

  await tx.objectStore(STORES.settings).clear();
  if (data.settings) await tx.objectStore(STORES.settings).put(data.settings, 'app');

  await tx.objectStore(STORES.tasks).clear();
  for (const t of data.tasks ?? []) await tx.objectStore(STORES.tasks).put(t);

  await tx.objectStore(STORES.dailyRecords).clear();
  for (const r of data.dailyRecords ?? []) await tx.objectStore(STORES.dailyRecords).put(r);

  await tx.objectStore(STORES.roadmapMilestones).clear();
  for (const m of data.roadmapMilestones ?? []) await tx.objectStore(STORES.roadmapMilestones).put(m);

  await tx.objectStore(STORES.communicationEntries).clear();
  for (const e of data.communicationEntries ?? []) await tx.objectStore(STORES.communicationEntries).put(e);

  await tx.objectStore(STORES.careerItems).clear();
  for (const c of data.careerItems ?? []) await tx.objectStore(STORES.careerItems).put(c);

  await tx.objectStore(STORES.internshipApplications).clear();
  for (const a of data.internshipApplications ?? []) await tx.objectStore(STORES.internshipApplications).put(a);

  await tx.objectStore(STORES.projects).clear();
  for (const p of data.projects ?? []) await tx.objectStore(STORES.projects).put(p);

  await tx.objectStore(STORES.contentItems).clear();
  for (const i of data.contentItems ?? []) await tx.objectStore(STORES.contentItems).put(i);

  await tx.objectStore(STORES.healthEntries).clear();
  for (const h of data.healthEntries ?? []) await tx.objectStore(STORES.healthEntries).put(h);

  await tx.objectStore(STORES.weeklyReviews).clear();
  for (const w of data.weeklyReviews ?? []) await tx.objectStore(STORES.weeklyReviews).put(w);

  await tx.done;
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(Object.values(STORES), 'readwrite');
  for (const store of Object.values(STORES)) {
    await tx.objectStore(store).clear();
  }
  await tx.done;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

export function getDefaultSettings(): AppSettings {
  return {
    theme: 'dark',
    displayName: 'Student',
    lifeAreaWeights: {
      technical: 50,
      communication: 15,
      career: 15,
      creativity: 10,
      health: 10,
    },
    workingHoursStart: '07:00',
    workingHoursEnd: '22:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dataVersion: 1,
  };
}
