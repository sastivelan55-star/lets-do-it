import {
  FileBox,
  Plus,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

interface VaultEmptyStateProps {
  isFiltered?: boolean;
}

export default function VaultEmptyState({ isFiltered }: VaultEmptyStateProps) {
  const {
    setIsAddModalOpen,
    setSearchQuery,
    setSelectedType,
    setSelectedTag,
    setActiveCollectionId,
  } = useVault();

  if (isFiltered) {
    return (
      <div
        style={{
          padding: '4rem 1.5rem',
          textAlign: 'center',
          borderRadius: '24px',
          background: 'rgba(15, 11, 32, 0.4)',
          border: '1px dashed rgba(168, 85, 247, 0.25)',
          margin: '2rem 0',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(168, 85, 247, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
          }}
        >
          <FileBox size={28} color="#c084fc" />
        </div>
        <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
          No Matching Resources
        </h3>
        <p style={{ margin: '0 0 1.25rem 0', color: '#94a3b8', fontSize: '0.86rem' }}>
          Try clearing your search filters, tag selections, or active collection filter.
        </p>
        <button
          onClick={() => {
            setSearchQuery('');
            setSelectedType('all');
            setSelectedTag(null);
            setActiveCollectionId(null);
          }}
          style={{
            padding: '0.55rem 1.2rem',
            borderRadius: '12px',
            background: 'rgba(168, 85, 247, 0.2)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            color: '#c084fc',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Reset All Filters
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '4rem 1.5rem',
        textAlign: 'center',
        borderRadius: '24px',
        background: 'linear-gradient(180deg, rgba(20, 14, 44, 0.45) 0%, rgba(10, 7, 24, 0.35) 100%)',
        border: '1px dashed rgba(168, 85, 247, 0.3)',
        margin: '2rem 0',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(99, 102, 241, 0.2))',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem auto',
          boxShadow: '0 0 30px rgba(168, 85, 247, 0.25)',
        }}
      >
        <FileBox size={32} color="#c084fc" />
      </div>

      <h3
        style={{
          margin: '0 0 0.5rem 0',
          fontSize: '1.35rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #ffffff 40%, #c084fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontFamily: 'Outfit, sans-serif',
        }}
      >
        Your Vault is Empty
      </h3>

      <p
        style={{
          margin: '0 auto 1.75rem auto',
          maxWidth: '480px',
          color: 'rgba(203, 213, 225, 0.75)',
          fontSize: '0.9rem',
          lineHeight: 1.5,
        }}
      >
        Start collecting URLs, YouTube videos, inspirations, documents, and code snippets.
        Everything is indexed with rich previews and offline backup.
      </p>

      {/* Action Shortcuts */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.65rem 1.25rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
            border: 'none',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(168, 85, 247, 0.4)',
          }}
        >
          <Plus size={16} />
          <span>Add Resource</span>
        </button>
      </div>
    </div>
  );
}
