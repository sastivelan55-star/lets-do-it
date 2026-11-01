import {
  Target,
  FolderOpen,
  Map,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface LifeProgressMapProps {
  onNavigateSection?: (section: string) => void;
}

export default function LifeProgressMap({ onNavigateSection }: LifeProgressMapProps) {
  const {
    customLifeAreas,
    projects,
    milestones,
    tasks,
    todaysTasks,
    todayCompletionRate,
  } = useApp();

  // 1. Life Areas
  const activeAreas = customLifeAreas.filter((a) => a.isEnabled !== false);

  // 2. Projects
  const totalProjects = projects.length;
  const inProgressProjects = projects.filter((p) => p.status === 'in-progress').length;
  const completedProjects = projects.filter((p) => p.status === 'completed').length;

  // 3. Roadmap Milestones
  const currentMilestone = milestones.find((m) => m.status === 'in-progress') || milestones[0];
  const completedMilestoneSubtasks = currentMilestone?.subtasks.filter((s) => s.completed).length || 0;
  const totalMilestoneSubtasks = currentMilestone?.subtasks.length || 0;
  const milestonePct = totalMilestoneSubtasks
    ? Math.round((completedMilestoneSubtasks / totalMilestoneSubtasks) * 100)
    : 0;

  // 4. Execution Tasks
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const totalTodayTasks = todaysTasks.length;
  const completedTodayTasks = todaysTasks.filter((t) => t.status === 'completed').length;

  const NODES = [
    {
      id: 'areas',
      title: 'Life Areas',
      stat: `${activeAreas.length} Configured`,
      detail: 'Core Pillars & Weights',
      icon: <Target size={16} color="#818cf8" />,
      accent: '#818cf8',
      bg: 'rgba(129, 140, 248, 0.12)',
      sectionTarget: 'review',
    },
    {
      id: 'projects',
      title: 'Projects',
      stat: `${inProgressProjects} Active`,
      detail: `${completedProjects}/${totalProjects} Delivered`,
      icon: <FolderOpen size={16} color="#f97316" />,
      accent: '#f97316',
      bg: 'rgba(249, 115, 22, 0.12)',
      sectionTarget: 'journey',
    },
    {
      id: 'roadmap',
      title: 'Curriculum',
      stat: `Month ${currentMilestone?.month || 1}`,
      detail: `${milestonePct}% Complete`,
      icon: <Map size={16} color="#60a5fa" />,
      accent: '#60a5fa',
      bg: 'rgba(96, 165, 250, 0.12)',
      sectionTarget: 'journey',
    },
    {
      id: 'tasks',
      title: 'Execution',
      stat: `${completedTodayTasks}/${totalTodayTasks} Today`,
      detail: `${completedTasks}/${totalTasks} Total Done`,
      icon: <CheckCircle2 size={16} color="#10b981" />,
      accent: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      sectionTarget: 'tasks',
    },
    {
      id: 'momentum',
      title: 'Momentum',
      stat: `${todayCompletionRate}% Rate`,
      detail: 'Daily Velocity',
      icon: <Sparkles size={16} color="#ec4899" />,
      accent: '#ec4899',
      bg: 'rgba(236, 72, 153, 0.12)',
      sectionTarget: 'home',
    },
  ];

  return (
    <div
      className="card"
      style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 27, 75, 0.45))',
        border: '1px solid rgba(129, 140, 248, 0.22)',
        padding: '1.25rem',
        borderRadius: '14px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingUp size={16} color="#818cf8" />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
              Your Life Progress Map
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
              Connected live execution: Foundations &rarr; Projects &rarr; Roadmap &rarr; Tasks &rarr; Momentum
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: '0.72rem',
            color: '#818cf8',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          Click any stage to explore <ArrowRight size={12} />
        </span>
      </div>

      {/* Nodes Pipeline */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
          gap: '0.75rem',
          position: 'relative',
        }}
      >
        {NODES.map((node, i) => (
          <div
            key={node.id}
            onClick={() => onNavigateSection?.(node.sectionTarget)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onNavigateSection?.(node.sectionTarget);
              }
            }}
            style={{
              background: 'rgba(11, 16, 32, 0.65)',
              border: `1px solid ${node.accent}33`,
              borderRadius: '10px',
              padding: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.5rem',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = node.accent;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 6px 20px ${node.accent}22`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = `${node.accent}33`;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Step badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: node.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {node.icon}
              </div>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  background: 'rgba(255,255,255,0.04)',
                  padding: '2px 6px',
                  borderRadius: '999px',
                }}
              >
                Step {i + 1}
              </span>
            </div>

            <div>
              <p
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  margin: '0 0 2px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {node.title}
              </p>
              <p
                style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: node.accent,
                  margin: '0 0 2px 0',
                  lineHeight: 1.2,
                }}
              >
                {node.stat}
              </p>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: 0 }}>
                {node.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
