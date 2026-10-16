import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import AuthPage from './components/auth/AuthPage';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import TodayPage from './pages/TodayPage';
import RoadmapPage from './pages/RoadmapPage';
import PlannerPage from './pages/PlannerPage';
import TechnicalPage from './pages/TechnicalPage';
import CommunicationPage from './pages/CommunicationPage';
import CareerPage from './pages/CareerPage';
import CreativityPage from './pages/CreativityPage';
import HealthPage from './pages/HealthPage';
import ProjectsPage from './pages/ProjectsPage';
import WeeklyReviewPage from './pages/WeeklyReviewPage';
import SettingsPage from './pages/SettingsPage';
import SchedulesPage from './pages/SchedulesPage';
import NotesPage from './pages/NotesPage';
import UploadsPage from './pages/UploadsPage';

export type NavSection =
  | 'today'
  | 'roadmap'
  | 'planner'
  | 'schedules'
  | 'notes'
  | 'uploads'
  | 'technical'
  | 'communication'
  | 'career'
  | 'creativity'
  | 'health'
  | 'projects'
  | 'review'
  | 'settings';


function LoadingScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0b0f1e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          boxShadow: '0 8px 32px rgba(99,102,241,0.5)',
          animation: 'float 2s ease infinite',
        }}
      >
        ⚡
      </div>
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 800,
            fontSize: '2rem',
            background: 'linear-gradient(135deg, #818cf8, #a78bfa, #60a5fa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          LifeMap
        </h1>
        <p style={{ color: 'rgba(148,163,184,0.6)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Loading your personal progress OS…
        </p>
      </div>
      <div
        style={{
          width: 200,
          height: 3,
          background: 'rgba(99,102,241,0.15)',
          borderRadius: '999px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            borderRadius: '999px',
            animation: 'loading-bar 1.5s ease infinite',
          }}
        />
      </div>
      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}

function AppContent() {
  const [section, setSection] = useState<NavSection>('today');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const PAGE_MAP: Record<NavSection, React.ReactNode> = {
    today:         <TodayPage />,
    roadmap:       <RoadmapPage />,
    planner:       <PlannerPage />,
    schedules:     <SchedulesPage />,
    notes:         <NotesPage />,
    uploads:       <UploadsPage />,
    technical:     <TechnicalPage />,
    communication: <CommunicationPage />,
    career:        <CareerPage />,
    creativity:    <CreativityPage />,
    health:        <HealthPage />,
    projects:      <ProjectsPage />,
    review:        <WeeklyReviewPage />,
    settings:      <SettingsPage />,
  };


  return (
    <div className="app-layout">
      {/* Sidebar — desktop only */}
      {!isMobile && (
        <Sidebar
          active={section}
          onNavigate={setSection}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
        />
      )}

      {/* Main content */}
      <main
        className="main-content"
        id="main-content"
        role="main"
      >
        {PAGE_MAP[section]}
      </main>

      {/* Mobile bottom nav */}
      {isMobile && (
        <MobileNav active={section} onNavigate={setSection} />
      )}
    </div>
  );
}

// Error Boundary
class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 'clamp(1rem, 4vw, 2rem)', maxWidth: '38rem', width: '100%', margin: '4rem auto', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
          <h1 style={{ marginBottom: '0.5rem', color: '#ef4444' }}>Something went wrong</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {this.state.error.message}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainRouter() {
  const { user, isGuest, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Not authenticated and not continuing as guest
  if (!user && !isGuest) {
    return <AuthPage />;
  }

  return <AppContent />;
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <MainRouter />
        </AppProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}
