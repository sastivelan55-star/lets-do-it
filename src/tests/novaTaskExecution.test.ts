import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  detectIntent,
  extractTaskData,
  processNovaMessage,
  getVerifiedCurrentAffairsResponse,
  resetSessionMemory,
  updateSessionMemory,
} from '../services/novaOrchestrator';
import {
  isGoogleTasksConnected,
  getGoogleTasksNavigationMarkdown,
} from '../services/googleTasksService';
import type { Task } from '../types';

describe('Nova AI Task Creation & Intelligence Execution Suite', () => {
  beforeEach(() => {
    resetSessionMemory();
  });

  // ── TEST 1: Exact requirement "add pot in this application" ────────────────
  it('TEST 1: correctly extracts "Pot" with no invented details from "add pot in this application"', async () => {
    const prompt = 'add pot in this application';
    const intent = detectIntent(prompt);
    expect(intent).toBe('TASK_CREATE');

    const taskData = extractTaskData(prompt);
    expect(taskData.title).toBe('Pot');
    expect(taskData.target).toBe('lifeos');
    // Must NOT invent date, time, location, or arbitrary category
    expect(taskData.dueDate).toBe('');
    expect(taskData.plannedStartTime).toBeUndefined();
    expect(taskData.notes).toBeUndefined();
    expect(taskData.priority).toBe('medium'); // normal/medium priority

    // Simulate actual creation via AppContext operation
    const mockTasks: Task[] = [];
    const mockAddTask = vi.fn().mockImplementation(async (data) => {
      const created: Task = {
        ...data,
        id: 'task-pot-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockTasks.push(created);
      return created;
    });

    const response = await processNovaMessage({
      messages: [{ role: 'user', content: prompt }],
      userQuery: prompt,
      appOps: {
        addTask: mockAddTask,
        updateTask: vi.fn(),
        completeTask: vi.fn(),
        removeTask: vi.fn(),
      },
    });

    // Verification
    expect(mockAddTask).toHaveBeenCalledTimes(1);
    expect(mockAddTask).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Pot',
        status: 'not-started',
        dueDate: '',
      })
    );
    expect(mockTasks).toHaveLength(1);
    expect(mockTasks[0].title).toBe('Pot');

    // Expected Nova response format with action button
    expect(response.reply).toContain("Done! I've added Pot to your Life OS Tasks.");
    expect(response.reply).toContain('You can find it under Tasks in the left navigation.');
    expect(response.actionButton).toEqual({
      label: 'View Task',
      section: 'tasks',
    });
  });

  // ── TEST 2: Two tasks with same title exist independently ─────────────────
  it('TEST 8: allows intentionally creating two tasks with the same title', async () => {
    const savedTasks: Task[] = [];
    let idCounter = 1;
    const mockAddTask = vi.fn().mockImplementation(async (data) => {
      const created: Task = {
        ...data,
        id: `pot-id-${idCounter++}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      savedTasks.push(created);
      return created;
    });

    // Create first Pot task
    await processNovaMessage({
      messages: [{ role: 'user', content: 'add pot in this application' }],
      userQuery: 'add pot in this application',
      appOps: {
        addTask: mockAddTask,
        updateTask: vi.fn(),
        completeTask: vi.fn(),
        removeTask: vi.fn(),
      },
    });

    // Create second Pot task intentionally
    await processNovaMessage({
      messages: [{ role: 'user', content: 'add pot in this application' }],
      userQuery: 'add pot in this application',
      appOps: {
        addTask: mockAddTask,
        updateTask: vi.fn(),
        completeTask: vi.fn(),
        removeTask: vi.fn(),
      },
    });

    expect(savedTasks).toHaveLength(2);
    expect(savedTasks[0].id).toBe('pot-id-1');
    expect(savedTasks[1].id).toBe('pot-id-2');
    expect(savedTasks[0].title).toBe('Pot');
    expect(savedTasks[1].title).toBe('Pot');
    expect(savedTasks[0].id).not.toBe(savedTasks[1].id);
  });

  // ── TEST 3: Navigation follow-up "where can I see it?" ─────────────────────
  it('TEST 5: answers "where can I see it?" with direct Life OS Tasks navigation action', async () => {
    // Pre-seed session memory with Pot task
    updateSessionMemory({
      lastTask: {
        id: 'task-pot-001',
        title: 'Pot',
        target: 'lifeos',
      },
      lastIntent: 'TASK_CREATE',
    });

    const response = await processNovaMessage({
      messages: [
        { role: 'user', content: 'add pot in this application' },
        { role: 'assistant', content: "Done! I've added Pot to your Life OS Tasks." },
        { role: 'user', content: 'where can I see it?' },
      ],
      userQuery: 'where can I see it?',
    });

    expect(response.intent).toBe('NAVIGATION_HELP');
    expect(response.reply).toContain('Tasks');
    expect(response.reply).toContain('left navigation menu');
    expect(response.actionButton).toEqual({
      label: 'View Tasks',
      section: 'tasks',
    });
  });

  // ── TEST 4: Google Tasks integration rule ─────────────────────────────────
  it('TEST 6: "add pot in gtasks" targets Google Tasks and requires connection if disconnected', async () => {
    const prompt = 'add pot in gtasks';
    const taskData = extractTaskData(prompt);
    expect(taskData.title).toBe('Pot');
    expect(taskData.target).toBe('gtasks');

    const response = await processNovaMessage({
      messages: [{ role: 'user', content: prompt }],
      userQuery: prompt,
    });

    // Without token, it must explain connection is required and provide direct link
    if (!isGoogleTasksConnected()) {
      expect(response.reply).toContain('Google Tasks Connection Required');
      expect(response.reply).toContain('tasks.google.com');
    }
  });

  // ── TEST 5: Google Tasks navigation instructions ──────────────────────────
  it('provides complete Google Tasks navigation across Workspace surfaces', () => {
    const navMd = getGoogleTasksNavigationMarkdown();
    expect(navMd).toContain('tasks.google.com');
    expect(navMd).toContain('Google Calendar');
    expect(navMd).toContain('Gmail');
  });

  // ── TEST 6: Storage failure simulation ────────────────────────────────────
  it('TEST 7: reports storage failure honestly without claiming success', async () => {
    const mockFailingAddTask = vi.fn().mockRejectedValue(new Error('IndexedDB quota exceeded'));

    const response = await processNovaMessage({
      messages: [{ role: 'user', content: 'add pot in this application' }],
      userQuery: 'add pot in this application',
      appOps: {
        addTask: mockFailingAddTask,
        updateTask: vi.fn(),
        completeTask: vi.fn(),
        removeTask: vi.fn(),
      },
    });

    expect(response.reply).toContain('Task Creation Failed');
    expect(response.reply).toContain('IndexedDB quota exceeded');
    expect(response.reply).not.toContain("Done! I've added");
  });

  // ── TEST 7: Current Affairs query "cm vijay" ──────────────────────────────
  it('TEST 2: answers "cm vijay" with verified current political facts', () => {
    const response = getVerifiedCurrentAffairsResponse('cm vijay');
    expect(response).not.toBeNull();
    // Must clearly state Vijay is NOT the CM and M.K. Stalin is the current CM
    expect(response).toContain('Vijay is NOT the Chief Minister of Tamil Nadu');
    expect(response).toContain('M. K. Stalin');
    expect(response).toContain('Tamilaga Vettri Kazhagam');
    expect(response).toContain('2026');
  });

  // ── TEST 8: Natural language task "meet Ravi at Starbucks" ────────────────
  it('TEST 4: extracts structured task with title, date, time and location', () => {
    const prompt = 'add a task tomorrow at 9 AM to meet Ravi at Starbucks';
    const taskData = extractTaskData(prompt);

    expect(taskData.title).toContain('Meet Ravi');
    expect(taskData.plannedStartTime).toBe('09:00');
    expect(taskData.notes).toBe('Starbucks');
    expect(taskData.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(taskData.lifeArea).toBe('communication');
  });

  // ── TEST 9: Follow-up "move it to 5 PM" ────────────────────────────────────
  it('TEST 5: updates time of previously created task on "move it to 5 PM"', async () => {
    const existingTask: Task = {
      id: 'task-ravi-001',
      title: 'Meet Ravi',
      lifeArea: 'communication',
      dueDate: '2026-11-08',
      plannedStartTime: '09:00',
      priority: 'medium',
      status: 'not-started',
      notes: 'Starbucks',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateSessionMemory({
      lastTask: {
        id: existingTask.id,
        title: existingTask.title,
        dueDate: existingTask.dueDate,
        plannedStartTime: existingTask.plannedStartTime,
        target: 'lifeos',
      },
    });

    const mockUpdateTask = vi.fn().mockResolvedValue(undefined);

    const response = await processNovaMessage({
      messages: [
        { role: 'user', content: 'add a task tomorrow at 9 AM to meet Ravi at Starbucks' },
        { role: 'assistant', content: "Done! I've added Meet Ravi to your Life OS Tasks." },
        { role: 'user', content: 'move it to 5 PM' },
      ],
      userQuery: 'move it to 5 PM',
      tasks: [existingTask],
      appOps: {
        addTask: vi.fn(),
        updateTask: mockUpdateTask,
        completeTask: vi.fn(),
        removeTask: vi.fn(),
      },
    });

    expect(mockUpdateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'task-ravi-001',
        plannedStartTime: '17:00',
      })
    );
    expect(response.reply).toContain('moved');
    expect(response.reply).toContain('17:00');
  });

  // ── TEST 10: "show my pending tasks" ──────────────────────────────────────
  it('lists pending tasks when requested', async () => {
    const tasksList: Task[] = [
      {
        id: 't-1',
        title: 'Pot',
        status: 'not-started',
        lifeArea: 'technical',
        dueDate: '',
        priority: 'medium',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 't-2',
        title: 'Buy milk',
        status: 'not-started',
        lifeArea: 'technical',
        dueDate: '2026-11-07',
        priority: 'low',
        createdAt: '',
        updatedAt: '',
      },
    ];

    const response = await processNovaMessage({
      messages: [{ role: 'user', content: 'show my pending tasks' }],
      userQuery: 'show my pending tasks',
      tasks: tasksList,
    });

    expect(response.intent).toBe('TASK_LIST');
    expect(response.reply).toContain('Pot');
    expect(response.reply).toContain('Buy milk');
  });

  // ── TEST 11: Other natural language commands ──────────────────────────────
  it('parses gym session, meeting, and personal assignment cleanly', () => {
    const gym = extractTaskData('Add a gym session every Monday at 7 AM.');
    expect(gym.title).toContain('Gym session');
    expect(gym.recurring).toBe('weekly');
    expect(gym.plannedStartTime).toBe('07:00');
    expect(gym.lifeArea).toBe('health');

    const milk = extractTaskData('Add a task to buy milk.');
    expect(milk.title).toBe('Buy milk');

    const meeting = extractTaskData('Create a meeting with Arun at Starbucks.');
    expect(meeting.title).toContain('Meeting with Arun');
    expect(meeting.notes).toBe('Starbucks');
    expect(meeting.lifeArea).toBe('communication');

    const assignment = extractTaskData('Add a personal task to finish my assignment.');
    expect(assignment.title).toBe('Finish my assignment');
  });

  // ── TEST 12: Fix "add poy to the date of 23rd december" (Module 3.1) ───────
  it('TEST 12: correctly extracts title "Poy" and dueDate "2026-12-23" without date text in title', () => {
    const prompt = 'add poy to the date of 23rd december';
    const taskData = extractTaskData(prompt);

    expect(taskData.title).toBe('Poy');
    expect(taskData.dueDate).toBe('2026-12-23');
    expect(taskData.plannedStartTime).toBeUndefined();
    expect(taskData.notes).toBeUndefined();
    expect(taskData.target).toBe('lifeos');
  });
});

