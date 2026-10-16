import React, { useState } from 'react';
import { Pin } from 'lucide-react';
import type { Note } from '../../types';

interface NoteFormProps {
  initial?: Partial<Note>;
  onSubmit: (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const CATEGORY_PRESETS = [
  'Technical & DSA',
  'System Design',
  'Career & Interview',
  'Placement Prep',
  'English & Speaking',
  'Personal Reflection',
  'Projects & Ideas',
  'General',
];

export default function NoteForm({ initial = {}, onSubmit, onCancel }: NoteFormProps) {
  const [title, setTitle] = useState(initial.title ?? '');
  const [content, setContent] = useState(initial.content ?? '');
  const [category, setCategory] = useState(initial.category ?? 'Technical & DSA');
  const [customCategory, setCustomCategory] = useState('');
  const [isPinned, setIsPinned] = useState(initial.isPinned ?? false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    const finalCategory = customCategory.trim() || category.trim() || undefined;

    setError('');
    onSubmit({
      title: title.trim(),
      content: content.trim(),
      category: finalCategory,
      isPinned,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {error && (
        <div
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px',
            padding: '0.6rem 0.9rem',
            color: '#f87171',
            fontSize: '0.85rem',
          }}
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="note-title">Note Title *</label>
        <input
          id="note-title"
          className="input"
          placeholder="e.g. Dynamic Programming Memoization Patterns"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </div>

      <div className="form-grid-2">
        <div>
          <label htmlFor="note-category">Category</label>
          <select
            id="note-category"
            className="input select"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              if (e.target.value !== 'Custom…') setCustomCategory('');
            }}
          >
            {CATEGORY_PRESETS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="Custom…">Custom Category…</option>
          </select>
        </div>

        {category === 'Custom…' && (
          <div>
            <label htmlFor="note-custom-cat">Custom Category Name</label>
            <input
              id="note-custom-cat"
              className="input"
              placeholder="e.g. Cloud Architecture"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
            />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: isPinned ? '#818cf8' : 'var(--text-secondary)',
              fontWeight: isPinned ? 600 : 400,
            }}
          >
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              style={{ display: 'none' }}
            />
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '5px',
                border: `1.5px solid ${isPinned ? '#818cf8' : 'var(--border)'}`,
                background: isPinned ? 'rgba(129, 140, 248, 0.2)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Pin size={12} color={isPinned ? '#818cf8' : 'var(--text-muted)'} />
            </div>
            <span>Pin note to top</span>
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="note-content">Note Content</label>
        <textarea
          id="note-content"
          className="input"
          style={{ resize: 'vertical', minHeight: '160px', fontFamily: 'inherit', lineHeight: 1.5 }}
          placeholder="Write your notes, insights, code snippets, algorithm steps, or learning takeaways here…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {initial.title ? 'Save Note' : 'Create Note'}
        </button>
      </div>
    </form>
  );
}
