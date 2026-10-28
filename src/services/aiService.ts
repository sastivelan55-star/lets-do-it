// Life OS AI Service (Client-Side Interface to Secure Serverless API)
import type { Task, LifeArea, TaskPriority } from '../types';

export interface AiTaskAction {
  intent: 'create_task' | 'edit_task' | 'assign_task' | 'add_subtasks' | 'reschedule_tasks' | 'summarize_progress' | 'clarify';
  explanation: string;
  needsConfirmation?: boolean;
  confirmationMessage?: string;
  clarificationQuestion?: string;
  actionParams?: {
    taskTitle?: string;
    description?: string;
    lifeArea?: string;
    dueDate?: string;
    priority?: TaskPriority;
    targetTaskId?: string;
    targetMonth?: number;
    targetProjectId?: string;
    subtasks?: string[];
    rescheduleDate?: string;
    taskIds?: string[];
  };
}

export interface AiStatusResult {
  success: boolean;
  providerConfigured: {
    openai: boolean;
    gemini: boolean;
  };
  error?: string;
}

export async function checkAiConfig(): Promise<AiStatusResult> {
  try {
    const res = await fetch('/api/ai');
    if (!res.ok) {
      return {
        success: false,
        providerConfigured: { openai: false, gemini: false },
        error: `Server responded with ${res.status}`,
      };
    }
    const data = await res.json();
    return {
      success: true,
      providerConfigured: data.providerConfigured || { openai: false, gemini: false },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      providerConfigured: { openai: false, gemini: false },
      error: `Failed to connect to AI API: ${msg}`,
    };
  }
}

export async function parseNaturalLanguageTask(
  instruction: string,
  context: {
    today: string;
    tasks: Task[];
    areas: Array<{ id: string; name: string }>;
    projects: Array<{ id: string; name: string }>;
  },
  provider?: 'openai' | 'gemini',
  model?: string
): Promise<{ success: boolean; action?: AiTaskAction; error?: string }> {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'parse_instruction',
        prompt: instruction,
        provider,
        model,
        context: {
          today: context.today,
          tasks: context.tasks.slice(0, 20).map((t) => ({
            id: t.id,
            title: t.title,
            lifeArea: t.lifeArea,
            dueDate: t.dueDate,
            priority: t.priority,
            status: t.status,
            roadmapMonth: t.roadmapMonth,
          })),
          areas: context.areas,
          projects: context.projects,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Failed to process instruction with AI model.',
      };
    }

    return {
      success: true,
      action: data.result,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Network error when calling AI service: ${msg}`,
    };
  }
}

// Client-side executor that validates parameters and performs safe AppContext operations
export async function executeAiAction(
  action: AiTaskAction,
  appOps: {
    addTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<any>;
    updateTask: (task: Task) => Promise<any>;
    assignTask: (taskId: string, assignment: { lifeArea?: LifeArea; roadmapMonth?: number | null; projectId?: string | null; dueDate?: string; priority?: TaskPriority }) => Promise<any>;
    rescheduleTask: (taskId: string, date: string) => Promise<any>;
    tasks: Task[];
    today: string;
  }
): Promise<{ success: boolean; message: string }> {
  const p = action.actionParams || {};

  switch (action.intent) {
    case 'create_task': {
      if (!p.taskTitle) {
        return { success: false, message: 'Missing task title in AI action parameters.' };
      }
      await appOps.addTask({
        title: p.taskTitle,
        description: p.description,
        lifeArea: (p.lifeArea || 'technical') as LifeArea,
        dueDate: p.dueDate || appOps.today,
        priority: (p.priority || 'medium') as TaskPriority,
        roadmapMonth: p.targetMonth,
        projectId: p.targetProjectId,
        status: 'not-started',
      });

      // If subtasks were also requested
      if (Array.isArray(p.subtasks) && p.subtasks.length > 0) {
        // Wait briefly for parent task to be available in local state if needed
        // Subtasks can be created
      }

      return { success: true, message: `Created task "${p.taskTitle}".` };
    }

    case 'assign_task': {
      let targetTask: Task | undefined;
      if (p.targetTaskId) {
        targetTask = appOps.tasks.find((t) => t.id === p.targetTaskId);
      } else if (p.taskTitle) {
        const query = p.taskTitle.toLowerCase();
        targetTask = appOps.tasks.find((t) => t.title.toLowerCase().includes(query));
      }

      if (!targetTask) {
        return { success: false, message: 'Could not find the target task to move or reassign.' };
      }

      await appOps.assignTask(targetTask.id, {
        lifeArea: p.lifeArea as LifeArea | undefined,
        roadmapMonth: p.targetMonth,
        projectId: p.targetProjectId,
        dueDate: p.dueDate,
        priority: p.priority,
      });

      return {
        success: true,
        message: `Updated assignment for "${targetTask.title}" (Area: ${p.lifeArea || targetTask.lifeArea}).`,
      };
    }

    case 'add_subtasks': {
      let parentTask: Task | undefined;
      if (p.targetTaskId) {
        parentTask = appOps.tasks.find((t) => t.id === p.targetTaskId);
      } else if (p.taskTitle) {
        const query = p.taskTitle.toLowerCase();
        parentTask = appOps.tasks.find((t) => t.title.toLowerCase().includes(query));
      }

      if (!parentTask) {
        return { success: false, message: 'Could not find parent task to attach subtasks to.' };
      }

      const subtaskList = p.subtasks || [];
      if (subtaskList.length === 0) {
        return { success: false, message: 'No subtask titles provided.' };
      }

      for (const stTitle of subtaskList) {
        await appOps.addTask({
          title: stTitle,
          parentId: parentTask.id,
          lifeArea: parentTask.lifeArea,
          dueDate: parentTask.dueDate,
          priority: 'medium',
          status: 'not-started',
        });
      }

      return { success: true, message: `Added ${subtaskList.length} subtasks to "${parentTask.title}".` };
    }

    case 'reschedule_tasks': {
      const targetDate = p.rescheduleDate || p.dueDate;
      if (!targetDate) {
        return { success: false, message: 'Missing reschedule target date.' };
      }

      const idsToReschedule = p.taskIds && p.taskIds.length > 0
        ? p.taskIds
        : p.targetTaskId
        ? [p.targetTaskId]
        : [];

      if (idsToReschedule.length === 0) {
        return { success: false, message: 'No tasks selected to reschedule.' };
      }

      for (const id of idsToReschedule) {
        await appOps.rescheduleTask(id, targetDate);
      }

      return { success: true, message: `Rescheduled ${idsToReschedule.length} task(s) to ${targetDate}.` };
    }

    default:
      return { success: false, message: `Unknown or unexecutable action: ${action.intent}` };
  }
}
