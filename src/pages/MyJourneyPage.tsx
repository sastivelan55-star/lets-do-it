import React, { useState } from 'react';
import {
  Map,
  Code2,
  FolderOpen,
  Briefcase,
  Palette,
  Compass,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Target,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import RoadmapPage from './RoadmapPage';
import TechnicalPage from './TechnicalPage';
import ProjectsPage from './ProjectsPage';
import CareerPage from './CareerPage';
import CreativityPage from './CreativityPage';

export type JourneyTab =
  | 'overview'
  | 'roadmap'
  | 'technical'
  | 'projects'
  | 'career'
  | 'creativity';

interface MyJourneyPageProps {
  initialTab?: JourneyTab;
}

export default function MyJourneyPage({ initialTab = 'overview' }: MyJourneyPageProps) {
  const [activeTab, setActiveTab] = useState<JourneyTab>(initialTab);
  const { milestones, projects, tasks } = useApp();

  // Metrics for overview
  const totalMilestones = milestones?.length || 0;
  const completedMilestones = milestones?.filter((m) => m.status === 'completed')?.length || 0;
  const activeProjects = projects?.filter((p) => p.status === 'in-progress')?.length || 0;
  const totalProjects = projects?.length || 0;
  const techTasks = tasks?.filter((t) => t.lifeArea === 'technical') || [];
  const completedTechTasks = techTasks.filter((t) => t.status === 'completed').length;

  const TABS: { id: JourneyTab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'overview', label: 'Overview', icon: <Compass size={15} />, color: '#818cf8' },
    { id: 'roadmap', label: 'Roadmap', icon: <Map size={15} />, color: '#60a5fa' },
    { id: 'technical', label: 'Technical Mastery', icon: <Code2 size={15} />, color: '#6366f1' },
    { id: 'projects', label: 'Projects & Portfolio', icon: <FolderOpen size={15} />, color: '#f97316' },
    { id: 'career', label: 'Career Development', icon: <Briefcase size={15} />, color: '#f59e0b' },
    { id: 'creativity', label: 'Creative Development', icon: <Palette size={15} />, color: '#ec4899' },
  ];

  return (
    <div className="composite-page">
      {/* Header with Subtab Navigation */}
      <header className="composite-header">
        <div className="composite-header-top">
          <div>
            <h1 className="composite-title">
              <span style={{ color: '#818cf8' }}>✦</span> My Journey
            </h1>
            <p className="composite-subtitle">
              Long-term vision, engineering roadmaps, technical mastery & career progression
            </p>
          </div>

          <div className="section-tabs" role="tablist" aria-label="Journey sections">
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
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))',
                border: '1px solid rgba(129,140,248,0.25)',
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
                  <Sparkles size={18} color="#818cf8" />
                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#818cf8', fontWeight: 700 }}>
                    Career & Growth Command Center
                  </span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                  Building Enduring Engineering & Creative Capital
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: '0.4rem 0 0', maxWidth: '650px' }}>
                  Track your full arc from monthly learning milestones to live client projects, technical drill routines, and internship pipelines.
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
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#60a5fa' }}>
                    {completedMilestones}/{totalMilestones}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Milestones
                  </div>
                </div>
                <div style={{ width: '1px', background: 'var(--border)' }} />
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f97316' }}>
                    {activeProjects}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    In Flight
                  </div>
                </div>
                <div style={{ width: '1px', background: 'var(--border)' }} />
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                    {completedTechTasks}/{techTasks.length}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Tech Tasks
                  </div>
                </div>
              </div>
            </div>

            {/* Pillar Grid Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {/* Roadmap Pillar */}
              <div
                className="glass-card"
                style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onClick={() => setActiveTab('roadmap')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(96,165,250,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#60a5fa',
                    }}
                  >
                    <Map size={18} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Open <ArrowRight size={13} />
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>
                  Learning Roadmap
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
                  Structured monthly learning progression, skill milestones, and study sessions.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Target size={14} color="#60a5fa" />
                  <span>{totalMilestones} Months Scheduled</span>
                </div>
              </div>

              {/* Technical Mastery Pillar */}
              <div
                className="glass-card"
                style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onClick={() => setActiveTab('technical')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(99,102,241,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6366f1',
                    }}
                  >
                    <Code2 size={18} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Open <ArrowRight size={13} />
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>
                  Technical Mastery
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
                  Daily coding drills, algorithms, system design habits, and technical tasks.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={14} color="#6366f1" />
                  <span>{techTasks.length} Engineering Tasks</span>
                </div>
              </div>

              {/* Projects Pillar */}
              <div
                className="glass-card"
                style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onClick={() => setActiveTab('projects')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(249,115,22,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#f97316',
                    }}
                  >
                    <FolderOpen size={18} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#f97316', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Open <ArrowRight size={13} />
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>
                  Projects & Portfolio
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
                  Production systems, portfolio work, tech stacks, repositories, and deliverables.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Layers size={14} color="#f97316" />
                  <span>{totalProjects} Tracked Projects</span>
                </div>
              </div>

              {/* Career Pillar */}
              <div
                className="glass-card"
                style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onClick={() => setActiveTab('career')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(245,158,11,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#f59e0b',
                    }}
                  >
                    <Briefcase size={18} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Open <ArrowRight size={13} />
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>
                  Career Readiness
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
                  Resume refinement, interview prep, job hunt routines, and internship application pipeline.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Sparkles size={14} color="#f59e0b" />
                  <span>Pipeline & Routine Checklist</span>
                </div>
              </div>

              {/* Creative Pillar */}
              <div
                className="glass-card"
                style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onClick={() => setActiveTab('creativity')}
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
                    <Palette size={18} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#ec4899', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Open <ArrowRight size={13} />
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>
                  Creative Development
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
                  Content writing, video ideas, technical publishing, brand identity, and content pipelines.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Sparkles size={14} color="#ec4899" />
                  <span>5 Creative Pillars Tracked</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preserved Sub-Page Views */}
        {activeTab === 'roadmap' && <RoadmapPage />}
        {activeTab === 'technical' && <TechnicalPage />}
        {activeTab === 'projects' && <ProjectsPage />}
        {activeTab === 'career' && <CareerPage />}
        {activeTab === 'creativity' && <CreativityPage />}
      </div>
    </div>
  );
}
