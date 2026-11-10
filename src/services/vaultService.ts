// Life OS — Personal Resource Library & Digital Vault Service
// Supabase Cloud Storage + PostgreSQL with RLS & Robust Offline/Local Mirroring
import { getSupabase } from './supabaseClient';
import type { VaultResource, VaultCollection, VaultResourceType } from '../types/vault';
import { logSafeError } from '../utils/errorUtils';

const STORAGE_PREFIX = 'lifeos_vault';

export interface DbVaultCollectionRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  cover_image: string | null;
  is_favourite: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface DbVaultResourceRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  resource_type: VaultResourceType;
  url: string | null;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  thumbnail_url: string | null;
  favicon_url: string | null;
  domain: string | null;
  collection_id: string | null;
  tags: string[] | null;
  notes: string | null;
  code_content: string | null;
  code_language: string | null;
  is_favourite: boolean;
  is_archived: boolean;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

function getStorage(): Storage | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    // In restricted sandbox or test environments
  }
  return null;
}

// ── Default Seed Data for New Users ──────────────────────────────────────────

export const DEFAULT_COLLECTIONS: Omit<VaultCollection, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Design Inspiration',
    description: 'UI/UX benchmarks, animations, color palettes, and cyberpunk art styles',
    color: '#d946ef',
    icon: 'Palette',
    isFavourite: true,
    orderIndex: 0,
  },
  {
    name: 'Development & Code',
    description: 'Libraries, repositories, algorithms, architectures, and snippets',
    color: '#22c55e',
    icon: 'Code2',
    isFavourite: true,
    orderIndex: 1,
  },
  {
    name: 'Learning & Guides',
    description: 'Tutorials, computer science roadmaps, deep-dives, and documentation',
    color: '#38bdf8',
    icon: 'GraduationCap',
    isFavourite: false,
    orderIndex: 2,
  },
  {
    name: 'Personal Ideas & Notes',
    description: 'Quick thoughts, product visions, research questions, and memos',
    color: '#eab308',
    icon: 'Lightbulb',
    isFavourite: false,
    orderIndex: 3,
  },
  {
    name: 'Watch Later',
    description: 'YouTube tech talks, tutorials, anime clips, and conference recordings',
    color: '#ef4444',
    icon: 'Tv',
    isFavourite: false,
    orderIndex: 4,
  },
  {
    name: 'Read Later',
    description: 'Articles, essays, engineering blogs, and newsletters',
    color: '#06b6d4',
    icon: 'BookOpen',
    isFavourite: false,
    orderIndex: 5,
  },
];

export const INITIAL_SAMPLE_RESOURCES: Omit<VaultResource, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Lofi Cyberpunk & Ambient Focus Radio',
    description: 'Deep coding sessions and ambient background flow state beats.',
    resourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    thumbnailUrl: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=128',
    domain: 'youtube.com',
    tags: ['focus', 'music', 'flow', 'ambient'],
    notes: 'Great background track for late-night programming sprints.',
    isFavourite: true,
    isArchived: false,
    viewCount: 14,
  },
  {
    title: 'React Documentation & Interactive Architecture',
    description: 'Official React guides, hooks lifecycle, server components, and patterns.',
    resourceType: 'link',
    url: 'https://react.dev',
    faviconUrl: 'https://www.google.com/s2/favicons?domain=react.dev&sz=128',
    domain: 'react.dev',
    tags: ['react', 'frontend', 'docs'],
    notes: 'Key reference for hooks optimization and component state hierarchy.',
    isFavourite: true,
    isArchived: false,
    viewCount: 28,
  },
  {
    title: 'Fast TypeScript Debounce Hook Pattern',
    description: 'Safe debounced callback utility with cleanup for search inputs and auto-saves.',
    resourceType: 'code',
    codeLanguage: 'typescript',
    codeContent: `export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debounced, setDebounced] = React.useState<T>(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}`,
    tags: ['typescript', 'hooks', 'react', 'utility'],
    notes: 'Used across search inputs and draft savers.',
    isFavourite: false,
    isArchived: false,
    viewCount: 9,
  },
  {
    title: 'Life OS Architecture Vision & Future Milestones',
    description: 'Notes on scaling the personal command center, AI companion, and mobile parity.',
    resourceType: 'note',
    notes: `# Life OS Vision
- Unified Daily Timetable and Quests synchronization
- Digital Vault with instantaneous search and rich media previews
- Offline-first resilience with optimistic local storage rollbacks
- Cyberpunk anime RPG personalization`,
    tags: ['vision', 'roadmap', 'life-os'],
    isFavourite: true,
    isArchived: false,
    viewCount: 42,
  },
];

// ── DB Row Converters ────────────────────────────────────────────────────────

