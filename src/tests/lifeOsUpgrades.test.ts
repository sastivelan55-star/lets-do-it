import { describe, it, expect } from 'vitest';
import { dbRowToSession, sessionToDbRow } from '../services/communicationService';
import type { DbCommunicationSessionRow } from '../services/communicationService';
import { dbRowToTask, taskToDbRow } from '../services/taskService';
import type { DbTaskRow } from '../services/taskService';
import { DEFAULT_LIFE_AREAS, DEFAULT_APPEARANCE, DEFAULT_AI_SETTINGS } from '../types';
import type { Task } from '../types';

describe('Life OS: Upgraded Data Models & Safe Conversions', () => {
  it('converts communication session DB row to CommunicationSession and back safely', () => {
    const sampleDbRow: DbCommunicationSessionRow = {
      id: 'comm-123',
      user_id: 'user-abc',
      date: '2026-10-28',
      start_time: '10:00',
      end_time: '10:45',
      duration_minutes: 45,
      activity_type: 'speaking',
      topic: 'Technical System Design in English',
      description: 'Practiced explaining distributed cache architecture',
      notes: 'Remember to pause before answering questions',
      attendance_status: 'attended',
      completion_status: 'completed',
      created_at: '2026-10-28T10:00:00Z',
      updated_at: '2026-10-28T10:45:00Z',
    };

    const session = dbRowToSession(sampleDbRow);
    expect(session.id).toBe('comm-123');
    expect(session.durationMinutes).toBe(45);
    expect(session.activityType).toBe('speaking');
    expect(session.attendanceStatus).toBe('attended');

    const backToDb = sessionToDbRow(session, 'user-abc');
    expect(backToDb.duration_minutes).toBe(45);
    expect(backToDb.topic).toBe('Technical System Design in English');
    expect(backToDb.user_id).toBe('user-abc');
  });

  it('maps roadmap_month properly on tasks without altering existing task integrity', () => {
    const rawDbTask: DbTaskRow = {
      id: 'task-roadmap-1',
      user_id: 'user-xyz',
      area: 'technical',
      title: 'Master Graph Algorithms',
      description: 'DFS, BFS, Dijkstra, TopoSort',
      project_id: null,
      due_date: '2026-11-15',
      planned_start: null,
      priority: 'high',
      status: 'not-started',
      estimated_minutes: null,
      actual_minutes: null,
      notes: 'Blind 75 Graph section',
      recurring_rule: null,
      completed_at: null,
      order_index: 2,
      parent_id: null,
      is_deleted: false,
      deleted_at: null,
      roadmap_month: 3,
      created_at: '2026-10-28T00:00:00Z',
      updated_at: '2026-10-28T00:00:00Z',
    };

    const task = dbRowToTask(rawDbTask);
    expect(task.roadmapMonth).toBe(3);
    expect(task.lifeArea).toBe('technical');
    expect(task.priority).toBe('high');

    const exportedRow = taskToDbRow({ ...task, roadmapMonth: 4 }, 'user-xyz');
    expect(exportedRow.roadmap_month).toBe(4);
  });

  it('provides safe default configurations for life areas, appearance, and AI', () => {
    expect(DEFAULT_LIFE_AREAS.length).toBe(5);
    expect(DEFAULT_LIFE_AREAS.map((a) => a.id)).toEqual([
      'technical',
      'communication',
      'career',
      'creativity',
      'health',
    ]);

    expect(DEFAULT_APPEARANCE.themePreset).toBe('navy-purple');
    expect(DEFAULT_APPEARANCE.accentColor).toBe('#6366f1');

    expect(DEFAULT_AI_SETTINGS.provider).toBe('gemini');
    expect(DEFAULT_AI_SETTINGS.model).toBe('gemini-2.0-flash');
  });

  it('bulk reschedule computes safe new dates without modifying unrelated task fields', () => {
    const overdueTasks: Task[] = [
      {
        id: 'task-1',
        title: 'Review PR #4',
        lifeArea: 'technical',
        dueDate: '2026-10-20',
        priority: 'high',
        status: 'not-started',
        orderIndex: 0,
        createdAt: '2026-10-20T00:00:00Z',
        updatedAt: '2026-10-20T00:00:00Z',
      },
      {
        id: 'task-2',
        title: 'Draft email to mentor',
        lifeArea: 'communication',
        dueDate: '2026-10-22',
        priority: 'medium',
        status: 'not-started',
        orderIndex: 1,
        createdAt: '2026-10-22T00:00:00Z',
        updatedAt: '2026-10-22T00:00:00Z',
      },
    ];

    const targetDate = '2026-11-02';
    const rescheduled = overdueTasks.map((t) => ({
      ...t,
      dueDate: targetDate,
      updatedAt: '2026-10-28T12:00:00Z',
    }));

    expect(rescheduled[0].dueDate).toBe('2026-11-02');
    expect(rescheduled[0].title).toBe('Review PR #4');
    expect(rescheduled[0].priority).toBe('high');
    expect(rescheduled[1].dueDate).toBe('2026-11-02');
    expect(rescheduled[1].lifeArea).toBe('communication');
  });
});
