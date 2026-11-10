import { describe, it, expect, beforeEach } from 'vitest';
import {
  isValidUrl,
  normalizeUrl,
  extractDomain,
  detectResourceTypeFromUrl,
  extractYouTubeVideoId,
  getYouTubeThumbnail,
  analyzeUrl,
  formatBytes,
} from '../utils/vaultUtils';
import {
  dbRowToResource,
  resourceToDbRow,
  dbRowToCollection,
  collectionToDbRow,
  loadLocalResources,
  saveLocalResources,
  DEFAULT_COLLECTIONS,
  type DbVaultResourceRow,
  type DbVaultCollectionRow,
} from '../services/vaultService';
import type { VaultResource } from '../types/vault';

// In-memory mock localStorage
class MockStorage implements Storage {
  private store: Record<string, string> = {};
  get length() {
    return Object.keys(this.store).length;
  }
  clear() {
    this.store = {};
  }
  getItem(key: string) {
    return this.store[key] || null;
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  key(index: number) {
    return Object.keys(this.store)[index] || null;
  }
}

describe('Vault Utils & URL Metadata Extraction', () => {
  it('validates safe HTTP/HTTPS URLs and rejects malicious schemes', () => {
    expect(isValidUrl('https://github.com/facebook/react')).toBe(true);
    expect(isValidUrl('http://example.com')).toBe(true);
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
    expect(isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isValidUrl('not a url')).toBe(false);
    expect(isValidUrl('')).toBe(false);
  });

  it('normalizes URLs missing protocol', () => {
    expect(normalizeUrl('github.com/vitejs/vite')).toBe('https://github.com/vitejs/vite');
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('extracts clean domain without www.', () => {
    expect(extractDomain('https://www.youtube.com/watch?v=12345678901')).toBe('youtube.com');
    expect(extractDomain('https://figma.com/@designer')).toBe('figma.com');
  });

  it('detects resource types accurately', () => {
    expect(detectResourceTypeFromUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube');
    expect(detectResourceTypeFromUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube');
    expect(detectResourceTypeFromUrl('https://vimeo.com/76979871')).toBe('video');
    expect(detectResourceTypeFromUrl('https://example.com/asset.mp4')).toBe('video');
    expect(detectResourceTypeFromUrl('https://images.unsplash.com/photo-1579783902614-a3fb3927b675')).toBe('image');
    expect(detectResourceTypeFromUrl('https://example.com/image.png')).toBe('image');
    expect(detectResourceTypeFromUrl('https://example.com/manual.pdf')).toBe('document');
    expect(detectResourceTypeFromUrl('https://open.spotify.com/track/4cOdK2wGLEDN1mmVoZyjxi')).toBe('audio');
    expect(detectResourceTypeFromUrl('https://github.com/facebook/react')).toBe('code');
    expect(detectResourceTypeFromUrl('https://codepen.io/pen/1234')).toBe('code');
    expect(detectResourceTypeFromUrl('https://twitter.com/shadcn')).toBe('social');
    expect(detectResourceTypeFromUrl('https://x.com/levelsio')).toBe('social');
    expect(detectResourceTypeFromUrl('https://figma.com/design/sample')).toBe('design');
    expect(detectResourceTypeFromUrl('https://dribbble.com/shots/1234')).toBe('design');
    expect(detectResourceTypeFromUrl('https://medium.com/@author/story')).toBe('article');
    expect(detectResourceTypeFromUrl('https://generic-site.org/page')).toBe('link');
  });

  it('extracts YouTube video ID and thumbnail URL', () => {
    const videoId = extractYouTubeVideoId('https://www.youtube.com/watch?v=jfKfPfyJRdk');
    expect(videoId).toBe('jfKfPfyJRdk');
    expect(getYouTubeThumbnail(videoId!)).toBe('https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg');

    const shortId = extractYouTubeVideoId('https://youtu.be/jfKfPfyJRdk?t=10');
    expect(shortId).toBe('jfKfPfyJRdk');
  });

  it('analyzes URL and returns complete rich metadata payload', () => {
    const res = analyzeUrl('https://github.com/facebook/react');
    expect(res.domain).toBe('github.com');
    expect(res.resourceType).toBe('code');
    expect(res.faviconUrl).toContain('google.com/s2/favicons');
    expect(res.title).toContain('facebook / react');
  });

  it('formats bytes into human readable format', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
    expect(formatBytes(0)).toBe('');
  });
});

describe('Vault Persistence & DB Row Mapping', () => {
  beforeEach(() => {
    const mockStorage = new MockStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
  });

  it('converts between DbVaultResourceRow and VaultResource accurately', () => {
    const dbRow: DbVaultResourceRow = {
      id: 'res-12345',
      user_id: 'user-abc',
      title: 'Deep Focus Coding Beats',
      description: 'Lofi background music',
      resource_type: 'youtube',
      url: 'https://youtube.com/watch?v=jfKfPfyJRdk',
      file_path: null,
      file_size: null,
      mime_type: null,
      thumbnail_url: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
      favicon_url: 'https://google.com/s2/favicons?domain=youtube.com',
      domain: 'youtube.com',
      collection_id: 'col-999',
      tags: ['lofi', 'focus'],
      notes: 'Listen while debugging',
      code_content: null,
      code_language: null,
      is_favourite: true,
      is_archived: false,
      view_count: 5,
      last_viewed_at: '2026-11-10T12:00:00Z',
      created_at: '2026-11-10T10:00:00Z',
      updated_at: '2026-11-10T12:00:00Z',
    };

    const resource = dbRowToResource(dbRow);
    expect(resource.id).toBe('res-12345');
    expect(resource.resourceType).toBe('youtube');
    expect(resource.isFavourite).toBe(true);
    expect(resource.tags).toEqual(['lofi', 'focus']);

    const backToRow = resourceToDbRow(resource, 'user-abc');
    expect(backToRow.title).toBe('Deep Focus Coding Beats');
    expect(backToRow.resource_type).toBe('youtube');
    expect(backToRow.is_favourite).toBe(true);
  });

  it('converts between DbVaultCollectionRow and VaultCollection accurately', () => {
    const dbRow: DbVaultCollectionRow = {
      id: 'col-123',
      user_id: 'user-abc',
      name: 'Design Inspiration',
      description: 'Cyberpunk visual benchmarks',
      color: '#d946ef',
      icon: 'Palette',
      cover_image: null,
      is_favourite: true,
      order_index: 0,
      created_at: '2026-11-10T10:00:00Z',
      updated_at: '2026-11-10T10:00:00Z',
    };

    const collection = dbRowToCollection(dbRow);
    expect(collection.id).toBe('col-123');
    expect(collection.name).toBe('Design Inspiration');
    expect(collection.color).toBe('#d946ef');
    expect(collection.icon).toBe('Palette');

    const backToRow = collectionToDbRow(collection, 'user-abc');
    expect(backToRow.name).toBe('Design Inspiration');
    expect(backToRow.color).toBe('#d946ef');
  });

  it('mirrors local resources in storage safely', () => {
    const testResource: VaultResource = {
      id: 'res-test-1',
      userId: 'test-user',
      title: 'Local Test Resource',
      resourceType: 'link',
      tags: ['test'],
      isFavourite: false,
      isArchived: false,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveLocalResources([testResource], 'test-user');
    const loaded = loadLocalResources('test-user');
    expect(loaded.length).toBe(1);
    expect(loaded[0].title).toBe('Local Test Resource');
  });

  it('provides default seed collections for new libraries', () => {
    expect(DEFAULT_COLLECTIONS.length).toBeGreaterThanOrEqual(4);
    const names = DEFAULT_COLLECTIONS.map((c) => c.name);
    expect(names).toContain('Design Inspiration');
    expect(names).toContain('Development & Code');
    expect(names).toContain('Watch Later');
  });
});
