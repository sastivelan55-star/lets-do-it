import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Link as LinkIcon,
  FolderPlus,
  Star,
  FileBox,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { isValidUrl } from '../../utils/vaultUtils';

interface VaultHeaderProps {
  onQuickUrlSubmit: (url: string) => void;
}

export default function VaultHeader({ onQuickUrlSubmit }: VaultHeaderProps) {
  const { stats, setIsAddModalOpen, setIsCollectionModalOpen } = useVault();
  const [pasteUrlInput, setPasteUrlInput] = useState('');
  const [urlError, setUrlError] = useState(false);

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteUrlInput.trim()) return;

    if (!isValidUrl(pasteUrlInput.trim())) {
      setUrlError(true);
      setTimeout(() => setUrlError(false), 2000);
      return;
    }

    onQuickUrlSubmit(pasteUrlInput.trim());
    setPasteUrlInput('');
  };

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(30, 20, 60, 0.45) 0%, rgba(13, 10, 28, 0.3) 100%)',
        borderRadius: '24px',
        border: '1px solid rgba(168, 85, 247, 0.22)',
        padding: 'clamp(1.2rem, 3vw, 2rem)',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.35)',
        marginBottom: '1.75rem',
      }}
    >
      {/* Background Decorative Neon Glows */}
      <div
        style={{
          position: 'absolute',
          top: '-60px',
          right: '-40px',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-60px',
          left: '10%',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Title and Badge */}
        <div style={{ flex: '1 1 320px', minWidth: '280px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              marginBottom: '0.75rem',
            }}
          >
            <Sparkles size={14} color="#c084fc" />
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#e9d5ff',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Personal Resource Library
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.4rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: 0,
              background: 'linear-gradient(135deg, #ffffff 30%, #c084fc 80%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            Digital Vault
          </h1>
          <p
            style={{
              color: 'rgba(203, 213, 225, 0.75)',
              fontSize: '0.92rem',
              marginTop: '0.4rem',
              marginBottom: 0,
              maxWidth: '560px',
              lineHeight: 1.5,
            }}
          >
            Collect, organize, preview, and explore videos, web links, inspirations, code,
            and documents in your cybernetic knowledge sanctuary.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsCollectionModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.15rem',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              color: '#e2e8f0',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.25)';
            }}
          >
            <FolderPlus size={17} color="#a855f7" />
            <span>New Collection</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.35rem',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              border: 'none',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(168, 85, 247, 0.45)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(168, 85, 247, 0.65)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(168, 85, 247, 0.45)';
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Add Resource</span>
          </button>
        </div>
      </div>

      {/* Quick Paste URL Bar & Stats Row */}
      <div
        style={{
          marginTop: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Quick Save URL Input Form */}
        <form
          onSubmit={handlePasteSubmit}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(10, 7, 24, 0.65)',
            borderRadius: '16px',
            border: `1px solid ${urlError ? '#ef4444' : 'rgba(168, 85, 247, 0.28)'}`,
            padding: '0.3rem 0.4rem 0.3rem 1rem',
            boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.4)',
            transition: 'border-color 0.2s ease',
          }}
        >
          <LinkIcon
            size={18}
            color={urlError ? '#ef4444' : '#c084fc'}
            style={{ flexShrink: 0, marginRight: '0.75rem' }}
          />
          <input
            type="text"
            placeholder={
              urlError
                ? 'Please enter a valid URL (e.g. https://...)'
                : 'Paste any link (YouTube, Figma, article, GitHub) to quick save...'
            }
            value={pasteUrlInput}
            onChange={(e) => {
              setPasteUrlInput(e.target.value);
              if (urlError) setUrlError(false);
            }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#f8fafc',
              fontSize: '0.88rem',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            type="submit"
            disabled={!pasteUrlInput.trim()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.5rem 0.95rem',
              borderRadius: '12px',
              background: pasteUrlInput.trim()
                ? 'linear-gradient(135deg, #a855f7, #6366f1)'
                : 'rgba(255, 255, 255, 0.08)',
              color: pasteUrlInput.trim() ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: pasteUrlInput.trim() ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
            }}
          >
            <span>Save</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Live Metrics Chips */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '12px',
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
            }}
          >
            <FileBox size={15} color="#c084fc" />
            <span style={{ fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.8)' }}>
              Total:{' '}
              <strong style={{ color: '#ffffff', fontWeight: 700 }}>{stats.total}</strong>
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '12px',
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
            }}
          >
            <Star size={15} color="#facc15" fill="#facc15" />
            <span style={{ fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.8)' }}>
              Favourites:{' '}
              <strong style={{ color: '#facc15', fontWeight: 700 }}>{stats.favourites}</strong>
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
            }}
          >
            <Layers size={15} color="#38bdf8" />
            <span style={{ fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.8)' }}>
              Collections:{' '}
              <strong style={{ color: '#38bdf8', fontWeight: 700 }}>{stats.collectionsCount}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

