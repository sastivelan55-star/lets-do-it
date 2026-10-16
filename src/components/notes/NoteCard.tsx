import { useState } from 'react';
import { Pin, Edit3, Trash2, Calendar } from 'lucide-react';
import type { Note } from '../../types';

import { format, parseISO } from 'date-fns';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onView: (note: Note) => void;
}

export default function NoteCard({ note, onEdit, onDelete, onView }: NoteCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  let formattedDate = '';
  try {
    formattedDate = format(parseISO(note.updatedAt || note.createdAt), 'MMM d, yyyy');
  } catch {
    formattedDate = note.updatedAt?.slice(0, 10) || '';
  }

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.1rem',
        background: 'var(--bg-surface-2)',
        borderRadius: '12px',
        border: `1px solid ${note.isPinned ? 'rgba(129, 140, 248, 0.4)' : 'var(--border)'}`,
        position: 'relative',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
        cursor: 'pointer',
      }}
      onClick={() => onView(note)}
    >
      <div>
        {/* Top meta row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.6rem',
            gap: '0.5rem',
          }}
        >
          <span
            className="badge"
            style={{
              background: 'rgba(99, 102, 241, 0.12)',
              color: '#818cf8',
              fontSize: '0.72rem',
              fontWeight: 600,
            }}
          >
            {note.category || 'General'}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {note.isPinned && (
              <span
                title="Pinned Note"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#818cf8',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  background: 'rgba(129, 140, 248, 0.15)',
                }}
              >
                <Pin size={12} />
              </span>
            )}

            <div
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'flex', gap: '2px', alignItems: 'center' }}
            >
              <button
                className="btn btn-ghost btn-sm btn-icon"
                onClick={() => onEdit(note)}
                title="Edit Note"
                aria-label="Edit Note"
              >
                <Edit3 size={13} />
              </button>

              {confirmDelete ? (
                <div style={{ display: 'flex', gap: '3px' }}>
                  <button
                    className="btn btn-sm btn-danger"
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                    onClick={() => onDelete(note.id)}
                  >
                    Del
                  </button>
                  <button
                    className="btn btn-sm btn-ghost"
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}
                    onClick={() => setConfirmDelete(false)}
                  >
                    Esc
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  style={{ color: '#ef4444' }}
                  onClick={() => setConfirmDelete(true)}
                  title="Delete Note"
                  aria-label="Delete Note"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3
          className="task-title"
          style={{
            fontWeight: 700,
            fontSize: '0.98rem',
            margin: '0 0 0.5rem 0',
            color: 'var(--text-primary)',
            overflowWrap: 'anywhere',
          }}
        >
          {note.title}
        </h3>

        {/* Excerpt */}
        {note.content ? (
          <p
            style={{
              fontSize: '0.84rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.45,
              margin: '0 0 0.75rem 0',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              whiteSpace: 'pre-wrap',
            }}
          >
            {note.content}
          </p>
        ) : (
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              margin: '0 0 0.75rem 0',
            }}
          >
            Empty note content…
          </p>
        )}
      </div>

      {/* Date footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border)',
          paddingTop: '0.5rem',
          marginTop: 'auto',
        }}
      >
        <Calendar size={11} />
        <span>Updated {formattedDate}</span>
      </div>
    </div>
  );
}
