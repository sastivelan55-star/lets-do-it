import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
} from 'lucide-react';
import AnimeFantasyDashboard from '../components/dashboard/AnimeFantasyDashboard';
import SchedulesPage from './SchedulesPage';

export type HomeTab = 'dashboard' | 'timeline';

interface HomePageProps {
  initialTab?: HomeTab;
  onNavigateSection?: (section: string) => void;
}

export default function HomePage({ initialTab = 'dashboard', onNavigateSection }: HomePageProps) {
  const [activeTab, setActiveTab] = useState<HomeTab>(initialTab === 'timeline' ? 'timeline' : 'dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const TABS: { id: HomeTab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'dashboard', label: 'Fantasy Dashboard', icon: <Sparkles size={15} />, color: '#ec4899' },
    { id: 'timeline',  label: 'Timeline & Blocks', icon: <Clock size={15} />,    color: '#10b981' },
  ];

  return (
    <div className="composite-page">
      {/* Subtab Navigation Bar with Live Time & Date */}
      <header className="composite-header" style={{ marginBottom: '1.25rem' }}>
        <div className="composite-header-top">
          {/* Time & Date Display */}
          <div>
            <h1
              className="composite-title"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.65rem',
                color: '#f8fafc',
                letterSpacing: '0.02em',
                textShadow: '0 0 16px rgba(192, 132, 252, 0.4)',
                margin: 0,
              }}
            >
              <Clock size={22} color="#ec4899" style={{ filter: 'drop-shadow(0 0 8px rgba(236, 72, 153, 0.6))' }} />
              <span>{formattedTime}</span>
            </h1>

            <p
              className="composite-subtitle"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#c084fc',
                fontWeight: 600,
                fontSize: '0.86rem',
                marginTop: '4px',
                letterSpacing: '0.02em',
              }}
            >
              <Calendar size={14} color="#38bdf8" />
              <span>{formattedDate}</span>
            </p>
          </div>

          {/* Subtab Section Buttons */}
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
        {activeTab === 'dashboard' && (
          <AnimeFantasyDashboard
            onNavigateSection={onNavigateSection}
            onOpenTaskBuilder={() => onNavigateSection && onNavigateSection('tasks')}
          />
        )}
        {activeTab === 'timeline' && <SchedulesPage />}
      </div>
    </div>
  );
}