export function dbRowToCollection(row: DbVaultCollectionRow): VaultCollection {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description || undefined,
    color: row.color,
    icon: row.icon || undefined,
    coverImage: row.cover_image || undefined,
    isFavourite: Boolean(row.is_favourite),
    orderIndex: row.order_index ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function collectionToDbRow(coll: Partial<VaultCollection>, userId: string): Partial<DbVaultCollectionRow> {
  const row: Partial<DbVaultCollectionRow> = { user_id: userId };
  if (coll.id !== undefined) row.id = coll.id;
  if (coll.name !== undefined) row.name = coll.name.trim();
  if (coll.description !== undefined) row.description = coll.description || null;
  if (coll.color !== undefined) row.color = coll.color;
  if (coll.icon !== undefined) row.icon = coll.icon || null;
  if (coll.coverImage !== undefined) row.cover_image = coll.coverImage || null;
  if (coll.isFavourite !== undefined) row.is_favourite = coll.isFavourite;
  if (coll.orderIndex !== undefined) row.order_index = coll.orderIndex;
  return row;
}

export function dbRowToResource(row: DbVaultResourceRow): VaultResource {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || undefined,
    resourceType: row.resource_type,
    url: row.url || undefined,
    filePath: row.file_path || undefined,
    fileSize: row.file_size ? Number(row.file_size) : undefined,
    mimeType: row.mime_type || undefined,
    thumbnailUrl: row.thumbnail_url || undefined,
    faviconUrl: row.favicon_url || undefined,
    domain: row.domain || undefined,
    collectionId: row.collection_id || undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    notes: row.notes || undefined,
    codeContent: row.code_content || undefined,
    codeLanguage: row.code_language || undefined,
    isFavourite: Boolean(row.is_favourite),
    isArchived: Boolean(row.is_archived),
    viewCount: row.view_count || 0,
    lastViewedAt: row.last_viewed_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function resourceToDbRow(res: Partial<VaultResource>, userId: string): Partial<DbVaultResourceRow> {
  const row: Partial<DbVaultResourceRow> = { user_id: userId };
  if (res.id !== undefined) row.id = res.id;
  if (res.title !== undefined) row.title = res.title.trim();
  if (res.description !== undefined) row.description = res.description || null;
  if (res.resourceType !== undefined) row.resource_type = res.resourceType;
  if (res.url !== undefined) row.url = res.url || null;
  if (res.filePath !== undefined) row.file_path = res.filePath || null;
  if (res.fileSize !== undefined) row.file_size = res.fileSize || null;
  if (res.mimeType !== undefined) row.mime_type = res.mimeType || null;
  if (res.thumbnailUrl !== undefined) row.thumbnail_url = res.thumbnailUrl || null;
  if (res.faviconUrl !== undefined) row.favicon_url = res.faviconUrl || null;
  if (res.domain !== undefined) row.domain = res.domain || null;
  if (res.collectionId !== undefined) row.collection_id = res.collectionId || null;
  if (res.tags !== undefined) row.tags = res.tags;
  if (res.notes !== undefined) row.notes = res.notes || null;
  if (res.codeContent !== undefined) row.code_content = res.codeContent || null;
  if (res.codeLanguage !== undefined) row.code_language = res.codeLanguage || null;
  if (res.isFavourite !== undefined) row.is_favourite = res.isFavourite;
  if (res.isArchived !== undefined) row.is_archived = res.isArchived;
  if (res.viewCount !== undefined) row.view_count = res.viewCount;
  if (res.lastViewedAt !== undefined) row.last_viewed_at = res.lastViewedAt || null;
  return row;
}

// ── Local Storage Helpers ────────────────────────────────────────────────────

function getCollectionStorageKey(userId?: string | null): string {
  return `${STORAGE_PREFIX}_collections_${userId || 'guest'}`;
}

function getResourceStorageKey(userId?: string | null): string {
  return `${STORAGE_PREFIX}_resources_${userId || 'guest'}`;
}

export function loadLocalCollections(userId?: string | null): VaultCollection[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(getCollectionStorageKey(userId));
    if (raw) return JSON.parse(raw);
  } catch (err) {
    logSafeError('loadLocalCollections', err);
  }
  return [];
}

export function saveLocalCollections(collections: VaultCollection[], userId?: string | null): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(getCollectionStorageKey(userId), JSON.stringify(collections));
  } catch (err) {
    logSafeError('saveLocalCollections', err);
  }
}

export function loadLocalResources(userId?: string | null): VaultResource[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(getResourceStorageKey(userId));
    if (raw) return JSON.parse(raw);
  } catch (err) {
    logSafeError('loadLocalResources', err);
  }
  return [];
}

export function saveLocalResources(resources: VaultResource[], userId?: string | null): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(getResourceStorageKey(userId), JSON.stringify(resources));
  } catch (err) {
    logSafeError('saveLocalResources', err);
  }
}

