import React, { useState, useEffect } from 'react';
import {
  X,
  Folder,
  Palette,
  Code2,
  GraduationCap,
  Lightbulb,
  Tv,
  BookOpen,
  Music,
  Sparkles,
  Heart,
  Star,
  Check,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

const COLOR_PALETTE = [
  '#a855f7', // Purple Neon
  '#ec4899', // Sakura Pink
  '#38bdf8', // Cyber Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Crimson
  '#6366f1', // Indigo
  '#06b6d4', // Teal
  '#eab308', // Gold
];

const AVAILABLE_ICONS = [
  { name: 'Folder', icon: <Folder size={18} /> },
  { name: 'Palette', icon: <Palette size={18} /> },
  { name: 'Code2', icon: <Code2 size={18} /> },
  { name: 'GraduationCap', icon: <GraduationCap size={18} /> },
  { name: 'Lightbulb', icon: <Lightbulb size={18} /> },
  { name: 'Tv', icon: <Tv size={18} /> },
  { name: 'BookOpen', icon: <BookOpen size={18} /> },
  { name: 'Music', icon: <Music size={18} /> },
  { name: 'Sparkles', icon: <Sparkles size={18} /> },
  { name: 'Heart', icon: <Heart size={18} /> },
];

export default function VaultCollectionModal() {
  const {
    isCollectionModalOpen,
    setIsCollectionModalOpen,
    editingCollection,
    setEditingCollection,
    addCollection,
    editCollection,
  } = useVault();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [selectedIcon, setSelectedIcon] = useState('Folder');
  const [isFavourite, setIsFavourite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingCollection) {
      setName(editingCollection.name);
      setDescription(editingCollection.description || '');
      setSelectedColor(editingCollection.color || COLOR_PALETTE[0]);
      setSelectedIcon(editingCollection.icon || 'Folder');
      setIsFavourite(editingCollection.isFavourite);
    } else {
      setName('');
      setDescription('');
      setSelectedColor(COLOR_PALETTE[0]);
      setSelectedIcon('Folder');
      setIsFavourite(false);
    }
  }, [editingCollection, isCollectionModalOpen]);

  const handleClose = () => {
    setEditingCollection(null);
    setIsCollectionModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingCollection) {
        await editCollection({
          ...editingCollection,
          name: name.trim(),
          description: description.trim() || undefined,
          color: selectedColor,
          icon: selectedIcon,
          isFavourite,
        });
      } else {
        await addCollection({
          name: name.trim(),
          description: description.trim() || undefined,
          color: selectedColor,
          icon: selectedIcon,
          isFavourite,
        });
      }
      handleClose();
    } catch (err) {
      console.error('Failed to save collection', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isCollectionModalOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(5, 3, 14, 0.75)',
        backdropFilter: 'blur(16px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) handleClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          borderRadius: '24px',
          background: 'linear-gradient(180deg, #171131 0%, #0d0a1e 100%)',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          animation: 'vaultModalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(168, 85, 247, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: selectedColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: `0 0 16px ${selectedColor}60`,
              }}
            >
              <Folder size={17} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              {editingCollection ? 'Edit Collection' : 'Create Collection'}
            </h2>
          </div>

          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Collection Name */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '0.35rem',
              }}
            >
              Collection Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Design Inspiration or Rust Architecture"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.65rem 0.85rem',
                borderRadius: '12px',
                background: 'rgba(10, 7, 24, 0.6)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                color: '#f8fafc',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '0.35rem',
              }}
            >
              Description (optional)
            </label>
            <input
              type="text"
              placeholder="Brief description of this collection..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.65rem 0.85rem',
                borderRadius: '12px',
                background: 'rgba(10, 7, 24, 0.6)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Color Palette Selector */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '0.45rem',
              }}
            >
              Theme Color
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {COLOR_PALETTE.map((color) => {
                const isSelected = selectedColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: color,
                      border: isSelected ? '2px solid #ffffff' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isSelected ? `0 0 12px ${color}` : 'none',
                      transition: 'transform 0.15s ease',
                      transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                    }}
                  >
                    {isSelected && <Check size={14} color="#ffffff" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '0.45rem',
              }}
            >
              Icon Symbol
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {AVAILABLE_ICONS.map((item) => {
                const isSelected = selectedIcon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedIcon(item.name)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: isSelected ? `${selectedColor}30` : 'rgba(255, 255, 255, 0.05)',
                      border: isSelected
                        ? `1px solid ${selectedColor}`
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      color: isSelected ? selectedColor : 'rgba(226, 232, 240, 0.7)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {item.icon}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Favourite Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsFavourite(!isFavourite)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: isFavourite ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${isFavourite ? 'rgba(234, 179, 8, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                padding: '0.4rem 0.8rem',
                borderRadius: '10px',
                color: isFavourite ? '#fde047' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.82rem',
              }}
            >
              <Star size={15} fill={isFavourite ? '#facc15' : 'transparent'} />
              <span>Mark as Favourite Collection</span>
            </button>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '0.5rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              style={{
                padding: '0.65rem 1.15rem',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                color: '#e2e8f0',
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.45rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: isSubmitting || !name.trim() ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 18px rgba(168, 85, 247, 0.4)',
                opacity: isSubmitting || !name.trim() ? 0.6 : 1,
              }}
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Saving...' : editingCollection ? 'Update' : 'Create'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

