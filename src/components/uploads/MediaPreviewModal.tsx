import { Download, ExternalLink, FileText, File } from 'lucide-react';
import Modal from '../ui/Modal';
import type { UserUpload } from '../../types';
import { formatFileSize } from '../../services/uploadService';

interface MediaPreviewModalProps {
  upload: UserUpload | null;
  signedUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MediaPreviewModal({
  upload,
  signedUrl,
  isOpen,
  onClose,
}: MediaPreviewModalProps) {
  if (!upload || !signedUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = signedUrl;
    a.download = upload.fileName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isPdf = upload.mimeType === 'application/pdf' || upload.fileName.toLowerCase().endsWith('.pdf');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={upload.fileName}
      maxWidth="720px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
        {/* Media Content Display Area */}
        <div
          style={{
            width: '100%',
            maxHeight: '60vh',
            minHeight: '220px',
            background: 'var(--bg-surface-2)',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border)',
          }}
        >
          {upload.category === 'image' && (
            <img
              src={signedUrl}
              alt={upload.fileName}
              style={{
                maxWidth: '100%',
                maxHeight: '58vh',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          )}

          {upload.category === 'video' && (
            <video
              controls
              playsInline
              preload="metadata"
              style={{
                width: '100%',
                maxHeight: '58vh',
                backgroundColor: '#000',
              }}
            >
              <source src={signedUrl} type={upload.mimeType} />
              Your browser does not support playing this video format.
            </video>
          )}

          {upload.category === 'audio' && (
            <div
              style={{
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5rem',
                width: '100%',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(168, 85, 247, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#c084fc',
                }}
              >
                🎵
              </div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0, textAlign: 'center' }}>
                {upload.fileName}
              </p>
              <audio controls preload="metadata" style={{ width: '100%', maxWidth: '480px' }}>
                <source src={signedUrl} type={upload.mimeType} />
                Your browser does not support audio playback.
              </audio>
            </div>
          )}

          {upload.category === 'document' && isPdf && (
            <iframe
              src={signedUrl}
              title={upload.fileName}
              style={{
                width: '100%',
                height: '55vh',
                border: 'none',
              }}
            />
          )}

          {upload.category === 'document' && !isPdf && (
            <div
              style={{
                padding: '2.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <FileText size={48} color="#10b981" />
              <div>
                <p style={{ fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                  Document: {upload.fileName}
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  This document format can be downloaded and opened with your native application.
                </p>
              </div>
            </div>
          )}

          {upload.category === 'other' && (
            <div
              style={{
                padding: '2.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <File size={48} color="var(--text-muted)" />
              <div>
                <p style={{ fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                  {upload.fileName}
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  Download this file to open with a compatible local application.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* File Metadata Details */}
        <div
          style={{
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '0.875rem 1rem',
            fontSize: '0.82rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
          }}
        >
          {upload.description && (
            <div style={{ marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Description: </span>
              <span style={{ color: 'var(--text-primary)' }}>{upload.description}</span>
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-secondary)' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Size: </span>
              <strong>{formatFileSize(upload.fileSize)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>MIME Type: </span>
              <code>{upload.mimeType}</code>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Uploaded: </span>
              <span>{new Date(upload.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => window.open(signedUrl, '_blank', 'noopener,noreferrer')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ExternalLink size={15} /> Open in New Tab
          </button>
          <button
            className="btn btn-primary"
            onClick={handleDownload}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={15} /> Download
          </button>
        </div>
      </div>
    </Modal>
  );
}
