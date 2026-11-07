import React, { useState } from 'react';
import {
  Sparkles,
  BarChart3,
  FileClock,
  Sliders,
  Palette,
  Bot,
  User,
  Trash2,
  Database,
  Info,
} from 'lucide-react';
import WeeklyReviewPage from './WeeklyReviewPage';
import SettingsPage, { type SettingsTab } from './SettingsPage';
import PersonalizationCenter from '../components/settings/PersonalizationCenter';
import { useApp } from '../context/AppContext';
import { getCharacterById } from '../data/animeCharacters';

export type ReviewTab =
  | 'personalization'
  | 'review'
  | 'reports'
  | 'areas'
  | 'appearance'
  | 'ai'
  | 'account'
  | 'recycle-bin'
  | 'data'
  | 'branding';

interface ReviewSettingsPageProps {
  initialTab?: ReviewTab;
}

export default function ReviewSettingsPage({ initialTab = 'personalization' }: ReviewSettingsPageProps) {
  const [activeTab, setActiveTab] = useState<ReviewTab>(initialTab);
  const { settings } = useApp();
  const activeChar = getCharacterById(settings.personalization?.activeCharacterId || 'nami');

  const TABS: { id: ReviewTab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'personalization', label: 'Personalization & Anime', icon: <Sparkles size={15} />, color: '#ec4899' },
    { id: 'review',          label: 'Weekly Review',           icon: <BarChart3 size={15} />, color: '#8b5cf6' },
    { id: 'reports',         label: 'Reports & History',       icon: <FileClock size={15} />, color: '#38bdf8' },
    { id: 'areas',           label: 'Life Areas',              icon: <Sliders size={15} />,   color: '#818cf8' },
    { id: 'appearance',      label: 'Appearance',              icon: <Palette size={15} />,   color: '#f43f5e' },
    { id: 'ai',              label: 'AI Execution',            icon: <Bot size={15} />,       color: '#a855f7' },
    { id: 'account',         label: 'Profile & Account',       icon: <User size={15} />,      color: '#10b981' },
    { id: 'recycle-bin',     label: 'Recycle Bin',             icon: <Trash2 size={15} />,    color: '#f43f5e' },
    { id: 'data',            label: 'Data Management',         icon: <Database size={15} />,  color: '#f59e0b' },
    { id: 'branding',        label: 'Manual Branding',         icon: <Info size={15} />,      color: '#64748b' },
  ];

  // Map subtabs to SettingsTab
  const getSettingsInitialTab = (tab: ReviewTab): SettingsTab => {
    switch (tab) {
      case 'reports':
        return 'reports';
      case 'areas':
        return 'areas';
      case 'appearance':
        return 'appearance';
      case 'ai':
        return 'ai';
      case 'account':
        return 'account';
      case 'recycle-bin':
        return 'recycle-bin';
      case 'data':
        return 'data';
      case 'branding':
        return 'branding';
      default:
        return 'areas';
    }
  };

  return (
    <div className="composite-page">
      {/* Header with Single Subtab Navigation */}
      <header className="composite-header" style={{ marginBottom: '1.25rem' }}>
        <div className="composite-header-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="composite-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#ec4899' }}>✦</span> Personalization & Settings
            </h1>
            <p className="composite-subtitle">
              Configure your anime companion, atmospheric wallpapers, visual themes, dashboard widgets & system preferences
            </p>
          </div>

          {/* Active Companion Card with Change Button */}
          <div
            style={{
              background: 'rgba(15, 10, 30, 0.75)',
              backdropFilter: 'blur(12px)',
              borderRadius: '14px',
              padding: '0.55rem 1.15rem',
              border: '1px solid rgba(192, 132, 252, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', color: activeChar.accentColor, fontWeight: 700 }}>
                {activeChar.series}
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                {activeChar.name}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setActiveTab('personalization')}
              style={{
                color: '#c084fc',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(192, 132, 252, 0.3)',
                background: 'rgba(192, 132, 252, 0.12)',
                cursor: 'pointer',
              }}
            >
              Change
            </button>
          </div>

          <div className="section-tabs" role="tablist" aria-label="Review and settings sections">
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
        {activeTab === 'personalization' && <PersonalizationCenter />}
        {activeTab === 'review' && <WeeklyReviewPage />}
        {activeTab !== 'personalization' && activeTab !== 'review' && (
          <SettingsPage
            key={activeTab}
            initialTab={getSettingsInitialTab(activeTab)}
            hideHeader={true}
          />
        )}
      </div>
    </div>
  );
}
