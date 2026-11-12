// Tests for Unified Cross-Platform Cloud Synchronization
import { describe, it, expect } from 'vitest';
import { projectToDbRow, dbRowToProject, type DbProjectRow } from '../services/projectService';
import { milestoneToDbRow, dbRowToMilestone, type DbMilestoneRow } from '../services/milestoneService';
import { dailyRecordToDbRow, dbRowToDailyRecord, type DbDailyRecordRow } from '../services/dailyRecordService';
import { migrateLocalDataToCloud } from '../services/localMigrationService';
import type { Project, RoadmapMilestone, DailyRecord } from '../types';

describe('Unified Cloud Synchronization Service Tests', () => {
  const TEST_USER_ID = 'test-user-uuid-1234';

  describe('Project Cloud Serialization & Mapping', () => {
    it('correctly maps Project to DbProjectRow and back', () => {
      const originalProject: Project = {
        id: 'proj_sample_1',
        name: 'Life OS Cross-Platform App',
        description: 'Synchronized Web and Mobile experience',
        status: 'in-progress',
        goals: ['Unified backend', 'Realtime sync'],
        tasks: [{ id: 'pt_1', title: 'Fix mobile sync', status: 'done', dueDate: '2026-11-12' }],
        milestones: [{ id: 'pm_1', title: 'Beta launch', completed: true, targetDate: '2026-11-20' }],
        technologies: ['React', 'Supabase', 'TypeScript'],
        notes: 'Priority task for Q4',
        repoUrl: 'https://github.com/example/repo',
        nextAction: 'Deploy to Vercel',
        startDate: '2026-11-01',
        targetDate: '2026-11-30',
        priority: 'high',
        createdAt: '2026-11-01T00:00:00Z',
        updatedAt: '2026-11-12T00:00:00Z',
      };

      const dbRow = projectToDbRow(originalProject, TEST_USER_ID);
      expect(dbRow.user_id).toBe(TEST_USER_ID);
      expect(dbRow.id).toBe('proj_sample_1');
      expect(dbRow.name).toBe('Life OS Cross-Platform App');
      expect(dbRow.status).toBe('in-progress');
      expect(dbRow.repo_url).toBe('https://github.com/example/repo');

      const reconstructed = dbRowToProject({
        ...dbRow,
        created_at: originalProject.createdAt,
        updated_at: originalProject.updatedAt,
      } as DbProjectRow);

      expect(reconstructed.id).toBe(originalProject.id);
      expect(reconstructed.name).toBe(originalProject.name);
      expect(reconstructed.status).toBe(originalProject.status);
      expect(reconstructed.goals).toEqual(originalProject.goals);
      expect(reconstructed.tasks).toEqual(originalProject.tasks);
      expect(reconstructed.milestones).toEqual(originalProject.milestones);
      expect(reconstructed.technologies).toEqual(originalProject.technologies);
      expect(reconstructed.repoUrl).toBe(originalProject.repoUrl);
      expect(reconstructed.priority).toBe(originalProject.priority);
    });
  });

  describe('Roadmap Milestone Cloud Serialization & Mapping', () => {
    it('correctly maps RoadmapMilestone to DbMilestoneRow and back', () => {
      const originalMilestone: RoadmapMilestone = {
        id: 'ms_month_1',
        month: 1,
        title: 'Backend Mastery & System Design',
        description: 'Complete PostgreSQL architecture design',
        status: 'in-progress',
        subtasks: [
          { id: 'st_1', title: 'Design RLS policies', completed: true },
          { id: 'st_2', title: 'Setup Realtime subscriptions', completed: true },
        ],
        learningSessions: [
          { id: 'ls_1', date: '2026-11-12', topic: 'PostgreSQL Replication', minutes: 45 },
        ],
        notes: 'Review database indexes',
        startDate: '2026-11-01',
        targetDate: '2026-11-30',
        completedDate: undefined,
      };

      const dbRow = milestoneToDbRow(originalMilestone, TEST_USER_ID);
      expect(dbRow.user_id).toBe(TEST_USER_ID);
      expect(dbRow.month).toBe(1);
      expect(dbRow.title).toBe('Backend Mastery & System Design');
      expect(dbRow.status).toBe('in-progress');

      const reconstructed = dbRowToMilestone({
        ...dbRow,
        created_at: '2026-11-01T00:00:00Z',
        updated_at: '2026-11-12T00:00:00Z',
      } as DbMilestoneRow);

      expect(reconstructed.id).toBe(originalMilestone.id);
      expect(reconstructed.month).toBe(originalMilestone.month);
      expect(reconstructed.title).toBe(originalMilestone.title);
      expect(reconstructed.subtasks).toEqual(originalMilestone.subtasks);
      expect(reconstructed.learningSessions).toEqual(originalMilestone.learningSessions);
      expect(reconstructed.notes).toBe(originalMilestone.notes);
    });
  });

  describe('Daily Record (Reflection) Cloud Serialization & Mapping', () => {
    it('correctly maps DailyRecord to DbDailyRecordRow and back', () => {
      const originalRecord: DailyRecord = {
        date: '2026-11-12',
        tasksCompleted: 8,
        tasksTotal: 10,
        minutesSpent: 280,
        reflectionNote: 'Great focus on cross-platform database synchronization today.',
        mood: 5,
        savedAt: '2026-11-12T18:00:00Z',
      };

      const dbRow = dailyRecordToDbRow(originalRecord, TEST_USER_ID);
      expect(dbRow.user_id).toBe(TEST_USER_ID);
      expect(dbRow.date).toBe('2026-11-12');
      expect(dbRow.tasks_completed).toBe(8);
      expect(dbRow.tasks_total).toBe(10);
      expect(dbRow.minutes_spent).toBe(280);
      expect(dbRow.reflection_note).toBe(originalRecord.reflectionNote);
      expect(dbRow.mood).toBe(5);
      expect(dbRow.id).toBe(`${TEST_USER_ID}_2026-11-12`);

      const reconstructed = dbRowToDailyRecord({
        ...dbRow,
        created_at: '2026-11-12T00:00:00Z',
        updated_at: '2026-11-12T18:00:00Z',
      } as DbDailyRecordRow);

      expect(reconstructed.date).toBe(originalRecord.date);
      expect(reconstructed.tasksCompleted).toBe(originalRecord.tasksCompleted);
      expect(reconstructed.tasksTotal).toBe(originalRecord.tasksTotal);
      expect(reconstructed.minutesSpent).toBe(originalRecord.minutesSpent);
      expect(reconstructed.reflectionNote).toBe(originalRecord.reflectionNote);
      expect(reconstructed.mood).toBe(originalRecord.mood);
    });
  });

  describe('Non-Destructive Local Data Migration', () => {
    it('returns zero migrations when user is unauthenticated or guest', async () => {
      const result = await migrateLocalDataToCloud('guest', {
        tasks: [],
        projects: [],
        milestones: [],
        schedules: [],
        notes: [],
        dailyRecords: [],
      });
      expect(result.tasksMigrated).toBe(0);
      expect(result.projectsMigrated).toBe(0);
    });
  });
});
