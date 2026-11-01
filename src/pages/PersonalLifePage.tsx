import React, { useState } from 'react';
import {
  Heart,
  MessageSquare,
  CalendarCheck,
  Activity,
  Sparkles,
  BookOpen,
  Users,
  ArrowRight,
  Clock,
  Compass,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import CommunicationPage from './CommunicationPage';
import HealthPage from './HealthPage';

export type PersonalTab =
  | 'overview'
  | 'communication'
  | 'attendance'
  | 'health'
  | 'reflection'
  | 'relationships';

interface PersonalLifePageProps {
  initialTab?: PersonalTab;
}

export default function PersonalLifePage({ initialTab = 'overview' }: PersonalLifePageProps) {
  const [activeTab, setActiveTab] = useState<PersonalTab>(initialTab);
  const { communicationSessions } = useApp();

  // Metrics
  const totalSessions = communicationSessions?.length || 0;
  const totalMinutes = communicationSessions?.reduce((acc, s) => acc + (s.durationMinutes || 0), 0) || 0;
  const totalHours = (totalMinutes / 60).toFixed(1);

  const TABS: { id: PersonalTab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'overview', label: 'Overview', icon: <Compass size={15} />, color: '#10b981' },
    { id: 'communication', label: 'Communication Practice', icon: <MessageSquare size={15} />, color: '#06b6d4' },
    { id: 'attendance', label: 'Attendance & Sessions', icon: <CalendarCheck size={15} />, color: '#38bdf8' },
    { id: 'health', label: 'Health & Habits', icon: <Activity size={15} />, color: '#10b981' },
    { id: 'reflection', label: 'Daily Reflection', icon: <BookOpen size={15} />, color: '#8b5cf6' },
    { id: 'relationships', label: 'Relationships', icon: <Users size={15} />, color: '#ec4899' },
  ];

  return (
    <div className="composite-page">
      {/* Header with Subtab Navigation */}
      <header className="composite-header">
        <div className="composite-header-top">
          <div>
            <h1 className="composite-title">
              <span style={{ color: '#10b981' }}>✦</span> Personal Life
            </h1>
            <p className="composite-subtitle">
              Communication fluency, attendance, habits, holistic wellness & daily reflection
            </p>
          </div>

          <div className="section-tabs" role="tablist" aria-label="Personal life sections">
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
        {activeTab === 'overview' && (
          <div className="page-container" style={{ paddingTop: '1.25rem' }}>
            {/* Mission Hero Banner */}
            <div
              className="glass-card"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,182,212,0.08))',
                border: '1px solid rgba(16,185,129,0.22)',
                padding: '1.5rem',
                borderRadius: '16px',
                marginBottom: '1.5rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem' }}>
                  <Heart size={18} color="#10b981" />
                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#10b981', fontWeight: 700 }}>
                    Wellness & Interpersonal Command Center
                  </span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                  Sustaining Energy, Clarity & Connection
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: '0.4rem 0 0', maxWidth: '650px' }}>
                  Cultivate high-impact communication routines, consistent attendance habits, restorative physical health, and thoughtful daily journaling.
                </p>
              </div>

              {/* Quick Stat Pill */}
              <div
                style={{
                  display: 'flex',
                  gap: '1.2rem',
                  background: 'rgba(8,12,28,0.6)',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#06b6d4' }}>
                    {totalSessions}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Sessions
                  </div>
                </div>
                <div style={{ width: '1px', background: 'var(--border)' }} />
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                    {totalHours} hrs
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Practice
                  </div>
                </div>
                <div style={{ width: '1px', background: 'var(--border)' }} />
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ec4899' }}>
                    Active
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Habits
                  </div>
                </div>
              </div>
            </div>

            {/* Pillar Grid Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {/* Communication Practice */}
              <div
                className="glass-card"
                style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onClick={() => setActiveTab('communication')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(6,182,212,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#06b6d4',
                    }}
                  >
                    <MessageSquare size={18} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Open <ArrowRight size={13} />
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>
                  Communication Practice
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
                  Log speech practice, mock interviews, technical discussions, and professional fluency drills.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Clock size={14} color="#06b6d4" />
                  <span>{totalHours} Total Practice Hours</span>
                </div>
              </div>

              {/* Attendance & Sessions */}
              <div
                className="glass-card"
                style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onClick={() => setActiveTab('attendance')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(56,189,248,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#38bdf8',
                    }}
                  >
                    <CalendarCheck size={18} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Open <ArrowRight size={13} />
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>
                  Attendance & Sessions
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
                  Track presence, consistency rates, session punctuality, and notes for every scheduled encounter.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Sparkles size={14} color="#38bdf8" />
                  <span>{totalSessions} Sessions Logged</span>
                </div>
              </div>

              {/* Health & Habits */}
              <div
                className="glass-card"
                style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onClick={() => setActiveTab('health')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(16,185,129,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10b981',
                    }}
                  >
                    <Activity size={18} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Open <ArrowRight size={13} />
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>
                  Health & Habits
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
                  Daily sleep tracking, physical energy notes, movement routines, and habit checklist.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Heart size={14} color="#10b981" />
                  <span>Daily Health Logs & Streaks</span>
                </div>
              </div>

              {/* Daily Reflection */}
              <div
                className="glass-card"
                style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onClick={() => setActiveTab('reflection')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(139,92,246,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#8b5cf6',
                    }}
                  >
                    <BookOpen size={18} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Open <ArrowRight size={13} />
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>
                  Daily Reflection
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
                  Evening prompts, mindfulness check-ins, gratitude journaling, and mental clarity logs.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Sparkles size={14} color="#8b5cf6" />
                  <span>Configurable Reflection Prompts</span>
                </div>
              </div>

              {/* Relationships */}
              <div
                className="glass-card"
                style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onClick={() => setActiveTab('relationships')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(236,72,153,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ec4899',
                    }}
                  >
                    <Users size={18} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#ec4899', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Open <ArrowRight size={13} />
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>
                  Relationships & Boundaries
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
                  Track relationship habits, interpersonal boundaries, check-ins with peers and mentors.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Users size={14} color="#ec4899" />
                  <span>Boundary & Habit Tracking</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preserved Sub-Page Views with Deep-Linked Subtab Views */}
        {activeTab === 'communication' && <CommunicationPage key="comm" initialView="communication" />}
        {activeTab === 'attendance' && <CommunicationPage key="attend" initialView="attendance" />}
        {activeTab === 'health' && <HealthPage key="health" initialFocus="health" />}
        {activeTab === 'reflection' && <HealthPage key="refl" initialFocus="reflection" />}
        {activeTab === 'relationships' && <HealthPage key="relat" initialFocus="relationships" />}
      </div>
    </div>
  );
}
