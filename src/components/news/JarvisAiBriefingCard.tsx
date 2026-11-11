import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Bot, Clock, CheckCircle } from 'lucide-react';
import type { AiBriefingResponse } from '../../services/newsService';

interface JarvisAiBriefingCardProps {
  briefing: AiBriefingResponse | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function JarvisAiBriefingCard({
  briefing,
  isLoading,
  onRefresh,
}: JarvisAiBriefingCardProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // If no briefing available and not loading, hide card per requirement
  if (!briefing?.available && !isLoading) {
    return null;
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.25) 0%, rgba(30, 27, 75, 0.4) 50%, rgba(15, 23, 42, 0.8) 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(168, 85, 247, 0.35)',
        padding: '1.25rem',
        boxShadow: '0 8px 32px rgba(147, 51, 234, 0.15)',
        marginBottom: '1.5rem',
        backdropFilter: 'blur(16px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          background: 'rgba(168, 85, 247, 0.15)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 16px rgba(168, 85, 247, 0.5)',
            }}
          >
            <Bot size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                Jarvis Executive Intelligence Briefing
              </h3>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#c084fc',
                  background: 'rgba(168, 85, 247, 0.18)',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={11} /> AI SYNTHESIS
              </span>
            </div>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.76rem', color: '#cbd5e1' }}>
              Distilled multi-source briefing across Chennai, National & Global intelligence
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.76rem',
              padding: '0.35rem 0.75rem',
            }}
          >
            <Sparkles size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Synthesizing…' : 'Regenerate'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.35rem 0.55rem' }}
            title={isExpanded ? 'Collapse Briefing' : 'Expand Briefing'}
          >
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(168, 85, 247, 0.2)', paddingTop: '1rem' }}>
          {isLoading ? (
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '0.5rem', color: '#c084fc' }}>
                ⚡
              </div>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>
                Jarvis is analyzing live feeds and synthesizing the daily intelligence briefing...
              </p>
            </div>
          ) : briefing?.bullet_points && briefing.bullet_points.length > 0 ? (
            <div>
              {/* 5-Bullet Executive Overview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
                {briefing.bullet_points.map((bullet, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        background: 'rgba(168, 85, 247, 0.25)',
                        color: '#d8b4fe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {idx + 1}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: '#f1f5f9', lineHeight: 1.45 }}>
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>

              {/* Top Stories 2-Line Summaries (if present) */}
              {briefing.top_story_summaries && briefing.top_story_summaries.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <h4 style={{ margin: '0 0 0.65rem', fontSize: '0.82rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Key Focus Story Summaries
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                    {briefing.top_story_summaries.map((story, sIdx) => (
                      <div
                        key={sIdx}
                        style={{
                          background: 'rgba(15, 23, 42, 0.6)',
                          borderRadius: '12px',
                          border: '1px solid rgba(168, 85, 247, 0.2)',
                          padding: '0.75rem 0.85rem',
                        }}
                      >
                        <h5 style={{ margin: '0 0 0.35rem', fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
                          {story.title}
                        </h5>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                          {story.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cache Telemetry Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '1rem',
                  fontSize: '0.7rem',
                  color: '#64748b',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />
                  {briefing.cached
                    ? `Cached ~${briefing.cache_age_minutes}m ago (Auto-refreshes every 30m)`
                    : 'Just generated via Claude AI'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#a855f7' }}>
                  <CheckCircle size={12} />
                  Model: {briefing.model || 'Claude'}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
