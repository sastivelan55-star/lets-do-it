import { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  X,
  Pin,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/ui/Modal';
import NoteForm from '../components/notes/NoteForm';
import NoteCard from '../components/notes/NoteCard';
import type { Note } from '../types';


export default function NotesPage() {
  const { notes, addNote, updateNote, removeNote, error } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  // Extract unique categories from existing notes
  const categories = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      if (n.category) set.add(n.category);
    });
    return ['All', ...Array.from(set)];
  }, [notes]);

  // Filter notes based on search query and selected category
  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return notes
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
  }, [notes, searchQuery, selectedCategory]);

  const handleAddSubmit = async (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addNote(data);
    setShowAddModal(false);
  };

  const handleEditSubmit = async (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingNote) return;
    await updateNote({ ...editingNote, ...data });
    setEditingNote(null);
  };

  return (
    <div className="page-container pb-safe">
      {/* Header */}
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
            📝 <span className="gradient-text">Personal Notes & Insights</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            DSA patterns, interview concepts, system design takeaways, and personal learning logs.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={15} /> Add Note
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div
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
          <span>{error}</span>
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
            No notes yet
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0' }}>
            Save DSA patterns, key interview takeaways, system design summaries, and study logs.
          </p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add First Note
          </button>
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
            initial={{ category: selectedCategory !== 'All' ? selectedCategory : undefined }}
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
          onClose={() => setViewingNote(null)}
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

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '1.25rem',
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const toEdit = viewingNote;
                  setViewingNote(null);
                  setEditingNote(toEdit);
                }}
              >
                Edit Note
              </button>
              <button className="btn btn-primary" onClick={() => setViewingNote(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
