import React, { useState } from 'react';
import {
  UploadCloud,
  FileBox,
} from 'lucide-react';
import { VaultProvider, useVault } from '../context/VaultContext';
import { useApp } from '../context/AppContext';
import UploadsPage from './UploadsPage';
import VaultHeader from '../components/vault/VaultHeader';
import VaultCollectionsBar from '../components/vault/VaultCollectionsBar';
import VaultFilterBar from '../components/vault/VaultFilterBar';
import VaultResourceCard from '../components/vault/VaultResourceCard';
import VaultAddModal from '../components/vault/VaultAddModal';
import VaultDetailModal from '../components/vault/VaultDetailModal';
import VaultCollectionModal from '../components/vault/VaultCollectionModal';
import VaultEmptyState from '../components/vault/VaultEmptyState';

export type VaultTab = 'uploads' | 'resources';

interface VaultPageProps {
  initialTab?: VaultTab;
}

function VaultResourcesContent() {
  const {
    filteredResources,
    resources,
    isLoading,
    viewMode,
    isAddModalOpen,
    setIsAddModalOpen,
    searchQuery,
    selectedType,
    selectedTag,
    activeCollectionId,
  } = useVault();

  const [quickInitialUrl, setQuickInitialUrl] = useState<string | undefined>(undefined);

  const handleQuickUrlSubmit = (url: string) => {
    setQuickInitialUrl(url);
    setIsAddModalOpen(true);
  };

  const hasAnyFilterActive =
    Boolean(searchQuery) ||
    selectedType !== 'all' ||
    Boolean(selectedTag) ||
    Boolean(activeCollectionId);

  return (
    <>
      {/* Header with Welcome, Quick Save Bar, & Stats */}
      <VaultHeader onQuickUrlSubmit={handleQuickUrlSubmit} />

      {/* Collections Carousel / Bar */}
      <VaultCollectionsBar />

      {/* Filter and Search Bar */}
      <VaultFilterBar />

      {/* Resources Display Area */}
      {isLoading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
            marginTop: '1rem',
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                height: '240px',
                borderRadius: '18px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                animation: 'pulse 1.8s ease infinite',
              }}
            />
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <VaultEmptyState isFiltered={hasAnyFilterActive || resources.length > 0} />
      ) : viewMode === 'compact' ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredResources.map((res) => (
            <VaultResourceCard key={res.id} resource={res} viewMode="compact" />
          ))}
        </div>
      ) : viewMode === 'masonry' ? (
        <div
          style={{
            columns: '3 290px',
            columnGap: '1.25rem',
          }}
        >
          {filteredResources.map((res) => (
            <div
              key={res.id}
              style={{
                breakInside: 'avoid',
                marginBottom: '1.25rem',
              }}
            >
              <VaultResourceCard resource={res} viewMode="masonry" />
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {filteredResources.map((res) => (
            <VaultResourceCard key={res.id} resource={res} viewMode="grid" />
          ))}
        </div>
      )}

      {/* Add / Edit Resource Modal */}
      <VaultAddModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setQuickInitialUrl(undefined);
        }}
        initialUrl={quickInitialUrl}
      />

      {/* Full Resource Detail Modal */}
      <VaultDetailModal />

      {/* Collection Create / Edit Modal */}
      <VaultCollectionModal />
    </>
  );
}

export default function VaultPage({ initialTab = 'uploads' }: VaultPageProps) {
  const [activeTab, setActiveTab] = useState<VaultTab>(initialTab);
  const { uploads } = useApp();

  const TABS: { id: VaultTab; label: string; icon: React.ReactNode; color: string; count?: number }[] = [
    {
      id: 'uploads',
      label: 'Media Vault & Uploads',
      icon: <UploadCloud size={15} />,
      color: '#38bdf8',
      count: uploads.length,
    },
    {
      id: 'resources',
      label: 'Digital Resource Library',
      icon: <FileBox size={15} />,
      color: '#c084fc',
    },
  ];

  return (
    <div
      className="composite-page"
      style={{
        padding: 'clamp(1rem, 2.5vw, 2rem)',
        maxWidth: '1440px',
        margin: '0 auto',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header with Tab Switcher */}
      <header
        className="composite-header"
        style={{
          marginBottom: '1.5rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid rgba(168, 85, 247, 0.15)',
        }}
      >
        <div
          className="composite-header-top"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h1 className="composite-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
              <span style={{ color: '#38bdf8' }}>✦</span> Personal Digital Vault
            </h1>
            <p className="composite-subtitle" style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Encrypted cloud files, media storage, bookmarks, and digital resource library
            </p>
          </div>

          {/* Subtab Switcher */}
          <div className="section-tabs" role="tablist" aria-label="Vault sections" style={{ display: 'flex', gap: '0.5rem' }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`section-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '12px',
                  background: activeTab === tab.id ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                  border: activeTab === tab.id ? `1px solid ${tab.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  color: activeTab === tab.id ? '#ffffff' : 'rgba(226, 232, 240, 0.75)',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === tab.id ? `0 0 16px ${tab.color}35` : 'none',
                }}
              >
                <span style={{ color: activeTab === tab.id ? tab.color : 'inherit', display: 'flex' }}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '999px',
                      background: 'rgba(255, 255, 255, 0.12)',
                      marginLeft: '0.2rem',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content Area */}
      {activeTab === 'uploads' ? (
        <UploadsPage />
      ) : (
        <VaultProvider>
          <VaultResourcesContent />
        </VaultProvider>
      )}
    </div>
  );
}
