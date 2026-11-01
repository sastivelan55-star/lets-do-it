import React, { useState } from 'react';
import {
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

export type ReviewTab =
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

export default function ReviewSettingsPage({ initialTab = 'review' }: ReviewSettingsPageProps) {
  const [activeTab, setActiveTab] = useState<ReviewTab>(initialTab);

  const TABS: { id: ReviewTab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'review', label: 'Weekly Review', icon: <BarChart3 size={15} />, color: '#8b5cf6' },
    { id: 'reports', label: 'Reports & History', icon: <FileClock size={15} />, color: '#38bdf8' },
    { id: 'areas', label: 'Life Areas', icon: <Sliders size={15} />, color: '#818cf8' },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={15} />, color: '#ec4899' },
    { id: 'ai', label: 'AI Execution', icon: <Bot size={15} />, color: '#a855f7' },
    { id: 'account', label: 'Profile & Account', icon: <User size={15} />, color: '#10b981' },
    { id: 'recycle-bin', label: 'Recycle Bin', icon: <Trash2 size={15} />, color: '#f43f5e' },
    { id: 'data', label: 'Data Management', icon: <Database size={15} />, color: '#f59e0b' },
    { id: 'branding', label: 'Manual Branding', icon: <Info size={15} />, color: '#64748b' },
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
      <header className="composite-header">
        <div className="composite-header-top">
          <div>
            <h1 className="composite-title">
              <span style={{ color: '#8b5cf6' }}>✦</span> Review & Settings
            </h1>
            <p className="composite-subtitle">
              Weekly retrospectives, progress analytics, life area configuration & system preferences
            </p>
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
        {activeTab === 'review' && <WeeklyReviewPage />}
        {activeTab !== 'review' && (
          <SettingsPage
            key={activeTab}
            initialTab={getSettingsInitialTab(activeTab)}
            hideHeader={true}
            hideTabs={true}
          />
        )}
      </div>
    </div>
  );
}
