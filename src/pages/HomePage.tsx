import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Clock,
} from 'lucide-react';
import TodayPage from './TodayPage';
import PlannerPage from './PlannerPage';
import SchedulesPage from './SchedulesPage';

export type HomeTab = 'today' | 'calendar' | 'timeline';

interface HomePageProps {
  initialTab?: HomeTab;
  onNavigateSection?: (section: string) => void;
}

export default function HomePage({ initialTab = 'today', onNavigateSection }: HomePageProps) {
  const [activeTab, setActiveTab] = useState<HomeTab>(initialTab);

  const TABS: { id: HomeTab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'today', label: 'Today', icon: <LayoutDashboard size={15} />, color: '#818cf8' },
    { id: 'calendar', label: 'Calendar Planner', icon: <Calendar size={15} />, color: '#38bdf8' },
    { id: 'timeline', label: 'Timeline & Schedules', icon: <Clock size={15} />, color: '#10b981' },
  ];

  return (
    <div className="composite-page">
      {/* Subtab Navigation Bar */}
      <header className="composite-header">
        <div className="composite-header-top">
          <div>
            <h1 className="composite-title">
              <span style={{ color: '#818cf8' }}>✦</span> Command Center
            </h1>
            <p className="composite-subtitle">
              Daily execution, multi-day calendar planning, and time-block scheduling
            </p>
          </div>

          <div className="section-tabs" role="tablist" aria-label="Home sub-sections">
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
        {activeTab === 'today' && (
          <TodayPage
            onNavigateSection={onNavigateSection}
            onNavigateSubTab={(target) => {
              if (target === 'calendar' || target === 'timeline') {
                setActiveTab(target);
              }
            }}
          />
        )}
        {activeTab === 'calendar' && <PlannerPage />}
        {activeTab === 'timeline' && <SchedulesPage />}
      </div>
    </div>
  );
}
