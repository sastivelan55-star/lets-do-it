import React, { useState } from 'react';
import {
  Plus,
  Link as LinkIcon,
  FolderPlus,
  ArrowRight,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { isValidUrl } from '../../utils/vaultUtils';

interface VaultHeaderProps {
  onQuickUrlSubmit: (url: string) => void;
}

export default function VaultHeader({ onQuickUrlSubmit }: VaultHeaderProps) {
  const { setIsAddModalOpen, setIsCollectionModalOpen } = useVault();
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
        background: 'linear-gradient(180deg, rgba(22, 16, 48, 0.65) 0%, rgba(12, 9, 26, 0.5) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(168, 85, 247, 0.2)',
        padding: '0.65rem 0.85rem',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        marginBottom: '0.85rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Quick Save URL Input Form */}
      <form
        onSubmit={handlePasteSubmit}
        style={{
          flex: '1 1 280px',
          minWidth: '220px',
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(8, 5, 20, 0.7)',
          borderRadius: '12px',
          border: `1px solid ${urlError ? '#ef4444' : 'rgba(168, 85, 247, 0.25)'}`,
          padding: '0.25rem 0.35rem 0.25rem 0.75rem',
          boxSizing: 'border-box',
        }}
      >
        <LinkIcon
          size={16}
          color={urlError ? '#ef4444' : '#c084fc'}
          style={{ flexShrink: 0, marginRight: '0.5rem' }}
        />
        <input
          type="text"
          placeholder={
            urlError
              ? 'Please enter a valid URL'
              : 'Paste URL to quick save (YouTube, GitHub, article, Figma)...'
          }
          value={pasteUrlInput}
          onChange={(e) => {
            setPasteUrlInput(e.target.value);
            if (urlError) setUrlError(false);
          }}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            color: '#f8fafc',
            fontSize: '0.82rem',
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
            gap: '0.25rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '9px',
            background: pasteUrlInput.trim()
              ? 'linear-gradient(135deg, #a855f7, #6366f1)'
              : 'rgba(255, 255, 255, 0.06)',
            color: pasteUrlInput.trim() ? '#ffffff' : 'rgba(255, 255, 255, 0.35)',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.78rem',
            cursor: pasteUrlInput.trim() ? 'pointer' : 'default',
            flexShrink: 0,
          }}
        >
          <span>Save</span>
          <ArrowRight size={13} />
        </button>
      </form>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setIsCollectionModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.45rem 0.75rem',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            color: '#e2e8f0',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <FolderPlus size={14} color="#c084fc" />
          <span>Collection</span>
        </button>

        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.45rem 0.95rem',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
            border: 'none',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(168, 85, 247, 0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Add Resource</span>
        </button>
      </div>
    </div>
  );
}
