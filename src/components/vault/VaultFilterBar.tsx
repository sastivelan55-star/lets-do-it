import React from 'react';
import {
  Search,
  X,
  LayoutGrid,
  Grid,
  List,
  SlidersHorizontal,
  Tag,
  Link,
  Video,
  Image,
  Code,
  FileText,
  FileBox,
  Music,
  Share2,
  Palette,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import type { VaultResourceType, VaultSortOption } from '../../types/vault';

const TYPE_FILTER_BUTTONS: { type: VaultResourceType | 'all'; label: string; icon: React.ReactNode }[] = [
  { type: 'all', label: 'All', icon: null },
  { type: 'link', label: 'Links', icon: <Link size={13} /> },
  { type: 'youtube', label: 'YouTube', icon: <Video size={13} /> },
  { type: 'image', label: 'Images', icon: <Image size={13} /> },
  { type: 'code', label: 'Code', icon: <Code size={13} /> },
  { type: 'note', label: 'Notes', icon: <FileText size={13} /> },
  { type: 'document', label: 'Docs', icon: <FileBox size={13} /> },
  { type: 'audio', label: 'Audio', icon: <Music size={13} /> },
  { type: 'social', label: 'Social', icon: <Share2 size={13} /> },
  { type: 'design', label: 'Design', icon: <Palette size={13} /> },
];

export default function VaultFilterBar() {
  const {
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    selectedTag,
    setSelectedTag,
    sortOption,
    setSortOption,
    viewMode,
    setViewMode,
  } = useVault();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        marginBottom: '1rem',
      }}
    >
      <style>{`
        .vault-types-scroll::-webkit-scrollbar {
          display: none;
          height: 0px;
        }
      `}</style>
      {/* Top Controls: Search Input + Sort Dropdown + View Mode */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.65rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Search Bar */}
        <div
          style={{
            flex: '1 1 240px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(15, 11, 32, 0.7)',
            borderRadius: '12px',
            border: '1px solid rgba(168, 85, 247, 0.22)',
            padding: '0.38rem 0.75rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          <Search size={15} color="#c084fc" style={{ marginRight: '0.45rem', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by title, domain, tags, notes, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: '0.82rem',
              fontFamily: 'inherit',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Right side controls: Tag Badge + Sort Dropdown + View Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Active Tag filter indicator */}
          {selectedTag && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                fontSize: '0.78rem',
                fontWeight: 600,
              }}
            >
              <Tag size={12} />
              <span>#{selectedTag}</span>
              <button
                onClick={() => setSelectedTag(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                }}
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Sort Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(15, 11, 32, 0.7)',
              borderRadius: '12px',
              border: '1px solid rgba(168, 85, 247, 0.22)',
              padding: '0.35rem 0.65rem',
            }}
          >
            <SlidersHorizontal size={14} color="#94a3b8" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as VaultSortOption)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#e2e8f0',
                fontSize: '0.82rem',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <option value="newest" style={{ background: '#130d2a' }}>
                Newest First
              </option>
              <option value="oldest" style={{ background: '#130d2a' }}>
                Oldest First
              </option>
              <option value="title" style={{ background: '#130d2a' }}>
                Title (A-Z)
              </option>
              <option value="views" style={{ background: '#130d2a' }}>
                Most Viewed
              </option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(15, 11, 32, 0.7)',
              borderRadius: '12px',
              border: '1px solid rgba(168, 85, 247, 0.22)',
              padding: '0.2rem',
            }}
          >
            <button
              title="Masonry View"
              onClick={() => setViewMode('masonry')}
              style={{
                background: viewMode === 'masonry' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                border: 'none',
                color: viewMode === 'masonry' ? '#c084fc' : 'rgba(255,255,255,0.45)',
                padding: '0.35rem 0.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              title="Uniform Grid"
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                border: 'none',
                color: viewMode === 'grid' ? '#c084fc' : 'rgba(255,255,255,0.45)',
                padding: '0.35rem 0.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Grid size={15} />
            </button>
            <button
              title="Compact List"
              onClick={() => setViewMode('compact')}
              style={{
                background: viewMode === 'compact' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                border: 'none',
                color: viewMode === 'compact' ? '#c084fc' : 'rgba(255,255,255,0.45)',
                padding: '0.35rem 0.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Resource Type Filter Chips */}
      <div
        className="vault-types-scroll"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          overflowX: 'auto',
          paddingBottom: '0.2rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {TYPE_FILTER_BUTTONS.map((btn) => {
          const isSelected = selectedType === btn.type;
          return (
            <button
              key={btn.type}
              onClick={() => setSelectedType(btn.type)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '10px',
                background: isSelected ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                border: isSelected
                  ? '1px solid rgba(168, 85, 247, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.06)',
                color: isSelected ? '#ffffff' : 'rgba(203, 213, 225, 0.7)',
                fontSize: '0.78rem',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {btn.icon}
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