// ── Cloud / Unified Collection Operations ───────────────────────────────────

export async function fetchVaultCollections(userId?: string | null): Promise<VaultCollection[]> {
  const local = loadLocalCollections(userId);

  // If local is completely empty, initialize with default seed collections
  if (local.length === 0) {
    const now = new Date().toISOString();
    const seeded: VaultCollection[] = DEFAULT_COLLECTIONS.map((c, i) => ({
      ...c,
      id: `local_col_${Date.now()}_${i}`,
      userId: userId || 'guest',
      createdAt: now,
      updatedAt: now,
    }));
    saveLocalCollections(seeded, userId);
    return seeded;
  }

  const supabase = getSupabase();
  if (!supabase || !userId) {
    return local;
  }

  try {
    const { data, error } = await supabase
      .from('vault_collections')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (!error && data && data.length > 0) {
      const cloudCollections = (data as DbVaultCollectionRow[]).map(dbRowToCollection);
      saveLocalCollections(cloudCollections, userId);
      return cloudCollections;
    }
  } catch (err) {
    logSafeError('fetchVaultCollections cloud', err);
  }

  return local;
}

export async function createVaultCollection(
  data: Partial<VaultCollection>,
  userId: string
): Promise<VaultCollection> {
  const now = new Date().toISOString();
  const newCol: VaultCollection = {
    id: data.id || `col_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    name: data.name?.trim() || 'Untitled Collection',
    description: data.description,
    color: data.color || '#a855f7',
    icon: data.icon || 'Folder',
    coverImage: data.coverImage,
    isFavourite: Boolean(data.isFavourite),
    orderIndex: data.orderIndex ?? 0,
    createdAt: now,
    updatedAt: now,
  };

  // 1. Save locally immediately
  const existing = loadLocalCollections(userId);
  saveLocalCollections([...existing, newCol], userId);

  // 2. Cloud sync if Supabase configured
  const supabase = getSupabase();
  if (supabase && userId !== 'guest') {
    try {
      const payload = collectionToDbRow(newCol, userId);
      // Remove local client id if not standard UUID format
      if (payload.id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.id)) {
        delete payload.id;
      }
      const { data: cloudData, error } = await supabase
        .from('vault_collections')
        .insert(payload)
        .select()
        .single();

      if (!error && cloudData) {
        const saved = dbRowToCollection(cloudData as DbVaultCollectionRow);
        // Update local with cloud UUID
        const updatedLocal = loadLocalCollections(userId).map((c) => (c.id === newCol.id ? saved : c));
        saveLocalCollections(updatedLocal, userId);
        return saved;
      }
    } catch (err) {
      logSafeError('createVaultCollection cloud', err);
    }
  }

  return newCol;
}

export async function updateVaultCollection(
  collection: VaultCollection,
  userId: string
): Promise<VaultCollection> {
  const updated: VaultCollection = {
    ...collection,
    updatedAt: new Date().toISOString(),
  };

  // 1. Update local
  const existing = loadLocalCollections(userId);
  saveLocalCollections(
    existing.map((c) => (c.id === updated.id ? updated : c)),
    userId
  );

  // 2. Cloud update
  const supabase = getSupabase();
  if (supabase && userId !== 'guest') {
    try {
      const payload = collectionToDbRow(updated, userId);
      delete payload.id;
      await supabase
        .from('vault_collections')
        .update(payload)
        .eq('id', updated.id)
        .eq('user_id', userId);
    } catch (err) {
      logSafeError('updateVaultCollection cloud', err);
    }
  }

  return updated;
}

export async function deleteVaultCollection(id: string, userId: string): Promise<void> {
  // 1. Remove locally
  const existing = loadLocalCollections(userId);
  saveLocalCollections(existing.filter((c) => c.id !== id), userId);

  // Also remove collection reference from local resources
  const resources = loadLocalResources(userId);
  saveLocalResources(
    resources.map((r) => (r.collectionId === id ? { ...r, collectionId: undefined } : r)),
    userId
  );

  // 2. Cloud delete
  const supabase = getSupabase();
  if (supabase && userId !== 'guest') {
    try {
      await supabase
        .from('vault_collections')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    } catch (err) {
      logSafeError('deleteVaultCollection cloud', err);
    }
  }
}

// ── Cloud / Unified Resource Operations ─────────────────────────────────────

export async function fetchVaultResources(userId?: string | null): Promise<VaultResource[]> {
  const local = loadLocalResources(userId);

  // Seed with sample resources if completely empty
  if (local.length === 0) {
    const now = new Date().toISOString();
    const seeded: VaultResource[] = INITIAL_SAMPLE_RESOURCES.map((r, i) => ({
      ...r,
      id: `local_res_${Date.now()}_${i}`,
      userId: userId || 'guest',
      createdAt: now,
      updatedAt: now,
    }));
    saveLocalResources(seeded, userId);
    return seeded;
  }

  const supabase = getSupabase();
  if (!supabase || !userId) {
    return local;
  }

  try {
    const { data, error } = await supabase
      .from('vault_resources')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const cloudResources = (data as DbVaultResourceRow[]).map(dbRowToResource);
      saveLocalResources(cloudResources, userId);
      return cloudResources;
    }
  } catch (err) {
    logSafeError('fetchVaultResources cloud', err);
  }

  return local;
}

export async function createVaultResource(
  data: Partial<VaultResource>,
  userId: string
): Promise<VaultResource> {
  const now = new Date().toISOString();
  const newRes: VaultResource = {
    id: data.id || `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    title: data.title?.trim() || 'Untitled Resource',
    description: data.description,
    resourceType: data.resourceType || 'link',
    url: data.url,
    filePath: data.filePath,
    fileSize: data.fileSize,
    mimeType: data.mimeType,
    thumbnailUrl: data.thumbnailUrl,
    faviconUrl: data.faviconUrl,
    domain: data.domain,
    collectionId: data.collectionId,
    tags: Array.isArray(data.tags) ? data.tags : [],
    notes: data.notes,
    codeContent: data.codeContent,
    codeLanguage: data.codeLanguage,
    isFavourite: Boolean(data.isFavourite),
    isArchived: Boolean(data.isArchived),
    viewCount: 0,
    lastViewedAt: undefined,
    createdAt: now,
    updatedAt: now,
  };

  // 1. Save locally immediately
  const existing = loadLocalResources(userId);
  saveLocalResources([newRes, ...existing], userId);

  // 2. Cloud sync if Supabase configured
  const supabase = getSupabase();
  if (supabase && userId !== 'guest') {
    try {
      const payload = resourceToDbRow(newRes, userId);
      // Remove non-UUID client id so Postgres generates gen_random_uuid()
      if (payload.id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.id)) {
        delete payload.id;
      }
      const { data: cloudData, error } = await supabase
        .from('vault_resources')
        .insert(payload)
        .select()
        .single();

      if (!error && cloudData) {
        const saved = dbRowToResource(cloudData as DbVaultResourceRow);
        const updatedLocal = loadLocalResources(userId).map((r) => (r.id === newRes.id ? saved : r));
        saveLocalResources(updatedLocal, userId);
        return saved;
      } else if (error) {
        logSafeError('createVaultResource insert error', error);
      }
    } catch (err) {
      logSafeError('createVaultResource cloud', err);
    }
  }

  return newRes;
}

