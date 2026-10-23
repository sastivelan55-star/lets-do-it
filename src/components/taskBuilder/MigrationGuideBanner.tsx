import { useState } from 'react';
import { Database, Check, Copy, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { TASK_HIERARCHY_SETUP_SQL, copyHierarchySqlToClipboard } from '../../services/taskHierarchySetupSql';

interface MigrationGuideBannerProps {
  onDismiss?: () => void;
}

export default function MigrationGuideBanner({ onDismiss }: MigrationGuideBannerProps) {
  const [copied, setCopied] = useState(false);
  const [showSql, setShowSql] = useState(false);

  const handleCopy = async () => {
    const ok = await copyHierarchySqlToClipboard();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.05))',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1.25rem',
      }}
      role="region"
      aria-label="Supabase hierarchy migration information"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.75rem', minWidth: '240px', flex: 1 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              flexShrink: 0,
            }}
          >
            <Database size={18} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#e2e8f0' }}>
              Database Setup: Task Hierarchy Migration
            </h4>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              To persist unlimited recursive subtasks and custom sibling ordering in Supabase PostgreSQL, execute the additive migration in your Supabase SQL Editor. Local/offline demo mode works automatically.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleCopy}
            className="btn btn-sm btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            {copied ? <Check size={14} color="white" /> : <Copy size={14} />}
            {copied ? 'SQL Copied!' : 'Copy SQL Script'}
          </button>

          <button
            onClick={() => setShowSql((v) => !v)}
            className="btn btn-sm btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            {showSql ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showSql ? 'Hide SQL' : 'View SQL'}
          </button>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="btn btn-sm btn-ghost"
              style={{ color: 'var(--text-muted)' }}
              title="Dismiss banner"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {showSql && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(99, 102, 241, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              supabase/migrations/20261023000000_add_task_hierarchy_and_order.sql
            </span>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.75rem', color: '#818cf8', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}
            >
              Supabase Dashboard <ExternalLink size={11} />
            </a>
          </div>
          <pre
            style={{
              background: '#070a14',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.75rem',
              color: '#94a3b8',
              overflowX: 'auto',
              maxHeight: '160px',
              margin: 0,
              fontFamily: 'Consolas, Monaco, monospace',
            }}
          >
            {TASK_HIERARCHY_SETUP_SQL.trim()}
          </pre>
        </div>
      )}
    </div>
  );
}
