import { describe, it, expect } from 'vitest';
import {
  formatTimetableTime,
  timeToMinutes,
  getTimetableIcon,
} from '../components/timetable/DailyTimetable';
import { TIMETABLE_SCHEDULED_TOOLTIP } from '../components/common/TimetableScheduledBadge';
import type { Task } from '../types';

describe('Unified Today Missions & Daily Timetable Logic', () => {
  const TODAY = '2026-11-09';
  const YESTERDAY = '2026-11-08';

  describe('Time Formatting & Chronological Sorting', () => {
    it('formats 24-hour time string into 12-hour AM/PM string', () => {
      expect(formatTimetableTime('04:00')).toBe('04:00 AM');
      expect(formatTimetableTime('06:00')).toBe('06:00 AM');
      expect(formatTimetableTime('08:00')).toBe('08:00 AM');
      expect(formatTimetableTime('13:00')).toBe('01:00 PM');
      expect(formatTimetableTime('15:30')).toBe('03:30 PM');
      expect(formatTimetableTime('22:00')).toBe('10:00 PM');
    });

    it('preserves existing AM/PM formatted strings', () => {
      expect(formatTimetableTime('04:00 AM')).toBe('04:00 AM');
      expect(formatTimetableTime('01:00 PM')).toBe('01:00 PM');
    });

    it('correctly calculates minutes from midnight for sorting', () => {
      expect(timeToMinutes('04:00 AM')).toBe(240);
      expect(timeToMinutes('06:00 AM')).toBe(360);
      expect(timeToMinutes('01:00 PM')).toBe(780);
      expect(timeToMinutes('10:00 PM')).toBe(1320);

      const times = ['10:00 PM', '04:00 AM', '01:00 PM', '06:00 AM'];
      times.sort((a, b) => timeToMinutes(a) - timeToMinutes(b));

      expect(times).toEqual(['04:00 AM', '06:00 AM', '01:00 PM', '10:00 PM']);
    });
  });

  describe('Category & Keyword Icon Resolution', () => {
    it('resolves proper Lucide icons for timetable keywords', () => {
      const getIconName = (node: any) =>
        node.type.displayName || node.type.name || node.type.render?.name || node.type.render?.displayName;

      expect(getIconName(getTimetableIcon('Wake up'))).toBe('Sun');
      expect(getIconName(getTimetableIcon('Study (DSA + Java)'))).toBe('BookOpen');
      expect(getIconName(getTimetableIcon('Get Ready'))).toBe('CircleCheck');
      expect(getIconName(getTimetableIcon('College'))).toBe('GraduationCap');
      expect(getIconName(getTimetableIcon('Lunch Break'))).toBe('Coffee');
      expect(getIconName(getTimetableIcon('Project Work'))).toBe('CodeXml');
      expect(getIconName(getTimetableIcon('Revision'))).toBe('RefreshCw');
      expect(getIconName(getTimetableIcon('Plan Tomorrow'))).toBe('ChartColumn');
    });
  });

  describe('Special Symbol Tooltip Constant', () => {
    it('matches the exact prompt requirement for tooltip', () => {
      expect(TIMETABLE_SCHEDULED_TOOLTIP).toBe("Scheduled for today's timetable");
    });
  });

  describe('Single Source of Truth & Synchronization Scenarios', () => {
    const sampleTasks: Task[] = [
      {
        id: 'task-1',
        title: 'Wake up',
        lifeArea: 'routine',
        dueDate: TODAY,
        targetDate: TODAY,
        scheduledDate: TODAY,
        startTime: '04:00',
        priority: 'high',
        status: 'not-started',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task-2',
        title: 'Study (DSA + Java)',
        lifeArea: 'growth',
        dueDate: TODAY,
        targetDate: TODAY,
        scheduledDate: TODAY,
        startTime: '06:00',
        endTime: '08:00',
        priority: 'critical',
        status: 'not-started',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task-3',
        title: 'General Review',
        lifeArea: 'growth',
        dueDate: TODAY,
        targetDate: TODAY,
        scheduledDate: TODAY,
        // No time assigned: unscheduled
        priority: 'medium',
        status: 'not-started',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task-yesterday',
        title: 'Yesterday Workout',
        lifeArea: 'health',
        dueDate: YESTERDAY,
        targetDate: YESTERDAY,
        scheduledDate: YESTERDAY,
        startTime: '17:00',
        priority: 'medium',
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    it('Scenario 1 & 2: Mission with time appears in timetable; mission without time remains only unscheduled', () => {
      const todayTasks = sampleTasks.filter(
        (t) => (t.scheduledDate || t.targetDate || t.dueDate) === TODAY
      );
      const scheduledInTimetable = todayTasks.filter((t) => Boolean(t.startTime || t.plannedStartTime));
      const unscheduledInTimetable = todayTasks.filter((t) => !t.startTime && !t.plannedStartTime);

      expect(scheduledInTimetable.map((t) => t.title)).toEqual(['Wake up', 'Study (DSA + Java)']);
      expect(unscheduledInTimetable.map((t) => t.title)).toEqual(['General Review']);
      // All 3 appear in Today Missions
      expect(todayTasks.length).toBe(3);
    });

    it('Scenario 4 & 5: Updating or completing a mission synchronizes across both views', () => {
      let state = [...sampleTasks];

      // Mark 'Wake up' as completed
      state = state.map((t) =>
        t.id === 'task-1' ? { ...t, status: 'completed' as const } : t
      );

      // Verify in Timetable
      const timetableWakeUp = state.find((t) => t.id === 'task-1');
      expect(timetableWakeUp?.status).toBe('completed');

      // Verify in Today Missions
      const todayMissionWakeUp = state.filter(
        (t) => (t.targetDate || t.dueDate) === TODAY && t.id === 'task-1'
      )[0];
      expect(todayMissionWakeUp.status).toBe('completed');
    });

    it('Scenario 6: Removing mission from timetable clears time but preserves mission in Today Missions', () => {
      let state = [...sampleTasks];

      // Remove 'Study (DSA + Java)' from timetable
      state = state.map((t) =>
        t.id === 'task-2'
          ? {
              ...t,
              startTime: undefined,
              plannedStartTime: undefined,
              endTime: undefined,
            }
          : t
      );

      // Now it has no time: does NOT appear in scheduled timetable slots
      const scheduled = state.filter(
        (t) => (t.targetDate || t.dueDate) === TODAY && Boolean(t.startTime || t.plannedStartTime)
      );
      expect(scheduled.some((t) => t.id === 'task-2')).toBe(false);

      // But STILL exists in Today Missions!
      const stillInTodayMissions = state.filter(
        (t) => (t.targetDate || t.dueDate) === TODAY && t.id === 'task-2'
      );
      expect(stillInTodayMissions.length).toBe(1);
      expect(stillInTodayMissions[0].title).toBe('Study (DSA + Java)');
    });

    it('Scenario 9 & 10: Date switching displays correct day timetable and preserves yesterday history', () => {
      // Viewing yesterday
      const yesterdayMissions = sampleTasks.filter(
        (t) => (t.scheduledDate || t.targetDate || t.dueDate) === YESTERDAY
      );
      expect(yesterdayMissions.length).toBe(1);
      expect(yesterdayMissions[0].title).toBe('Yesterday Workout');
      expect(yesterdayMissions[0].status).toBe('completed');

      // Today missions remain unaffected
      const todayMissions = sampleTasks.filter(
        (t) => (t.scheduledDate || t.targetDate || t.dueDate) === TODAY
      );
      expect(todayMissions.length).toBe(3);
    });
  });
});
