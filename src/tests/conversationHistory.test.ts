import { describe, it, expect, beforeEach } from 'vitest';
import {
  type Conversation,
  type ChatMessage,
  getSavedConversations,
  getConversationById,
  createNewConversation,
  updateConversation,
  deleteConversationById,
  renameConversation,
  togglePinConversation,
  groupConversations,
  generateConversationTitle,
  generateMessageId,
} from '../services/conversationService';

const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

describe('Conversation Service & ChatGPT-Style Chat Management Suite', () => {
  beforeEach(() => {
    (globalThis as any).localStorage = createLocalStorageMock();
  });

  it('TEST 1: creates a new conversation with timestamp, default title, and persists to localStorage', () => {
    const conv = createNewConversation('Hello Nova');
    expect(conv.id).toMatch(/^conv-/);
    expect(conv.title).toBe('Hello Nova');
    expect(conv.messages.length).toBeGreaterThan(0); // includes welcome message
    expect(conv.pinned).toBe(false);

    const saved = getSavedConversations();
    expect(saved.length).toBe(1);
    expect(saved[0].id).toBe(conv.id);
  });

  it('TEST 2: generates intelligent auto-titles from user prompt', () => {
    expect(generateConversationTitle('Who is the President of India?')).toBe('Indian President');
    expect(generateConversationTitle('who is the prime minister of india')).toBe('Indian Prime Minister');
    expect(generateConversationTitle('What is the latest breaking news on climate change?')).toBe('Climate Change Update');
    expect(generateConversationTitle('add pot in this application')).toBe('Pot Task');
    expect(generateConversationTitle('explain quantum computing in simple terms')).toBe('Quantum Computing');
  });

  it('TEST 3: correctly groups conversations into Today, Yesterday, Previous 7 Days, and Older', () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const convs: Conversation[] = [
      { id: '1', title: 'Today Conv', createdAt: now - 1000, updatedAt: now - 1000, messages: [], pinned: false, archived: false },
      { id: '2', title: 'Yesterday Conv', createdAt: now - oneDay - 1000, updatedAt: now - oneDay - 1000, messages: [], pinned: false, archived: false },
      { id: '3', title: '7-Days Conv', createdAt: now - 3 * oneDay, updatedAt: now - 3 * oneDay, messages: [], pinned: false, archived: false },
      { id: '4', title: 'Older Conv', createdAt: now - 15 * oneDay, updatedAt: now - 15 * oneDay, messages: [], pinned: false, archived: false },
    ];

    const grouped = groupConversations(convs);
    expect(grouped.today.length).toBe(1);
    expect(grouped.today[0].title).toBe('Today Conv');

    expect(grouped.yesterday.length).toBe(1);
    expect(grouped.yesterday[0].title).toBe('Yesterday Conv');

    expect(grouped.previous7Days.length).toBe(1);
    expect(grouped.previous7Days[0].title).toBe('7-Days Conv');

    expect(grouped.older.length).toBe(1);
    expect(grouped.older[0].title).toBe('Older Conv');
  });

  it('TEST 4: pins and unpins conversations properly', () => {
    const conv = createNewConversation('Pinned test');
    expect(conv.pinned).toBe(false);

    const isNowPinned = togglePinConversation(conv.id);
    expect(isNowPinned).toBe(true);
    expect(getConversationById(conv.id)?.pinned).toBe(true);

    const isUnpinned = togglePinConversation(conv.id);
    expect(isUnpinned).toBe(false);
    expect(getConversationById(conv.id)?.pinned).toBe(false);
  });

  it('TEST 5: renames a conversation title cleanly', () => {
    const conv = createNewConversation('Initial Title');
    renameConversation(conv.id, 'Renamed Masterplan');
    
    const updated = getConversationById(conv.id);
    expect(updated?.title).toBe('Renamed Masterplan');

    const list = getSavedConversations();
    expect(list[0].title).toBe('Renamed Masterplan');
  });

  it('TEST 6: deletes a conversation by id', () => {
    const conv1 = createNewConversation('Conv 1');
    const conv2 = createNewConversation('Conv 2');
    expect(getSavedConversations().length).toBe(2);

    deleteConversationById(conv1.id);
    const remaining = getSavedConversations();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe(conv2.id);
  });

  it('TEST 7: maintains message list with unique IDs and preserves chronological order', () => {
    const conv = createNewConversation('Chat 1');
    const m1: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: 'Hello',
      timestamp: Date.now(),
    };
    const m2: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: 'Hi there! How can I assist you with Life OS today?',
      timestamp: Date.now() + 50,
    };

    conv.messages = [m1, m2];
    updateConversation(conv);

    const loaded = getSavedConversations().find(c => c.id === conv.id);
    expect(loaded?.messages.length).toBe(2);
    expect(loaded?.messages[0].content).toBe('Hello');
    expect(loaded?.messages[1].role).toBe('assistant');
  });

  it('TEST 8: simulates ChatGPT message branching when an earlier message is edited', () => {
    // When message index 0 is edited, any answers downstream are truncated and the branch continues
    const messages: ChatMessage[] = [
      { id: 'm1', role: 'user', content: 'What is 2+2?', timestamp: 1 },
      { id: 'm2', role: 'assistant', content: '2+2 = 4', timestamp: 2 },
      { id: 'm3', role: 'user', content: 'Multiply by 3', timestamp: 3 },
      { id: 'm4', role: 'assistant', content: '4 * 3 = 12', timestamp: 4 },
    ];

    // User edits m1 to "What is 5+5?"
    const editIndex = messages.findIndex(m => m.id === 'm1');
    expect(editIndex).toBe(0);

    // Branching logic truncates from editIndex onwards:
    const branchedHistory = messages.slice(0, editIndex);
    const newEditedUserMsg: ChatMessage = {
      id: 'm1_v2',
      role: 'user',
      content: 'What is 5+5?',
      timestamp: 5,
    };
    const updatedMessages = [...branchedHistory, newEditedUserMsg];

    expect(updatedMessages.length).toBe(1);
    expect(updatedMessages[0].content).toBe('What is 5+5?');
  });
});
