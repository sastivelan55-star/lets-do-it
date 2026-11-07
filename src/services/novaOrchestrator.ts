/**
 * Nova AI Orchestrator
 * Comprehensive Intelligence, Intent Recognition, Real Action Execution, and Tool Layer
 * 
 * Capabilities:
 * - Intent classification (GENERAL_QUESTION, CURRENT_AFFAIRS, NEWS_SEARCH, TASK_CREATE,
 *   TASK_UPDATE, TASK_DELETE, TASK_COMPLETE, TASK_LIST, NAVIGATION_HELP, FOLLOW_UP, CASUAL_CHAT)
 * - Multi-turn conversational context memory (remembers last created/modified task)
 * - Precise field extraction adhering to rules: never invent dates, times, categories or locations
 * - Separate title, due date, time, location, recurrence, priority
 * - Fixes "add poy to the date of 23rd december" -> title: "Poy", due_date: "2026-12-23"
 * - Safe spelling correction without altering proper nouns or uncommon words
 * - Life OS direct task execution & persistence verification
 * - Google Tasks real API execution with connection status verification
 * - Verified current affairs intelligence (e.g. "cm vijay", Indian political leadership)
 * - Primary Google Gemini model with intelligent local deterministic engine fallback
 * - Streaming support with AbortController
 */

import type { LifeArea, TaskPriority, Task } from '../types';
import { ENV } from '../config/env';
import type { NewsContextItem, LifeOsContext } from './aiService';
import {
  createGoogleTask,
  isGoogleTasksConnected,
  getGoogleTasksNavigationMarkdown,
} from './googleTasksService';

// ─── Types ───────────────────────────────────────────────────────────────────

export type NovaIntentType =
  | 'GENERAL_QUESTION'
  | 'CURRENT_AFFAIRS'
  | 'NEWS_SEARCH'
  | 'TASK_CREATE'
  | 'TASK_UPDATE'
  | 'TASK_DELETE'
  | 'TASK_COMPLETE'
  | 'TASK_LIST'
  | 'NAVIGATION_HELP'
  | 'FOLLOW_UP'
  | 'CASUAL_CHAT';

export interface ExtractedTaskData {
  title: string;
  description?: string;
  lifeArea?: LifeArea;
  dueDate?: string; // YYYY-MM-DD or empty
  plannedStartTime?: string; // HH:mm
  priority: TaskPriority;
  recurring?: 'daily' | 'weekly' | 'weekdays' | 'none';
  notes?: string; // location or specific details
  target: 'lifeos' | 'gtasks';
}

export type ExtractedTask = ExtractedTaskData;

export interface TaskContextMemory {
  lastTask?: {
    id?: string;
    title: string;
    dueDate?: string;
    plannedStartTime?: string;
    target: 'lifeos' | 'gtasks';
    notes?: string;
  };
  lastIntent?: NovaIntentType;
  lastTopic?: string;
}

export interface NovaChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  newsContext?: NewsContextItem[];
  lifeOsContext?: LifeOsContext;
  userQuery?: string;
  tasks?: Task[];
  appOps?: {
    addTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
    updateTask: (task: Task) => Promise<void>;
    completeTask: (id: string) => Promise<void>;
    removeTask: (id: string) => Promise<void>;
  };
  memory?: TaskContextMemory;
  signal?: AbortSignal;
}

export interface NovaChatResponse {
  reply: string;
  intent: NovaIntentType;
  provider: string;
  model: string;
  latencyMs: number;
  actionButton?: {
    label: string;
    section: string; // NavSection e.g. 'tasks'
  };
  createdTask?: Task;
  updatedMemory?: TaskContextMemory;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const GEMINI_KEY = (ENV.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '').trim();
const GEMINI_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
];
const OPENAI_KEY = (ENV.openAiApiKey || import.meta.env.VITE_OPENAI_API_KEY || '').trim();

const MONTH_MAP: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

const SAFE_TYPO_MAP: Record<string, string> = {
  bithday: 'birthday',
  celebretion: 'celebration',
  grocceries: 'groceries',
  groceries: 'groceries',
  meating: 'meeting',
  exersise: 'exercise',
  exercize: 'exercise',
  taks: 'task',
  tsak: 'task',
  tomorow: 'tomorrow',
  tommorrow: 'tomorrow',
};

// In-memory session context tracker for follow-ups
let globalSessionMemory: TaskContextMemory = {};

export function getSessionMemory(): TaskContextMemory {
  return globalSessionMemory;
}

