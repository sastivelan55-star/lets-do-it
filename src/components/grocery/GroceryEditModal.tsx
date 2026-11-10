import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import type { GroceryItem, GroceryCategory, GroceryUnit } from '../../types/grocery';
import { GROCERY_CATEGORIES, GROCERY_UNITS } from '../../types/grocery';

interface GroceryEditModalProps {
  item: GroceryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Omit<GroceryItem, 'id' | 'listId'>>) => void;
}

export default function GroceryEditModal({
  item,
  isOpen,
  onClose,
  onSave,
}: GroceryEditModalProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<GroceryUnit>('pcs');
  const [category, setCategory] = useState<GroceryCategory>('vegetables');
  const [estimatedPrice, setEstimatedPrice] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.name);
      setQuantity(item.quantity);
      setUnit(item.unit);
      setCategory(item.category);
      setEstimatedPrice(item.estimatedPrice !== undefined ? String(item.estimatedPrice) : '');
      setNotes(item.notes || '');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave(item.id, {
      name: name.trim(),
      quantity: Number(quantity) > 0 ? Number(quantity) : 1,
      unit,
      category,
      estimatedPrice: estimatedPrice ? Number(estimatedPrice) : undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Grocery Item" maxWidth="500px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Item Name */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Item Name *
          </label>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        {/* Quantity & Unit */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Quantity *
            </label>
            <input
              type="number"
              min="0.25"
              step="any"
              className="input"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Unit
            </label>
            <select
              className="input"
              value={unit}
              onChange={(e) => setUnit(e.target.value as GroceryUnit)}
            >
              {GROCERY_UNITS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category & Estimated Price */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Category
            </label>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value as GroceryCategory)}
            >
              {GROCERY_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Estimated Price (₹)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              className="input"
              placeholder="e.g. 150"
              value={estimatedPrice}
              onChange={(e) => setEstimatedPrice(e.target.value)}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Notes / Brand / Store (Optional)
          </label>
          <textarea
            className="input"
            rows={2}
            placeholder="Special instructions, brand preferences, organic..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

