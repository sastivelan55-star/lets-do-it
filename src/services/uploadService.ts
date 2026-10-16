// Cloud Upload & Media Vault Service (Supabase Storage + PostgreSQL with RLS + TUS Resumable Uploads)
import { Upload, isSupported as isTusSupported } from 'tus-js-client';
import { getSupabase } from './supabaseClient';
import { ENV } from '../config/env';
import type { UserUpload, UploadCategory } from '../types';

// Supabase Free Tier global upload ceiling is 50 MB per file.
// For Pro Tier (5 GB limit), this constant can be adjusted or set via environment variable.
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB limit
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

// ── Error Formatting ─────────────────────────────────────────────────────────

export function formatUploadErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (lower.includes('bucket not found') || lower.includes('nosuchbucket')) {
    return "Storage bucket 'media-vault' does not exist in Supabase. Please execute the SQL migration in supabase/migrations/20261016100000_create_media_vault_and_uploads.sql or create the bucket 'media-vault' in Supabase Dashboard -> Storage.";
  }
  if (lower.includes('user_uploads') || lower.includes('schema cache')) {
    return "Database table 'user_uploads' does not exist in Supabase. Please execute the SQL migration in supabase/migrations/20261016100000_create_media_vault_and_uploads.sql.";
  }
  if (lower.includes('payload too large') || lower.includes('entity too large') || lower.includes('413')) {
    return "File exceeds the 50 MB Supabase plan limit. Supabase Free tier allows files up to 50 MB.";
  }
  if (lower.includes('row-level security') || lower.includes('violates row-level security')) {
    return "Upload permission denied by Storage Row Level Security. Ensure you are signed in and have permission to upload.";
  }
  return msg;
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
      error: `File size (${formatFileSize(file.size)}) exceeds the 50 MB Supabase plan limit.`,
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

// ── TUS Resumable Upload ─────────────────────────────────────────────────────

export async function uploadViaTus(
  file: File,
  storagePath: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token || ENV.supabaseAnonKey;

  return new Promise((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: `${ENV.supabaseUrl}/storage/v1/upload/resumable`,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      headers: {
        authorization: `Bearer ${token}`,
        apikey: ENV.supabaseAnonKey,
        'x-upsert': 'false',
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: BUCKET_NAME,
        objectName: storagePath,
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
      },
      chunkSize: 6 * 1024 * 1024, // 6MB chunks
      onError: (err) => {
        reject(new Error(formatUploadErrorMessage(err)));
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        if (onProgress && bytesTotal > 0) {
          onProgress(Math.min(99, Math.round((bytesUploaded / bytesTotal) * 100)));
        }
      },
      onSuccess: () => {
        if (onProgress) onProgress(100);
        resolve();
      },
    });

    upload.start();
  });
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
    throw new Error(formatUploadErrorMessage(error));
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
    throw new Error(formatUploadErrorMessage(error));
  }

  return data.signedUrl;
}

export async function uploadUserFile(
  file: File,
  userId: string,
  description?: string,
  onProgress?: (percent: number) => void
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
  // Use TUS resumable uploads for files > 6MB if supported, otherwise standard upload
  let uploaded = false;
  if (file.size > 6 * 1024 * 1024 && isTusSupported) {
    try {
      await uploadViaTus(file, storagePath, onProgress);
      uploaded = true;
    } catch (tusErr: unknown) {
      console.warn('[LifeMap] TUS upload failed, falling back to standard upload:', tusErr);
      // Fallback to standard upload
    }
  }

  if (!uploaded) {
    if (onProgress) onProgress(25);
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      });

    if (uploadError) {
      throw new Error(formatUploadErrorMessage(uploadError));
    }
    if (onProgress) onProgress(100);
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
      throw new Error(formatUploadErrorMessage(dbError));
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
    throw new Error(formatUploadErrorMessage(dbError));
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
    throw new Error(formatUploadErrorMessage(error));
  }

  return dbRowToUpload(data as DbUploadRow);
}