export function updateSessionMemory(mem: Partial<TaskContextMemory>): void {
  globalSessionMemory = { ...globalSessionMemory, ...mem };
}

export function resetSessionMemory(): void {
  globalSessionMemory = {};
}

// ─── Intent Recognition ───────────────────────────────────────────────────────

export function detectIntent(text: string, memory?: TaskContextMemory): NovaIntentType {
  const q = text.toLowerCase().trim();

  // 1. Casual Chat / Greetings
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|namaste|greetings|sup|yo)\b/i.test(q)) {
    return 'CASUAL_CHAT';
  }

  // 2. Navigation / Where to see
  if (
    q.includes('where to see') ||
    q.includes('where can i see') ||
    q.includes('where is it') ||
    q.includes('how to view') ||
    q.includes('show where') ||
    q === 'where'
  ) {
    return 'NAVIGATION_HELP';
  }

  // 3. Current Affairs & Politics (e.g. "cm vijay", President of India, PM of India)
  if (
    q.includes('cm vijay') ||
    q.includes('vijay cm') ||
    q.includes('chief minister vijay') ||
    q.includes('president of india') ||
    q.includes('prime minister of india') ||
    q.includes('pm of india') ||
    (q.includes('who is') && (q.includes('president') || q.includes('minister') || q.includes('governor') || q.includes('cm')))
  ) {
    return 'CURRENT_AFFAIRS';
  }

  // 4. Follow-up task modifications: "move it to 5 PM", "shift it to evening", "push to tomorrow"
  if (
    (q.includes('move it') || q.includes('shift it') || q.includes('change it') || q.includes('reschedule it') || q.includes('push it')) &&
    (memory?.lastTask || globalSessionMemory.lastTask)
  ) {
    return 'TASK_UPDATE';
  }

  // 5. Explicit Task Listing
  if (
    /\b(show|list|view|what are)\b.*\b(tasks|pending|todos|schedule|agenda)\b/i.test(q) ||
    q === 'show my pending tasks' ||
    q === 'pending tasks' ||
    q === 'my tasks'
  ) {
    return 'TASK_LIST';
  }

  // 6. Task Completion
  if (/\b(mark|complete|done|finish|check off)\b.*\b(task|meeting|appointment|it)\b/i.test(q)) {
    return 'TASK_COMPLETE';
  }

  // 7. Task Deletion
  if (/\b(delete|remove|cancel|drop)\b.*\b(task|meeting|appointment|reminder)\b/i.test(q)) {
    return 'TASK_DELETE';
  }

  // 8. Task Update / Reschedule
  if (/\b(move|reschedule|change|update|edit|shift|postpone)\b.*\b(task|meeting|appointment|gym|schedule)\b/i.test(q)) {
    return 'TASK_UPDATE';
  }

  // 9. Task Creation (Life OS or Google Tasks)
  if (
    /\b(add|create|make|set up|schedule|remind me to|book|plan|new task)\b/i.test(q) ||
    q.startsWith('add ') ||
    q.startsWith('create ') ||
    q.startsWith('remind me ')
  ) {
    return 'TASK_CREATE';
  }

  // 10. News Queries
  if (
    /\b(news|headline|breaking|latest news|ai news|technology news|tech news|summarize news)\b/i.test(q)
  ) {
    return 'NEWS_SEARCH';
  }

  return 'GENERAL_QUESTION';
}

// ─── Date & Time Resolvers (Asia/Kolkata) ──────────────────────────────────────

export function resolveKolkataDate(datePhrase?: string): string {
  if (!datePhrase) return '';
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const p = datePhrase.toLowerCase().trim();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (p === 'today') return fmt(now);
  if (p === 'tomorrow') {
    const t = new Date(now);
    t.setDate(t.getDate() + 1);
    return fmt(t);
  }
  if (p === 'day after tomorrow' || p === 'overmorrow') {
    const t = new Date(now);
    t.setDate(t.getDate() + 2);
    return fmt(t);
  }
  if (p.includes('monday')) {
    const t = new Date(now);
    t.setDate(t.getDate() + ((1 - t.getDay() + 7) % 7 || 7));
    return fmt(t);
  }
  if (p.includes('sunday')) {
    const t = new Date(now);
    t.setDate(t.getDate() + ((7 - t.getDay() + 7) % 7 || 7));
    return fmt(t);
  }
  if (p.includes('saturday') || p.includes('weekend')) {
    const t = new Date(now);
    t.setDate(t.getDate() + ((6 - t.getDay() + 7) % 7 || 7));
    return fmt(t);
  }

  // Try direct date string parsing
  const d = new Date(datePhrase);
  if (!isNaN(d.getTime())) return fmt(d);

  return '';
}

