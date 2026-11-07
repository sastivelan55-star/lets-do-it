/**
 * FloatingAiAssistant — ChatGPT-Style Nova AI Conversational Experience
 * 
 * Capabilities (Modules 1, 2, 3, 5, 8):
 * - Complete conversation history with grouping (Today, Yesterday, Previous 7 Days, Older)
 * - Persistent across browser refresh, restart, and page switches via conversationService
 * - Search across conversation titles and message content
 * - Auto-generated conversation titles from first user message
 * - Conversation management: New Chat, Rename, Pin, Delete with confirmation
 * - Inline user message editing with conversation branching & regeneration
 * - Assistant message regeneration
 * - Stop Generating button with AbortController
 * - Markdown rendering with code blocks and "Copy Code" button
 * - Direct Life OS task creation without date leakage in title
 * - Google Tasks integration check and direct links
 * - Mobile responsive drawer layout
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  X,
  Minus,
  Maximize2,
  Minimize2,
  Trash2,
  Copy,
  Check,
  Newspaper,
  ChevronDown,
  RotateCcw,
  ListTree,
  ChevronRight,
  Edit3,
  Edit2,
  Square,
  Search,
  Pin,
  PanelLeft,
  PanelLeftClose,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  processNovaMessage,
} from '../../services/novaOrchestrator';
import {
  type Conversation,
  type ChatMessage,
  getSavedConversations,
  getActiveConversationId,
  setActiveConversationId,
  createNewConversation,
  updateConversation,
  deleteConversationById,
  renameConversation,
  togglePinConversation,
  groupConversations,
  generateConversationTitle,
  generateMessageId,
} from '../../services/conversationService';
import type { NewsContextItem, LifeOsContext } from '../../services/aiService';

interface FloatingAiAssistantProps {
  onNavigate?: (section: any) => void;
}

const DEFAULT_NEWS_STORIES: NewsContextItem[] = [
  {
    id: 'art-0',
    title: 'Global Leaders Agree on New Climate Action Plan',
    category: 'Breaking',
    source: 'Reuters',
    publishedAt: 'Recently',
    description: 'World leaders have reached a historic agreement to accelerate climate action and achieve net-zero emissions by 2050.',
  },
  {
    id: 'art-1',
    title: 'AI Revolution: New Breakthrough Brings Smarter Solutions',
    category: 'Technology',
    source: 'TechCrunch',
    publishedAt: 'Recently',
    description: 'Researchers unveil a major advancement in artificial intelligence, promising more human-like and helpful AI systems.',
  },
  {
    id: 'art-2',
    title: 'Stock Markets Rally as Tech Shares Soar',
    category: 'Business',
    source: 'Bloomberg',
    publishedAt: 'Recently',
    description: 'Global markets saw strong gains today, led by technology stocks and renewed investor confidence.',
  },
];

const QUICK_PROMPTS = [
  { label: '🪴 Add Pot', query: 'add pot in this application' },
  { label: '🗓️ Add Poy (23 Dec)', query: 'add poy to the date of 23rd december' },
  { label: '📋 My Pending Tasks', query: 'show my pending tasks' },
  { label: '🏛️ CM Vijay Info', query: 'cm vijay' },
  { label: '⚡ Latest AI News', query: 'summarize the latest AI news' },
  { label: '🇮🇳 India Leaders', query: 'Who is the President and Prime Minister of India?' },
  { label: '☕ Meet Ravi', query: 'add a task tomorrow at 9 AM to meet Ravi at Starbucks' },
];

export default function FloatingAiAssistant({ onNavigate }: FloatingAiAssistantProps) {
  const { tasks, todaysTasks, overdueTasks, addTask, updateTask, completeTask, removeTask } = useApp();

  // Assistant Window State
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Conversations State
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const list = getSavedConversations();
    if (list.length > 0) return list;
    const initial = createNewConversation();
    return [initial];
  });

  const [activeConvId, setActiveConvIdState] = useState<string>(() => {
    const savedId = getActiveConversationId();
    const list = getSavedConversations();
    if (savedId && list.some((c) => c.id === savedId)) return savedId;
    if (list.length > 0) return list[0].id;
    return createNewConversation().id;
  });

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConvId) || conversations[0] || null;
  }, [conversations, activeConvId]);

  const messages: ChatMessage[] = activeConversation?.messages || [];

  // Chat Execution & Input State
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);

  // Inline Message Editing State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Conversation Search & Rename
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [renamingConvId, setRenamingConvId] = useState<string | null>(null);
  const [renameTitleInput, setRenameTitleInput] = useState('');

  // News Context State
  const [newsList, setNewsList] = useState<NewsContextItem[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [isArticleSelectorOpen, setIsArticleSelectorOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Life OS context for Nova
  const userContext: LifeOsContext = useMemo(
    () => ({
      today: new Date().toISOString().slice(0, 10),
      totalTasks: tasks.length,
      todaysTasks: todaysTasks.map((t) => ({ title: t.title, priority: t.priority, status: t.status })),
      overdueCount: overdueTasks.length,
    }),
    [tasks.length, todaysTasks, overdueTasks.length]
  );

  // ─── Sync Conversations to Storage ─────────────────────────────────────────

  const setMessagesForActive = (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    if (!activeConversation) return;
    const updatedMessages = updater(activeConversation.messages);
    const updatedConv: Conversation = {
      ...activeConversation,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };
    updateConversation(updatedConv);
    setConversations((prev) => prev.map((c) => (c.id === updatedConv.id ? updatedConv : c)));
  };

  // ─── Load News from Cache ──────────────────────────────────────────────────

  useEffect(() => {
    const loadNews = () => {
      try {
        const cached = localStorage.getItem('newspro_articles_cache_v2');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setNewsList(
              parsed.map((item: any) => ({
                id: item.id || `art-${Math.random()}`,
                title: item.title,
                description: item.description || '',
                content: item.content || item.description || '',
                category: item.category || 'General',
                source: item.source || 'News',
                publishedAt: item.publishedAt || 'Recent',
                url: item.url || '',
              }))
            );
            return;
          }
        }
      } catch {
        // ignore
      }
      setNewsList(DEFAULT_NEWS_STORIES);
    };

    loadNews();
    window.addEventListener('storage', loadNews);
    return () => window.removeEventListener('storage', loadNews);
  }, []);

  // ─── Auto-scroll ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, loading]);

  useEffect(() => {
    if (isOpen && !isMinimized && !editingMessageId) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized, editingMessageId]);

  // ─── Navigation Helper ─────────────────────────────────────────────────────

  const handleNavigate = (section: string) => {
    if (onNavigate) {
      onNavigate(section);
    }
    window.dispatchEvent(new CustomEvent('lifeos:navigate', { detail: section }));
  };

  // ─── Conversation Management Handlers ──────────────────────────────────────

  const handleSelectConversation = (id: string) => {
    setActiveConvIdState(id);
    setActiveConversationId(id);
    setEditingMessageId(null);
    setLastFailedPrompt(null);
    if (window.innerWidth < 640) {
      setIsHistoryOpen(false);
    }
  };

  const handleNewChat = () => {
    const newConv = createNewConversation();
    setConversations(getSavedConversations());
    setActiveConvIdState(newConv.id);
    setEditingMessageId(null);
    setLastFailedPrompt(null);
    if (window.innerWidth < 640) {
      setIsHistoryOpen(false);
    }
  };

  const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation history?')) {
      deleteConversationById(id);
      const remaining = getSavedConversations();
      if (remaining.length === 0) {
        const fresh = createNewConversation();
        setConversations([fresh]);
        setActiveConvIdState(fresh.id);
      } else {
        setConversations(remaining);
        setActiveConvIdState(remaining[0].id);
      }
    }
  };

  const handleStartRename = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setRenamingConvId(conv.id);
    setRenameTitleInput(conv.title);
  };

  const handleSaveRename = (id: string) => {
    if (renameTitleInput.trim()) {
      renameConversation(id, renameTitleInput.trim());
      setConversations(getSavedConversations());
    }
    setRenamingConvId(null);
  };

  const handleTogglePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    togglePinConversation(id);
    setConversations(getSavedConversations());
  };

  const handleClearActiveConversation = () => {
    if (window.confirm('Clear all messages in this conversation?')) {
      setMessagesForActive(() => [
        {
          id: 'msg-welcome',
          role: 'assistant',
          content: `Conversation reset. How can I help you next? Ask about today's news headlines, international politics, AI technologies, or your tasks!`,
          timestamp: Date.now(),
        },
      ]);
      setLastFailedPrompt(null);
    }
  };

  // ─── Main Send / Dispatch Handler ──────────────────────────────────────────

  const handleSend = async (textToSend?: string, customHistory?: ChatMessage[]) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || loading) return;

    setLastFailedPrompt(null);

    // Abort any ongoing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    const userMsg: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };

    const currentBase = customHistory || messages;
    const nextMessages = [...currentBase, userMsg];

    // Update title automatically if currently "New Chat" and this is the first user prompt
    if (activeConversation && (activeConversation.title === 'New Chat' || activeConversation.messages.length <= 1)) {
      const smartTitle = generateConversationTitle(prompt);
      renameConversation(activeConversation.id, smartTitle);
    }

    setMessagesForActive(() => nextMessages);
    setInput('');
    setLoading(true);

    try {
      const chatHistory = nextMessages
        .filter((m) => m.id !== 'msg-welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await processNovaMessage({
        messages: chatHistory,
        userQuery: prompt,
        newsContext: newsList,
        lifeOsContext: userContext,
        tasks,
        appOps: {
          addTask,
          updateTask,
          completeTask,
          removeTask,
        },
        signal: abortCtrl.signal,
      });

      const assistantMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: response.reply,
        timestamp: Date.now(),
        actionButton: response.actionButton,
      };

      setMessagesForActive((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // User aborted cleanly
      }
      const errText = err instanceof Error ? err.message : String(err);
      setLastFailedPrompt(prompt);
      const errorMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: `⚠️ **Request failed:** ${errText}\n\nClick **Retry** below to resend.`,
        timestamp: Date.now(),
        isError: true,
      };
      setMessagesForActive((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  // ─── Inline User Message Edit & Branching (Module 1.1) ─────────────────────

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleSaveAndBranchEdit = (msgId: string) => {
    const trimmed = editContent.trim();
    if (!trimmed) return;

    // Find message index to branch from
    const idx = messages.findIndex((m) => m.id === msgId);
    if (idx === -1) return;

    // Truncate subsequent messages that depended on the old version
    const truncatedHistory = messages.slice(0, idx);

    setEditingMessageId(null);
    setEditContent('');

    // Resubmit edited message with truncated history
    handleSend(trimmed, truncatedHistory);
  };

  // ─── Assistant Response Regeneration (Module 1.2) ──────────────────────────

  const handleRegenerate = (assistantMsgId: string) => {
    const idx = messages.findIndex((m) => m.id === assistantMsgId);
    if (idx <= 0) return;

    // Find the immediately preceding user message
    const precedingUserIdx = idx - 1;
    const userMsg = messages[precedingUserIdx];
    if (!userMsg || userMsg.role !== 'user') return;

    // Truncate up to preceding user message
    const historyBeforeUser = messages.slice(0, precedingUserIdx);

    handleSend(userMsg.content, historyBeforeUser);
  };

  const handleDeleteMessage = (msgId: string) => {
    if (window.confirm('Delete this message?')) {
      setMessagesForActive((prev) => prev.filter((m) => m.id !== msgId));
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyCodeBlock = (idxKey: string, codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIdx(idxKey);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  const handleSelectArticlePrompt = (article: NewsContextItem) => {
    setSelectedArticleId(article.id);
    setIsArticleSelectorOpen(false);
    handleSend(`Summarize and explain the article "${article.title}" reported by ${article.source}. What are the key details and real-world takeaways?`);
  };

  // ─── Markdown Renderer with Code Blocks ───────────────────────────────────

  const renderInlineMarkdown = (text: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let keyIdx = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index));
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(<strong key={keyIdx++} style={{ color: '#fff', fontWeight: 700 }}>{token.slice(2, -2)}</strong>);
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code key={keyIdx++} style={{ background: 'rgba(255,255,255,0.12)', padding: '1px 5px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.85em', color: '#38bdf8' }}>
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(<em key={keyIdx++} style={{ color: '#cbd5e1' }}>{token.slice(1, -1)}</em>);
      } else if (token.startsWith('[') && token.includes('](')) {
        const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          parts.push(
            <a
              key={keyIdx++}
              href={linkMatch[2]}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#38bdf8', textDecoration: 'underline' }}
            >
              {linkMatch[1]}
            </a>
          );
        }
      }
      lastIndex = match.index + token.length;
    }

    if (lastIndex < text.length) parts.push(text.substring(lastIndex));
    return parts.length > 0 ? parts : text;
  };

  const renderFormattedContent = (content: string, msgId: string) => {
    // Check for fenced code blocks
    if (content.includes('```')) {
      const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
      const elements: React.ReactNode[] = [];
      let lastPos = 0;
      let blockMatch: RegExpExecArray | null;
      let blockIdx = 0;

      while ((blockMatch = codeBlockRegex.exec(content)) !== null) {
        if (blockMatch.index > lastPos) {
          elements.push(
            <div key={`text-${blockIdx}`}>
              {renderTextLines(content.substring(lastPos, blockMatch.index))}
            </div>
          );
        }

        const lang = blockMatch[1] || 'code';
        const codeText = blockMatch[2];
        const blockKey = `${msgId}-code-${blockIdx}`;

        elements.push(
          <div
            key={blockKey}
            style={{
              background: '#090d16',
              borderRadius: '8px',
              border: '1px solid rgba(129, 140, 248, 0.25)',
              margin: '0.65rem 0',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.35rem 0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.72rem',
                color: '#94a3b8',
                fontFamily: 'monospace',
              }}
            >
              <span style={{ textTransform: 'uppercase' }}>{lang}</span>
              <button
                type="button"
                onClick={() => handleCopyCodeBlock(blockKey, codeText)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: copiedCodeIdx === blockKey ? '#10b981' : '#cbd5e1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.72rem',
                }}
              >
                {copiedCodeIdx === blockKey ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedCodeIdx === blockKey ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre style={{ margin: 0, padding: '0.75rem', overflowX: 'auto', fontSize: '0.8rem', color: '#e2e8f0', fontFamily: 'monospace', lineHeight: 1.45 }}>
              <code>{codeText}</code>
            </pre>
          </div>
        );

        lastPos = blockMatch.index + blockMatch[0].length;
        blockIdx++;
      }

      if (lastPos < content.length) {
        elements.push(
          <div key={`text-end`}>
            {renderTextLines(content.substring(lastPos))}
          </div>
        );
      }

      return elements;
    }

    return renderTextLines(content);
  };

  const renderTextLines = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('#### ')) return <h4 key={idx} style={{ fontWeight: 700, fontSize: '0.95rem', margin: '0.5rem 0 0.25rem', color: '#c7d2fe' }}>{line.replace('#### ', '')}</h4>;
      if (line.startsWith('### ')) return <h3 key={idx} style={{ fontWeight: 700, fontSize: '1rem', margin: '0.6rem 0 0.3rem', color: '#a5b4fc' }}>{line.replace('### ', '')}</h3>;
      if (line.startsWith('## ')) return <h2 key={idx} style={{ fontWeight: 800, fontSize: '1.05rem', margin: '0.7rem 0 0.35rem', color: '#e0e7ff' }}>{line.replace('## ', '')}</h2>;
      if (line.startsWith('> ')) return (
        <blockquote key={idx} style={{ borderLeft: '3px solid #818cf8', paddingLeft: '0.65rem', margin: '0.4rem 0', color: '#cbd5e1', fontStyle: 'italic', background: 'rgba(99,102,241,0.08)', padding: '0.35rem 0.65rem', borderRadius: '0 6px 6px 0' }}>
          {renderInlineMarkdown(line.replace('> ', ''))}
        </blockquote>
      );
      if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) return (
        <div key={idx} style={{ display: 'flex', gap: '0.45rem', margin: '0.2rem 0', paddingLeft: '0.25rem' }}>
          <span style={{ color: '#818cf8', fontWeight: 'bold' }}>•</span>
          <span style={{ flex: 1 }}>{renderInlineMarkdown(line.replace(/^[-•*]\s+/, ''))}</span>
        </div>
      );
      if (/^\d+\.\s+/.test(line)) {
        const match = line.match(/^(\d+)\.\s+(.*)/);
        if (match) return (
          <div key={idx} style={{ display: 'flex', gap: '0.45rem', margin: '0.2rem 0', paddingLeft: '0.25rem' }}>
            <span style={{ color: '#38bdf8', fontWeight: 700, minWidth: '1.2rem' }}>{match[1]}.</span>
            <span style={{ flex: 1 }}>{renderInlineMarkdown(match[2])}</span>
          </div>
        );
      }
      if (line.startsWith('|') && line.endsWith('|')) {
        if (line.includes('---')) return null;
        const cells = line.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1);
        return (
          <div key={idx} style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '0.25rem 0.5rem', borderRadius: '4px', margin: '2px 0', fontSize: '0.78rem' }}>
            {cells.map((c, ci) => (
              <span key={ci} style={{ flex: ci === 0 ? '0 0 35%' : 1, fontWeight: ci === 0 ? 600 : 400, color: ci === 0 ? '#38bdf8' : '#e2e8f0' }}>
                {renderInlineMarkdown(c.trim())}
              </span>
            ))}
          </div>
        );
      }
      if (line.trim() === '---') return <hr key={idx} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.6rem 0' }} />;
      if (!line.trim()) return <div key={idx} style={{ height: '0.4rem' }} />;
      return <p key={idx} style={{ margin: '0.2rem 0', lineHeight: 1.55 }}>{renderInlineMarkdown(line)}</p>;
    });
  };

  const grouped = useMemo(() => {
    return groupConversations(conversations, historySearchQuery);
  }, [conversations, historySearchQuery]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── 1. FLOATING GLOWING TRIGGER BUTTON ─────────────────────────────── */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setIsMinimized(false); }}
          aria-label="Open Nova AI Assistant"
          title="Nova AI — Intelligent Assistant"
          className="nova-floating-trigger"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '58px',
            height: '58px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%)',
            border: '2px solid rgba(255,255,255,0.35)',
            boxShadow: '0 0 25px rgba(124,58,237,0.65), 0 10px 30px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 9990,
            transition: 'all 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
            color: '#ffffff',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08) translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 0 35px rgba(124,58,237,0.85), 0 14px 35px rgba(0,0,0,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.boxShadow = '0 0 25px rgba(124,58,237,0.65), 0 10px 30px rgba(0,0,0,0.4)';
          }}
        >
          <div style={{ position: 'absolute', inset: '-4px', borderRadius: '50%', background: 'linear-gradient(135deg,#38bdf8,#818cf8,#f472b6)', opacity: 0.5, filter: 'blur(6px)', zIndex: -1, animation: 'nova-pulse 3s infinite ease-in-out' }} />
          <Sparkles size={26} className="nova-icon-spin" />
          <span style={{ position: 'absolute', top: '2px', right: '2px', width: '13px', height: '13px', borderRadius: '50%', background: '#10b981', border: '2px solid #0f172a', boxShadow: '0 0 8px #10b981' }} />
        </button>
      )}

      {/* ── 2. MINIMIZED FLOATING PILL ─────────────────────────────────────── */}
      {isOpen && isMinimized && (
        <div
          onClick={() => setIsMinimized(false)}
          style={{ position: 'fixed', bottom: '24px', right: '24px', background: 'linear-gradient(135deg,rgba(30,41,59,0.95),rgba(15,23,42,0.95))', backdropFilter: 'blur(16px)', border: '1px solid rgba(129,140,248,0.35)', boxShadow: '0 10px 30px rgba(0,0,0,0.5),0 0 20px rgba(99,102,241,0.3)', borderRadius: '999px', padding: '0.55rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', zIndex: 9990, color: '#f8fafc' }}
        >
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(99,102,241,0.6)' }}>
            <Sparkles size={15} color="#fff" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e0e7ff', lineHeight: 1.2 }}>{activeConversation?.title || 'Nova Assistant'}</span>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{tasks.length} tasks • {conversations.length} chats • Click to open</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', marginLeft: '4px' }} title="Close">
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── 3. MAIN CHAT WINDOW ────────────────────────────────────────────── */}
      {isOpen && !isMinimized && (
        <div
          role="dialog"
          aria-label="Nova AI Chat"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: isExpanded || isHistoryOpen ? 'min(860px, 96vw)' : 'min(470px, 94vw)',
            height: isExpanded ? 'min(860px, 90vh)' : 'min(660px, calc(100vh - 100px))',
            background: 'linear-gradient(180deg,rgba(17,24,39,0.96) 0%,rgba(11,15,25,0.98) 100%)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(129,140,248,0.28)',
            borderRadius: '20px',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.75),0 0 45px rgba(99,102,241,0.25)',
            display: 'flex',
            overflow: 'hidden',
            zIndex: 9992,
            transition: 'width 0.3s ease, height 0.3s ease',
            color: '#f8fafc',
            fontFamily: 'Inter,system-ui,sans-serif',
          }}
        >
          {/* ── CHAT HISTORY DRAWER / SIDEBAR (Module 2) ── */}
          {isHistoryOpen && (
            <div
              style={{
                width: '260px',
                minWidth: '240px',
                background: 'rgba(11, 15, 25, 0.95)',
                borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
            >
              {/* Sidebar Header */}
              <div style={{ padding: '0.85rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleNewChat}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 10px rgba(124, 58, 237, 0.3)',
                  }}
                >
                  <Plus size={15} />
                  <span>New Chat</span>
                </button>

                {/* Search Bar */}
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="Search chats…"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '0.35rem 0.6rem 0.35rem 1.8rem',
                      fontSize: '0.74rem',
                      color: '#f8fafc',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Grouped Conversations Scroll Area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0.6rem' }}>
                {(['today', 'yesterday', 'previous7Days', 'older'] as const).map((groupKey) => {
                  const items = grouped[groupKey];
                  if (!items || items.length === 0) return null;

                  const groupTitles = {
                    today: 'Today',
                    yesterday: 'Yesterday',
                    previous7Days: 'Previous 7 Days',
                    older: 'Older',
                  };

                  return (
                    <div key={groupKey} style={{ marginBottom: '0.8rem' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.2rem 0.4rem', marginBottom: '2px' }}>
                        {groupTitles[groupKey]}
                      </div>
                      {items.map((conv) => {
                        const isCurrent = conv.id === activeConvId;
                        const isRenaming = renamingConvId === conv.id;

                        return (
                          <div
                            key={conv.id}
                            onClick={() => handleSelectConversation(conv.id)}
                            style={{
                              padding: '0.45rem 0.55rem',
                              borderRadius: '8px',
                              background: isCurrent ? 'rgba(99, 102, 241, 0.22)' : 'transparent',
                              border: isCurrent ? '1px solid rgba(129, 140, 248, 0.35)' : '1px solid transparent',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '6px',
                              marginBottom: '2px',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (!isCurrent) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                              if (!isCurrent) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1 }}>
                              {conv.pinned && <Pin size={11} color="#f59e0b" style={{ flexShrink: 0 }} />}
                              {isRenaming ? (
                                <input
                                  autoFocus
                                  value={renameTitleInput}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => setRenameTitleInput(e.target.value)}
                                  onBlur={() => handleSaveRename(conv.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveRename(conv.id);
                                    if (e.key === 'Escape') setRenamingConvId(null);
                                  }}
                                  style={{
                                    width: '100%',
                                    background: '#1e293b',
                                    border: '1px solid #818cf8',
                                    borderRadius: '4px',
                                    padding: '2px 4px',
                                    color: '#fff',
                                    fontSize: '0.74rem',
                                    outline: 'none',
                                  }}
                                />
                              ) : (
                                <span style={{ fontSize: '0.76rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#f8fafc' : '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {conv.title}
                                </span>
                              )}
                            </div>

                            {/* Actions on hover/active */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={(e) => handleTogglePin(e, conv.id)}
                                title={conv.pinned ? 'Unpin' : 'Pin to top'}
                                style={{ background: 'transparent', border: 'none', color: conv.pinned ? '#f59e0b' : '#64748b', cursor: 'pointer', padding: '2px' }}
                              >
                                <Pin size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleStartRename(e, conv)}
                                title="Rename chat"
                                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}
                              >
                                <Edit2 size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteConversation(e, conv.id)}
                                title="Delete chat"
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── RIGHT MAIN CHAT AREA ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* ── HEADER ── */}
            <div style={{ padding: '0.85rem 1.1rem', background: 'linear-gradient(90deg,rgba(30,41,59,0.7),rgba(15,23,42,0.8))', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {/* History Sidebar Toggle */}
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  style={{
                    background: isHistoryOpen ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isHistoryOpen ? '#38bdf8' : '#cbd5e1',
                    cursor: 'pointer',
                  }}
                  title={isHistoryOpen ? 'Close History' : 'Open History Panel'}
                >
                  {isHistoryOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
                </button>

                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(124,58,237,0.5)', position: 'relative' }}>
                  <Bot size={18} color="#fff" />
                  <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '9px', height: '9px', borderRadius: '50%', background: '#10b981', border: '2px solid #0f172a' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activeConversation?.title || 'Nova Assistant'}
                    </h3>
                    <span style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', fontSize: '0.62rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', border: '1px solid rgba(56,189,248,0.3)' }}>LIVE</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>Life OS Tasks & Intelligence</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button type="button" onClick={handleNewChat} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#38bdf8', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="New Chat">
                  <Plus size={15} />
                </button>
                <button type="button" onClick={handleClearActiveConversation} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Clear messages in chat">
                  <Trash2 size={13} />
                </button>
                <button type="button" onClick={() => setIsMinimized(true)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Minimize">
                  <Minus size={14} />
                </button>
                <button type="button" onClick={() => setIsExpanded(!isExpanded)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title={isExpanded ? 'Restore' : 'Expand'}>
                  {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>
                <button type="button" onClick={() => setIsOpen(false)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Close">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* ── CONTEXT BANNER ── */}
            <div style={{ padding: '0.45rem 1rem', background: 'rgba(99,102,241,0.07)', borderBottom: '1px solid rgba(129,140,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: '#cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Newspaper size={13} color="#818cf8" />
                <span>
                  Active Tasks: <strong style={{ color: '#38bdf8' }}>{tasks.filter((t) => !t.isDeleted && t.status !== 'completed').length}</strong>
                  <span style={{ color: '#94a3b8', marginLeft: '6px' }}>• {newsList.length} News Feeds</span>
                </span>
              </div>

              <div style={{ position: 'relative' }}>
                <button type="button" onClick={() => setIsArticleSelectorOpen(!isArticleSelectorOpen)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', borderRadius: '6px', padding: '2px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <span>Articles…</span>
                  <ChevronDown size={11} />
                </button>

                {isArticleSelectorOpen && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', width: '300px', maxHeight: '260px', overflowY: 'auto', background: '#1e293b', border: '1px solid rgba(129,140,248,0.3)', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 1000, padding: '0.4rem' }}>
                    <p style={{ margin: '0.2rem 0.4rem 0.4rem', fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Select an article:</p>
                    {newsList.map((art) => (
                      <button
                        key={art.id}
                        type="button"
                        onClick={() => handleSelectArticlePrompt(art)}
                        style={{ width: '100%', textAlign: 'left', background: selectedArticleId === art.id ? 'rgba(99,102,241,0.25)' : 'transparent', border: '1px solid transparent', padding: '0.45rem 0.55rem', borderRadius: '6px', color: '#f1f5f9', fontSize: '0.74rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.18)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = selectedArticleId === art.id ? 'rgba(99,102,241,0.25)' : 'transparent')}
                      >
                        <span style={{ fontWeight: 600, color: '#e0e7ff', lineHeight: 1.25 }}>{art.title}</span>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{art.category} • {art.source}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── MESSAGES SCROLL AREA ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {messages.map((msg) => {
                const isAssistant = msg.role === 'assistant';
                const isEditing = editingMessageId === msg.id;

                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isAssistant ? 'flex-start' : 'flex-end', maxWidth: '100%' }}>
                    <div style={{ display: 'flex', gap: '0.6rem', maxWidth: isAssistant ? '95%' : '88%', alignItems: 'flex-start' }}>
                      {isAssistant && (
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', boxShadow: '0 0 10px rgba(99,102,241,0.4)' }}>
                          <Sparkles size={14} color="#fff" />
                        </div>
                      )}

                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            background: isAssistant ? 'rgba(30,41,59,0.75)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                            border: isAssistant ? '1px solid rgba(129,140,248,0.2)' : 'none',
                            borderRadius: isAssistant ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                            padding: '0.75rem 0.95rem',
                            color: '#f8fafc',
                            fontSize: '0.85rem',
                            boxShadow: isAssistant ? '0 4px 15px rgba(0,0,0,0.2)' : '0 4px 15px rgba(79,70,229,0.35)',
                            wordBreak: 'break-word',
                            animation: 'nova-slide-in 0.2s ease',
                            position: 'relative',
                          }}
                        >
                          {/* INLINE EDIT MODE (Module 1.1) */}
                          {isEditing ? (
                            <div style={{ width: '100%' }}>
                              <textarea
                                autoFocus
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSaveAndBranchEdit(msg.id);
                                  }
                                  if (e.key === 'Escape') {
                                    handleCancelEdit();
                                  }
                                }}
                                rows={3}
                                style={{
                                  width: '100%',
                                  background: 'rgba(15, 23, 42, 0.9)',
                                  border: '1px solid #818cf8',
                                  borderRadius: '8px',
                                  padding: '0.5rem',
                                  color: '#ffffff',
                                  fontSize: '0.84rem',
                                  outline: 'none',
                                  boxSizing: 'border-box',
                                  lineHeight: 1.4,
                                }}
                              />
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', fontSize: '0.68rem', color: '#94a3b8' }}>
                                <span>Enter to save • Shift+Enter for newline • Esc to cancel</span>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#cbd5e1', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer' }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveAndBranchEdit(msg.id)}
                                    style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', border: 'none', color: '#fff', borderRadius: '4px', padding: '3px 9px', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Save & Submit
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>{renderFormattedContent(msg.content, msg.id)}</div>
                          )}

                          {/* Interactive Action Button (e.g. View Task) */}
                          {msg.actionButton && !isEditing && (
                            <div style={{ marginTop: '0.65rem' }}>
                              <button
                                type="button"
                                onClick={() => handleNavigate(msg.actionButton!.section)}
                                style={{
                                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                  border: '1px solid rgba(168, 85, 247, 0.5)',
                                  borderRadius: '8px',
                                  color: '#ffffff',
                                  padding: '0.45rem 0.85rem',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  boxShadow: '0 0 12px rgba(124, 58, 237, 0.4)',
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 0 16px rgba(124, 58, 237, 0.6)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '0 0 12px rgba(124, 58, 237, 0.4)';
                                }}
                              >
                                <ListTree size={14} />
                                <span>{msg.actionButton.label}</span>
                                <ChevronRight size={13} />
                              </button>
                            </div>
                          )}

                          {/* Message Actions Row (Module 1.4) */}
                          {!isEditing && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: isAssistant ? 'flex-start' : 'flex-end',
                                marginTop: '0.45rem',
                                paddingTop: '0.35rem',
                                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                                fontSize: '0.68rem',
                                color: '#94a3b8',
                                gap: '0.5rem',
                              }}
                            >
                              {/* Edit User Message Button (Module 1.1) */}
                              {!isAssistant && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(msg)}
                                  style={{ background: 'transparent', border: 'none', color: '#c7d2fe', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                                  title="Edit message & regenerate"
                                >
                                  <Edit3 size={11} />
                                  <span>Edit</span>
                                </button>
                              )}

                              {/* Assistant Regenerate (Module 1.2) */}
                              {isAssistant && msg.id !== 'msg-welcome' && (
                                <button
                                  type="button"
                                  onClick={() => handleRegenerate(msg.id)}
                                  disabled={loading}
                                  style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                                  title="Regenerate assistant response"
                                >
                                  <RotateCcw size={11} />
                                  <span>Regenerate</span>
                                </button>
                              )}

                              {/* Retry Failed Prompt */}
                              {lastFailedPrompt && msg.isError && (
                                <button
                                  type="button"
                                  onClick={() => handleSend(lastFailedPrompt)}
                                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 6px', borderRadius: '4px' }}
                                >
                                  <RotateCcw size={11} />
                                  <span>Retry</span>
                                </button>
                              )}

                              {/* Copy Message Text */}
                              <button
                                type="button"
                                onClick={() => handleCopy(msg.id, msg.content)}
                                style={{ background: 'transparent', border: 'none', color: copiedId === msg.id ? '#10b981' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 4px', borderRadius: '4px' }}
                                title="Copy message"
                              >
                                {copiedId === msg.id ? <Check size={11} /> : <Copy size={11} />}
                                <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                              </button>

                              {/* Delete Single Message */}
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg.id)}
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', padding: '2px' }}
                                title="Delete message"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <span style={{ fontSize: '0.65rem', color: 'rgba(148,163,184,0.6)', marginTop: '2px', paddingLeft: isAssistant ? '36px' : '0', paddingRight: !isAssistant ? '4px' : '0' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}

              {/* Typing / Thinking Indicator */}
              {loading && (
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 10px rgba(99,102,241,0.4)' }}>
                    <Sparkles size={14} color="#fff" />
                  </div>
                  <div style={{ background: 'rgba(30,41,59,0.75)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: '4px 16px 16px 16px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Nova is generating</span>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8', animation: 'nova-dot 1.2s infinite ease-in-out' }} />
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8', animation: 'nova-dot 1.2s infinite ease-in-out 0.2s' }} />
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8', animation: 'nova-dot 1.2s infinite ease-in-out 0.4s' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── STOP GENERATING BUTTON (Module 1.5) ── */}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '0.35rem 0', background: 'rgba(15, 23, 42, 0.4)' }}>
                <button
                  type="button"
                  onClick={handleStopGenerating}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    borderRadius: '8px',
                    padding: '4px 12px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.2)',
                  }}
                >
                  <Square size={12} fill="#f87171" />
                  <span>Stop Generating</span>
                </button>
              </div>
            )}

            {/* ── QUICK PROMPTS ── */}
            <div style={{ padding: '0.45rem 0.85rem', background: 'rgba(15,23,42,0.6)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.4rem', overflowX: 'auto', whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(qp.query)}
                  disabled={loading}
                  style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(129,140,248,0.25)', color: '#c7d2fe', borderRadius: '999px', padding: '4px 10px', fontSize: '0.72rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: loading ? 0.6 : 1 }}
                  onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = 'rgba(99,102,241,0.28)'; } }}
                  onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; } }}
                >
                  {qp.label}
                </button>
              ))}
            </div>

            {/* ── INPUT BOX ── */}
            <div style={{ padding: '0.75rem 0.95rem', background: 'rgba(11,15,25,0.95)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '0.55rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder='Ask Nova anything or say "add poy to the date of 23rd december"…'
                  rows={1}
                  disabled={loading}
                  style={{ width: '100%', background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(129,140,248,0.25)', borderRadius: '12px', padding: '0.65rem 0.85rem', color: '#f8fafc', fontSize: '0.84rem', outline: 'none', resize: 'none', maxHeight: '100px', lineHeight: 1.4, boxSizing: 'border-box' }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(129,140,248,0.6)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(129,140,248,0.25)')}
                />
              </div>
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                style={{ background: !input.trim() || loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: !input.trim() || loading ? '#64748b' : '#fff', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer', flexShrink: 0, boxShadow: !input.trim() || loading ? 'none' : '0 4px 15px rgba(124,58,237,0.4)', transition: 'all 0.2s ease' }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS */}
      <style>{`
        @keyframes nova-pulse { 0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(1.15);opacity:0.8} }
        @keyframes nova-dot { 0%,100%{transform:scale(0.6);opacity:0.4}50%{transform:scale(1.2);opacity:1} }
        @keyframes nova-slide-in { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
        @media (max-width:640px){
          .nova-floating-trigger{bottom:76px!important;right:16px!important;width:52px!important;height:52px!important}
        }
      `}</style>
    </>
  );
}
