import { useState } from 'react';
import PremiumHomeDashboard from '../components/dashboard/PremiumHomeDashboard';
import DailyTimetable from '../components/timetable/DailyTimetable';

export type HomeTab = 'dashboard' | 'timeline';

interface HomePageProps {
  initialTab?: HomeTab;
  onNavigateSection?: (section: string) => void;
  onOpenQuickCapture?: () => void;
  onOpenSearch?: () => void;
}

export default function HomePage({
  initialTab = 'dashboard',
  onNavigateSection,
  onOpenQuickCapture,
  onOpenSearch,
}: HomePageProps) {
  const [activeTab, setActiveTab] = useState<HomeTab>(initialTab === 'timeline' ? 'timeline' : 'dashboard');

  if (activeTab === 'timeline') {
    return (
      <div style={{ maxWidth: '1680px', margin: '0 auto', padding: '1rem 1.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '10px',
            padding: '6px 14px',
            color: '#c084fc',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ← Back to Dashboard
        </button>
        <DailyTimetable onNavigateSection={onNavigateSection} />
      </div>
    );
  }

  return (
    <PremiumHomeDashboard
      onNavigateSection={onNavigateSection}
      onOpenQuickCapture={onOpenQuickCapture}
      onOpenSearch={onOpenSearch}
      onOpenTimetable={() => setActiveTab('timeline')}
      onOpenTaskBuilder={() => onNavigateSection && onNavigateSection('tasks')}
    />
  );
}
