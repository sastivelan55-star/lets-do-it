import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import AuthPage from './components/auth/AuthPage';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import HomePage from './pages/HomePage';
import TaskBuilderPage from './pages/TaskBuilderPage';
import PlannerPage from './pages/PlannerPage';
import ProjectsPage from './pages/ProjectsPage';
import RoadmapPage from './pages/RoadmapPage';
import WeeklyReviewPage from './pages/WeeklyReviewPage';
import MyJourneyPage from './pages/MyJourneyPage';
import PersonalLifePage from './pages/PersonalLifePage';
import KnowledgePage from './pages/KnowledgePage';
import ReviewSettingsPage from './pages/ReviewSettingsPage';
import PulseFlowPage from './pages/PulseFlowPage';
import VaultPage from './pages/VaultPage';
import GroceryPage from './pages/GroceryPage';
import TopBar from './components/layout/TopBar';
import UniversalSearchModal from './components/search/UniversalSearchModal';
import QuickCaptureModal from './components/quickCapture/QuickCaptureModal';
import FloatingAiAssistant from './components/ai/FloatingAiAssistant';

export type NavSection =
  | 'home'
  | 'tasks'
  | 'pulse'
  | 'notes'
  | 'vault'
  | 'groceries'
  | 'calendar'
  | 'projects'
  | 'roadmap'
  | 'reflection'
  | 'settings'
  | 'journey'
  | 'personal'
  | 'knowledge'
  | 'explore'
  | 'review'
  | 'uploads';

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
          Life OS
        </h1>
        <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Personal Command & Growth Center
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
  const [section, setSection] = useState<NavSection>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Global event listeners for search command palette, quick capture, and navigation
  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true);
    const handleOpenCapture = () => setIsQuickCaptureOpen(true);
    const handleNavigate = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (custom.detail) {
        setSection(custom.detail as NavSection);
      }
    };

    window.addEventListener('lifeos:open-search', handleOpenSearch);
    window.addEventListener('lifeos:open-quick-capture', handleOpenCapture);
    window.addEventListener('lifeos:navigate', handleNavigate as EventListener);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K: toggle command palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('lifeos:open-search', handleOpenSearch);
      window.removeEventListener('lifeos:open-quick-capture', handleOpenCapture);
      window.removeEventListener('lifeos:navigate', handleNavigate as EventListener);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const PAGE_MAP: Record<NavSection, React.ReactNode> = {
    home:       <HomePage onNavigateSection={(sec) => setSection(sec as NavSection)} />,
    tasks:      <TaskBuilderPage />,
    pulse:      <PulseFlowPage />,
    notes:      <KnowledgePage initialTab="notes" />,
    calendar:   <PlannerPage />,
    projects:   <ProjectsPage />,
    roadmap:    <RoadmapPage />,
    reflection: <WeeklyReviewPage />,
    settings:   <ReviewSettingsPage initialTab="personalization" />,
    journey:    <MyJourneyPage />,
    personal:   <PersonalLifePage />,
    knowledge:  <KnowledgePage initialTab="knowledge" />,
    explore:    <PulseFlowPage />,
    review:     <ReviewSettingsPage initialTab="personalization" />,
    vault:      <VaultPage initialTab="uploads" />,
    uploads:    <VaultPage initialTab="uploads" />,
    groceries:  <GroceryPage />,
  };

  return (
    <div className="app-layout" style={{ maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box', width: '100%' }}>
      {/* Sidebar — desktop only (exact 7 destinations) */}
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
        style={{ maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box', width: '100%' }}
      >
        <TopBar
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
          onNavigate={setSection}
          activeSection={section}
        />
        {PAGE_MAP[section]}
      </main>

      {/* Mobile bottom nav */}
      {isMobile && (
        <MobileNav active={section} onNavigate={setSection} />
      )}

      {/* Global Universal Search Command Palette */}
      <UniversalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(target) => {
          setSection(target);
          setIsSearchOpen(false);
        }}
      />

      {/* Global Quick Capture Modal */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onSuccessNavigate={(target) => {
          if (target && target in PAGE_MAP) {
            setSection(target as NavSection);
          }
        }}
      />

      {/* Global Floating AI Assistant */}
      <FloatingAiAssistant onNavigate={setSection} />
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
