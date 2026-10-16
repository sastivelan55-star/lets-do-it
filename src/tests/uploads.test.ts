import { describe, it, expect } from 'vitest';
import {
  formatFileSize,
  detectCategory,
  sanitizeFileName,
  validateUploadFile,
  dbRowToUpload,
  MAX_FILE_SIZE_BYTES,
  type DbUploadRow,
} from '../services/uploadService';
import type { UserUpload } from '../types';

describe('Media Vault & Uploads Service', () => {
  describe('formatFileSize', () => {
    it('formats bytes, kilobytes, megabytes, and gigabytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(26214400)).toBe('25.0 MB');
      expect(formatFileSize(1073741824)).toBe('1.0 GB');
    });

    it('handles negative or invalid numbers safely', () => {
      expect(formatFileSize(-100)).toBe('0 B');
      expect(formatFileSize(NaN)).toBe('0 B');
    });
  });

  describe('detectCategory', () => {
    it('identifies image formats by MIME and extension', () => {
      expect(detectCategory('image/png', 'diagram.png')).toBe('image');
      expect(detectCategory('image/jpeg', 'photo.jpg')).toBe('image');
      expect(detectCategory('image/webp', 'screen.webp')).toBe('image');
      expect(detectCategory('image/svg+xml', 'icon.svg')).toBe('image');
      expect(detectCategory('', 'untyped.gif')).toBe('image');
    });

    it('identifies video formats by MIME and extension', () => {
      expect(detectCategory('video/mp4', 'demo.mp4')).toBe('video');
      expect(detectCategory('video/webm', 'recording.webm')).toBe('video');
      expect(detectCategory('video/quicktime', 'clip.mov')).toBe('video');
      expect(detectCategory('', 'movie.mkv')).toBe('video');
    });

    it('identifies audio formats by MIME and extension', () => {
      expect(detectCategory('audio/mpeg', 'voice_memo.mp3')).toBe('audio');
      expect(detectCategory('audio/wav', 'lecture.wav')).toBe('audio');
      expect(detectCategory('audio/ogg', 'sound.ogg')).toBe('audio');
      expect(detectCategory('', 'tune.m4a')).toBe('audio');
    });

    it('identifies documents and text files by MIME and extension', () => {
      expect(detectCategory('application/pdf', 'dsa_notes.pdf')).toBe('document');
      expect(detectCategory('text/plain', 'cheatsheet.txt')).toBe('document');
      expect(detectCategory('text/markdown', 'readme.md')).toBe('document');
      expect(detectCategory('text/csv', 'data.csv')).toBe('document');
      expect(detectCategory('application/json', 'config.json')).toBe('document');
      expect(detectCategory('', 'resume.docx')).toBe('document');
      expect(detectCategory('', 'archive.zip')).toBe('document');
    });

    it('falls back to other for unknown types', () => {
      expect(detectCategory('application/octet-stream', 'binary.bin')).toBe('other');
      expect(detectCategory('', 'unknown_extension.xyz')).toBe('other');
    });
  });

  describe('sanitizeFileName', () => {
    it('removes path traversal sequences, illegal characters, and normalizes whitespace', () => {
      expect(sanitizeFileName('../../secret.png')).toBe('secret.png');
      expect(sanitizeFileName('my file (final) [2026].jpg')).toBe('my_file_final_2026.jpg');
      expect(sanitizeFileName('test/path\\name:bad*char.pdf')).toBe('testpathnamebadchar.pdf');
      expect(sanitizeFileName('hello world.txt')).toBe('hello_world.txt');
    });

    it('truncates excessively long base names while preserving extension', () => {
      const veryLong = 'a'.repeat(120) + '.pdf';
      const clean = sanitizeFileName(veryLong);
      expect(clean.endsWith('.pdf')).toBe(true);
      expect(clean.length).toBeLessThanOrEqual(84);
    });
  });

  describe('validateUploadFile', () => {
    it('accepts files within the 25 MB limit', () => {
      const file = new File(['sample content'], 'notes.pdf', { type: 'application/pdf' });
      const result = validateUploadFile(file);
      expect(result.valid).toBe(true);
      expect(result.category).toBe('document');
    });

    it('rejects files larger than 25 MB', () => {
      // Mock File with large size
      const largeFile = {
        name: 'huge_video.mp4',
        size: MAX_FILE_SIZE_BYTES + 1024,
        type: 'video/mp4',
      } as unknown as File;

      const result = validateUploadFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds the 25 MB limit');
    });

    it('rejects empty files (0 bytes)', () => {
      const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });
      const result = validateUploadFile(emptyFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('0 bytes');
    });

    it('rejects dangerous executable extensions', () => {
      const exeFile = new File(['malicious'], 'script.exe', { type: 'application/x-msdownload' });
      const result = validateUploadFile(exeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('restricted for security');

      const batFile = new File(['echo hello'], 'run.bat', { type: 'text/plain' });
      const batResult = validateUploadFile(batFile);
      expect(batResult.valid).toBe(false);
    });
  });

  describe('dbRowToUpload mapping', () => {
    it('correctly maps Supabase DbUploadRow to UserUpload', () => {
      const row: DbUploadRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 'user-abc',
        file_name: 'test_image.png',
        file_path: 'user-abc/123e4567-e89b-12d3-a456-426614174000-test_image.png',
        file_size: 204800,
        mime_type: 'image/png',
        category: 'image',
        description: 'Mock screenshot',
        created_at: '2026-10-16T10:00:00Z',
        updated_at: '2026-10-16T10:00:00Z',
      };

      const upload = dbRowToUpload(row, 'https://example.com/signed-url');
      expect(upload.id).toBe(row.id);
      expect(upload.userId).toBe(row.user_id);
      expect(upload.fileName).toBe('test_image.png');
      expect(upload.fileSize).toBe(204800);
      expect(upload.category).toBe('image');
      expect(upload.signedUrl).toBe('https://example.com/signed-url');
    });

    it('converts string file_size from BigInt columns gracefully', () => {
      const row = {
        id: '123',
        user_id: 'u1',
        file_name: 'doc.pdf',
        file_path: 'u1/123-doc.pdf',
        file_size: '5242880',
        mime_type: 'application/pdf',
        category: 'document',
        description: null,
        created_at: '2026-10-16T10:00:00Z',
        updated_at: '2026-10-16T10:00:00Z',
      } as unknown as DbUploadRow;

      const upload = dbRowToUpload(row);
      expect(upload.fileSize).toBe(5242880);
      expect(upload.description).toBeUndefined();
    });
  });

  describe('Filtering and Sorting Logic', () => {
    const mockUploads: UserUpload[] = [
      {
        id: '1',
        userId: 'u1',
        fileName: 'react_hooks.pdf',
        filePath: 'u1/1-react_hooks.pdf',
        fileSize: 1048576, // 1MB
        mimeType: 'application/pdf',
        category: 'document',
        description: 'React interview guide',
        createdAt: '2026-10-14T10:00:00Z',
        updatedAt: '2026-10-14T10:00:00Z',
      },
      {
        id: '2',
        userId: 'u1',
        fileName: 'avatar.png',
        filePath: 'u1/2-avatar.png',
        fileSize: 524288, // 512KB
        mimeType: 'image/png',
        category: 'image',
        description: 'Profile picture',
        createdAt: '2026-10-15T12:00:00Z',
        updatedAt: '2026-10-15T12:00:00Z',
      },
      {
        id: '3',
        userId: 'u1',
        fileName: 'dsa_solution.mp4',
        filePath: 'u1/3-dsa_solution.mp4',
        fileSize: 10485760, // 10MB
        mimeType: 'video/mp4',
        category: 'video',
        description: 'Graph BFS walk-through',
        createdAt: '2026-10-16T08:00:00Z',
        updatedAt: '2026-10-16T08:00:00Z',
      },
    ];

    it('filters by category', () => {
      const images = mockUploads.filter((u) => u.category === 'image');
      expect(images).toHaveLength(1);
      expect(images[0].fileName).toBe('avatar.png');
    });

    it('filters by search keyword in name or description', () => {
      const q = 'graph';
      const results = mockUploads.filter(
        (u) => u.fileName.toLowerCase().includes(q) || (u.description && u.description.toLowerCase().includes(q))
      );
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('3');
    });

    it('sorts by largest size first', () => {
      const sorted = [...mockUploads].sort((a, b) => b.fileSize - a.fileSize);
      expect(sorted[0].id).toBe('3'); // 10MB
      expect(sorted[1].id).toBe('1'); // 1MB
      expect(sorted[2].id).toBe('2'); // 512KB
    });

    it('sorts by newest first', () => {
      const sorted = [...mockUploads].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      expect(sorted[0].id).toBe('3'); // Oct 16
      expect(sorted[1].id).toBe('2'); // Oct 15
      expect(sorted[2].id).toBe('1'); // Oct 14
    });
  });
});
