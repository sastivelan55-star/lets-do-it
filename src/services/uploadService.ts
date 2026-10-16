// Cloud Upload & Media Vault Service (Supabase Storage + PostgreSQL with RLS)
import { getSupabase } from './supabaseClient';
import type { UserUpload, UploadCategory } from '../types';

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB limit
export const BUCKET_NAME = 'media-vault';

export interface DbUploadRow {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number | string;
  mime_type: string;
  category: UploadCategory;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function dbRowToUpload(row: DbUploadRow, signedUrl?: string): UserUpload {
  return {
    id: row.id,
    userId: row.user_id,
    fileName: row.file_name,
    filePath: row.file_path,
    fileSize: typeof row.file_size === 'string' ? parseInt(row.file_size, 10) : row.file_size,
    mimeType: row.mime_type,
    category: row.category,
    description: row.description ?? undefined,
    signedUrl,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Validation and Categorization Utilities ──────────────────────────────────

const DISALLOWED_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'vbs', 'msi', 'com', 'scr', 'pif', 'ps1', 'jar',
  'php', 'asp', 'aspx', 'jsp', 'cgi', 'pl', 'pyc'
]);

export function formatFileSize(bytes: number): string {
  if (bytes <= 0 || isNaN(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
  return `${size} ${units[i]}`;
}

export function detectCategory(mimeType: string, fileName: string): UploadCategory {
  const lowerMime = (mimeType || '').toLowerCase();
  const ext = (fileName.split('.').pop() || '').toLowerCase();

  // 1. Strict MIME type matching first
  if (lowerMime.startsWith('image/')) return 'image';
  if (lowerMime.startsWith('audio/')) return 'audio';
  if (lowerMime.startsWith('video/')) return 'video';
  if (
    lowerMime === 'application/pdf' ||
    lowerMime.startsWith('text/') ||
    lowerMime.includes('document') ||
    lowerMime.includes('spreadsheet') ||
    lowerMime.includes('presentation')
  ) {
    return 'document';
  }

  // 2. Extension fallback when MIME is empty or application/octet-stream
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'ico', 'tiff'].includes(ext)) {
    return 'image';
  }

  if (['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac', 'wma'].includes(ext)) {
    return 'audio';
  }

  if (['mp4', 'webm', 'mov', 'mkv', 'avi', 'flv'].includes(ext)) {
    return 'video';
  }

  if (
    ['pdf', 'txt', 'md', 'csv', 'json', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'tar', 'gz'].includes(ext)
  ) {
    return 'document';
  }

  return 'other';
}

export function sanitizeFileName(name: string): string {
  // Extract base name and extension
  const parts = name.split('.');
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  const base = parts.join('.');

  // Replace path traversal dots, directory separators, and special shell characters
  const cleanBase = base
    .replace(/\.\.+/g, '')
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/^\.+/, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .substring(0, 80);

  return ext ? `${cleanBase || 'file'}.${ext}` : (cleanBase || 'file');
}

export function validateUploadFile(file: File): { valid: boolean; error?: string; category: UploadCategory } {
  const category = detectCategory(file.type, file.name);

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds the 25 MB limit.`,
      category,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty (0 bytes).',
      category,
    };
  }

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (DISALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `File type (.${ext}) is restricted for security.`,
      category,
    };
  }

  return { valid: true, category };
}

// ── CRUD Operations ──────────────────────────────────────────────────────────

export async function fetchUserUploads(userId: string): Promise<UserUpload[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from('user_uploads')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch uploads: ${error.message}`);
  }

  return (data as DbUploadRow[]).map((row) => dbRowToUpload(row));
}

export async function getUploadSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

export async function uploadUserFile(
  file: File,
  userId: string,
  description?: string
): Promise<UserUpload> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const validation = validateUploadFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file');
  }

  // Generate safe sanitized file path scoped to the user's folder
  const fileId = crypto.randomUUID();
  const cleanName = sanitizeFileName(file.name);
  const storagePath = `${userId}/${fileId}-${cleanName}`;

  // 1. Upload file object to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  // 2. Insert metadata into public.user_uploads
  try {
    const { data: dbData, error: dbError } = await supabase
      .from('user_uploads')
      .insert({
        id: fileId,
        user_id: userId,
        file_name: file.name,
        file_path: storagePath,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        category: validation.category,
        description: description ? description.trim() : null,
      })
      .select()
      .single();

    if (dbError) {
      // Partial failure recovery: remove the uploaded storage file to prevent orphan files
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]).catch((cleanupErr) => {
        console.error('[LifeMap] Failed to cleanup orphan storage file after DB error:', cleanupErr);
      });
      throw new Error(`Failed to save file metadata: ${dbError.message}`);
    }

    // 3. Resolve initial signed URL for preview/download
    let signedUrl: string | undefined;
    try {
      signedUrl = await getUploadSignedUrl(storagePath, 3600);
    } catch {
      // Ignore signed URL resolution error — can be requested on-demand
    }

    return dbRowToUpload(dbData as DbUploadRow, signedUrl);
  } catch (err) {
    // Ensure orphan storage cleanup in all failure cases
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]).catch(() => {});
    throw err;
  }
}

export async function deleteUserUpload(upload: UserUpload, userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  // 1. Delete object from Supabase Storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([upload.filePath]);

  if (storageError) {
    console.warn(`[LifeMap] Storage removal warning: ${storageError.message}`);
  }

  // 2. Delete metadata row from public.user_uploads
  const { error: dbError } = await supabase
    .from('user_uploads')
    .delete()
    .eq('id', upload.id)
    .eq('user_id', userId);

  if (dbError) {
    throw new Error(`Failed to delete upload record: ${dbError.message}`);
  }
}

export async function updateUserUploadMetadata(
  id: string,
  userId: string,
  updates: { fileName?: string; description?: string }
): Promise<UserUpload> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const payload: Record<string, unknown> = {};
  if (updates.fileName !== undefined) payload.file_name = updates.fileName.trim();
  if (updates.description !== undefined) payload.description = updates.description.trim() || null;

  const { data, error } = await supabase
    .from('user_uploads')
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update upload: ${error.message}`);
  }

  return dbRowToUpload(data as DbUploadRow);
}