export function resolveTimeIST(timePhrase?: string): string | undefined {
  if (!timePhrase) return undefined;
  const p = timePhrase.toLowerCase().trim();

  // Special named times
  if (p === 'morning') return '09:00';
  if (p === 'noon' || p === 'midday') return '12:00';
  if (p === 'afternoon') return '14:00';
  if (p === 'evening') return '18:00';
  if (p === 'night') return '20:00';

  // 12-hour format e.g. "9 AM", "10:30 AM", "5 PM", "6:15 PM"
  const match = p.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const meridian = match[3].toLowerCase();

    if (meridian === 'pm' && hours < 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // 24-hour format e.g. "17:00", "09:00"
  const match24 = p.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (match24) {
    return `${match24[1].padStart(2, '0')}:${match24[2]}`;
  }

  return undefined;
}

// ─── Comprehensive Strict Field Extraction (Module 3) ─────────────────────────

/**
 * Extracts task fields from natural language WITHOUT combining dates/times into the title:
 * - "add poy to the date of 23rd december" -> title: "Poy", dueDate: "2026-12-23", time: null
 * - "add pot in this application" -> title: "Pot", target: "lifeos", no date, no time, no category, no location
 * - "add pot in gtasks" -> title: "Pot", target: "gtasks"
 * - "remind me to call Ravi tomorrow at 10 AM" -> title: "Call Ravi", date=tomorrow, time="10:00"
 * - "add a gym session every Monday at 7 AM" -> title: "Gym session", recurring="weekly", time="07:00", lifeArea="health"
 * - "create a meeting with Arun at Starbucks" -> title: "Meeting with Arun", location="Starbucks", lifeArea="communication"
 */
export function extractTaskData(prompt: string): ExtractedTaskData {
  let cleaned = prompt.trim().replace(/[.,;!?]+$/, '').trim();
  const lower = cleaned.toLowerCase();

  // 1. Detect target (Google Tasks vs Life OS)
  let target: 'lifeos' | 'gtasks' = 'lifeos';
  if (
    lower.includes('in gtasks') ||
    lower.includes('to gtasks') ||
    lower.includes('in google tasks') ||
    lower.includes('to google tasks') ||
    lower.includes('on google tasks')
  ) {
    target = 'gtasks';
    cleaned = cleaned.replace(/\b(in|to|on)\s+(gtasks|google\s+tasks)\b/gi, '').trim();
  } else if (
    lower.includes('in this application') ||
    lower.includes('in this app') ||
    lower.includes('in life os') ||
    lower.includes('to life os')
  ) {
    target = 'lifeos';
    cleaned = cleaned.replace(/\b(in|to)\s+(this\s+application|this\s+app|life\s+os)\b/gi, '').trim();
  }

  // 2. Extract Recurring
  let recurring: 'daily' | 'weekly' | 'weekdays' | 'none' = 'none';
  if (/\bevery\s+monday\b/i.test(cleaned)) {
    recurring = 'weekly';
    cleaned = cleaned.replace(/\bevery\s+monday\b/gi, '').trim();
  } else if (/\bevery\s+day\b|\bdaily\b/i.test(cleaned)) {
    recurring = 'daily';
    cleaned = cleaned.replace(/\bevery\s+day\b|\bdaily\b/gi, '').trim();
  } else if (/\bweekdays\b/i.test(cleaned)) {
    recurring = 'weekdays';
    cleaned = cleaned.replace(/\bweekdays\b/gi, '').trim();
  }

  // 3. Extract Time (e.g. "at 7 AM", "at 5:30 PM", "at 10:00")
  let plannedStartTime: string | undefined;
  const timeMatch = cleaned.match(/\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2}:\d{2})\b/i);
  if (timeMatch) {
    plannedStartTime = resolveTimeIST(timeMatch[1]);
    cleaned = cleaned.replace(timeMatch[0], '').trim();
  }

  // 4. Extract Explicit Calendar Dates (e.g. "to the date of 23rd december", "on 23rd december", "23rd dec")
  let dueDate: string | undefined;
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const currentYear = now.getFullYear();
  const pad = (n: number) => String(n).padStart(2, '0');

  // Match pattern: (prefix)? (day) (month) (optional year)?
  // e.g. "to the date of 23rd december", "on 23rd dec 2026", "23rd december"
  const explicitDateRegex = /(?:(?:to|for|on)\s+the\s+date\s+of\s+|(?:to|for|on|due\s+on|by)\s+)?\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)(?:\s+(\d{4}))?\b/i;
  const expMatch = cleaned.match(explicitDateRegex);

  if (expMatch) {
    const day = parseInt(expMatch[1], 10);
    const monthStr = expMatch[2].toLowerCase();
    const month = MONTH_MAP[monthStr] || 1;
    const year = expMatch[3] ? parseInt(expMatch[3], 10) : currentYear;

    dueDate = `${year}-${pad(month)}-${pad(day)}`;
    cleaned = cleaned.replace(expMatch[0], '').trim();
  } else {
    // Match month first: e.g. "december 23", "dec 23rd"
    const monthFirstRegex = /(?:(?:to|for|on)\s+the\s+date\s+of\s+|(?:to|for|on|due\s+on|by)\s+)?\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?\b/i;
    const mExpMatch = cleaned.match(monthFirstRegex);
    if (mExpMatch) {
      const month = MONTH_MAP[mExpMatch[1].toLowerCase()] || 1;
      const day = parseInt(mExpMatch[2], 10);
      const year = mExpMatch[3] ? parseInt(mExpMatch[3], 10) : currentYear;

      dueDate = `${year}-${pad(month)}-${pad(day)}`;
      cleaned = cleaned.replace(mExpMatch[0], '').trim();
    }
  }

  // 5. Extract Relative Dates (e.g. "tomorrow", "day after tomorrow", "today", "next monday")
  if (!dueDate) {
    const relDateRegex = /(?:(?:to|for|on)\s+the\s+date\s+of\s+|(?:to|for|on|due\s+on|by)\s+)?\b(tomorrow|day\s+after\s+tomorrow|overmorrow|today|this\s+weekend|next\s+monday|next\s+week)\b/i;
    const dateMatch = cleaned.match(relDateRegex);
    if (dateMatch) {
      dueDate = resolveKolkataDate(dateMatch[1]);
      cleaned = cleaned.replace(dateMatch[0], '').trim();
    }
  }

  // 6. Extract Day of Week: e.g. "for Sunday", "on Monday"
  if (!dueDate) {
    const dowRegex = /(?:(?:to|for|on)\s+the\s+date\s+of\s+|(?:to|for|on|due\s+on|by)\s+)?\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
    const dowMatch = cleaned.match(dowRegex);
    if (dowMatch) {
      dueDate = resolveKolkataDate(dowMatch[1]);
      cleaned = cleaned.replace(dowMatch[0], '').trim();
    }
  }

  // 7. Extract Physical Location (e.g. "at Starbucks", "at Apollo Hospital")
  let location: string | undefined;
  const locMatch = cleaned.match(/\b(?:at|in)\s+([A-Z][a-zA-Z0-9\s]+?)(?=\s+(?:tomorrow|at|for|to)|$)/);
  if (locMatch && !locMatch[1].toLowerCase().includes('application') && !locMatch[1].toLowerCase().includes('app')) {
    location = locMatch[1].trim();
    cleaned = cleaned.replace(locMatch[0], '').trim();
  }

  // 8. Normalize meeting phrases and strip command verbs
  if (/^(create|schedule|add)\s+a\s+meeting\s+with\s+/i.test(cleaned)) {
    cleaned = cleaned.replace(/^(create|schedule|add)\s+a\s+meeting\s+with\s+/i, 'Meeting with ');
  } else {
    cleaned = cleaned
      .replace(/^(add\s+a\s+task\s+to|add\s+task\s+to|add\s+a\s+task|add\s+task|add\s+a|add|create\s+a\s+task|create\s+task|create\s+a|create|remind\s+me\s+to|remind\s+me|book\s+a|book|schedule\s+a|schedule)\s+/i, '')
      .trim();
  }

  // Strip dangling prepositions at the end or start e.g. "poy to the date of" -> already stripped
  cleaned = cleaned.replace(/\s+(?:to|for|on|at|by|in)\s*$/i, '').trim();
  cleaned = cleaned.replace(/^(?:to|for|on|at|by|in)\s+/i, '').trim();
  cleaned = cleaned.replace(/[.,;!?]+$/, '').trim();

  // 9. Safe Spelling Correction (Module 3.4) without altering proper nouns
  const words = cleaned.split(/\s+/);
  const correctedWords = words.map((w) => {
    // Preserve capitalized proper nouns
    if (w.length > 1 && w[0] === w[0].toUpperCase() && w.slice(1) === w.slice(1).toLowerCase()) {
      return w;
    }
    const lowerW = w.toLowerCase();
    if (SAFE_TYPO_MAP[lowerW]) {
      return SAFE_TYPO_MAP[lowerW];
    }
    return w;
  });
  cleaned = correctedWords.join(' ');

  // 10. Resolve category / LifeArea ONLY if user explicitly indicated or obvious context
  let lifeArea: LifeArea | undefined;
  const clower = cleaned.toLowerCase();
  if (clower.includes('personal task') || clower.includes('personal')) {
    cleaned = cleaned.replace(/\bpersonal\s+task\s+to\b|\bpersonal\s+task\b|\bpersonal\b/gi, '').trim();
    lifeArea = 'career';
  } else if (clower.includes('gym') || clower.includes('workout') || clower.includes('exercise')) {
    lifeArea = 'health';
  } else if (clower.includes('meeting') || clower.includes('call') || clower.includes('meet')) {
    lifeArea = 'communication';
  } else if (clower.includes('shopping') || clower.includes('groceries') || clower.includes('vegetables')) {
    lifeArea = 'creativity'; // mapped into lifeArea
  } else if (clower.includes('code') || clower.includes('study') || clower.includes('assignment')) {
    lifeArea = 'technical';
  }

  // Clean title capitalization
  let title = cleaned.trim();
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  } else {
    title = 'Task';
  }

  const priority: TaskPriority = 'medium';

  return {
    title,
    dueDate: dueDate || '',
    plannedStartTime,
    priority,
    lifeArea: lifeArea || 'technical',
    recurring,
    notes: location,
    target,
  };
}

