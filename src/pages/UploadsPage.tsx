import { useState, useMemo } from 'react';
import {
  UploadCloud,
  Search,
  X,
  AlertCircle,
  HardDrive,
  Trash2,
  FolderOpen,
  Database,
  Copy,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import FileUploadZone from '../components/uploads/FileUploadZone';
import UploadCard from '../components/uploads/UploadCard';
import MediaPreviewModal from '../components/uploads/MediaPreviewModal';
import EditUploadModal from '../components/uploads/EditUploadModal';
import Modal from '../components/ui/Modal';
import type { UserUpload } from '../types';
import { formatFileSize } from '../services/uploadService';
import { MEDIA_VAULT_SETUP_SQL, copySetupSqlToClipboard } from '../services/uploadSetupSql';
import { formatSafeErrorMessage } from '../utils/errorUtils';

type SortOption = 'newest' | 'oldest' | 'largest' | 'smallest' | 'name';

export default function UploadsPage() {
  const { uploads, uploadFile, removeUpload, updateUpload, error } = useApp();
  const { user, isGuest } = useAuth();
  const displayError = error ? (typeof error === 'string' && error !== '[object Object]' ? error : formatSafeErrorMessage(error)) : null;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Modals state
  const [previewUpload, setPreviewUpload] = useState<UserUpload | null>(null);
  const [previewSignedUrl, setPreviewSignedUrl] = useState<string | null>(null);
  const [editingUpload, setEditingUpload] = useState<UserUpload | null>(null);
  const [deletingUpload, setDeletingUpload] = useState<UserUpload | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Compute metrics
  const totalSizeBytes = useMemo(() => {
    return uploads.reduce((sum, u) => sum + (u.fileSize || 0), 0);
  }, [uploads]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: uploads.length,
      image: 0,
      video: 0,
      audio: 0,
      document: 0,
      other: 0,
    };
    for (const u of uploads) {
      if (counts[u.category] !== undefined) {
        counts[u.category]++;
      } else {
        counts.other++;
      }
    }
    return counts;
  }, [uploads]);

  // Filter and sort uploads
  const filteredUploads = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return uploads
      .filter((u) => {
        const matchesCategory =
          selectedCategory === 'all' || u.category === selectedCategory;
        const matchesQuery =
          !q ||
          u.fileName.toLowerCase().includes(q) ||
          (u.description && u.description.toLowerCase().includes(q));

        return matchesCategory && matchesQuery;
      })
      .sort((a, b) => {
        if (sortOption === 'newest') return b.createdAt.localeCompare(a.createdAt);
        if (sortOption === 'oldest') return a.createdAt.localeCompare(b.createdAt);
        if (sortOption === 'largest') return (b.fileSize || 0) - (a.fileSize || 0);
        if (sortOption === 'smallest') return (a.fileSize || 0) - (b.fileSize || 0);
        if (sortOption === 'name') return a.fileName.localeCompare(b.fileName);
        return 0;
      });
  }, [uploads, searchQuery, selectedCategory, sortOption]);

  const handleUploadSubmit = async (
    file: File,
    description?: string,
    onProgress?: (percent: number) => void
  ) => {
    await uploadFile(file, description, onProgress);
  };

  const handleCopySql = async () => {
    const ok = await copySetupSqlToClipboard();
    if (ok) {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUpload) return;
    setIsDeleting(true);
    try {
      await removeUpload(deletingUpload);
      setDeletingUpload(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const CATEGORIES: { id: string; label: string }[] = [
    { id: 'all', label: `All (${categoryCounts.all})` },
    { id: 'image', label: `Photos (${categoryCounts.image})` },
    { id: 'video', label: `Videos (${categoryCounts.video})` },
    { id: 'audio', label: `Audio (${categoryCounts.audio})` },
    { id: 'document', label: `Docs (${categoryCounts.document})` },
  ];

  return (
    <div className="page-container pb-safe">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            📁 <span className="gradient-text">Media Vault & Uploads</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Encrypted personal progress storage: project attachments, study notes, audio memos, and recordings.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowSetupModal(true)}
            id="open-setup-sql-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="View Supabase Storage & Database Setup SQL"
          >
            <Database size={15} />
            Setup SQL
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowUploadZone((v) => !v)}
            id="toggle-upload-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <UploadCloud size={16} />
            {showUploadZone ? 'Hide Uploader' : 'Upload Files'}
          </button>
        </div>
      </div>

      {/* Guest Mode Warning Banner */}
      {isGuest && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            color: '#fbbf24',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Guest Demo Mode: </strong>
            Cloud Media Vault requires an authenticated Supabase account to store and stream files securely. Please sign in or create an account to upload files.
          </div>
        </div>
      )}

      {/* System Error Banner */}
      {displayError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '10px',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span>{displayError}</span>
            {(displayError.includes('media-vault') || displayError.includes('user_uploads') || displayError.includes('SQL migration')) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleCopySql}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
                >
                  {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                  {copiedSql ? 'Copied to Clipboard!' : 'Copy Supabase SQL Migration'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowSetupModal(true)}
                  style={{ fontSize: '0.78rem' }}
                >
                  View Setup Guide
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vault Storage Summary Cards */}
      <div
        className="stats-grid"
        style={{ marginBottom: '1.25rem' }}
      >
        <div className="card" style={{ padding: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
            <HardDrive size={14} color="#818cf8" /> Total Files
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
            {uploads.length}
          </div>
        </div>

        <div className="card" style={{ padding: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
            <FolderOpen size={14} color="#34d399" /> Storage Used
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
            {formatFileSize(totalSizeBytes)}
          </div>
        </div>

        <div className="card" style={{ padding: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>⚡</span> Max File Size
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            50 MB
            <span style={{ fontSize: '0.68rem', color: '#818cf8', fontWeight: 600, background: 'rgba(99,102,241,0.15)', padding: '2px 6px', borderRadius: '4px' }}>
              TUS Resumable
            </span>
          </div>
        </div>
      </div>

      {/* Upload Zone (Collapsible or Triggered) */}
      {showUploadZone && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UploadCloud size={18} color="#818cf8" /> Add Files to Vault
          </h2>
          <FileUploadZone onUpload={handleUploadSubmit} disabled={!user} />
        </div>
      )}

      {/* Search, Filter & Sort Controls */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search bar */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="input"
              placeholder="Search files by name or description…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.4rem', paddingRight: searchQuery ? '2.4rem' : '0.9rem' }}
            />
            {searchQuery && (
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: '0.35rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '24px',
                  height: '24px',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div style={{ flexShrink: 0 }}>
            <select
              className="input"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              style={{ padding: '0.6rem 0.9rem', minWidth: '150px' }}
              aria-label="Sort files"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="largest">Largest Size</option>
              <option value="smallest">Smallest Size</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '4px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`btn btn-sm ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedCategory(cat.id)}
              style={{ flexShrink: 0, fontSize: '0.78rem' }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Uploads Grid */}
      {filteredUploads.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
            gap: '1rem',
          }}
        >
          {filteredUploads.map((upload) => (
            <UploadCard
              key={upload.id}
              upload={upload}
              onPreview={(u, url) => {
                setPreviewUpload(u);
                setPreviewSignedUrl(url);
              }}
              onEdit={(u) => setEditingUpload(u)}
              onDelete={(u) => setDeletingUpload(u)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="card empty-state" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: '#818cf8',
            }}
          >
            <FolderOpen size={32} />
          </div>

          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            {searchQuery || selectedCategory !== 'all' ? 'No matching files found' : 'No files in vault yet'}
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            {searchQuery || selectedCategory !== 'all'
              ? 'Try modifying your search keywords or clearing your category filters.'
              : 'Keep project screenshots, audio memos, study PDFs, and video demos safe in your private cloud vault.'}
          </p>

          {!searchQuery && selectedCategory === 'all' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowUploadZone(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <UploadCloud size={16} /> Upload First File
            </button>
          )}
        </div>
      )}

      {/* Media Preview Modal */}
      <MediaPreviewModal
        upload={previewUpload}
        signedUrl={previewSignedUrl}
        isOpen={Boolean(previewUpload && previewSignedUrl)}
        onClose={() => {
          setPreviewUpload(null);
          setPreviewSignedUrl(null);
        }}
      />

      {/* Edit Metadata Modal */}
      {editingUpload && (
        <EditUploadModal
          key={editingUpload.id}
          upload={editingUpload}
          isOpen={Boolean(editingUpload)}
          onClose={() => setEditingUpload(null)}
          onSave={async (id, updates) => {
            await updateUpload(id, updates);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingUpload && (
        <Modal
          isOpen={Boolean(deletingUpload)}
          onClose={() => setDeletingUpload(null)}
          title="Delete File from Vault"
          maxWidth="440px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
              Are you sure you want to permanently delete <strong>{deletingUpload.fileName}</strong>?
            </p>
            <p style={{ color: '#f87171', fontSize: '0.8rem', margin: 0, fontWeight: 500 }}>
              ⚠️ This will remove both the actual file object from Supabase Storage and its metadata. This action cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setDeletingUpload(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={14} />
                {isDeleting ? 'Deleting…' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Supabase Storage & Database Setup Modal */}
      {showSetupModal && (
        <Modal
          isOpen={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          title="Supabase Storage & Database Setup"
          maxWidth="680px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: 0, lineHeight: 1.5 }}>
              To enable private, encrypted file uploads up to <strong>50 MB</strong> with TUS resumable chunks and Row Level Security, run this idempotent SQL migration once in your Supabase project.
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                <strong>Step 1:</strong> Copy SQL script &nbsp;→&nbsp; <strong>Step 2:</strong> Go to Supabase Dashboard &nbsp;→&nbsp; <strong>Step 3:</strong> Paste in <strong>SQL Editor</strong> & click <strong>Run</strong>.
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleCopySql}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
              >
                {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                {copiedSql ? 'Copied!' : 'Copy SQL'}
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <pre
                style={{
                  background: 'rgba(10, 15, 30, 0.85)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '1rem',
                  fontSize: '0.75rem',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                  color: '#93c5fd',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {MEDIA_VAULT_SETUP_SQL.trim()}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowSetupModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCopySql}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                {copiedSql ? 'Copied to Clipboard!' : 'Copy Migration SQL'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
