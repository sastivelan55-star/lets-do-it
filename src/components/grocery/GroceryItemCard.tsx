import { useState, memo } from 'react';
import {
  Check,
  Edit2,
  Trash2,
  FileText,
} from 'lucide-react';
import type { GroceryItem } from '../../types/grocery';
import { GROCERY_CATEGORIES } from '../../types/grocery';
import { useGrocery } from '../../context/GroceryContext';

interface GroceryItemCardProps {
  item: GroceryItem;
  onEdit: (item: GroceryItem) => void;
  onDelete: (item: GroceryItem) => void;
}

function GroceryItemCardComponent({
  item,
  onEdit,
  onDelete,
}: GroceryItemCardProps) {
  const { togglePurchased } = useGrocery();
  const [isHovered, setIsHovered] = useState(false);

  const categoryMeta =
    GROCERY_CATEGORIES.find((c) => c.id === item.category) ||
    GROCERY_CATEGORIES[GROCERY_CATEGORIES.length - 1];

  const totalItemCost =
    item.estimatedPrice && item.estimatedPrice > 0
      ? Math.round(item.estimatedPrice * (item.quantity > 0 ? item.quantity : 1) * 100) / 100
      : undefined;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        borderRadius: '14px',
        background: item.isPurchased
          ? 'rgba(16, 185, 129, 0.08)'
          : isHovered
            ? 'rgba(25, 35, 52, 0.7)'
            : 'rgba(15, 23, 42, 0.55)',
        border: item.isPurchased
          ? '1px solid rgba(16, 185, 129, 0.3)'
          : `1px solid ${isHovered ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.07)'}`,
        boxShadow: isHovered
          ? '0 6px 20px rgba(0, 0, 0, 0.35)'
          : '0 2px 8px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: item.isPurchased ? 0.75 : 1,
        gap: '0.75rem',
      }}
    >
      {/* Left Checkbox & Item Details */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
        {/* Animated Checkbox with comfortable touch target */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePurchased(item.id);
          }}
          style={{
            width: '28px',
            height: '28px',
            minWidth: '28px',
            minHeight: '28px',
            borderRadius: '8px',
            border: item.isPurchased
              ? 'none'
              : '2px solid rgba(52, 211, 153, 0.6)',
            background: item.isPurchased
              ? 'linear-gradient(135deg, #10b981, #059669)'
              : 'rgba(255, 255, 255, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.18s ease',
            boxShadow: item.isPurchased ? '0 0 12px rgba(16, 185, 129, 0.55)' : 'none',
          }}
          aria-label={item.isPurchased ? 'Mark as not purchased' : 'Mark as purchased'}
        >
          {item.isPurchased && <Check size={16} strokeWidth={3} />}
        </button>

        {/* Text Details */}
        <div
          onClick={() => togglePurchased(item.id)}
          style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
          title={item.isPurchased ? 'Click to mark as to buy' : 'Click to mark as purchased'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: item.isPurchased ? '#94a3b8' : '#f8fafc',
                textDecoration: item.isPurchased ? 'line-through' : 'none',
                userSelect: 'none',
              }}
            >
              {item.name}
            </span>

            {/* Quantity Badge */}
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              {item.quantity} {item.unit}
            </span>

            {/* Category Chip */}
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '0.12rem 0.45rem',
                borderRadius: '6px',
                background: `${categoryMeta.color}18`,
                color: categoryMeta.color,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <span>{categoryMeta.emoji}</span>
              <span>{categoryMeta.label}</span>
            </span>

            {/* Price Tag if available */}
            {totalItemCost !== undefined && (
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: '#34d399',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  padding: '0.12rem 0.45rem',
                  borderRadius: '6px',
                }}
              >
                ₹{totalItemCost}
                {item.quantity > 1 && (
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>
                    (₹{item.estimatedPrice}/{item.unit})
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Notes if present */}
          {item.notes && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '0.2rem',
                fontSize: '0.74rem',
                color: '#94a3b8',
                fontStyle: 'italic',
              }}
            >
              <FileText size={11} color="#64748b" style={{ flexShrink: 0 }} />
              <span>{item.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => onEdit(item)}
          title="Edit item"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <Edit2 size={13} />
        </button>

        <button
          type="button"
          onClick={() => onDelete(item)}
          title="Delete item"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export default memo(GroceryItemCardComponent);
