// Serverless API route for Life OS & NewsPro AI Task & Chat Execution
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

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface NewsContextItem {
  id: string;
  title: string;
  description: string;
  content?: string;
  category?: string;
  source?: string;
  publishedAt?: string;
  url?: string;
}

export interface AiApiRequest {
  action: 'status' | 'parse_instruction' | 'summarize' | 'chat';
  provider?: 'openai' | 'gemini';
  model?: string;
  prompt?: string;
  messages?: ChatMessage[];
  newsContext?: NewsContextItem[];
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
  message?: ChatMessage;
  reply?: string;
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
  "needsConfirmation": boolean,
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
2. Never output markdown fences. Output pure JSON only.
3. For destructive or bulk actions, always set "needsConfirmation": true with a helpful confirmationMessage.
4. If instruction is ambiguous, set "intent": "clarify" with "clarificationQuestion".
5. Match the closest lifeArea from the available areas. Default to "technical" if coding/DSA related.
6. Calculate dates accurately relative to {TODAY}.`;

// Helper to execute Gemini generateContent with fallback models
async function callGeminiApi(
  geminiKey: string,
  systemInstruction: string,
  userPrompt: string,
  preferredModel?: string
): Promise<{ success: boolean; text?: string; error?: string }> {
  const modelsToTry = [
    preferredModel,
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
  ].filter(Boolean) as string[];

  let lastError = 'Unknown Gemini error';

  for (const model of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return { success: true, text };
        }
      } else {
        const errText = await res.text();
        lastError = `Gemini API error (${model} - ${res.status}): ${errText}`;
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }

  return { success: false, error: lastError };
}

export async function handleAiRequest(body: AiApiRequest): Promise<AiApiResponse> {
  const openaiKey = (process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '').trim();
  const geminiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();

  if (body.action === 'status') {
    return {
      success: true,
      providerConfigured: {
        openai: Boolean(openaiKey),
        gemini: Boolean(geminiKey),
      },
    };
  }

  // Prioritize Gemini since it has active quota
  const preferredProvider = body.provider || (geminiKey ? 'gemini' : openaiKey ? 'openai' : null);

  if (!preferredProvider || (preferredProvider === 'openai' && !openaiKey) || (preferredProvider === 'gemini' && !geminiKey)) {
    return {
      success: false,
      error: `AI Provider (${body.provider || 'default'}) is not configured.`,
      providerConfigured: {
        openai: Boolean(openaiKey),
        gemini: Boolean(geminiKey),
      },
    };
  }

  // ── ACTION: CHAT CONVERSATION WITH NEWS & APP CONTEXT ──────────────────────
  if (body.action === 'chat') {
    const rawMessages = body.messages || [];
    const newsContext = body.newsContext || [];

    let newsPromptSection = '';
    if (newsContext.length > 0) {
      newsPromptSection = `\n\n### LIVE LOADED REAL-TIME NEWS ARTICLES CONTEXT:\n` +
        newsContext.slice(0, 20).map((art, idx) =>
          `[Article ${idx + 1}] Title: ${art.title}\nCategory: ${art.category || 'General'} | Source: ${art.source || 'News'} | Published: ${art.publishedAt || 'Recent'}\n${art.url ? `URL: ${art.url}\n` : ''}Summary: ${art.description}\n${art.content ? `Full Details: ${art.content}\n` : ''}`
        ).join('\n---\n');
    }

    const systemPromptChat = `You are Nova, an intelligent, articulate, and accurate AI Assistant in Life OS & NewsPro.
Key Capabilities and Knowledge:
1. General Knowledge: Answer questions clearly across Indian and international politics, world history, sciences, arts, and geography. For example, the President of India is Droupadi Murmu, and the Prime Minister of India is Narendra Modi.
2. Technology & AI: Explain software concepts, artificial intelligence, machine learning, systems architecture, coding, and the difference between AI and ML.
3. News & Real-Time Events: Use the LIVE LOADED REAL-TIME NEWS ARTICLES CONTEXT provided below to answer questions about breaking stories, tech breakthroughs, markets, sports, or world events with accurate citations and sources.
4. Life OS Productivity: Assist the user with time management, habits, tasks, roadmap planning, and schedules.
5. Formatting: Format all answers with clean GitHub-flavored markdown (bullet points, bold highlights, concise headers). Never invent facts or citations. Be friendly, direct, and helpful.${newsPromptSection}`;

    // Format the multi-turn conversation into a prompt
    const conversationPrompt = rawMessages
      .map((m) => `${m.role === 'assistant' ? 'Assistant (Nova)' : 'User'}: ${m.content}`)
      .join('\n\n');

    // 1. Try Gemini first (or as requested)
    if (preferredProvider === 'gemini' || !openaiKey) {
      const geminiResult = await callGeminiApi(
        geminiKey,
        systemPromptChat,
        conversationPrompt,
        body.model || 'gemini-3.6-flash'
      );

      if (geminiResult.success && geminiResult.text) {
        return {
          success: true,
          message: { role: 'assistant', content: geminiResult.text },
          reply: geminiResult.text,
        };
      }

      // If Gemini failed and we have OpenAI, try OpenAI
      if (openaiKey) {
        try {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: systemPromptChat },
                ...rawMessages.map((m) => ({ role: m.role, content: m.content })),
              ],
              temperature: 0.7,
              max_tokens: 1500,
            }),
          });

          if (res.ok) {
            const data = (await res.json()) as any;
            const text = data?.choices?.[0]?.message?.content || '';
            if (text) {
              return {
                success: true,
                message: { role: 'assistant', content: text },
                reply: text,
              };
            }
          }
        } catch (_e) {
          // Fall through
        }
      }

      return { success: false, error: geminiResult.error };
    }

    // 2. If OpenAI preferred
    if (preferredProvider === 'openai') {
      try {
        const model = body.model || 'gpt-4o-mini';
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPromptChat },
              ...rawMessages.map((m) => ({ role: m.role, content: m.content })),
            ],
            temperature: 0.7,
            max_tokens: 1500,
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as any;
          const text = data?.choices?.[0]?.message?.content || '';
          if (text) {
            return {
              success: true,
              message: { role: 'assistant', content: text },
              reply: text,
            };
          }
        }
      } catch (_e) {
        // Fallback to Gemini
      }

      // Fallback to Gemini if OpenAI credits are exhausted
      const geminiResult = await callGeminiApi(
        geminiKey,
        systemPromptChat,
        conversationPrompt,
        'gemini-3.6-flash'
      );

      if (geminiResult.success && geminiResult.text) {
        return {
          success: true,
          message: { role: 'assistant', content: geminiResult.text },
          reply: geminiResult.text,
        };
      }

      return { success: false, error: 'AI request could not be processed by either provider.' };
    }
  }

  // ── ACTION: PARSE INSTRUCTION INTO STRUCTURED ACTIONS ──────────────────────
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
    const geminiRes = await callGeminiApi(geminiKey, populatedSystemPrompt, promptText, 'gemini-3.6-flash');
    if (geminiRes.success && geminiRes.text) {
      // Clean possible markdown JSON wrappers
      let cleaned = geminiRes.text.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
      else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
      const parsed: AiTaskAction = JSON.parse(cleaned);
      return { success: true, result: parsed };
    }

    return { success: false, error: geminiRes.error || 'Failed to process task action with AI.' };
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