export async function updateVaultResource(
  resource: VaultResource,
  userId: string
): Promise<VaultResource> {
  const updated: VaultResource = {
    ...resource,
    updatedAt: new Date().toISOString(),
  };

  // 1. Update local
  const existing = loadLocalResources(userId);
  saveLocalResources(
    existing.map((r) => (r.id === updated.id ? updated : r)),
    userId
  );

  // 2. Cloud sync
  const supabase = getSupabase();
  if (supabase && userId !== 'guest') {
    try {
      const payload = resourceToDbRow(updated, userId);
      delete payload.id;
      await supabase
        .from('vault_resources')
        .update(payload)
        .eq('id', updated.id)
        .eq('user_id', userId);
    } catch (err) {
      logSafeError('updateVaultResource cloud', err);
    }
  }

  return updated;
}

export async function deleteVaultResource(id: string, userId: string): Promise<void> {
  // 1. Delete locally
  const existing = loadLocalResources(userId);
  saveLocalResources(existing.filter((r) => r.id !== id), userId);

  // 2. Cloud delete
  const supabase = getSupabase();
  if (supabase && userId !== 'guest') {
    try {
      await supabase
        .from('vault_resources')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    } catch (err) {
      logSafeError('deleteVaultResource cloud', err);
    }
  }
}

export async function recordResourceView(id: string, userId: string): Promise<void> {
  const now = new Date().toISOString();
  const existing = loadLocalResources(userId);
  const target = existing.find((r) => r.id === id);
  if (!target) return;

  const updated: VaultResource = {
    ...target,
    viewCount: (target.viewCount || 0) + 1,
    lastViewedAt: now,
  };

  saveLocalResources(
    existing.map((r) => (r.id === id ? updated : r)),
    userId
  );

  const supabase = getSupabase();
  if (supabase && userId !== 'guest') {
    try {
      await supabase
        .from('vault_resources')
        .update({
          view_count: updated.viewCount,
          last_viewed_at: now,
        })
        .eq('id', id)
        .eq('user_id', userId);
    } catch {
      // Ignore background view increment errors
    }
  }
}
