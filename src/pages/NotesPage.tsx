import { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  X,
  Pin,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/ui/Modal';
import NoteForm from '../components/notes/NoteForm';
import NoteCard from '../components/notes/NoteCard';
import type { Note } from '../types';
import { formatSafeErrorMessage } from '../utils/errorUtils';
import { runAiPrompt, parseAiJsonArray } from '../services/aiService';
import { today } from '../utils/dates';

export type NotePageMode = 'all' | 'notes' | 'knowledge';

interface NotesPageProps {
  mode?: NotePageMode;
  hideHeader?: boolean;
}

const KNOWLEDGE_KEYWORDS = [
  'tech', 'dsa', 'system design', 'placement', 'interview',
  'algorithm', 'data structure', 'leetcode', 'backend', 'frontend',
  'database', 'sql', 'python', 'javascript', 'typescript', 'react',
  'code', 'study', 'architecture', 'api', 'dev', 'engineering'
];

function isKnowledgeNote(note: Note): boolean {
  const cat = (note.category || '').toLowerCase();
  const title = (note.title || '').toLowerCase();
  if (
    cat.includes('technical') ||
    cat.includes('dsa') ||
    cat.includes('system design') ||
    cat.includes('placement') ||
    cat.includes('interview')
  ) {
    return true;
  }
  return KNOWLEDGE_KEYWORDS.some((kw) => cat.includes(kw) || title.includes(kw));
}

export default function NotesPage({ mode = 'all', hideHeader = false }: NotesPageProps = {}) {
  const { notes, addNote, updateNote, removeNote, addTask, settings, error } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [aiNoteLoading, setAiNoteLoading] = useState<'summary' | 'tasks' | null>(null);
  const [aiNoteSummary, setAiNoteSummary] = useState<string | null>(null);
  const [aiExtractedTasks, setAiExtractedTasks] = useState<string[]>([]);
  const [addedTaskIndices, setAddedTaskIndices] = useState<Set<number>>(new Set());
  const [aiNoteError, setAiNoteError] = useState<string | null>(null);

  const resetAiNoteState = () => {
    setAiNoteLoading(null);
    setAiNoteSummary(null);
    setAiExtractedTasks([]);
    setAddedTaskIndices(new Set());
    setAiNoteError(null);
  };

  const handleAiNoteSummarize = async (note: Note) => {
    setAiNoteLoading('summary');
    setAiNoteError(null);
    const res = await runAiPrompt(
      `Summarize and polish this note clearly in 3-5 concise bullet points:\n\nTitle: ${note.title}\nContent:\n${note.content || '(Empty)'}`,
      'You are a sharp personal knowledge assistant in Life OS. Return concise, high-signal markdown bullets.',
      {
        provider: settings.aiSettings?.provider || 'gemini',
        model: settings.aiSettings?.model,
      }
    );
    setAiNoteLoading(null);
    if (res.success && res.text) {
      setAiNoteSummary(res.text);
    } else {
      setAiNoteError(res.error || 'AI summarize failed.');
    }
  };

  const handleAiExtractTasks = async (note: Note) => {
    setAiNoteLoading('tasks');
    setAiNoteError(null);
    setAddedTaskIndices(new Set());
    const res = await runAiPrompt(
      `Extract concrete, actionable to-do tasks from this note as a JSON array of 2 to 6 short task title strings (no explanations, valid JSON array only):\n\nTitle: ${note.title}\nContent:\n${note.content || '(Empty)'}`,
      'Output ONLY a valid JSON array of short task title strings, e.g. ["Task 1", "Task 2"].',
      {
        provider: settings.aiSettings?.provider || 'gemini',
        model: settings.aiSettings?.model,
      }
    );
    setAiNoteLoading(null);
    if (!res.success || !res.text) {
      setAiNoteError(res.error || 'AI task extraction failed.');
      return;
    }
    const parsed = parseAiJsonArray<string>(res.text);
    const fallback = res.text
      .split('\n')
      .map((l) => l.replace(/^[-*\d.)\s]+/, '').trim())
      .filter((l) => l.length > 2)
      .slice(0, 6);
    const extracted = (parsed && parsed.length > 0 ? parsed : fallback)
      .map((s) => String(s).trim())
      .filter(Boolean);
    if (extracted.length === 0) {
      setAiNoteError('No clear actionable tasks found in this note.');
      return;
    }
    setAiExtractedTasks(extracted);
  };

  // Filter notes based on mode (notes vs knowledge vs all)
  const scopedNotes = useMemo(() => {
    if (mode === 'knowledge') {
      return notes.filter((n) => isKnowledgeNote(n));
    }
    if (mode === 'notes') {
      return notes.filter((n) => !isKnowledgeNote(n));
    }
    return notes;
  }, [notes, mode]);

  // Extract unique categories from scoped notes
  const categories = useMemo(() => {
    const set = new Set<string>();
    scopedNotes.forEach((n) => {
      if (n.category) set.add(n.category);
    });
    return ['All', ...Array.from(set)];
  }, [scopedNotes]);

  // Filter notes based on search query and selected category
  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return scopedNotes
      .filter((note) => {
        const matchesCategory =
          selectedCategory === 'All' || note.category === selectedCategory;
        const matchesQuery =
          !q ||
          note.title.toLowerCase().includes(q) ||
          note.content.toLowerCase().includes(q) ||
          (note.category && note.category.toLowerCase().includes(q));

        return matchesCategory && matchesQuery;
      })
      .sort((a, b) => {
        // Pinned notes first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // Then by updated_at descending
        return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      });
  }, [scopedNotes, searchQuery, selectedCategory]);

  const handleAddSubmit = async (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addNote(data);
    setShowAddModal(false);
  };

  const handleEditSubmit = async (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingNote) return;
    await updateNote({ ...editingNote, ...data });
    setEditingNote(null);
  };

  const defaultCategoryForMode = mode === 'knowledge' ? 'Technical & DSA' : 'General';

  return (
    <div className="page-container pb-safe">
      {/* Header */}
      {!hideHeader && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              {mode === 'knowledge' ? (
                <>🧠 <span className="gradient-text">Knowledge Base & Technical Notes</span></>
              ) : mode === 'notes' ? (
                <>📝 <span className="gradient-text">Personal Notes & Thoughts</span></>
              ) : (
                <>📝 <span className="gradient-text">Personal Notes & Insights</span></>
              )}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {mode === 'knowledge'
                ? 'Technical concepts, DSA patterns, algorithms, system design takeaways, and learning logs.'
                : mode === 'notes'
                ? 'Personal reflections, quick ideas, thoughts, book notes, and everyday insights.'
                : 'DSA patterns, interview concepts, system design takeaways, and personal learning logs.'}
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={15} /> {mode === 'knowledge' ? 'Add Technical Note' : 'Add Note'}
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{typeof error === 'string' && error !== '[object Object]' ? error : formatSafeErrorMessage(error)}</span>
        </div>
      )}

      {/* Search and Category Filter Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ position: 'relative', width: '100%', maxWidth: '30rem' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            className="input"
            style={{
              paddingLeft: '2.4rem',
              paddingRight: searchQuery ? '2.4rem' : '1rem',
              width: '100%',
            }}
            placeholder="Search notes by title, concept, or keywords…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        {categories.length > 1 && (
          <div className="filter-scroll" style={{ paddingBottom: '0.25rem' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.78rem', borderRadius: '8px', whiteSpace: 'nowrap' }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        /* Zero Notes Total State */
        <div className="empty-state" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <FileText size={44} color="#818cf8" style={{ margin: '0 auto 0.75rem auto' }} />
          <p style={{ fontWeight: 700, fontSize: '1.1rem', margin: '0 0 0.25rem 0' }}>
            No notes recorded yet
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Use the <strong>+ Add Note</strong> button in the header above to record DSA patterns, interview concepts, and personal study insights.
          </p>
        </div>
      ) : filteredNotes.length === 0 ? (
        /* Zero Filtered Results State */
        <div className="empty-state" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <Search size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto' }} />
          <p style={{ fontWeight: 600, fontSize: '1rem', margin: '0 0 0.25rem 0' }}>
            No notes found
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
            No notes match "{searchQuery}" {selectedCategory !== 'All' ? `in ${selectedCategory}` : ''}.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
            gap: '1rem',
          }}
        >
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={(n) => setEditingNote(n)}
              onDelete={removeNote}
              onView={(n) => setViewingNote(n)}
            />
          ))}
        </div>
      )}

      {/* Add Note Modal */}
      {showAddModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddModal(false)}
          title="Create New Note"
          maxWidth="640px"
        >
          <NoteForm
            initial={{ category: selectedCategory !== 'All' ? selectedCategory : defaultCategoryForMode }}
            onSubmit={handleAddSubmit}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}

      {/* Edit Note Modal */}
      {editingNote && (
        <Modal
          isOpen={true}
          onClose={() => setEditingNote(null)}
          title="Edit Note"
          maxWidth="640px"
        >
          <NoteForm
            initial={editingNote}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditingNote(null)}
          />
        </Modal>
      )}

      {/* View Full Note Reader Modal */}
      {viewingNote && (
        <Modal
          isOpen={true}
          onClose={() => { setViewingNote(null); resetAiNoteState(); }}
          title={viewingNote.title}
          maxWidth="680px"
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <span
                className="badge"
                style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {viewingNote.category || 'General'}
              </span>

              {viewingNote.isPinned && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '0.72rem',
                    color: '#818cf8',
                  }}
                >
                  <Pin size={11} /> Pinned
                </span>
              )}

              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginLeft: 'auto',
                }}
              >
                Updated {viewingNote.updatedAt?.slice(0, 10) || ''}
              </span>
            </div>

            <div
              style={{
                fontSize: '0.92rem',
                lineHeight: 1.65,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                background: 'var(--bg-surface-2)',
                padding: '1.25rem',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                maxHeight: '60vh',
                overflowY: 'auto',
              }}
            >
              {viewingNote.content || '(Empty content)'}
            </div>

            {(aiNoteSummary || aiExtractedTasks.length > 0 || aiNoteError) && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.9rem 1rem',
                  borderRadius: '10px',
                  background: 'rgba(139, 92, 246, 0.08)',
                  border: aiNoteError ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                {aiNoteError && (
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#f87171' }}>{aiNoteError}</p>
                )}
                {aiNoteSummary && (
                  <div style={{ marginBottom: aiExtractedTasks.length > 0 ? '0.75rem' : 0 }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#a78bfa', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Sparkles size={12} /> AI Summary &amp; Polish
                    </div>
                    <div style={{ fontSize: '0.84rem', lineHeight: 1.55, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                      {aiNoteSummary}
                    </div>
                  </div>
                )}
                {aiExtractedTasks.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#34d399', marginBottom: '0.45rem' }}>
                      Extracted Actionable Tasks
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {aiExtractedTasks.map((taskTitle, idx) => {
                        const alreadyAdded = addedTaskIndices.has(idx);
                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              padding: '0.45rem 0.65rem',
                              borderRadius: '8px',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border)',
                              fontSize: '0.82rem',
                            }}
                          >
                            <span style={{ color: 'var(--text-primary)', flex: 1 }}>{taskTitle}</span>
                            <button
                              type="button"
                              disabled={alreadyAdded}
                              onClick={async () => {
                                await addTask({
                                  title: taskTitle,
                                  lifeArea: 'technical',
                                  dueDate: today(),
                                  priority: 'medium',
                                  status: 'not-started',
                                  notes: `Extracted from note: ${viewingNote.title}`,
                                });
                                setAddedTaskIndices((prev) => new Set(prev).add(idx));
                              }}
                              className="btn btn-xs"
                              style={{
                                background: alreadyAdded ? 'rgba(16, 185, 129, 0.16)' : 'rgba(99, 102, 241, 0.16)',
                                color: alreadyAdded ? '#10b981' : '#818cf8',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                flexShrink: 0,
                              }}
                            >
                              {alreadyAdded ? <><CheckCircle2 size={11} /> Added</> : '+ Add to Tasks'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginTop: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={aiNoteLoading !== null}
                  onClick={() => handleAiNoteSummarize(viewingNote)}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}
                >
                  <Sparkles size={13} className={aiNoteLoading === 'summary' ? 'animate-spin' : ''} />
                  {aiNoteLoading === 'summary' ? 'Summarizing…' : 'AI Summarize'}
                </button>
                <button
                  type="button"
                  disabled={aiNoteLoading !== null}
                  onClick={() => handleAiExtractTasks(viewingNote)}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}
                >
                  <Plus size={13} />
                  {aiNoteLoading === 'tasks' ? 'Extracting…' : 'Extract Tasks'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    const toEdit = viewingNote;
                    setViewingNote(null);
                    resetAiNoteState();
                    setEditingNote(toEdit);
                  }}
                >
                  Edit Note
                </button>
                <button className="btn btn-primary" onClick={() => { setViewingNote(null); resetAiNoteState(); }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
