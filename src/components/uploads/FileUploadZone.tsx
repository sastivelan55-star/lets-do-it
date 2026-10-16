import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { validateUploadFile, formatFileSize } from '../../services/uploadService';

interface FileUploadZoneProps {
  onUpload: (file: File, description?: string) => Promise<unknown>;
  disabled?: boolean;
}

interface QueuedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

export default function FileUploadZone({ onUpload, disabled = false }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [description, setDescription] = useState('');
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
      };
    });

    setQueue((prev) => [...prev, ...formatted]);
  };

  const removeQueuedFile = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUploadAll = async () => {
    const pending = queue.filter((item) => item.status === 'pending');
    if (pending.length === 0 || isProcessing) return;

    setIsProcessing(true);

    for (const item of pending) {
      // Mark file as uploading
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading' } : q))
      );

      try {
        await onUpload(item.file, description.trim() || undefined);
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'success' } : q))
        );
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: 'error', errorMessage: errorMsg } : q
          )
        );
      }
    }

    setIsProcessing(false);
    setDescription('');
  };

  const pendingCount = queue.filter((q) => q.status === 'pending').length;

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
            Supports Photos, Videos, Audio, PDFs, and Documents (up to 25 MB each)
          </p>
        </div>
      </div>

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Selected Files ({queue.length})
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setQueue([])}
              disabled={isProcessing}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
            >
              Clear All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
            {queue.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, overflow: 'hidden' }}>
                  <File size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
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
                  {item.status === 'uploading' && <Loader2 size={16} className="animate-spin text-indigo-400" />}
                  {item.status === 'success' && <CheckCircle2 size={16} color="#10b981" />}
                  {item.status === 'error' && (
                    <span title={item.errorMessage} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f87171', fontSize: '0.75rem' }}>
                      <AlertCircle size={15} /> Error
                    </span>
                  )}
                  {item.status === 'pending' && (
                    <button
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
