import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import type { GroceryList } from '../../types/grocery';

interface GroceryListModalProps {
  isOpen: boolean;
  onClose: () => void;
  listToRename?: GroceryList | null;
  onSave: (name: string, color?: string) => void;
}

const LIST_COLORS = [
  '#10b981', // Emerald
  '#38bdf8', // Sky
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#06b6d4', // Cyan
];

export default function GroceryListModal({
  isOpen,
  onClose,
  listToRename,
  onSave,
}: GroceryListModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');

  useEffect(() => {
    if (listToRename) {
      setName(listToRename.name);
      setColor(listToRename.color || '#10b981');
    } else {
      setName('');
      setColor('#10b981');
    }
  }, [listToRename, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave(name.trim(), color);
    onClose();
  };

  const isEditing = Boolean(listToRename);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Rename Shopping List' : 'Create New Shopping List'}
      maxWidth="440px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            List Name *
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Weekly Groceries, Monthly Restock, Party Snacks..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Theme Color
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {LIST_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: c,
                  border: color === c ? '2px solid #ffffff' : '2px solid transparent',
                  cursor: 'pointer',
                  boxShadow: color === c ? `0 0 10px ${c}` : 'none',
                  transition: 'all 0.15s ease',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
            {isEditing ? 'Save Changes' : 'Create List'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

