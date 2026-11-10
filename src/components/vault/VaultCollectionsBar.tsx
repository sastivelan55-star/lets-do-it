import React, { useState } from 'react';
import {
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
  Archive,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import type { VaultCollection } from '../../types/vault';

const ICON_MAP: Record<string, React.ReactNode> = {
  Folder: <Folder size={13} />,
  Palette: <Palette size={13} />,
  Code2: <Code2 size={13} />,
  GraduationCap: <GraduationCap size={13} />,
  Lightbulb: <Lightbulb size={13} />,
  Tv: <Tv size={13} />,
  BookOpen: <BookOpen size={13} />,
  Music: <Music size={13} />,
  Sparkles: <Sparkles size={13} />,
  Heart: <Heart size={13} />,
};

export default function VaultCollectionsBar() {
  const {
    collections,
    resources,
    activeCollectionId,
    setActiveCollectionId,
    setIsCollectionModalOpen,
    setEditingCollection,
    removeCollection,
    stats,
  } = useVault();

  const [menuColId, setMenuColId] = useState<string | null>(null);

  // Compute resource count per collection
  const collectionCounts: Record<string, number> = {};
  let uncategorizedCount = 0;

  for (const r of resources) {
    if (!r.isArchived) {
      if (r.collectionId) {
        collectionCounts[r.collectionId] = (collectionCounts[r.collectionId] || 0) + 1;
      } else {
        uncategorizedCount++;
      }
    }
  }

  const handleEdit = (col: VaultCollection, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuColId(null);
    setEditingCollection(col);
    setIsCollectionModalOpen(true);
  };

  const handleDelete = async (col: VaultCollection, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuColId(null);
    if (confirm(`Delete collection "${col.name}"? Contained resources will be kept as uncategorized.`)) {
      await removeCollection(col.id);
    }
  };

  return (
    <div
      style={{
        marginBottom: '0.85rem',
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        .vault-collections-scroll::-webkit-scrollbar {
          display: none;
          height: 0px;
        }
      `}</style>
      <div
        className="vault-collections-scroll"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          overflowX: 'auto',
          padding: '0.2rem 0.2rem 0.35rem 0.2rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* All Resources Tab */}
        <button
          onClick={() => {
            setActiveCollectionId(null);
            setMenuColId(null);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.4rem 0.75rem',
            borderRadius: '999px',
            background:
              activeCollectionId === null
                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.35), rgba(99, 102, 241, 0.35))'
                : 'rgba(255, 255, 255, 0.04)',
            border:
              activeCollectionId === null
                ? '1px solid rgba(168, 85, 247, 0.6)'
                : '1px solid rgba(255, 255, 255, 0.08)',
            color: activeCollectionId === null ? '#ffffff' : 'rgba(226, 232, 240, 0.75)',
            fontSize: '0.78rem',
            fontWeight: activeCollectionId === null ? 700 : 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.15s ease',
            boxShadow:
              activeCollectionId === null ? '0 0 12px rgba(168, 85, 247, 0.3)' : 'none',
          }}
        >
          <Sparkles size={13} color={activeCollectionId === null ? '#c084fc' : '#94a3b8'} />
          <span>All Resources</span>
          <span
            style={{
              fontSize: '0.68rem',
              padding: '0.08rem 0.4rem',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.12)',
              marginLeft: '0.15rem',
            }}
          >
            {stats.total}
          </span>
        </button>

        {/* Favourites Tab */}
        <button
          onClick={() => {
            setActiveCollectionId('favourites');
            setMenuColId(null);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.4rem 0.75rem',
            borderRadius: '999px',
            background:
              activeCollectionId === 'favourites'
                ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(245, 158, 11, 0.25))'
                : 'rgba(255, 255, 255, 0.04)',
            border:
              activeCollectionId === 'favourites'
                ? '1px solid rgba(234, 179, 8, 0.6)'
                : '1px solid rgba(255, 255, 255, 0.08)',
            color: activeCollectionId === 'favourites' ? '#fde047' : 'rgba(226, 232, 240, 0.75)',
            fontSize: '0.78rem',
            fontWeight: activeCollectionId === 'favourites' ? 700 : 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.15s ease',
            boxShadow:
              activeCollectionId === 'favourites' ? '0 0 12px rgba(234, 179, 8, 0.3)' : 'none',
          }}
        >
          <Star
            size={13}
            color="#facc15"
            fill={activeCollectionId === 'favourites' ? '#facc15' : 'transparent'}
          />
          <span>Favourites</span>
          <span
            style={{
              fontSize: '0.68rem',
              padding: '0.08rem 0.4rem',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.12)',
              marginLeft: '0.15rem',
            }}
          >
            {stats.favourites}
          </span>
        </button>

        {/* User Defined Collections */}
        {collections.map((col) => {
          const isActive = activeCollectionId === col.id;
          const count = collectionCounts[col.id] || 0;
          const iconNode = col.icon && ICON_MAP[col.icon] ? ICON_MAP[col.icon] : <Folder size={13} />;
          const isMenuOpen = menuColId === col.id;

          return (
            <div key={col.id} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => {
                  setActiveCollectionId(col.id);
                  setMenuColId(null);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '999px',
                  background: isActive
                    ? `linear-gradient(135deg, ${col.color}35, rgba(168, 85, 247, 0.25))`
                    : 'rgba(255, 255, 255, 0.04)',
                  border: isActive ? `1px solid ${col.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  color: isActive ? '#ffffff' : 'rgba(226, 232, 240, 0.75)',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? `0 0 12px ${col.color}40` : 'none',
                }}
              >
                <span style={{ color: col.color, display: 'flex', alignItems: 'center' }}>
                  {iconNode}
                </span>
                <span>{col.name}</span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '0.08rem 0.4rem',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.12)',
                    marginLeft: '0.15rem',
                  }}
                >
                  {count}
                </span>

                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuColId(isMenuOpen ? null : col.id);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px',
                    borderRadius: '50%',
                    marginLeft: '2px',
                    color: 'rgba(255, 255, 255, 0.4)',
                  }}
                >
                  <MoreVertical size={12} />
                </span>
              </button>

              {/* Popover Action Menu */}
              {isMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '6px',
                    zIndex: 50,
                    background: '#130d2a',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '12px',
                    padding: '0.35rem',
                    minWidth: '140px',
                    boxShadow: '0 10px 28px rgba(0,0,0,0.6)',
                  }}
                >
                  <button
                    onClick={(e) => handleEdit(col, e)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: '#f8fafc',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Edit2 size={12} color="#c084fc" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={(e) => handleDelete(col, e)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: '#f87171',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Trash2 size={12} color="#f87171" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Uncategorized Tab */}
        {uncategorizedCount > 0 && (
          <button
            onClick={() => {
              setActiveCollectionId('uncategorized');
              setMenuColId(null);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.75rem',
              borderRadius: '999px',
              background:
                activeCollectionId === 'uncategorized'
                  ? 'rgba(148, 163, 184, 0.25)'
                  : 'rgba(255, 255, 255, 0.04)',
              border:
                activeCollectionId === 'uncategorized'
                  ? '1px solid rgba(148, 163, 184, 0.6)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
              color: activeCollectionId === 'uncategorized' ? '#ffffff' : 'rgba(226, 232, 240, 0.75)',
              fontSize: '0.78rem',
              fontWeight: activeCollectionId === 'uncategorized' ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <span>Uncategorized</span>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '0.08rem 0.4rem',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.12)',
                marginLeft: '0.15rem',
              }}
            >
              {uncategorizedCount}
            </span>
          </button>
        )}

        {/* Archived Tab */}
        {stats.archived > 0 && (
          <button
            onClick={() => {
              setActiveCollectionId('archived');
              setMenuColId(null);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.75rem',
              borderRadius: '999px',
              background:
                activeCollectionId === 'archived'
                  ? 'rgba(100, 116, 139, 0.3)'
                  : 'rgba(255, 255, 255, 0.04)',
              border:
                activeCollectionId === 'archived'
                  ? '1px solid rgba(148, 163, 184, 0.6)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
              color: activeCollectionId === 'archived' ? '#cbd5e1' : 'rgba(226, 232, 240, 0.65)',
              fontSize: '0.78rem',
              fontWeight: activeCollectionId === 'archived' ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Archive size={13} color="#94a3b8" />
            <span>Archived</span>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '0.08rem 0.4rem',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.12)',
                marginLeft: '0.15rem',
              }}
            >
              {stats.archived}
            </span>
          </button>
        )}

        {/* New Collection Button */}
        <button
          onClick={() => {
            setEditingCollection(null);
            setIsCollectionModalOpen(true);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.4rem 0.75rem',
            borderRadius: '999px',
            background: 'transparent',
            border: '1px dashed rgba(168, 85, 247, 0.35)',
            color: '#c084fc',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <Plus size={13} />
          <span>New Collection</span>
        </button>
      </div>
    </div>
  );
}
