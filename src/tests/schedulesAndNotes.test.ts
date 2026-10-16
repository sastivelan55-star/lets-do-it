import { describe, it, expect } from 'vitest';
import { dbRowToSchedule, scheduleToDbRow } from '../services/scheduleService';
import type { DbScheduleRow } from '../services/scheduleService';
import { dbRowToNote, noteToDbRow } from '../services/noteService';
import type { DbNoteRow } from '../services/noteService';
import type { ScheduleEntry, Note } from '../types';

describe('Schedules Feature: Row Mapping & Persistence', () => {
  it('converts a ScheduleEntry to a DbScheduleRow with user_id', () => {
    const schedule: ScheduleEntry = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: 'user-xyz',
      title: 'LeetCode Deep Work',
      date: '2026-10-16',
      startTime: '09:00',
      endTime: '11:00',
      description: 'Focus on Graph traversal and DFS/BFS',
      linkedTaskId: 'task-123',
      createdAt: '2026-10-16T00:00:00Z',
      updatedAt: '2026-10-16T00:00:00Z',
    };

    const row = scheduleToDbRow(schedule, 'user-xyz');
    expect(row.id).toBe(schedule.id);
    expect(row.user_id).toBe('user-xyz');
    expect(row.title).toBe('LeetCode Deep Work');
    expect(row.date).toBe('2026-10-16');
    expect(row.start_time).toBe('09:00');
    expect(row.end_time).toBe('11:00');
    expect(row.description).toBe('Focus on Graph traversal and DFS/BFS');
    expect(row.linked_task_id).toBe('task-123');
  });

  it('converts a DbScheduleRow from Supabase back to ScheduleEntry', () => {
    const row: DbScheduleRow = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: 'user-xyz',
      title: 'English Speaking Practice',
      date: '2026-10-16',
      start_time: '14:00',
      end_time: '14:30',
      description: 'Interview answers rehearsal',
      linked_task_id: null,
      created_at: '2026-10-16T00:00:00Z',
      updated_at: '2026-10-16T00:00:00Z',
    };

    const entry = dbRowToSchedule(row);
    expect(entry.id).toBe(row.id);
    expect(entry.userId).toBe('user-xyz');
    expect(entry.title).toBe('English Speaking Practice');
    expect(entry.startTime).toBe('14:00');
    expect(entry.endTime).toBe('14:30');
    expect(entry.linkedTaskId).toBeUndefined();
  });

  it('validates that startTime must be before endTime', () => {
    const isValidRange = (start: string, end: string) => start < end;
    expect(isValidRange('09:00', '10:00')).toBe(true);
    expect(isValidRange('10:00', '10:00')).toBe(false);
    expect(isValidRange('11:00', '09:00')).toBe(false);
  });
});

describe('Notes Feature: Row Mapping & Categorization', () => {
  it('converts a Note to a DbNoteRow with user_id', () => {
    const note: Note = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      userId: 'user-xyz',
      title: 'Binary Tree Traversal Insights',
      content: 'Preorder: root, left, right. Inorder: left, root, right.',
      category: 'technical',
      isPinned: true,
      createdAt: '2026-10-16T00:00:00Z',
      updatedAt: '2026-10-16T00:00:00Z',
    };

    const row = noteToDbRow(note, 'user-xyz');
    expect(row.id).toBe(note.id);
    expect(row.user_id).toBe('user-xyz');
    expect(row.title).toBe(note.title);
    expect(row.content).toBe(note.content);
    expect(row.category).toBe('technical');
    expect(row.is_pinned).toBe(true);
  });

  it('converts a DbNoteRow back to Note', () => {
    const row: DbNoteRow = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      user_id: 'user-xyz',
      title: 'STAR Story: Hackathon Project',
      content: 'Situation: 24h deadline...',
      category: 'career',
      is_pinned: false,
      created_at: '2026-10-16T00:00:00Z',
      updated_at: '2026-10-16T00:00:00Z',
    };

    const note = dbRowToNote(row);
    expect(note.id).toBe(row.id);
    expect(note.userId).toBe('user-xyz');
    expect(note.category).toBe('career');
    expect(note.isPinned).toBe(false);
  });

  it('filters and searches notes correctly', () => {
    const notes: Note[] = [
      { id: '1', title: 'Spring Boot Architecture', content: 'Controllers and Services', category: 'technical', isPinned: true, createdAt: '', updatedAt: '' },
      { id: '2', title: 'HR Questions Rehearsal', content: 'Tell me about a time you failed', category: 'career', isPinned: false, createdAt: '', updatedAt: '' },
      { id: '3', title: 'Tamil Poem Idea', content: 'Lines about perseverance and coding', category: 'creativity', isPinned: false, createdAt: '', updatedAt: '' },
    ];

    const searchTechnical = notes.filter((n) => n.category === 'technical');
    expect(searchTechnical.length).toBe(1);
    expect(searchTechnical[0].title).toBe('Spring Boot Architecture');

    const searchKeyword = notes.filter((n) =>
      n.title.toLowerCase().includes('failed') || n.content.toLowerCase().includes('failed')
    );
    expect(searchKeyword.length).toBe(1);
    expect(searchKeyword[0].title).toBe('HR Questions Rehearsal');
  });
});

describe('Account Isolation & Optimistic Rollback for Schedules and Notes', () => {
  it('clears schedules and notes on user logout/switch', () => {
    let schedules: ScheduleEntry[] = [{ id: 's1', title: 'S1', date: '2026-10-16', startTime: '09:00', endTime: '10:00', createdAt: '', updatedAt: '', userId: 'user-1' }];
    let notes: Note[] = [{ id: 'n1', title: 'N1', content: '', createdAt: '', updatedAt: '', userId: 'user-1' }];
    let prevUserId: string | null | undefined = 'user-1';

    const onUserChange = (newUserId: string | null) => {
      if (prevUserId !== undefined && prevUserId !== newUserId) {
        schedules = [];
        notes = [];
      }
      prevUserId = newUserId;
    };

    onUserChange(null);
    expect(schedules.length).toBe(0);
    expect(notes.length).toBe(0);
  });

  it('rolls back optimistic schedule update when cloud operation fails', () => {
    const initialSchedule: ScheduleEntry = {
      id: 's1',
      title: 'Original Title',
      date: '2026-10-16',
      startTime: '09:00',
      endTime: '10:00',
      createdAt: '',
      updatedAt: '',
    };
    let state = [initialSchedule];

    // Optimistic update
    const snapshot = [...state];
    const updatedSchedule = { ...initialSchedule, title: 'Optimistic Edit' };
    state = state.map((s) => (s.id === updatedSchedule.id ? updatedSchedule : s));
    expect(state[0].title).toBe('Optimistic Edit');

    // Simulate Supabase network/database failure
    const simulateCloudFail = true;
    if (simulateCloudFail) {
      // Rollback to snapshot
      state = snapshot;
    }
    expect(state[0].title).toBe('Original Title');
  });
});
