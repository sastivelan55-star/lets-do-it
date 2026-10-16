import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import {
  UploadCloud,
  File as FileIcon,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  RotateCcw,
  Copy,
  Check,
} from 'lucide-react';
import { validateUploadFile, formatFileSize } from '../../services/uploadService';
import { copySetupSqlToClipboard } from '../../services/uploadSetupSql';

interface FileUploadZoneProps {
  onUpload: (file: File, description?: string, onProgress?: (percent: number) => void) => Promise<unknown>;
  disabled?: boolean;
}

interface QueuedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  progress?: number;
}

export default function FileUploadZone({ onUpload, disabled = false }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [description, setDescription] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || !e.dataTransfer.files?.length) return;
    addFilesToQueue(Array.from(e.dataTransfer.files));
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    addFilesToQueue(Array.from(e.target.files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addFilesToQueue = (newFiles: File[]) => {
    const formatted: QueuedFile[] = newFiles.map((file) => {
      const validation = validateUploadFile(file);
      return {
        file,
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        status: validation.valid ? 'pending' : 'error',
        errorMessage: validation.error,
        progress: 0,
      };
    });

    setQueue((prev) => [...prev, ...formatted]);
  };

  const removeQueuedFile = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const retryFile = (id: string) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const validation = validateUploadFile(item.file);
          return {
            ...item,
            status: validation.valid ? 'pending' : 'error',
            errorMessage: validation.error,
            progress: 0,
          };
        }
        return item;
      })
    );
  };

  const retryAllFailed = () => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.status === 'error') {
          const validation = validateUploadFile(item.file);
          return {
            ...item,
            status: validation.valid ? 'pending' : 'error',
            errorMessage: validation.error,
            progress: 0,
          };
        }
        return item;
      })
    );
  };

  const handleCopySql = async () => {
    const ok = await copySetupSqlToClipboard();
    if (ok) {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    }
  };

  const handleUploadAll = async () => {
    const pending = queue.filter((item) => item.status === 'pending');
    if (pending.length === 0 || isProcessing) return;

    setIsProcessing(true);

    for (const item of pending) {
      // Mark file as uploading
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading', progress: 5 } : q))
      );

      try {
        await onUpload(item.file, description.trim() || undefined, (percent) => {
          setQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, progress: percent } : q))
          );
        });

        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'success', progress: 100 } : q))
        );
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: 'error', errorMessage: errorMsg, progress: 0 }
              : q
          )
        );
      }
    }

    setIsProcessing(false);
    setDescription('');
  };

  const pendingCount = queue.filter((q) => q.status === 'pending').length;
  const errorCount = queue.filter((q) => q.status === 'error').length;

  const hasMissingSchemaError = queue.some(
    (q) =>
      q.status === 'error' &&
      q.errorMessage &&
      (q.errorMessage.includes('media-vault') ||
        q.errorMessage.includes('user_uploads') ||
        q.errorMessage.includes('SQL migration') ||
        q.errorMessage.includes('schema cache'))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {/* Drop Zone Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        style={{
          border: isDragging
            ? '2px dashed #818cf8'
            : '2px dashed var(--border)',
          borderRadius: '16px',
          background: isDragging
            ? 'rgba(99, 102, 241, 0.12)'
            : 'rgba(26, 34, 56, 0.4)',
          padding: 'clamp(1.5rem, 4vw, 2.5rem)',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          disabled={disabled}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#818cf8',
            boxShadow: '0 4px 16px rgba(99,102,241,0.15)',
          }}
        >
          <UploadCloud size={28} />
        </div>

        <div>
          <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
            Click to upload or drag & drop files
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Supports Photos, Videos, Audio, PDFs, and Documents (up to 50 MB each • Resumable TUS)
          </p>
        </div>
      </div>

      {/* Supabase Missing Schema Helper Banner */}
      {hasMissingSchemaError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '12px',
            color: 'var(--text-primary)',
          }}
        >
          <AlertCircle size={20} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1, fontSize: '0.82rem', lineHeight: 1.5 }}>
            <strong style={{ color: '#f87171', display: 'block', marginBottom: '4px' }}>
              Supabase Storage & Table Setup Required
            </strong>
            The private storage bucket <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '4px' }}>media-vault</code> and metadata table <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '4px' }}>user_uploads</code> have not been initialized yet in your Supabase backend.
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleCopySql}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
              >
                {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                {copiedSql ? 'SQL Copied to Clipboard!' : 'Copy Supabase SQL Migration'}
              </button>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Paste into Supabase Dashboard → SQL Editor → Run.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Queue & Metadata input */}
      {queue.length > 0 && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Selected Files ({queue.length})
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {errorCount > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={retryAllFailed}
                  disabled={isProcessing}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: '#818cf8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <RotateCcw size={13} /> Retry Failed ({errorCount})
                </button>
              )}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setQueue([])}
                disabled={isProcessing}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              >
                Clear All
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '280px', overflowY: 'auto', marginBottom: '1rem' }}>
            {queue.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  padding: '0.65rem 0.75rem',
                  background: 'var(--bg-surface-2)',
                  border: item.status === 'error' ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, overflow: 'hidden' }}>
                    <FileIcon size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.file.name}
                      </p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {formatFileSize(item.file.size)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    {item.status === 'uploading' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Loader2 size={15} className="animate-spin text-indigo-400" />
                        <span style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 600 }}>
                          {item.progress ?? 0}%
                        </span>
                      </div>
                    )}
                    {item.status === 'success' && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>
                        <CheckCircle2 size={16} /> Uploaded
                      </span>
                    )}
                    {item.status === 'error' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => retryFile(item.id)}
                          disabled={isProcessing}
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: '#818cf8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Retry upload"
                        >
                          <RotateCcw size={12} /> Retry
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          onClick={() => removeQueuedFile(item.id)}
                          disabled={isProcessing}
                          style={{ width: '22px', height: '22px', padding: 0 }}
                          aria-label="Remove file"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    {item.status === 'pending' && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        onClick={() => removeQueuedFile(item.id)}
                        style={{ width: '22px', height: '22px', padding: 0 }}
                        aria-label="Remove file"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Upload Progress Bar */}
                {item.status === 'uploading' && (
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${item.progress ?? 0}%`,
                        background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                        transition: 'width 0.2s ease',
                      }}
                    />
                  </div>
                )}

                {/* Explicit Error Message Display */}
                {item.status === 'error' && item.errorMessage && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '5px',
                      padding: '0.4rem 0.5rem',
                      background: 'rgba(239, 68, 68, 0.08)',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      color: '#f87171',
                      lineHeight: 1.35,
                      wordBreak: 'break-word',
                    }}
                  >
                    <AlertCircle size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{item.errorMessage}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {pendingCount > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                className="input"
                placeholder="Optional description or note for these files…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isProcessing}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUploadAll}
                disabled={isProcessing || disabled}
                style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Uploading Files…
                  </>
                ) : (
                  <>
                    <UploadCloud size={15} /> Upload {pendingCount} {pendingCount === 1 ? 'File' : 'Files'}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
