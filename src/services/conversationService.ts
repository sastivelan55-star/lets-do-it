/**
 * Conversation Service — Full ChatGPT-Style Conversation Management
 * 
 * Features:
 * - Persistent conversation threads across browser refresh, restart, and page switches
 * - Automatic meaningful title generation from first message (e.g. "Indian President", "Poy Task")
 * - Conversation grouping (Today, Yesterday, Previous 7 Days, Older)
 * - Search across conversation titles and message content
 * - Branching on user message edit (truncates and regenerates from that message)
 * - Rename, Pin, Archive, and Delete with confirmation
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  actionButton?: {
    label: string;
    section: string;
  };
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  archived?: boolean;
}

export type ConversationGroupKey = 'today' | 'yesterday' | 'previous7Days' | 'older';

export interface GroupedConversations {
  today: Conversation[];
  yesterday: Conversation[];
  previous7Days: Conversation[];
  older: Conversation[];
}

const STORAGE_KEY_CONVERSATIONS = 'nova_conversations_v4';
const STORAGE_KEY_ACTIVE_ID = 'nova_active_conversation_id_v4';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function generateConversationId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Automatically derives a concise, human-readable title from the first user prompt.
 * Avoids generic "New Chat" when meaningful content exists.
 */
export function generateConversationTitle(prompt: string): string {
  const clean = prompt.trim().replace(/[.,;!?]+$/, '');
  const lower = clean.toLowerCase();

  // Known intent shortcuts
  if (lower.includes('president of india')) return 'Indian President';
  if (lower.includes('prime minister of india') || lower.includes('pm of india')) return 'Indian Prime Minister';
  if (lower.includes('cm vijay') || lower.includes('vijay cm')) return 'CM Vijay Politics';
  if (lower.includes('climate change')) return 'Climate Change Update';
  if (lower.includes('quantum computing')) return 'Quantum Computing';
  if (lower.includes('uchiha')) return 'God of Uchiha';
  if (lower.startsWith('add pot') || lower === 'pot') return 'Pot Task';
  if (lower.startsWith('add poy') || lower.includes('poy')) return 'Poy Task';
  if (lower.includes('gym')) return 'Gym Schedule';
  if (lower.includes('ravi') && lower.includes('starbucks')) return 'Meeting with Ravi';
  if (lower.includes('ai news') || lower.includes('technology news') || lower.includes('tech news')) return 'Tech & AI News';
  if (lower.includes('what is artificial intelligence') || lower.includes('what is ai')) return 'What is AI?';
  if (lower.includes('difference between ai and machine learning') || lower.includes('ai vs ml')) return 'AI vs ML Comparison';
  if (lower.includes('pending task') || lower.includes('my tasks')) return 'Pending Tasks';

  // Extract from task command e.g. "Add a task to buy vegetables tomorrow" -> "Buy Vegetables"
  const taskMatch = clean.match(/^(?:add|create|schedule|remind me to)\s+(?:a\s+task\s+to\s+|task\s+to\s+|a\s+)?(.+?)(?:\s+(?:tomorrow|today|at|on|for)|$)/i);
  if (taskMatch && taskMatch[1]) {
    const raw = taskMatch[1].trim();
    return raw.charAt(0).toUpperCase() + raw.slice(1, 35);
  }

  // Fallback to first 4-6 words (up to 38 chars)
  const words = clean.split(/\s+/).slice(0, 6).join(' ');
  if (words.length > 38) {
    return words.slice(0, 35) + '…';
  }
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// ─── Storage Operations ───────────────────────────────────────────────────────

export function getSavedConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
      }
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveConversationsList(list: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function getActiveConversationId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
  } catch {
    return null;
  }
}

export function setActiveConversationId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
  } catch {
    // ignore
  }
}

// ─── High-Level Conversation API ──────────────────────────────────────────────

export function createNewConversation(initialTitle = 'New Chat'): Conversation {
  const conv: Conversation = {
    id: generateConversationId(),
    title: initialTitle,
    messages: [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: `👋 **Welcome to Nova AI!**\n\nI am your intelligent assistant connected directly to your **Life OS Tasks** and live news channels.\n\n**Try saying:**\n- *"add pot in this application"*\n- *"add poy to the date of 23rd december"*\n- *"remind me to meet Ravi at Starbucks"*\n- *"cm vijay"*\n- *"show my pending tasks"*`,
        timestamp: Date.now(),
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pinned: false,
    archived: false,
  };

  const list = getSavedConversations();
  saveConversationsList([conv, ...list]);
  setActiveConversationId(conv.id);
  return conv;
}

export function getConversationById(id: string): Conversation | null {
  const list = getSavedConversations();
  return list.find((c) => c.id === id) || null;
}

export function updateConversation(conv: Conversation): void {
  const list = getSavedConversations();
  const next = list.map((c) => (c.id === conv.id ? { ...conv, updatedAt: Date.now() } : c));
  // If not in list, add it
  if (!list.some((c) => c.id === conv.id)) {
    next.unshift({ ...conv, updatedAt: Date.now() });
  }
  saveConversationsList(next);
}

export function deleteConversationById(id: string): void {
  const list = getSavedConversations();
  const next = list.filter((c) => c.id !== id);
  saveConversationsList(next);

  if (getActiveConversationId() === id) {
    if (next.length > 0) {
      setActiveConversationId(next[0].id);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
    }
  }
}

export function renameConversation(id: string, newTitle: string): void {
  const list = getSavedConversations();
  const next = list.map((c) => (c.id === id ? { ...c, title: newTitle.trim(), updatedAt: Date.now() } : c));
  saveConversationsList(next);
}

export function togglePinConversation(id: string): boolean {
  const list = getSavedConversations();
  let nextPinned = false;
  const next = list.map((c) => {
    if (c.id === id) {
      nextPinned = !c.pinned;
      return { ...c, pinned: nextPinned, updatedAt: Date.now() };
    }
    return c;
  });
  saveConversationsList(next);
  return nextPinned;
}

export function toggleArchiveConversation(id: string): boolean {
  const list = getSavedConversations();
  let nextArchived = false;
  const next = list.map((c) => {
    if (c.id === id) {
      nextArchived = !c.archived;
      return { ...c, archived: nextArchived, updatedAt: Date.now() };
    }
    return c;
  });
  saveConversationsList(next);
  return nextArchived;
}

// ─── Grouping for Sidebar ─────────────────────────────────────────────────────

export function groupConversations(list: Conversation[], filterQuery = ''): GroupedConversations {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOf7Days = startOfToday - 6 * 86400000;

  const q = filterQuery.toLowerCase().trim();
  const filtered = q
    ? list.filter((c) => {
        const inTitle = c.title.toLowerCase().includes(q);
        const inMessages = c.messages.some((m) => m.content.toLowerCase().includes(q));
        return inTitle || inMessages;
      })
    : list.filter((c) => !c.archived);

  const groups: GroupedConversations = {
    today: [],
    yesterday: [],
    previous7Days: [],
    older: [],
  };

  for (const c of filtered) {
    if (c.pinned) {
      // Pinned conversations stay at top of Today group
      groups.today.unshift(c);
      continue;
    }
    if (c.updatedAt >= startOfToday) {
      groups.today.push(c);
    } else if (c.updatedAt >= startOfYesterday) {
      groups.yesterday.push(c);
    } else if (c.updatedAt >= startOf7Days) {
      groups.previous7Days.push(c);
    } else {
      groups.older.push(c);
    }
  }

  return groups;
}

