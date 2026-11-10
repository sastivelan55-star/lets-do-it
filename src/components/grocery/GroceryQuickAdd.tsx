import React, { useState } from 'react';
import {
  Plus,
  ChevronDown,
  ChevronUp,
  FileText,
  DollarSign,
} from 'lucide-react';
import { useGrocery } from '../../context/GroceryContext';
import {
  GROCERY_CATEGORIES,
  GROCERY_UNITS,
  type GroceryCategory,
  type GroceryUnit,
} from '../../types/grocery';

export default function GroceryQuickAdd() {
  const { addItem, selectedCategory } = useGrocery();

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<GroceryUnit>('pcs');
  const [category, setCategory] = useState<GroceryCategory>(
    selectedCategory !== 'all' ? selectedCategory : 'vegetables'
  );
  const [estimatedPrice, setEstimatedPrice] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addItem({
      name: name.trim(),
      quantity: Number(quantity) > 0 ? Number(quantity) : 1,
      unit,
      category,
      estimatedPrice: estimatedPrice ? Number(estimatedPrice) : undefined,
      notes: notes.trim() || undefined,
    });

    setName('');
    setQuantity(1);
    setEstimatedPrice('');
    setNotes('');
    setShowDetails(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        borderRadius: '16px',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        padding: '0.85rem 1rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(16px)',
        marginBottom: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
      }}
    >
      {/* Primary Input Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Name input */}
        <input
          type="text"
          placeholder="Add grocery item (e.g. Tomatoes, Keerai, Almond Milk)..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            flex: '1 1 220px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '0.55rem 0.85rem',
            color: '#f8fafc',
            fontSize: '0.86rem',
            outline: 'none',
            fontFamily: 'inherit',
          }}
          autoFocus
        />

        {/* Quantity Stepper */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '0.15rem 0.35rem',
          }}
        >
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0 6px',
              fontSize: '1rem',
              fontWeight: 700,
            }}
          >
            -
          </button>
          <input
            type="number"
            min="0.25"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
            style={{
              width: '42px',
              textAlign: 'center',
              background: 'transparent',
              border: 'none',
              color: '#f8fafc',
              fontSize: '0.85rem',
              fontWeight: 700,
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0 6px',
              fontSize: '1rem',
              fontWeight: 700,
            }}
          >
            +
          </button>
        </div>

        {/* Unit Selector */}
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as GroceryUnit)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '0.55rem 0.75rem',
            color: '#f8fafc',
            fontSize: '0.82rem',
            outline: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {GROCERY_UNITS.map((u) => (
            <option key={u.id} value={u.id} style={{ background: '#0b1120' }}>
              {u.label}
            </option>
          ))}
        </select>

        {/* Category Picker */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as GroceryCategory)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '0.55rem 0.75rem',
            color: '#f8fafc',
            fontSize: '0.82rem',
            outline: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {GROCERY_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id} style={{ background: '#0b1120' }}>
              {cat.emoji} {cat.label}
            </option>
          ))}
        </select>

        {/* Optional Expand Toggle (Price & Notes) */}
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          title="Add estimated price & notes"
          style={{
            background: showDetails ? 'rgba(52, 211, 153, 0.18)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${showDetails ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '10px',
            padding: '0.55rem 0.7rem',
            color: showDetails ? '#34d399' : '#94a3b8',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.8rem',
          }}
        >
          <DollarSign size={13} />
          <span>{showDetails ? 'Less' : 'More'}</span>
          {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {/* Add Button */}
        <button
          type="submit"
          disabled={!name.trim()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.55rem 1.15rem',
            borderRadius: '10px',
            background: name.trim()
              ? 'linear-gradient(135deg, #10b981, #059669)'
              : 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: name.trim() ? '#ffffff' : 'rgba(255, 255, 255, 0.35)',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: name.trim() ? 'pointer' : 'default',
            boxShadow: name.trim() ? '0 0 16px rgba(16, 185, 129, 0.45)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add</span>
        </button>
      </div>

      {/* Expanded Optional Fields: Estimated Price & Notes */}
      {showDetails && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            flexWrap: 'wrap',
          }}
        >
          {/* Estimated Price */}
          <div style={{ flex: '1 1 140px', position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#34d399',
                fontSize: '0.82rem',
                fontWeight: 700,
              }}
            >
              ₹
            </span>
            <input
              type="number"
              step="any"
              placeholder="Price per unit"
              value={estimatedPrice}
              onChange={(e) => setEstimatedPrice(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '1.8rem',
                paddingRight: '0.75rem',
                paddingTop: '0.45rem',
                paddingBottom: '0.45rem',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '0.82rem',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Notes */}
          <div style={{ flex: '2 1 240px', position: 'relative' }}>
            <FileText
              size={13}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              placeholder="Brand, organic, store, or special notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '2.1rem',
                paddingRight: '0.75rem',
                paddingTop: '0.45rem',
                paddingBottom: '0.45rem',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '0.82rem',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      )}
    </form>
  );
}
