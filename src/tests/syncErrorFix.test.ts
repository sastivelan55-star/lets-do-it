import { describe, it, expect } from 'vitest';
import {
  extractErrorInfo,
  formatSafeErrorMessage,
  sanitizeDiagnostics,
} from '../utils/errorUtils';
import { formatUploadErrorMessage } from '../services/uploadService';
import { formatAuthErrorMessage } from '../context/AuthContext';
import type { Task } from '../types';

describe('Universal Safe Error Handling & Production Sync Fix', () => {
  describe('extractErrorInfo', () => {
    it('handles standard JavaScript Error objects', () => {
      const err = new Error('Database connection failed');
      const info = extractErrorInfo(err, 'Test Operation');
      expect(info.message).toBe('Database connection failed');
      expect(info.message).not.toContain('[object Object]');
    });

    it('handles Supabase PostgrestError plain objects without crashing or producing [object Object]', () => {
      const postgrestError = {
        code: 'PGRST205',
        details: null,
        hint: null,
        message: "Could not find the table 'public.user_uploads' in the schema cache",
      };

      const info = extractErrorInfo(postgrestError, 'Supabase Query');
      expect(info.message).toBe("Could not find the table 'public.user_uploads' in the schema cache");
      expect(info.code).toBe('PGRST205');
      expect(info.isSchemaMissing).toBe(true);
      expect(info.message).not.toContain('[object Object]');
    });

    it('handles Supabase AuthError objects', () => {
      const authError = {
        name: 'AuthApiError',
        message: 'Invalid login credentials',
        status: 400,
      };

      const info = extractErrorInfo(authError, 'Auth');
      expect(info.message).toBe('Invalid login credentials');
      expect(info.status).toBe(400);
      expect(info.isAuthError).toBe(true);
      expect(info.message).not.toContain('[object Object]');
    });

    it('handles Supabase StorageError objects', () => {
      const storageError = {
        name: 'StorageApiError',
        message: 'Bucket not found: media-vault',
        statusCode: 404,
      };

      const info = extractErrorInfo(storageError, 'Storage');
      expect(info.message).toContain('Bucket not found');
      expect(info.isSchemaMissing).toBe(true);
      expect(info.message).not.toContain('[object Object]');
    });

    it('handles arbitrary objects with error_description or details', () => {
      const customObj = {
        error_description: 'Token expired',
        code: 'otp_expired',
      };
      const info = extractErrorInfo(customObj);
      expect(info.message).toBe('Token expired');
      expect(info.code).toBe('otp_expired');
      expect(info.message).not.toContain('[object Object]');
    });

    it('handles empty objects or objects without known properties without returning [object Object]', () => {
      const emptyObj = {};
      const info = extractErrorInfo(emptyObj, 'Fallback test');
      expect(info.message).not.toContain('[object Object]');
      expect(info.message.length).toBeGreaterThan(0);
    });

    it('handles null and undefined gracefully', () => {
      const infoNull = extractErrorInfo(null);
      expect(infoNull.message).not.toContain('[object Object]');

      const infoUndefined = extractErrorInfo(undefined);
      expect(infoUndefined.message).not.toContain('[object Object]');
    });
  });

  describe('formatSafeErrorMessage', () => {
    it('translates PGRST205 missing user_uploads into helpful migration instructions', () => {
      const postgrestError = {
        code: 'PGRST205',
        details: null,
        hint: null,
        message: "Could not find the table 'public.user_uploads' in the schema cache",
      };

      const formatted = formatSafeErrorMessage(postgrestError);
      expect(formatted).toContain("'user_uploads'");
      expect(formatted).toContain('20261016100000_create_media_vault_and_uploads.sql');
      expect(formatted).not.toContain('[object Object]');
    });

    it('translates missing schedules or notes tables into migration instructions', () => {
      const schedError = {
        code: 'PGRST205',
        message: "Could not find the table 'public.schedules' in the schema cache",
      };
      const formattedSched = formatSafeErrorMessage(schedError);
      expect(formattedSched).toContain('schedules');
      expect(formattedSched).toContain('SQL migration');
      expect(formattedSched).not.toContain('[object Object]');

      const noteError = {
        code: 'PGRST205',
        message: "Could not find the table 'public.notes' in the schema cache",
      };
      const formattedNote = formatSafeErrorMessage(noteError);
      expect(formattedNote).toContain('notes');
      expect(formattedNote).toContain('SQL migration');
      expect(formattedNote).not.toContain('[object Object]');
    });

    it('translates missing tasks table into migration instructions', () => {
      const taskError = {
        code: 'PGRST205',
        message: "Could not find the table 'public.tasks' in the schema cache",
      };
      const formatted = formatSafeErrorMessage(taskError);
      expect(formatted).toContain("'tasks'");
      expect(formatted).toContain('20261011000000_create_tasks_table.sql');
      expect(formatted).not.toContain('[object Object]');
    });

    it('translates RLS violation errors into clear permission guidance', () => {
      const rlsError = {
        code: '42501',
        message: 'new row violates row-level security policy for table tasks',
      };
      const formatted = formatSafeErrorMessage(rlsError);
      expect(formatted).toContain('Row-Level Security');
      expect(formatted).not.toContain('[object Object]');
    });

    it('translates 401 Unauthorized into authentication guidance', () => {
      const auth401 = {
        status: 401,
        message: 'Invalid API key or token expired',
      };
      const formatted = formatSafeErrorMessage(auth401);
      expect(formatted).toContain('Authentication failed');
      expect(formatted).not.toContain('[object Object]');
    });
  });

  describe('formatUploadErrorMessage regression test', () => {
    it('correctly handles raw Supabase PostgrestError object without producing [object Object]', () => {
      // THIS WAS THE EXACT BUG THAT BROKE PRODUCTION
      const rawSupabaseError = {
        code: 'PGRST205',
        details: null,
        hint: null,
        message: "Could not find the table 'public.user_uploads' in the schema cache",
      };

      const result = formatUploadErrorMessage(rawSupabaseError);
      expect(result).not.toBe('[object Object]');
      expect(result).not.toContain('[object Object]');
      expect(result).toContain("table 'user_uploads' does not exist in Supabase");
    });
  });

  describe('formatAuthErrorMessage regression test', () => {
    it('handles raw Supabase error objects safely', () => {
      const authErrorObj = {
        message: 'Invalid login credentials',
        status: 400,
      };
      const msg = formatAuthErrorMessage(authErrorObj, 'signin');
      expect(msg).toContain('Invalid email or password');
      expect(msg).not.toContain('[object Object]');
    });
  });

  describe('sanitizeDiagnostics', () => {
    it('masks JWT tokens, anon keys, and bearer tokens', () => {
      const text = 'Failed with token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMifQ.abc and key sb_publishable_12345';
      const clean = sanitizeDiagnostics(text);
      expect(clean).not.toContain('eyJhbGciOi');
      expect(clean).not.toContain('sb_publishable_12345');
      expect(clean).toContain('[REDACTED_JWT]');
      expect(clean).toContain('sb_publishable_[REDACTED]');
    });
  });

  describe('Dashboard Sync Resilience Simulation (Promise.allSettled)', () => {
    it('successfully syncs tasks even when optional tables (uploads, schedules, notes) are missing', async () => {
      // Mock cloud tasks representing user data
      const mockTasks: Task[] = [
        {
          id: 'task-1',
          userId: 'user-abc',
          title: 'Daily LeetCode Problem',
          lifeArea: 'technical',
          priority: 'high',
          status: 'not-started',
          dueDate: '2026-10-16',
          createdAt: '2026-10-16T10:00:00Z',
          updatedAt: '2026-10-16T10:00:00Z',
        },
        {
          id: 'task-2',
          userId: 'user-abc',
          title: 'System Design Architecture',
          lifeArea: 'technical',
          priority: 'critical',
          status: 'completed',
          completedAt: '2026-10-16T11:00:00Z',
          dueDate: '2026-10-16',
          createdAt: '2026-10-16T09:00:00Z',
          updatedAt: '2026-10-16T11:00:00Z',
        },
      ];

      // Simulated services: Tasks succeeds, others fail due to unmigrated tables (PGRST205)
      const fetchTasks = async () => mockTasks;
      const fetchSchedules = async () => {
        throw new Error("Could not find the table 'public.schedules' in the schema cache");
      };
      const fetchNotes = async () => {
        throw new Error("Could not find the table 'public.notes' in the schema cache");
      };
      const fetchUploads = async () => {
        const rawErr = {
          code: 'PGRST205',
          message: "Could not find the table 'public.user_uploads' in the schema cache",
        };
        throw new Error(formatUploadErrorMessage(rawErr));
      };

      // AppContext loadUserData pattern using Promise.allSettled
      let stateTasks: Task[] = [];
      let syncStatus: 'synced' | 'syncing' | 'error' | 'offline' = 'syncing';
      let stateError: string | null = null;

      const [tasksRes, schedulesRes, notesRes, uploadsRes] = await Promise.allSettled([
        fetchTasks(),
        fetchSchedules(),
        fetchNotes(),
        fetchUploads(),
      ]);

      let hasCriticalTaskError = false;
      let taskErrorMessage = '';

      if (tasksRes.status === 'fulfilled') {
        stateTasks = tasksRes.value;
      } else {
        hasCriticalTaskError = true;
        taskErrorMessage = formatSafeErrorMessage(tasksRes.reason, 'Failed to load tasks');
      }

      // Schedules, Notes, Uploads are handled gracefully
      expect(schedulesRes.status).toBe('rejected');
      expect(notesRes.status).toBe('rejected');
      expect(uploadsRes.status).toBe('rejected');

      if (hasCriticalTaskError) {
        stateError = taskErrorMessage;
        syncStatus = 'error';
      } else {
        syncStatus = 'synced';
        stateError = null;
      }

      // VERIFICATIONS:
      // 1. Sync status is 'synced' — NOT 'error'!
      expect(syncStatus).toBe('synced');
      // 2. Error banner is null — NOT '[object Object]'!
      expect(stateError).toBeNull();
      // 3. Tasks are fully populated!
      expect(stateTasks.length).toBe(2);
      expect(stateTasks[0].title).toBe('Daily LeetCode Problem');
      // 4. Completed count calculation
      const completedCount = stateTasks.filter((t) => t.status === 'completed').length;
      expect(completedCount).toBe(1);
    });

    it('reports actionable, safe error message when tasks query itself fails', async () => {
      const fetchTasksFails = async () => {
        throw {
          code: 'PGRST205',
          message: "Could not find the table 'public.tasks' in the schema cache",
        };
      };

      let stateTasks: Task[] = [];
      let syncStatus = 'syncing';
      let stateError: string | null = null;

      const [tasksRes] = await Promise.allSettled([fetchTasksFails()]);

      if (tasksRes.status === 'fulfilled') {
        stateTasks = tasksRes.value;
        syncStatus = 'synced';
      } else {
        syncStatus = 'error';
        stateError = formatSafeErrorMessage(tasksRes.reason);
      }

      expect(syncStatus).toBe('error');
      expect(stateError).not.toBe('[object Object]');
      expect(stateError).toContain("'tasks'");
      expect(stateError).toContain('20261011000000_create_tasks_table.sql');
      expect(stateTasks.length).toBe(0);
    });
  });
});