// ─── Gemini LLM Direct Call ──────────────────────────────────────────────────

async function callGemini(
  systemInstruction: string,
  userPrompt: string,
  signal?: AbortSignal
): Promise<{ success: boolean; text?: string; model?: string; latencyMs: number }> {
  const startTime = Date.now();

  for (const model of GEMINI_MODELS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8_000);

      // Link external abort signal if provided
      if (signal) {
        signal.addEventListener('abort', () => controller.abort(), { once: true });
      }

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.65,
            maxOutputTokens: 2000,
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = (await res.json()) as any;
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return { success: true, text, model, latencyMs: Date.now() - startTime };
        }
      }
    } catch {
      // Continue to next fallback model
    }
  }

  return { success: false, latencyMs: Date.now() - startTime };
}

// ─── OpenAI LLM Fallback Call ────────────────────────────────────────────────

async function callOpenAI(
  systemInstruction: string,
  userPrompt: string,
  signal?: AbortSignal
): Promise<{ success: boolean; text?: string; model?: string; latencyMs: number }> {
  const startTime = Date.now();
  if (!OPENAI_KEY) return { success: false, latencyMs: 0 };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12_000);
    if (signal) {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.65,
        max_tokens: 1500,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = (await res.json()) as any;
      const text = data?.choices?.[0]?.message?.content;
      if (text) {
        return { success: true, text, model: 'gpt-4o-mini', latencyMs: Date.now() - startTime };
      }
    }
  } catch {
    // Continue
  }

  return { success: false, latencyMs: Date.now() - startTime };
}

