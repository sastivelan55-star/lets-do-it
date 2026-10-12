import { useState } from 'react';
import { Database, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';

export default function SupabaseSetupNotice() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const envSnippet = `# Add these to your .env.local file:
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsIn...`;

  return (
    <div
      style={{
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '16px',
        padding: 'clamp(1rem, 3.5vw, 1.5rem)',
        width: '100%',
        maxWidth: '40rem',
        margin: '1.5rem auto',
        boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#818cf8',
          }}
        >
          <Database size={22} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Cloud Database Setup Required
          </h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            LifeMap connects directly to your secure Supabase PostgreSQL database.
          </p>
        </div>
      </div>

      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
        <p style={{ margin: '0 0 0.5rem 0' }}>
          To enable <strong>real cloud sync across multiple devices</strong>:
        </p>
        <ol style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <li>
            Create a free database project at{' '}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#818cf8', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
            >
              supabase.com <ExternalLink size={12} />
            </a>
          </li>
          <li>
            Open <strong>SQL Editor</strong> in Supabase and run the migration in{' '}
            <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
              supabase/migrations/20261011000000_create_tasks_table.sql
            </code>
          </li>
          <li>
            Copy your <strong>Project URL</strong> and <strong>anon public key</strong> into your{' '}
            <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>.env.local</code>.
          </li>
        </ol>
      </div>

      <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
        <pre
          style={{
            background: '#090d16',
            padding: '0.85rem',
            borderRadius: '8px',
            fontSize: '0.78rem',
            color: '#a5b4fc',
            overflowX: 'auto',
            border: '1px solid rgba(255,255,255,0.06)',
            margin: 0,
          }}
        >
          {envSnippet}
        </pre>
        <button
          onClick={() => copyToClipboard(envSnippet, 'env')}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(99,102,241,0.2)',
            border: 'none',
            color: '#c7d2fe',
            padding: '4px 8px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {copied === 'env' ? <Check size={12} /> : <Copy size={12} />}
          {copied === 'env' ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem',
          borderRadius: '8px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          fontSize: '0.8rem',
          color: '#34d399',
        }}
      >
        <ShieldCheck size={18} style={{ flexShrink: 0 }} />
        <span>
          <strong>Zero Trust Security:</strong> Every user row is protected by PostgreSQL Row-Level Security (RLS). Users can never access or modify each other's data.
        </span>
      </div>
    </div>
  );
}
