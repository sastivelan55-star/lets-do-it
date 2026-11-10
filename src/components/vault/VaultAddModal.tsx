import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Link,
  UploadCloud,
  Code,
  FileText,
  Star,
  Sparkles,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { useAuth } from '../../context/AuthContext';
import type { VaultResourceType } from '../../types/vault';
import {
  analyzeUrl,
  isValidUrl,
  formatBytes,
} from '../../utils/vaultUtils';
import { uploadUserFile } from '../../services/uploadService';

interface VaultAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUrl?: string;
}

type AddTab = 'url' | 'upload' | 'code' | 'note';

const CODE_LANGUAGES = [
  'typescript',
  'javascript',
  'python',
  'sql',
  'html',
  'css',
  'json',
  'rust',
  'go',
  'java',
  'cpp',
  'markdown',
  'bash',
];

export default function VaultAddModal({ isOpen, onClose, initialUrl }: VaultAddModalProps) {
  const { collections, addResource, editResource, editingResource, setEditingResource } = useVault();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<AddTab>('url');

  // Form Fields
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resourceType, setResourceType] = useState<VaultResourceType>('link');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [domain, setDomain] = useState('');
  const [collectionId, setCollectionId] = useState<string>('');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [codeContent, setCodeContent] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('typescript');
  const [isFavourite, setIsFavourite] = useState(false);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset or Populate on open / editingResource change
  useEffect(() => {
    if (!isOpen) return;

    if (editingResource) {
      setTitle(editingResource.title);
      setDescription(editingResource.description || '');
      setUrl(editingResource.url || '');
      setResourceType(editingResource.resourceType);
      setThumbnailUrl(editingResource.thumbnailUrl || '');
      setFaviconUrl(editingResource.faviconUrl || '');
      setDomain(editingResource.domain || '');
      setCollectionId(editingResource.collectionId || '');
      setTagsInput(editingResource.tags ? editingResource.tags.join(', ') : '');
      setNotes(editingResource.notes || '');
      setCodeContent(editingResource.codeContent || '');
      setCodeLanguage(editingResource.codeLanguage || 'typescript');
      setIsFavourite(editingResource.isFavourite);

      if (editingResource.resourceType === 'code') setActiveTab('code');
      else if (editingResource.resourceType === 'note') setActiveTab('note');
      else if (editingResource.filePath) setActiveTab('upload');
      else setActiveTab('url');
    } else {
      // New resource
      setTitle('');
      setDescription('');
      setUrl(initialUrl || '');
      setResourceType('link');
      setThumbnailUrl('');
      setFaviconUrl('');
      setDomain('');
      setCollectionId('');
      setTagsInput('');
      setNotes('');
      setCodeContent('');
      setCodeLanguage('typescript');
      setIsFavourite(false);
      setSelectedFile(null);
      setUploadProgress(null);
      setActiveTab('url');

      if (initialUrl && isValidUrl(initialUrl)) {
        handleUrlAnalyze(initialUrl);
      }
    }
    setErrorMessage(null);
  }, [isOpen, editingResource, initialUrl]);

  // URL Analysis Trigger
  const handleUrlAnalyze = (inputUrl: string) => {
    if (!inputUrl || !isValidUrl(inputUrl)) return;
    const analysis = analyzeUrl(inputUrl);
    setUrl(analysis.url);
    if (!title || title === 'Saved Link' || title === 'YouTube Video') {
      setTitle(analysis.title);
    }
    setDomain(analysis.domain);
    setResourceType(analysis.resourceType);
    setFaviconUrl(analysis.faviconUrl);
    if (analysis.thumbnailUrl) {
      setThumbnailUrl(analysis.thumbnailUrl);
    }
  };

  const handleUrlBlur = () => {
    if (url.trim() && isValidUrl(url.trim())) {
      handleUrlAnalyze(url.trim());
    }
  };

  // File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTitle(file.name.replace(/\.[a-z0-9]+$/i, ''));
      if (file.type.startsWith('image/')) setResourceType('image');
      else if (file.type.startsWith('video/')) setResourceType('video');
      else if (file.type.startsWith('audio/')) setResourceType('audio');
      else setResourceType('document');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please provide a title for this resource.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      let uploadedFilePath: string | undefined = editingResource?.filePath;
      let uploadedFileSize: number | undefined = editingResource?.fileSize;
      let uploadedMimeType: string | undefined = editingResource?.mimeType;

      // If user uploaded a new file
      if (activeTab === 'upload' && selectedFile) {
        setIsUploading(true);
        if (user?.id) {
          try {
            const uploadRes = await uploadUserFile(
              selectedFile,
              user.id,
              description,
              (percent: number) => setUploadProgress(percent)
            );
            uploadedFilePath = uploadRes.filePath;
            uploadedFileSize = uploadRes.fileSize;
            uploadedMimeType = uploadRes.mimeType;
            if (uploadRes.signedUrl && uploadRes.category === 'image') {
              setThumbnailUrl(uploadRes.signedUrl);
            }
          } catch (uploadErr) {
            console.warn('Storage upload error, falling back to local metadata:', uploadErr);
            uploadedFileSize = selectedFile.size;
            uploadedMimeType = selectedFile.type;
          }
        } else {
          // Guest / offline upload preview
          uploadedFileSize = selectedFile.size;
          uploadedMimeType = selectedFile.type;
        }
        setIsUploading(false);
      }

      if (editingResource) {
        await editResource({
          ...editingResource,
          title: title.trim(),
          description: description.trim() || undefined,
          resourceType,
          url: url.trim() || undefined,
          filePath: uploadedFilePath,
          fileSize: uploadedFileSize,
          mimeType: uploadedMimeType,
          thumbnailUrl: thumbnailUrl.trim() || undefined,
          faviconUrl: faviconUrl.trim() || undefined,
          domain: domain.trim() || undefined,
          collectionId: collectionId || undefined,
          tags: parsedTags,
          notes: notes.trim() || undefined,
          codeContent: codeContent || undefined,
          codeLanguage: codeLanguage || undefined,
          isFavourite,
        });
      } else {
        await addResource({
          title: title.trim(),
          description: description.trim() || undefined,
          resourceType,
          url: url.trim() || undefined,
          filePath: uploadedFilePath,
          fileSize: uploadedFileSize,
          mimeType: uploadedMimeType,
          thumbnailUrl: thumbnailUrl.trim() || undefined,
          faviconUrl: faviconUrl.trim() || undefined,
          domain: domain.trim() || undefined,
          collectionId: collectionId || undefined,
          tags: parsedTags,
          notes: notes.trim() || undefined,
          codeContent: codeContent || undefined,
          codeLanguage: codeLanguage || undefined,
          isFavourite,
          isArchived: false,
        });
      }

      setEditingResource(null);
      onClose();
    } catch (err: unknown) {
      console.error('Failed to save resource', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to save resource. Please check inputs and retry.'
      );
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(5, 3, 14, 0.75)',
        backdropFilter: 'blur(16px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          background: 'linear-gradient(180deg, #171131 0%, #0d0a1e 100%)',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.65), 0 0 30px rgba(168, 85, 247, 0.15)',
          overflow: 'hidden',
          animation: 'vaultModalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(168, 85, 247, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={17} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                {editingResource ? 'Edit Resource' : 'Add to Vault'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                Save links, media, code, or personal inspiration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection (only for new resource) */}
        {!editingResource && (
          <div
            style={{
              display: 'flex',
              padding: '0.5rem 1.5rem',
              gap: '0.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              background: 'rgba(10, 7, 24, 0.5)',
              overflowX: 'auto',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'url' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                color: activeTab === 'url' ? '#c084fc' : 'rgba(203, 213, 225, 0.7)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Link size={14} />
              <span>Web Link</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'upload' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                color: activeTab === 'upload' ? '#c084fc' : 'rgba(203, 213, 225, 0.7)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <UploadCloud size={14} />
              <span>Upload File</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('code');
                setResourceType('code');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'code' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                color: activeTab === 'code' ? '#c084fc' : 'rgba(203, 213, 225, 0.7)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Code size={14} />
              <span>Code Snippet</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('note');
                setResourceType('note');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'note' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                color: activeTab === 'note' ? '#c084fc' : 'rgba(203, 213, 225, 0.7)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <FileText size={14} />
              <span>Personal Note</span>
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '1.25rem 1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            flex: 1,
          }}
        >
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                fontSize: '0.82rem',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: URL / Link Input */}
          {activeTab === 'url' && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  marginBottom: '0.35rem',
                }}
              >
                Website or Resource URL *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="https://youtube.com/watch?v=... or https://github.com/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={handleUrlBlur}
                  style={{
                    flex: 1,
                    padding: '0.65rem 0.85rem',
                    borderRadius: '12px',
                    background: 'rgba(10, 7, 24, 0.6)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleUrlAnalyze(url)}
                  style={{
                    padding: '0.65rem 1rem',
                    borderRadius: '12px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    color: '#c084fc',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Analyze
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: File Upload Zone */}
          {activeTab === 'upload' && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  marginBottom: '0.35rem',
                }}
              >
                Choose or Drop File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                    setTitle(file.name.replace(/\.[a-z0-9]+$/i, ''));
                    if (file.type.startsWith('image/')) setResourceType('image');
                    else if (file.type.startsWith('video/')) setResourceType('video');
                    else if (file.type.startsWith('audio/')) setResourceType('audio');
                    else setResourceType('document');
                  }
                }}
                style={{
                  border: '2px dashed rgba(168, 85, 247, 0.4)',
                  borderRadius: '16px',
                  padding: '1.75rem',
                  textAlign: 'center',
                  background: 'rgba(15, 11, 32, 0.4)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease',
                }}
              >
                <UploadCloud size={32} color="#c084fc" style={{ margin: '0 auto 0.5rem auto' }} />
                {selectedFile ? (
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>
                      {selectedFile.name}
                    </p>
                    <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.78rem' }}>
                      {formatBytes(selectedFile.size)} • {selectedFile.type || 'Custom File'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: '#e2e8f0', fontSize: '0.88rem' }}>
                      Click to browse or drag and drop your file
                    </p>
                    <p style={{ margin: '0.3rem 0 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                      Supports images, videos, audio, and documents (up to 50 MB)
                    </p>
                  </div>
                )}
              </div>

              {uploadProgress !== null && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: '#c084fc',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      borderRadius: '999px',
                      background: 'rgba(255,255,255,0.1)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${uploadProgress}%`,
                        background: 'linear-gradient(90deg, #a855f7, #6366f1)',
                        transition: 'width 0.2s ease',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Code Snippet Inputs */}
          {activeTab === 'code' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.35rem',
                }}
              >
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>
                  Code Content
                </label>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  style={{
                    background: '#130d2a',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    color: '#c084fc',
                    borderRadius: '8px',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.75rem',
                  }}
                >
                  {CODE_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                placeholder="Paste code snippet here..."
                rows={5}
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  background: '#090616',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  color: '#a7f3d0',
                  fontFamily: 'Fira Code, monospace',
                  fontSize: '0.82rem',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>
          )}

          {/* Title Field (All Tabs) */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '0.35rem',
              }}
            >
              Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Lofi Hip Hop Radio or React Architecture Guide"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.65rem 0.85rem',
                borderRadius: '12px',
                background: 'rgba(10, 7, 24, 0.6)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                color: '#f8fafc',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '0.35rem',
              }}
            >
              Short Description / Summary
            </label>
            <textarea
              placeholder="Brief description of what this resource contains..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.65rem 0.85rem',
                borderRadius: '12px',
                background: 'rgba(10, 7, 24, 0.6)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          {/* Collection & Resource Type Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  marginBottom: '0.35rem',
                }}
              >
                Collection
              </label>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  background: '#130d2a',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">(No collection / Uncategorized)</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  marginBottom: '0.35rem',
                }}
              >
                Resource Type
              </label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value as VaultResourceType)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '12px',
                  background: '#130d2a',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="link">Web Link</option>
                <option value="youtube">YouTube Video</option>
                <option value="video">Other Video</option>
                <option value="image">Image</option>
                <option value="document">Document / PDF</option>
                <option value="audio">Audio</option>
                <option value="article">Article / Blog</option>
                <option value="social">Social Media</option>
                <option value="design">Design Inspiration</option>
                <option value="code">Code Snippet</option>
                <option value="note">Personal Note</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Tags Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '0.35rem',
              }}
            >
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. react, design, cyberpunk, productivity"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.65rem 0.85rem',
                borderRadius: '12px',
                background: 'rgba(10, 7, 24, 0.6)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Personal Notes / Thoughts attached */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '0.35rem',
              }}
            >
              Personal Notes & Ideas
            </label>
            <textarea
              placeholder="Attach your private notes, takeaways, or research questions..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.65rem 0.85rem',
                borderRadius: '12px',
                background: 'rgba(10, 7, 24, 0.6)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Thumbnail preview if available */}
          {thumbnailUrl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img
                src={thumbnailUrl}
                alt="Thumbnail preview"
                style={{
                  width: '80px',
                  height: '50px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                }}
              />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.75rem', color: '#c084fc', display: 'block' }}>
                  Thumbnail Preview Detected
                </span>
                <input
                  type="text"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="Custom thumbnail image URL"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    color: '#94a3b8',
                    fontSize: '0.72rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {/* Favourite checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsFavourite(!isFavourite)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: isFavourite ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${isFavourite ? 'rgba(234, 179, 8, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                padding: '0.4rem 0.8rem',
                borderRadius: '10px',
                color: isFavourite ? '#fde047' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.82rem',
              }}
            >
              <Star size={15} fill={isFavourite ? '#facc15' : 'transparent'} />
              <span>Mark as Favourite</span>
            </button>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '0.5rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '0.65rem 1.15rem',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                color: '#e2e8f0',
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.45rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: isSubmitting || isUploading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 18px rgba(168, 85, 247, 0.4)',
                opacity: isSubmitting || isUploading ? 0.7 : 1,
              }}
            >
              <Check size={16} />
              <span>
                {isUploading
                  ? 'Uploading file...'
                  : isSubmitting
                    ? 'Saving...'
                    : editingResource
                      ? 'Save Changes'
                      : 'Add to Vault'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
