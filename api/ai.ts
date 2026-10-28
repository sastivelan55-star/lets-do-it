// Serverless API route for Life OS AI Task Execution
// Works in Vercel Serverless Functions and local Vite dev middleware

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
    priority?: 'low' | 'medium' | 'high' | 'critical';
    targetTaskId?: string;
    targetMonth?: number;
    targetProjectId?: string;
    subtasks?: string[];
    rescheduleDate?: string;
    taskIds?: string[];
    summaryText?: string;
  };
}

export interface AiApiRequest {
  action: 'status' | 'parse_instruction' | 'summarize';
  provider?: 'openai' | 'gemini';
  model?: string;
  prompt?: string;
  context?: {
    today: string;
    tasks?: Array<{ id: string; title: string; lifeArea: string; dueDate: string; priority: string; status: string; roadmapMonth?: number }>;
    areas?: Array<{ id: string; name: string }>;
    projects?: Array<{ id: string; name: string }>;
  };
}

export interface AiApiResponse {
  success: boolean;
  providerConfigured?: {
    openai: boolean;
    gemini: boolean;
  };
  result?: AiTaskAction;
  summary?: string;
  error?: string;
}

const SYSTEM_PROMPT = `You are Life OS AI Task Assistant, a precise, structured personal execution assistant.
Your job is to understand natural language instructions from the user and output a SINGLE JSON object with strict parameters for task management actions.

Current date context: {TODAY}

Available life planning areas:
{AREAS}

Available projects:
{PROJECTS}

Existing tasks sample:
{TASKS}

Rules:
1. Output ONLY valid JSON matching this schema:
{
  "intent": "create_task" | "edit_task" | "assign_task" | "add_subtasks" | "reschedule_tasks" | "summarize_progress" | "clarify",
  "explanation": "Clear, friendly sentence describing what will be done",
  "needsConfirmation": boolean, // true for bulk rescheduling, reassigning, or consequential moves
  "confirmationMessage": "string if needsConfirmation is true",
  "clarificationQuestion": "string if instruction is ambiguous",
  "actionParams": {
    "taskTitle": "string",
    "description": "string",
    "lifeArea": "technical" | "communication" | "career" | "creativity" | "health" | custom area id,
    "dueDate": "YYYY-MM-DD",
    "priority": "low" | "medium" | "high" | "critical",
    "targetTaskId": "id if matching an existing task",
    "targetMonth": integer 1-8 if assigned to roadmap,
    "targetProjectId": "project id if linked to project",
    "subtasks": ["subtask title 1", "subtask title 2"],
    "rescheduleDate": "YYYY-MM-DD",
    "taskIds": ["id1", "id2"]
  }
}
2. Never output markdown fences (do not wrap in \`\`\`json). Output pure JSON only.
3. For destructive or bulk actions (like moving multiple overdue tasks), always set "needsConfirmation": true with a helpful confirmationMessage.
4. If instruction is ambiguous (e.g. "move that task" when multiple match), set "intent": "clarify" with "clarificationQuestion".
5. Match the closest lifeArea from the available areas. Default to "technical" if coding/DSA related, "communication" if speaking/interview related, "career" for resume/internship, "creativity" for ideas/writing, "health" for habits/reflection.
6. Calculate dates accurately relative to {TODAY}. E.g. "tomorrow" = today + 1 day, "next Monday" = upcoming Monday.`;

export async function handleAiRequest(body: AiApiRequest): Promise<AiApiResponse> {
  const openaiKey = process.env.OPENAI_API_KEY?.trim() || '';
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || '';

  if (body.action === 'status') {
    return {
      success: true,
      providerConfigured: {
        openai: Boolean(openaiKey),
        gemini: Boolean(geminiKey),
      },
    };
  }

  const preferredProvider = body.provider || (geminiKey ? 'gemini' : openaiKey ? 'openai' : null);

  if (!preferredProvider || (preferredProvider === 'openai' && !openaiKey) || (preferredProvider === 'gemini' && !geminiKey)) {
    return {
      success: false,
      error: `AI Provider (${body.provider || 'default'}) is not configured. Please add OPENAI_API_KEY or GEMINI_API_KEY in your environment variables.`,
      providerConfigured: {
        openai: Boolean(openaiKey),
        gemini: Boolean(geminiKey),
      },
    };
  }

  const context = body.context || { today: new Date().toISOString().slice(0, 10) };
  const promptText = body.prompt?.trim() || '';

  if (!promptText) {
    return { success: false, error: 'Empty instruction prompt provided.' };
  }

  const populatedSystemPrompt = SYSTEM_PROMPT
    .replace('{TODAY}', context.today)
    .replace('{AREAS}', (context.areas || []).map((a) => `- ${a.id}: ${a.name}`).join('\n') || 'technical, communication, career, creativity, health')
    .replace('{PROJECTS}', (context.projects || []).map((p) => `- ${p.id}: ${p.name}`).join('\n') || 'None')
    .replace('{TASKS}', (context.tasks || []).slice(0, 15).map((t) => `- [${t.id}] "${t.title}" (area: ${t.lifeArea}, due: ${t.dueDate}, status: ${t.status})`).join('\n') || 'None');

  try {
    if (preferredProvider === 'gemini') {
      const model = body.model || 'gemini-1.5-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: populatedSystemPrompt }] },
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: `Gemini API error (${res.status}): ${errText}` };
      }

      const data = (await res.json()) as any;
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        return { success: false, error: 'Empty response received from Gemini.' };
      }

      const parsed: AiTaskAction = JSON.parse(rawText);
      return { success: true, result: parsed };
    }

    if (preferredProvider === 'openai') {
      const model = body.model || 'gpt-4o-mini';
      const endpoint = 'https://api.openai.com/v1/chat/completions';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: populatedSystemPrompt },
            { role: 'user', content: promptText },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: `OpenAI API error (${res.status}): ${errText}` };
      }

      const data = (await res.json()) as any;
      const rawText = data?.choices?.[0]?.message?.content;
      if (!rawText) {
        return { success: false, error: 'Empty response received from OpenAI.' };
      }

      const parsed: AiTaskAction = JSON.parse(rawText);
      return { success: true, result: parsed };
    }

    return { success: false, error: 'Unsupported provider requested.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `AI Execution Failed: ${msg}` };
  }
}

// Vercel Serverless Function Handler
export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const result = await handleAiRequest({ action: 'status' });
    return res.status(200).json(result);
  }

  if (req.method === 'POST') {
    const body: AiApiRequest = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const result = await handleAiRequest(body);
    return res.status(result.success ? 200 : 400).json(result);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
