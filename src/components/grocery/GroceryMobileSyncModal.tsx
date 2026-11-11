// Life OS — Grocery List Mobile & Cloud Synchronization Modal
import { useState } from 'react';
import {
  Smartphone,
  Cloud,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  X,
  Share2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useGrocery } from '../../context/GroceryContext';
import { GROCERY_SETUP_SQL } from '../../services/groceryService';

interface GroceryMobileSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GroceryMobileSyncModal({ isOpen, onClose }: GroceryMobileSyncModalProps) {
  const {
    cloudSyncStatus,
    cloudNeedsSetup,
    syncNow,
    getMobileSyncUrl,
    lists,
    items,
  } = useGrocery();

  const [activeTab, setActiveTab] = useState<'link' | 'cloud'>('link');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const mobileUrl = getMobileSyncUrl();

  const handleCopyLink = async () => {
    if (!mobileUrl) return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(mobileUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  const handleCopySql = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(GROCERY_SETUP_SQL.trim());
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 2500);
      }
    } catch {}
  };

  const handleManualSync = async () => {
    setIsSyncingNow(true);
    setSyncFeedback(null);
    try {
      await syncNow();
      setSyncFeedback('Sync initiated successfully!');
    } catch (e: any) {
      setSyncFeedback(e?.message || 'Sync failed');
    } finally {
      setIsSyncingNow(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0d1520',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '20px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
              }}
            >
              <Smartphone size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                Sync Grocery List with Mobile
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                Access all {items.length} items across {lists.length} shopping lists on your phone
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            style={{
              flex: 1,
              padding: '0.85rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'link' ? '2px solid #10b981' : '2px solid transparent',
              color: activeTab === 'link' ? '#34d399' : '#94a3b8',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Share2 size={16} />
            <span>Instant Mobile Link (0 Setup)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            style={{
              flex: 1,
              padding: '0.85rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'cloud' ? '2px solid #10b981' : '2px solid transparent',
              color: activeTab === 'cloud' ? '#34d399' : '#94a3b8',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Cloud size={16} />
            <span>Supabase Cloud Sync</span>
            {cloudNeedsSetup && (
              <span
                style={{
                  fontSize: '0.65rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  padding: '1px 6px',
                  borderRadius: '10px',
                }}
              >
                Setup SQL
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {activeTab === 'link' ? (
            <>
              {/* Option 1: Instant Mobile Link */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '14px',
                  padding: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem' }}>
                  <CheckCircle2 size={18} color="#34d399" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                    1-Click Instant Mobile Sync
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                  Click below to copy your personal mobile sync link. Paste or send it to your phone (via WhatsApp, Telegram, or Notes). Opening it will <strong>instantly load all your grocery lists and items</strong> on your mobile phone!
                </p>
              </div>

              {/* Link Box */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  Transfer Link (Contains your {items.length} items and {lists.length} lists):
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#070c14',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '0.5rem 0.75rem',
                  }}
                >
                  <input
                    type="text"
                    readOnly
                    value={mobileUrl}
                    style={{
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      color: '#93c5fd',
                      fontSize: '0.78rem',
                      fontFamily: 'monospace',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{
                      background: copiedLink ? '#10b981' : '#334155',
                      border: 'none',
                      color: '#ffffff',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink ? 'Copied to Clipboard!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div style={{ background: '#0b1320', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                  How to open on your phone:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: '#94a3b8' }}>
                  <div>1. Click <strong>Copy Link</strong> above.</div>
                  <div>2. Message or email the link to your phone.</div>
                  <div>3. Tap the link on your mobile browser — Life OS will automatically decode and sync your entire shopping list!</div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Option 2: Supabase Cloud Database */}
              <div
                style={{
                  background: cloudNeedsSetup ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                  border: cloudNeedsSetup ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '14px',
                  padding: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.35rem' }}>
                  {cloudNeedsSetup ? (
                    <AlertCircle size={18} color="#f87171" />
                  ) : (
                    <CheckCircle2 size={18} color="#34d399" />
                  )}
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                    {cloudNeedsSetup ? 'Database Schema Setup Pending' : `Supabase Cloud Sync: ${cloudSyncStatus.toUpperCase()}`}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                  {cloudNeedsSetup
                    ? 'The "grocery_lists" and "grocery_items" tables need to be created once in your Supabase project. Copy the SQL below and run it in the Supabase SQL Editor.'
                    : 'Your grocery items and lists automatically synchronize across all devices logged into your account in real time.'}
                </p>
              </div>

              {cloudNeedsSetup && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
                      Supabase Migration SQL:
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySql}
                      style={{
                        background: copiedSql ? '#10b981' : '#334155',
                        border: 'none',
                        color: '#ffffff',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {copiedSql ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL'}</span>
                    </button>
                  </div>

                  <pre
                    style={{
                      background: '#070c14',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '0.85rem',
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      color: '#93c5fd',
                      maxHeight: '160px',
                      overflowY: 'auto',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {GROCERY_SETUP_SQL.trim()}
                  </pre>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncingNow}
                  style={{
                    background: '#10b981',
                    border: 'none',
                    color: '#ffffff',
                    padding: '0.55rem 1.1rem',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <RefreshCw size={14} className={isSyncingNow ? 'animate-spin' : ''} />
                  <span>{isSyncingNow ? 'Syncing...' : 'Sync Now to Cloud'}</span>
                </button>

                {cloudNeedsSetup && (
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#334155',
                      border: 'none',
                      color: '#f8fafc',
                      padding: '0.55rem 1.1rem',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      textDecoration: 'none',
                    }}
                  >
                    <span>Open Supabase SQL Editor</span>
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>

              {syncFeedback && (
                <div style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600 }}>
                  ✓ {syncFeedback}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#334155',
              border: 'none',
              color: '#ffffff',
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
