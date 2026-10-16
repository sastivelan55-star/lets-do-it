// Cloud Note Service (Supabase PostgreSQL with RLS)
import { getSupabase } from './supabaseClient';
import type { Note } from '../types';

export interface DbNoteRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export function dbRowToNote(row: DbNoteRow): Note {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    category: row.category ?? undefined,
    isPinned: row.is_pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function noteToDbRow(note: Partial<Note>, userId: string): Partial<DbNoteRow> {
  const row: Partial<DbNoteRow> = {
    user_id: userId,
  };

  if (note.id !== undefined) row.id = note.id;
  if (note.title !== undefined) row.title = note.title.trim();
  if (note.content !== undefined) row.content = note.content;
  if (note.category !== undefined) row.category = note.category ? note.category.trim() : null;
  if (note.isPinned !== undefined) row.is_pinned = Boolean(note.isPinned);

  return row;
}

// ── CRUD Operations ──────────────────────────────────────────────────────────

export async function fetchUserNotes(userId: string): Promise<Note[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch notes: ${error.message}`);
  }

  return (data as DbNoteRow[]).map(dbRowToNote);
}

export async function createCloudNote(
  noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> | Note,
  userId: string
): Promise<Note> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const insertPayload = noteToDbRow(noteData, userId);
  // Ensure non-UUID client ids (e.g. from local nanoid) are stripped so Postgres generates a valid UUID
  if (
    insertPayload.id &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(insertPayload.id)
  ) {
    delete insertPayload.id;
  }

  const { data, error } = await supabase
    .from('notes')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create note: ${error.message}`);
  }

  return dbRowToNote(data as DbNoteRow);
}

export async function updateCloudNote(note: Note, userId: string): Promise<Note> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const updatePayload = noteToDbRow(note, userId);
  delete updatePayload.id; // Primary key should not be in update set

  const { data, error } = await supabase
    .from('notes')
    .update(updatePayload)
    .eq('id', note.id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update note: ${error.message}`);
  }

  return dbRowToNote(data as DbNoteRow);
}

export async function deleteCloudNote(noteId: string, userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete note: ${error.message}`);
  }
}
