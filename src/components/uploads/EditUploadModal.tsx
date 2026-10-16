import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import type { UserUpload } from '../../types';

interface EditUploadModalProps {
  upload: UserUpload | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: { fileName?: string; description?: string }) => Promise<void>;
}

export default function EditUploadModal({
  upload,
  isOpen,
  onClose,
  onSave,
}: EditUploadModalProps) {
  const [fileName, setFileName] = useState(upload?.fileName || '');
  const [description, setDescription] = useState(upload?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!upload) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) {
      setError('File name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSave(upload.id, {
        fileName: fileName.trim(),
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update file');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit File Details"
      maxWidth="480px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && (
          <div
            style={{
              padding: '0.6rem 0.85rem',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '0.82rem',
            }}
          >
            {error}
          </div>
        )}

        <div>
          <label htmlFor="edit-upload-name" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>
            File Name
          </label>
          <input
            id="edit-upload-name"
            className="input"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label htmlFor="edit-upload-desc" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>
            Description (Optional)
          </label>
          <textarea
            id="edit-upload-desc"
            className="input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            placeholder="Add context or notes about this file…"
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Saving…
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