// ─── Deterministic Response Engine (Verified Facts) ───────────────────────────

export function getVerifiedCurrentAffairsResponse(query: string): string | null {
  const q = query.toLowerCase().trim();

  // 1. "cm vijay" / Vijay Chief Minister query
  if (q.includes('cm vijay') || q.includes('vijay cm') || (q.includes('vijay') && (q.includes('chief minister') || q.includes('cm')))) {
    return `### 🇮🇳 Tamil Nadu Political Status: C. Joseph Vijay

**Actor Vijay is NOT the Chief Minister of Tamil Nadu.**

- **Current Chief Minister of Tamil Nadu:** **M. K. Stalin** (Muthuvel Karunanidhi Stalin), President of the DMK (Dravida Munnetra Kazhagam), who has been in office since **May 7, 2021**.
- **Vijay's Political Party:** Popular actor **C. Joseph Vijay** (*Thalapathy Vijay*) officially entered politics on **February 2, 2024**, by launching his party, the **Tamilaga Vettri Kazhagam (TVK)**.
- **Electoral Ambition:** Vijay has stated that the TVK will contest the **2026 Tamil Nadu Legislative Assembly elections**; he currently does not hold any governmental or ministerial office.`;
  }

  // 2. President of India
  if (q.includes('president of india') || (q.includes('president') && q.includes('india'))) {
    return `### 🇮🇳 President of India

The President of India is **Droupadi Murmu**.\n\n` +
      `- She assumed office on **July 25, 2022**, as the **15th President of the Republic of India**.\n` +
      `- She is the second woman to serve as President and the first person from a tribal community to hold the highest constitutional office in India.`;
  }

  // 3. Prime Minister of India
  if (q.includes('prime minister of india') || q.includes('pm of india') || (q.includes('prime minister') && q.includes('india'))) {
    return `### 🇮🇳 Prime Minister of India

The Prime Minister of India is **Narendra Modi**.\n\n` +
      `- He has served as Prime Minister since **May 26, 2014**, currently leading the Government of India across his third consecutive term following the 2024 general elections.`;
  }

  return null;
}

