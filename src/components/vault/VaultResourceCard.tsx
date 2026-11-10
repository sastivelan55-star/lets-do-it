import React, { useState } from 'react';
import {
  Star,
  ExternalLink,
  MoreVertical,
  Play,
  Copy,
  Check,
  Edit2,
  Archive,
  Trash2,
  Folder,
  Tag,
  Eye,
  FileBox,
} from 'lucide-react';
import type { VaultResource } from '../../types/vault';
import { useVault } from '../../context/VaultContext';
import { RESOURCE_TYPE_CONFIG, formatBytes } from '../../utils/vaultUtils';

interface VaultResourceCardProps {
  resource: VaultResource;
  viewMode: 'masonry' | 'grid' | 'compact';
}

export default function VaultResourceCard({ resource, viewMode }: VaultResourceCardProps) {
  const {
    collections,
    toggleFavourite,
    toggleArchive,
    removeResource,
    viewResource,
    setEditingResource,
    setIsAddModalOpen,
    setSelectedTag,
  } = useVault();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const typeConfig = RESOURCE_TYPE_CONFIG[resource.resourceType] || RESOURCE_TYPE_CONFIG.other;
  const collection = collections.find((c) => c.id === resource.collectionId);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (resource.codeContent) {
      navigator.clipboard.writeText(resource.codeContent);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = resource.url || window.location.href;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setIsMenuOpen(false);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    setEditingResource(resource);
    setIsAddModalOpen(true);
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    await toggleArchive(resource.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (confirm(`Delete "${resource.title}"?`)) {
      await removeResource(resource.id);
    }
  };

  // Compact List Layout
  if (viewMode === 'compact') {
    return (
      <div
        onClick={() => viewResource(resource)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsMenuOpen(false);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          padding: '0.75rem 1rem',
          borderRadius: '14px',
          background: isHovered ? 'rgba(25, 18, 52, 0.7)' : 'rgba(15, 11, 32, 0.5)',
          border: `1px solid ${isHovered ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginBottom: '0.5rem',
          position: 'relative',
        }}
      >
        {/* Favicon or Type Icon */}
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: typeConfig.bg,
            border: `1px solid ${typeConfig.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {resource.faviconUrl ? (
            <img
              src={resource.faviconUrl}
              alt=""
              style={{ width: '18px', height: '18px', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span style={{ color: typeConfig.color, fontSize: '0.75rem' }}>
              {resource.resourceType === 'youtube' ? <Play size={16} fill="currentColor" /> : <FileBox size={16} />}
            </span>
          )}
        </div>

        {/* Title and Domain */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                color: '#f8fafc',
                fontSize: '0.9rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {resource.title}
            </span>
            {resource.domain && (
              <span style={{ color: '#94a3b8', fontSize: '0.75rem', flexShrink: 0 }}>
                • {resource.domain}
              </span>
            )}
          </div>
          {resource.description && (
            <p
              style={{
                margin: 0,
                color: 'rgba(203, 213, 225, 0.65)',
                fontSize: '0.78rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {resource.description}
            </p>
          )}
        </div>

        {/* Collection & Type Badge */}
        {collection && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.2rem 0.5rem',
              borderRadius: '999px',
              background: `${collection.color}20`,
              color: collection.color,
              fontSize: '0.72rem',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            <Folder size={11} />
            <span>{collection.name}</span>
          </span>
        )}

        {/* Fast Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavourite(resource.id);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
            }}
          >
            <Star
              size={16}
              color={resource.isFavourite ? '#facc15' : 'rgba(255,255,255,0.3)'}
              fill={resource.isFavourite ? '#facc15' : 'transparent'}
            />
          </button>

          {resource.url && (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#c084fc')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
            >
              <ExternalLink size={15} />
            </a>
          )}
        </div>
      </div>
    );
  }

  // Standard Grid / Masonry Layout
  return (
    <div
      onClick={() => viewResource(resource)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsMenuOpen(false);
      }}
      style={{
        borderRadius: '14px',
        background: isHovered
          ? 'linear-gradient(180deg, rgba(28, 20, 58, 0.8) 0%, rgba(16, 12, 34, 0.75) 100%)'
          : 'linear-gradient(180deg, rgba(18, 14, 38, 0.65) 0%, rgba(12, 9, 26, 0.6) 100%)',
        border: `1px solid ${isHovered ? 'rgba(168, 85, 247, 0.45)' : 'rgba(168, 85, 247, 0.16)'}`,
        boxShadow: isHovered
          ? '0 10px 28px rgba(0, 0, 0, 0.4), 0 0 16px rgba(168, 85, 247, 0.16)'
          : '0 4px 16px rgba(0, 0, 0, 0.25)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Visual Thumbnail Area */}
      {resource.thumbnailUrl ? (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '140px',
            maxHeight: '140px',
            overflow: 'hidden',
            background: '#090616',
          }}
        >
          <img
            src={resource.thumbnailUrl}
            alt={resource.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.35s ease',
              transform: isHovered ? 'scale(1.04)' : 'scale(1)',
            }}
            loading="lazy"
          />

          {/* Video Play Overlay */}
          {(resource.resourceType === 'youtube' || resource.resourceType === 'video') && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isHovered ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.25)',
                transition: 'background 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.65)',
                  transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <Play size={16} color="#ffffff" fill="#ffffff" style={{ marginLeft: '2px' }} />
              </div>
            </div>
          )}

          {/* Top Floating Badge on Thumbnail */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span
              style={{
                padding: '0.15rem 0.45rem',
                borderRadius: '6px',
                background: 'rgba(10, 7, 24, 0.85)',
                backdropFilter: 'blur(8px)',
                border: `1px solid ${typeConfig.border}`,
                color: typeConfig.color,
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.03em',
              }}
            >
              {typeConfig.label}
            </span>
          </div>
        </div>
      ) : resource.codeContent ? (
        /* Code Snippet Preview Area */
        <div
          style={{
            background: '#090616',
            padding: '0.75rem',
            borderBottom: '1px solid rgba(168, 85, 247, 0.15)',
            fontFamily: 'Fira Code, monospace',
            fontSize: '0.72rem',
            color: '#a7f3d0',
            position: 'relative',
            maxHeight: '110px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.35rem',
              color: '#34d399',
              fontSize: '0.68rem',
              fontWeight: 600,
            }}
          >
            <span>{resource.codeLanguage || 'code'}</span>
            <button
              onClick={handleCopyCode}
              title="Copy snippet"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: '5px',
                padding: '2px 5px',
                color: copiedCode ? '#34d399' : '#e2e8f0',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '0.65rem',
              }}
            >
              {copiedCode ? <Check size={10} /> : <Copy size={10} />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.35 }}>
            {resource.codeContent.slice(0, 160)}
            {resource.codeContent.length > 160 ? '...' : ''}
          </pre>
        </div>
      ) : resource.resourceType === 'note' && resource.notes ? (
        /* Note Preview Area */
        <div
          style={{
            background: 'rgba(234, 179, 8, 0.06)',
            padding: '0.75rem',
            borderBottom: '1px solid rgba(234, 179, 8, 0.2)',
            color: '#fef08a',
            fontSize: '0.76rem',
            maxHeight: '85px',
            overflow: 'hidden',
            fontStyle: 'italic',
            lineHeight: 1.4,
          }}
        >
          "{resource.notes.slice(0, 120)}
          {resource.notes.length > 120 ? '...' : ''}"
        </div>
      ) : null}

      {/* Card Body */}
      <div style={{ padding: '0.75rem 0.85rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Meta: Favicon / Domain / Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.45rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
            {resource.faviconUrl ? (
              <img
                src={resource.faviconUrl}
                alt=""
                style={{ width: '15px', height: '15px', borderRadius: '3px', objectFit: 'contain' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}

            {resource.domain ? (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {resource.domain}
              </span>
            ) : (
              <span
                style={{
                  padding: '0.12rem 0.4rem',
                  borderRadius: '5px',
                  background: typeConfig.bg,
                  color: typeConfig.color,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                }}
              >
                {typeConfig.label}
              </span>
            )}
          </div>

          {/* Action Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavourite(resource.id);
              }}
              title={resource.isFavourite ? 'Remove favourite' : 'Add to favourites'}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '3px',
                display: 'flex',
                color: resource.isFavourite ? '#facc15' : 'rgba(255,255,255,0.3)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Star
                size={14}
                color={resource.isFavourite ? '#facc15' : 'rgba(255,255,255,0.35)'}
                fill={resource.isFavourite ? '#facc15' : 'transparent'}
              />
            </button>

            {resource.url && (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                title="Open external link"
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  padding: '3px',
                  display: 'flex',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#c084fc')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
              >
                <ExternalLink size={14} />
              </a>
            )}

            {/* Three-dots menu */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.45)',
                cursor: 'pointer',
                padding: '3px',
                display: 'flex',
              }}
            >
              <MoreVertical size={14} />
            </button>

            {/* Card Popover Menu */}
            {isMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  zIndex: 30,
                  background: '#150f2e',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  borderRadius: '12px',
                  padding: '0.35rem',
                  minWidth: '150px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.7)',
                }}
              >
                <button
                  onClick={handleEdit}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#f8fafc',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Edit2 size={13} color="#c084fc" />
                  <span>Edit Resource</span>
                </button>

                {resource.url && (
                  <button
                    onClick={handleCopyLink}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: copiedLink ? '#34d399' : '#f8fafc',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>
                )}

                <button
                  onClick={handleArchive}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#cbd5e1',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Archive size={13} color="#94a3b8" />
                  <span>{resource.isArchived ? 'Unarchive' : 'Archive'}</span>
                </button>

                <button
                  onClick={handleDelete}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#f87171',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Trash2 size={13} color="#f87171" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3
          style={{
            margin: '0 0 0.35rem 0',
            fontSize: '0.88rem',
            fontWeight: 700,
            color: '#f8fafc',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {resource.title}
        </h3>

        {/* Description Snippet */}
        {resource.description && (
          <p
            style={{
              margin: '0 0 0.55rem 0',
              color: 'rgba(203, 213, 225, 0.72)',
              fontSize: '0.78rem',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {resource.description}
          </p>
        )}

        <div style={{ marginTop: 'auto' }}>
          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                flexWrap: 'wrap',
                marginBottom: '0.55rem',
              }}
            >
              {resource.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTag(tag);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.15rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '5px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'rgba(226, 232, 240, 0.75)',
                    fontSize: '0.68rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#c084fc';
                    e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(226, 232, 240, 0.75)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  <Tag size={9} />
                  <span>{tag}</span>
                </span>
              ))}
              {resource.tags.length > 3 && (
                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>
                  +{resource.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Bottom Card Footer: Collection and Views */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '0.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '0.72rem',
              color: 'rgba(148, 163, 184, 0.7)',
            }}
          >
            {collection ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: collection.color,
                  fontWeight: 600,
                }}
              >
                <Folder size={10} />
                <span>{collection.name}</span>
              </span>
            ) : resource.fileSize ? (
              <span>{formatBytes(resource.fileSize)}</span>
            ) : (
              <span />
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Eye size={11} />
              <span>{resource.viewCount || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
