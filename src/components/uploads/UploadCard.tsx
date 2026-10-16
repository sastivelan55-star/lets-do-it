import { useState, useEffect } from 'react';
import {
  Image,
  Video,
  Music,
  FileText,
  File,
  Download,
  Trash2,
  Edit2,
  Eye,
  Loader2,
} from 'lucide-react';
import type { UserUpload, UploadCategory } from '../../types';
import { formatFileSize } from '../../services/uploadService';
import { useApp } from '../../context/AppContext';

interface UploadCardProps {
  upload: UserUpload;
  onPreview: (upload: UserUpload, signedUrl: string) => void;
  onEdit: (upload: UserUpload) => void;
  onDelete: (upload: UserUpload) => void;
}

const CATEGORY_ICONS: Record<UploadCategory, React.ReactNode> = {
  image: <Image size={20} color="#38bdf8" />,
  video: <Video size={20} color="#f43f5e" />,
  audio: <Music size={20} color="#a855f7" />,
  document: <FileText size={20} color="#10b981" />,
  other: <File size={20} color="#94a3b8" />,
};

const CATEGORY_COLORS: Record<UploadCategory, string> = {
  image: '#38bdf8',
  video: '#f43f5e',
  audio: '#a855f7',
  document: '#10b981',
  other: '#94a3b8',
};

export default function UploadCard({
  upload,
  onPreview,
  onEdit,
  onDelete,
}: UploadCardProps) {
  const { getDownloadUrl } = useApp();
  const [signedUrl, setSignedUrl] = useState<string | undefined>(upload.signedUrl);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Lazy-load thumbnail URL for images
  useEffect(() => {
    let isMounted = true;
    if (upload.category === 'image' && !signedUrl) {
      getDownloadUrl(upload.filePath)
        .then((url) => {
          if (isMounted) setSignedUrl(url);
        })
        .catch(() => {
          // Graceful fallback: card displays standard Image icon
        });
    }
    return () => {
      isMounted = false;
    };
  }, [upload.category, upload.filePath, signedUrl, getDownloadUrl]);

  const handlePreviewClick = async () => {
    if (signedUrl) {
      onPreview(upload, signedUrl);
      return;
    }
    setIsLoadingUrl(true);
    try {
      const url = await getDownloadUrl(upload.filePath);
      setSignedUrl(url);
      onPreview(upload, url);
    } catch (err: unknown) {
      alert(`Could not generate preview link: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleDownloadClick = async () => {
    setIsDownloading(true);
    try {
      const url = signedUrl || (await getDownloadUrl(upload.filePath));
      const a = document.createElement('a');
      a.href = url;
      a.download = upload.fileName;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: unknown) {
      alert(`Download failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const formattedDate = new Date(upload.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '0.875rem',
        gap: '0.75rem',
        minWidth: 0,
        position: 'relative',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
      }}
    >
      {/* Top Media / Thumbnail Area */}
      <div
        onClick={handlePreviewClick}
        style={{
          width: '100%',
          height: '130px',
          borderRadius: '10px',
          background: 'var(--bg-surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: 'pointer',
          position: 'relative',
          border: '1px solid var(--border)',
        }}
      >
        {upload.category === 'image' && signedUrl ? (
          <img
            src={signedUrl}
            alt={upload.fileName}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
            }}
          />
        ) : (
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `rgba(${
                upload.category === 'video'
                  ? '244, 63, 94, 0.15'
                  : upload.category === 'audio'
                  ? '168, 85, 247, 0.15'
                  : upload.category === 'document'
                  ? '16, 185, 129, 0.15'
                  : '56, 189, 248, 0.15'
              })`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {CATEGORY_ICONS[upload.category]}
          </div>
        )}

        {/* Category Pill Tag */}
        <span
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(11, 15, 30, 0.85)',
            backdropFilter: 'blur(4px)',
            border: `1px solid ${CATEGORY_COLORS[upload.category]}40`,
            color: CATEGORY_COLORS[upload.category],
            fontSize: '0.68rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            padding: '2px 8px',
            borderRadius: '999px',
            letterSpacing: '0.04em',
          }}
        >
          {upload.category}
        </span>
      </div>

      {/* File Info */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          title={upload.fileName}
          style={{
            fontWeight: 600,
            fontSize: '0.88rem',
            color: 'var(--text-primary)',
            margin: '0 0 4px 0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {upload.fileName}
        </p>

        {upload.description && (
          <p
            title={upload.description}
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              margin: '0 0 6px 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {upload.description}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span>{formatFileSize(upload.fileSize)}</span>
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border)',
          paddingTop: '0.6rem',
          gap: '0.25rem',
        }}
      >
        <button
          className="btn btn-secondary btn-sm"
          onClick={handlePreviewClick}
          disabled={isLoadingUrl}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            fontSize: '0.75rem',
            padding: '0.3rem 0.5rem',
          }}
        >
          {isLoadingUrl ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
          Preview
        </button>

        <button
          className="btn btn-ghost btn-icon"
          onClick={handleDownloadClick}
          disabled={isDownloading}
          title="Download file"
          aria-label="Download file"
          style={{ width: '28px', height: '28px' }}
        >
          {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        </button>

        <button
          className="btn btn-ghost btn-icon"
          onClick={() => onEdit(upload)}
          title="Edit description or name"
          aria-label="Edit file metadata"
          style={{ width: '28px', height: '28px' }}
        >
          <Edit2 size={14} />
        </button>

        <button
          className="btn btn-ghost btn-icon"
          onClick={() => onDelete(upload)}
          title="Delete file"
          aria-label="Delete file"
          style={{ width: '28px', height: '28px', color: '#f87171' }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