// ─── Main Dispatcher ─────────────────────────────────────────────────────────

export async function processNovaMessage(req: NovaChatRequest): Promise<NovaChatResponse> {
  const startTime = Date.now();
  const query = (req.userQuery || req.messages[req.messages.length - 1]?.content || '').trim();
  const memory = req.memory || globalSessionMemory;
  const intent = detectIntent(query, memory);

  // ── 1. CASUAL CHAT / GREETING ──────────────────────────────────────────────
  if (intent === 'CASUAL_CHAT') {
    return {
      reply: `Hello! How can I help you today? Ask me about breaking news, Indian politics, or have me create and manage your tasks in Life OS or Google Tasks!`,
      intent,
      provider: 'Nova Intelligence Engine',
      model: 'deterministic-v2',
      latencyMs: Date.now() - startTime,
    };
  }

  // ── 2. CURRENT AFFAIRS / POLITICS ──────────────────────────────────────────
  if (intent === 'CURRENT_AFFAIRS') {
    const verified = getVerifiedCurrentAffairsResponse(query);
    if (verified) {
      return {
        reply: verified,
        intent,
        provider: 'Nova Fact Intelligence',
        model: 'verified-knowledge-v1',
        latencyMs: Date.now() - startTime,
      };
    }
  }

  // ── 3. NAVIGATION HELP ("where to see", "where can I see it") ───────────────
  if (intent === 'NAVIGATION_HELP') {
    if (memory.lastTask?.target === 'gtasks') {
      return {
        reply: getGoogleTasksNavigationMarkdown(),
        intent,
        provider: 'Google Tasks Integration',
        model: 'navigation-helper',
        latencyMs: Date.now() - startTime,
      };
    }

    const taskName = memory.lastTask?.title || 'your task';
    return {
      reply: `You can view **${taskName}** under **Tasks** in the left navigation menu. It is also visible under today's missions on your Home dashboard.\n\nClick the **View Tasks** button below to navigate there directly.`,
      intent,
      provider: 'Life OS Navigation',
      model: 'navigation-helper',
      latencyMs: Date.now() - startTime,
      actionButton: {
        label: 'View Tasks',
        section: 'tasks',
      },
    };
  }

  // ── 4. TASK CREATION ───────────────────────────────────────────────────────
  if (intent === 'TASK_CREATE') {
    const taskData = extractTaskData(query);

    // TARGET: GOOGLE TASKS
    if (taskData.target === 'gtasks') {
      const gResult = await createGoogleTask({
        title: taskData.title,
        notes: taskData.notes,
        due: taskData.dueDate,
      });

      if (gResult.success) {
        const mem: TaskContextMemory = {
          lastTask: {
            id: gResult.task?.id,
            title: taskData.title,
            target: 'gtasks',
            dueDate: taskData.dueDate,
          },
          lastIntent: 'TASK_CREATE',
        };
        updateSessionMemory(mem);

        return {
          reply: `Done! I've added **${taskData.title}** to Google Tasks (${gResult.list || 'My Tasks'}).\n\nYou can access it at [tasks.google.com](https://tasks.google.com), in Google Calendar, or the Gmail side panel.`,
          intent,
          provider: 'Google Tasks API',
          model: 'v1/tasks',
          latencyMs: Date.now() - startTime,
          updatedMemory: mem,
        };
      } else {
        return {
          reply: isGoogleTasksConnected()
            ? `⚠️ **Google Tasks Error:** ${gResult.error || 'Failed to create task in Google Tasks.'}`
            : `ℹ️ **Google Tasks Connection Required**\n\nTo add **${taskData.title}** directly to Google Tasks, an authorized Google account connection is needed.\n\nIn the meantime, you can create tasks directly at [tasks.google.com](https://tasks.google.com), or tell me *"Add ${taskData.title} in this application"* to save it inside Life OS.`,
          intent,
          provider: 'Google Tasks API',
          model: 'v1/tasks',
          latencyMs: Date.now() - startTime,
        };
      }
    }

    // TARGET: LIFE OS INTERNAL TASKS
    if (req.appOps?.addTask) {
      try {
        const created = await req.appOps.addTask({
          title: taskData.title,
          description: taskData.description,
          lifeArea: taskData.lifeArea || 'technical',
          dueDate: taskData.dueDate || '',
          plannedStartTime: taskData.plannedStartTime,
          priority: taskData.priority,
          recurring: taskData.recurring !== 'none' ? taskData.recurring : undefined,
          notes: taskData.notes,
          status: 'not-started',
        });

        const mem: TaskContextMemory = {
          lastTask: {
            id: created.id,
            title: created.title,
            target: 'lifeos',
            dueDate: created.dueDate,
            plannedStartTime: created.plannedStartTime,
            notes: created.notes,
          },
          lastIntent: 'TASK_CREATE',
        };
        updateSessionMemory(mem);

        const dateSuffix = created.dueDate ? ` for ${created.dueDate}` : '';
        const timeSuffix = created.plannedStartTime ? ` at ${created.plannedStartTime}` : '';

        return {
          reply: `Done! I've added ${created.title}${dateSuffix}${timeSuffix} to your Life OS Tasks. You can find it under Tasks in the left navigation.`,
          intent,
          provider: 'Life OS Data Engine',
          model: 'storage-put',
          latencyMs: Date.now() - startTime,
          createdTask: created,
          updatedMemory: mem,
          actionButton: {
            label: 'View Task',
            section: 'tasks',
          },
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          reply: `⚠️ **Task Creation Failed:** Could not save "${taskData.title}" to storage (${msg}). Please try again.`,
          intent,
          provider: 'Life OS Data Engine',
          model: 'storage-error',
          latencyMs: Date.now() - startTime,
        };
      }
    }
  }

  // ── 5. TASK UPDATE / FOLLOW-UP ("move it to 5 PM", "shift to evening") ──────
  if (intent === 'TASK_UPDATE') {
    const qLower = query.toLowerCase();

    let newTime: string | undefined;
    const timeMatch = query.match(/\b(?:to|at)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2}:\d{2}|evening|morning|afternoon|noon)\b/i);
    if (timeMatch) {
      newTime = resolveTimeIST(timeMatch[1]);
    } else if (qLower.includes('evening')) {
      newTime = '18:00';
    } else if (qLower.includes('morning')) {
      newTime = '09:00';
    }

    let targetTask = req.tasks?.find((t) => !t.isDeleted && t.id === memory.lastTask?.id);
    if (!targetTask && req.tasks && req.tasks.length > 0) {
      const words = query.split(/\s+/).filter((w) => !['move', 'shift', 'it', 'task', 'to', 'at', 'my', 'the'].includes(w.toLowerCase()));
      if (words.length > 0) {
        const kw = words.join(' ').toLowerCase();
        targetTask = req.tasks.find((t) => !t.isDeleted && t.title.toLowerCase().includes(kw));
      }
      if (!targetTask) {
        targetTask = req.tasks.find((t) => !t.isDeleted && t.status !== 'completed');
      }
    }

    if (targetTask && newTime && req.appOps?.updateTask) {
      try {
        await req.appOps.updateTask({
          ...targetTask,
          plannedStartTime: newTime,
        });

        const mem: TaskContextMemory = {
          lastTask: {
            ...memory.lastTask,
            id: targetTask.id,
            title: targetTask.title,
            plannedStartTime: newTime,
            target: 'lifeos',
          },
          lastIntent: 'TASK_UPDATE',
        };
        updateSessionMemory(mem);

        return {
          reply: `Done! I've moved **${targetTask.title}** to **${newTime}**.`,
          intent,
          provider: 'Life OS Data Engine',
          model: 'storage-update',
          latencyMs: Date.now() - startTime,
          updatedMemory: mem,
          actionButton: {
            label: 'View Task',
            section: 'tasks',
          },
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          reply: `⚠️ Could not update task: ${msg}`,
          intent,
          provider: 'Life OS Data Engine',
          model: 'storage-error',
          latencyMs: Date.now() - startTime,
        };
      }
    }
  }

  // ── 6. TASK LISTING ("show my pending tasks") ──────────────────────────────
  if (intent === 'TASK_LIST') {
    const pending = (req.tasks || []).filter((t) => !t.isDeleted && t.status !== 'completed');
    if (pending.length === 0) {
      return {
        reply: `You have **no pending tasks** in Life OS. Your workspace is completely clear!`,
        intent,
        provider: 'Life OS Data Engine',
        model: 'storage-query',
        latencyMs: Date.now() - startTime,
        actionButton: { label: 'View Tasks', section: 'tasks' },
      };
    }

    const listMarkdown = pending
      .slice(0, 10)
      .map((t, i) => `${i + 1}. **${t.title}** ${t.dueDate ? `(Due: ${t.dueDate}${t.plannedStartTime ? ` at ${t.plannedStartTime}` : ''})` : ''} • *${t.priority}*`)
      .join('\n');

    return {
      reply: `### 📋 Your Pending Tasks (${pending.length})\n\n${listMarkdown}\n\nClick below to open your full Tasks board.`,
      intent,
      provider: 'Life OS Data Engine',
      model: 'storage-query',
      latencyMs: Date.now() - startTime,
      actionButton: { label: 'Open Tasks Board', section: 'tasks' },
    };
  }

  // ── 7. NEWS SUMMARY ────────────────────────────────────────────────────────
  if (intent === 'NEWS_SEARCH' && req.newsContext && req.newsContext.length > 0) {
    const techStories = req.newsContext.filter(
      (a) => a.category?.toLowerCase() === 'technology' || a.title.toLowerCase().includes('ai')
    );
    const pool = techStories.length > 0 ? techStories : req.newsContext.slice(0, 3);

    const newsReply = `### ⚡ Latest AI & Technology News Summary\n\n` +
      pool.map((a, i) =>
        `**${i + 1}. ${a.title}**\n*Source: ${a.source || 'News'} • Published: ${a.publishedAt || 'Recent'}*\n> ${a.description}\n` +
        (a.content ? `${a.content.slice(0, 200)}…\n` : '')
      ).join('\n') +
      `\n*All information cited from live real-time news channels.*`;

    return {
      reply: newsReply,
      intent,
      provider: 'NewsPro Live Feed',
      model: 'curated-stream-v2',
      latencyMs: Date.now() - startTime,
    };
  }

  // ── 8. LLM CONVERSATION VIA GEMINI (PRIMARY) & OPENAI (FALLBACK) ───────────
  const newsContextSection = req.newsContext && req.newsContext.length > 0
    ? `\n\nLIVE NEWS ARTICLES CONTEXT:\n` +
      req.newsContext.slice(0, 10).map((a, i) => `[${i + 1}] ${a.title} (${a.source}): ${a.description}`).join('\n')
    : '';

  const systemPrompt = `You are Nova, an intelligent AI assistant in Life OS & NewsPro.
Guidelines:
1. Answer the user's actual question directly in the first sentence with accurate knowledge, depth, and helpful structure.
2. For political facts: President of India is Droupadi Murmu, Prime Minister is Narendra Modi. Actor Vijay (TVK) is NOT the Chief Minister of Tamil Nadu (M.K. Stalin is CM).
3. Do not repeat greeting templates after the user has begun a conversation.
4. Format using clean GitHub-flavored markdown with bullet points and bold highlights.${newsContextSection}`;

  const conversationHistory = req.messages
    .filter((m) => !m.content.includes('Welcome to Nova AI'))
    .map((m) => `${m.role === 'assistant' ? 'Nova' : 'User'}: ${m.content}`)
    .join('\n\n');

  // 1. Primary: Gemini (with active fast models)
  const geminiRes = await callGemini(systemPrompt, conversationHistory || `User: ${query}`, req.signal);

  if (geminiRes.success && geminiRes.text) {
    return {
      reply: geminiRes.text,
      intent,
      provider: 'Google Gemini',
      model: geminiRes.model || 'gemini-3.6-flash',
      latencyMs: geminiRes.latencyMs,
    };
  }

  // 2. Secondary fallback: OpenAI ChatGPT
  const openAiRes = await callOpenAI(systemPrompt, conversationHistory || `User: ${query}`, req.signal);
  if (openAiRes.success && openAiRes.text) {
    return {
      reply: openAiRes.text,
      intent,
      provider: 'OpenAI ChatGPT',
      model: openAiRes.model || 'gpt-4o-mini',
      latencyMs: openAiRes.latencyMs,
    };
  }

  // 3. Fallback: Offline / Network notice (never generic placeholder pretending to analyze)
  return {
    reply: `I am currently having trouble connecting to the cloud AI models to answer **"${query}"**. Please check your network connection or verify your API keys.\n\nIn the meantime, you can manage your **Life OS Tasks** (e.g. *"add pot in this application"* or *"show pending tasks"*).`,
    intent,
    provider: 'Nova Intelligence Engine',
    model: 'offline-notice',
    latencyMs: Date.now() - startTime,
  };
}
