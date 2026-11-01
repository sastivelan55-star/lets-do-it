import React, { useState } from 'react';
import {
  FileText,
  BookOpen,
  UploadCloud,
} from 'lucide-react';
import NotesPage from './NotesPage';
import UploadsPage from './UploadsPage';

export type KnowledgeTab = 'notes' | 'knowledge' | 'uploads';

interface KnowledgePageProps {
  initialTab?: KnowledgeTab;
}

export default function KnowledgePage({ initialTab = 'notes' }: KnowledgePageProps) {
  const [activeTab, setActiveTab] = useState<KnowledgeTab>(initialTab);

  const TABS: { id: KnowledgeTab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'notes', label: 'Notes', icon: <FileText size={15} />, color: '#c084fc' },
    { id: 'knowledge', label: 'Knowledge Base', icon: <BookOpen size={15} />, color: '#a855f7' },
    { id: 'uploads', label: 'Files & Uploads', icon: <UploadCloud size={15} />, color: '#38bdf8' },
  ];

  return (
    <div className="composite-page">
      {/* Header with Subtab Navigation */}
      <header className="composite-header">
        <div className="composite-header-top">
          <div>
            <h1 className="composite-title">
              <span style={{ color: '#c084fc' }}>✦</span> Notes & Knowledge
            </h1>
            <p className="composite-subtitle">
              Personal knowledge management, technical insights, media vault & documents
            </p>
          </div>

          <div className="section-tabs" role="tablist" aria-label="Knowledge sections">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`section-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span style={{ color: activeTab === tab.id ? tab.color : 'inherit', display: 'flex' }}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="composite-content">
        {activeTab === 'notes' && <NotesPage key="notes" mode="notes" />}
        {activeTab === 'knowledge' && <NotesPage key="knowledge" mode="knowledge" />}
        {activeTab === 'uploads' && <UploadsPage />}
      </div>
    </div>
  );
}
