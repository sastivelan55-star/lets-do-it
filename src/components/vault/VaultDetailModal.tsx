import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Star,
  Archive,
  Trash2,
  Edit2,
  Copy,
  Check,
  Eye,
  Calendar,
  Save,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import {
  extractYouTubeVideoId,
  getYouTubeEmbedUrl,
  RESOURCE_TYPE_CONFIG,
} from '../../utils/vaultUtils';

export default function VaultDetailModal() {
  const {
    detailResource,
    setDetailResource,
    collections,
    toggleFavourite,
    toggleArchive,
    removeResource,
    editResource,
    setEditingResource,
    setIsAddModalOpen,
  } = useVault();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  if (!detailResource) return null;

  const typeConfig = RESOURCE_TYPE_CONFIG[detailResource.resourceType] || RESOURCE_TYPE_CONFIG.other;
  const youtubeId = detailResource.url ? extractYouTubeVideoId(detailResource.url) : null;
  const embedUrl = youtubeId ? getYouTubeEmbedUrl(youtubeId) : null;

  const handleCopyLink = () => {
    const link = detailResource.url || window.location.href;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (detailResource.codeContent) {
      navigator.clipboard.writeText(detailResource.codeContent);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCollectionChange = async (newColId: string) => {
    await editResource({
      ...detailResource,
      collectionId: newColId || undefined,
    });
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTagInput.trim().toLowerCase();
    if (!clean) return;
    const existing = detailResource.tags || [];
    if (!existing.includes(clean)) {
      await editResource({
        ...detailResource,
        tags: [...existing, clean],
      });
    }
    setNewTagInput('');
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const existing = detailResource.tags || [];
    await editResource({
      ...detailResource,
      tags: existing.filter((t) => t !== tagToRemove),
    });
  };

  const handleSaveNotes = async () => {
    await editResource({
      ...detailResource,
      notes: editedNotes,
    });
    setIsEditingNotes(false);
  };

  const handleDelete = async () => {
    if (confirm(`Delete "${detailResource.title}" permanently?`)) {
      await removeResource(detailResource.id);
    }
  };

  const handleEdit = () => {
    setEditingResource(detailResource);
    setDetailResource(null);
    setIsAddModalOpen(true);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(0.5rem, 2vw, 1.5rem)',
        background: 'rgba(5, 3, 14, 0.82)',
        backdropFilter: 'blur(20px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setDetailResource(null);
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          background: 'linear-gradient(180deg, #171131 0%, #0d0a1e 100%)',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.75), 0 0 40px rgba(168, 85, 247, 0.2)',
          overflow: 'hidden',
          animation: 'vaultModalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid rgba(168, 85, 247, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10, 7, 24, 0.5)',
          }}
        >
          {/* Left: Type Pill & Domain */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              style={{
                padding: '0.25rem 0.65rem',
                borderRadius: '8px',
                background: typeConfig.bg,
                border: `1px solid ${typeConfig.border}`,
                color: typeConfig.color,
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {typeConfig.label}
            </span>

            {detailResource.domain && (
              <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500 }}>
                {detailResource.domain}
              </span>
            )}
          </div>

          {/* Right Action Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={() => toggleFavourite(detailResource.id)}
              title={detailResource.isFavourite ? 'Favourited' : 'Mark Favourite'}
              style={{
                background: detailResource.isFavourite ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: `1px solid ${detailResource.isFavourite ? 'rgba(234, 179, 8, 0.5)' : 'transparent'}`,
                borderRadius: '10px',
                padding: '0.45rem',
                cursor: 'pointer',
                display: 'flex',
                color: detailResource.isFavourite ? '#facc15' : '#e2e8f0',
              }}
            >
              <Star size={16} fill={detailResource.isFavourite ? '#facc15' : 'transparent'} />
            </button>

            {detailResource.url && (
              <button
                onClick={handleCopyLink}
                title="Copy link"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.45rem',
                  cursor: 'pointer',
                  display: 'flex',
                  color: copiedLink ? '#34d399' : '#e2e8f0',
                }}
              >
                {copiedLink ? <Check size={16} /> : <Copy size={16} />}
              </button>
            )}

            <button
              onClick={handleEdit}
              title="Edit resource"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                borderRadius: '10px',
                padding: '0.45rem',
                cursor: 'pointer',
                display: 'flex',
                color: '#e2e8f0',
              }}
            >
              <Edit2 size={16} />
            </button>

            <button
              onClick={() => toggleArchive(detailResource.id)}
              title={detailResource.isArchived ? 'Unarchive' : 'Archive'}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                borderRadius: '10px',
                padding: '0.45rem',
                cursor: 'pointer',
                display: 'flex',
                color: '#94a3b8',
              }}
            >
              <Archive size={16} />
            </button>

            <button
              onClick={handleDelete}
              title="Delete resource"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: 'none',
                borderRadius: '10px',
                padding: '0.45rem',
                cursor: 'pointer',
                display: 'flex',
                color: '#f87171',
              }}
            >
              <Trash2 size={16} />
            </button>

            <button
              onClick={() => setDetailResource(null)}
              title="Close"
              style={{
                background: 'transparent',
                border: 'none',
                borderRadius: '10px',
                padding: '0.45rem',
                cursor: 'pointer',
                display: 'flex',
                color: 'rgba(255, 255, 255, 0.6)',
                marginLeft: '0.3rem',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Main Area */}
        <div style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
          {/* MEDIA PREVIEW EMBEDS */}
          {embedUrl ? (
            /* YouTube Player Embed */
            <div
              style={{
                position: 'relative',
                width: '100%',
                paddingBottom: '56.25%',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#000000',
                border: '1px solid rgba(168, 85, 247, 0.3)',
              }}
            >
              <iframe
                src={embedUrl}
                title={detailResource.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
              />
            </div>
          ) : detailResource.resourceType === 'image' && detailResource.thumbnailUrl ? (
            /* Image Preview */
            <div
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                maxHeight: '400px',
                background: '#090616',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(168, 85, 247, 0.25)',
              }}
            >
              <img
                src={detailResource.thumbnailUrl}
                alt={detailResource.title}
                style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
              />
            </div>
          ) : detailResource.codeContent ? (
            /* Code Snippet Viewer */
            <div
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#090616',
                border: '1px solid rgba(168, 85, 247, 0.3)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 1rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <span style={{ color: '#34d399', fontSize: '0.78rem', fontWeight: 600 }}>
                  {detailResource.codeLanguage || 'code'}
                </span>
                <button
                  onClick={handleCopyCode}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.3rem 0.65rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    color: copiedCode ? '#34d399' : '#e2e8f0',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: '1.25rem',
                  fontFamily: 'Fira Code, monospace',
                  fontSize: '0.85rem',
                  color: '#a7f3d0',
                  lineHeight: 1.5,
                  overflowX: 'auto',
                }}
              >
                {detailResource.codeContent}
              </pre>
            </div>
          ) : null}

          {/* Title and External Link Button */}
          <div>
            <h1
              style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.35,
              }}
            >
              {detailResource.title}
            </h1>

            {detailResource.url && (
              <a
                href={detailResource.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  color: '#c084fc',
                  fontSize: '0.86rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                  wordBreak: 'break-all',
                }}
              >
                <span>{detailResource.url}</span>
                <ExternalLink size={14} />
              </a>
            )}
          </div>

          {/* Description */}
          {detailResource.description && (
            <div
              style={{
                padding: '0.85rem 1.15rem',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                color: 'rgba(226, 232, 240, 0.85)',
                fontSize: '0.9rem',
                lineHeight: 1.55,
              }}
            >
              {detailResource.description}
            </div>
          )}

          {/* Collection & Metadata Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              padding: '1rem',
              borderRadius: '16px',
              background: 'rgba(10, 7, 24, 0.5)',
              border: '1px solid rgba(168, 85, 247, 0.16)',
            }}
          >
            {/* Collection Selector */}
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  marginBottom: '0.3rem',
                  fontWeight: 600,
                }}
              >
                Collection
              </span>
              <select
                value={detailResource.collectionId || ''}
                onChange={(e) => handleCollectionChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '10px',
                  background: '#130d2a',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  color: '#e2e8f0',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
              >
                <option value="">(No collection)</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Saved Date */}
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  marginBottom: '0.3rem',
                  fontWeight: 600,
                }}
              >
                Saved Date
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: '#cbd5e1',
                  fontSize: '0.82rem',
                }}
              >
                <Calendar size={14} color="#a855f7" />
                <span>{new Date(detailResource.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* View Count */}
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  marginBottom: '0.3rem',
                  fontWeight: 600,
                }}
              >
                Engagement
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: '#cbd5e1',
                  fontSize: '0.82rem',
                }}
              >
                <Eye size={14} color="#38bdf8" />
                <span>{detailResource.viewCount || 1} views</span>
              </div>
            </div>
          </div>

          {/* Tags Editor */}
          <div>
            <span
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: '#cbd5e1',
                marginBottom: '0.5rem',
                fontWeight: 600,
              }}
            >
              Tags
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              {detailResource.tags?.map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '8px',
                    background: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    color: '#c084fc',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  <span>#{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#c084fc',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                    }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}

              {/* Add Tag Form */}
              <form onSubmit={handleAddTag} style={{ display: 'inline-flex' }}>
                <input
                  type="text"
                  placeholder="+ Add tag"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px dashed rgba(255, 255, 255, 0.2)',
                    color: '#f8fafc',
                    fontSize: '0.78rem',
                    outline: 'none',
                    width: '90px',
                  }}
                />
              </form>
            </div>
          </div>

          {/* Attached Personal Notes Editor */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: '#fde047', fontWeight: 600 }}>
                Personal Notes & Takeaways
              </span>
              {!isEditingNotes ? (
                <button
                  onClick={() => {
                    setEditedNotes(detailResource.notes || '');
                    setIsEditingNotes(true);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#c084fc',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  Edit Notes
                </button>
              ) : (
                <button
                  onClick={handleSaveNotes}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Save size={12} />
                  <span>Save Notes</span>
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                placeholder="Write your personal takeaways or ideas here..."
                rows={4}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  background: 'rgba(10, 7, 24, 0.6)',
                  border: '1px solid rgba(234, 179, 8, 0.4)',
                  color: '#fef08a',
                  fontSize: '0.85rem',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            ) : detailResource.notes ? (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  background: 'rgba(234, 179, 8, 0.08)',
                  border: '1px solid rgba(234, 179, 8, 0.25)',
                  color: '#fef08a',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {detailResource.notes}
              </div>
            ) : (
              <p
                onClick={() => {
                  setEditedNotes('');
                  setIsEditingNotes(true);
                }}
                style={{
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: '0.82rem',
                  fontStyle: 'italic',
                  cursor: 'pointer',
                  margin: 0,
                }}
              >
                Click to attach personal notes or insights...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
