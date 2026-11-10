// Life OS — Personal Resource Library / Digital Vault Utilities
import type { VaultResourceType } from '../types/vault';

/**
 * Validates whether a string is a safe HTTP or HTTPS URL.
 * Rejects javascript:, data:, file:, etc.
 */
export function isValidUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string') return false;
  const trimmed = urlString.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Normalizes user input by prepending https:// if missing.
 */
export function normalizeUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let trimmed = rawUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Extracts clean domain name without www.
 */
export function extractDomain(urlString: string): string {
  if (!urlString) return '';
  try {
    const parsed = new URL(normalizeUrl(urlString));
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return '';
  }
}

/**
 * Extracts YouTube video ID from standard, short, or embed URLs.
 */
export function extractYouTubeVideoId(urlString: string): string | null {
  if (!urlString) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/ ]{11})/i;
  const match = urlString.match(regExp);
  return match && match[1] && match[1].length === 11 ? match[1] : null;
}

/**
 * Returns high quality YouTube thumbnail URL.
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Returns privacy-enhanced YouTube embed URL.
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
}

/**
 * Returns high-resolution Google favicon URL.
 */
export function getFaviconUrl(domain: string): string {
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

/**
 * Automatically detects resource type from URL patterns.
 */
export function detectResourceTypeFromUrl(urlString: string): VaultResourceType {
  if (!urlString) return 'link';
  const lower = urlString.toLowerCase();
  const domain = extractDomain(urlString).toLowerCase();

  // YouTube
  if (extractYouTubeVideoId(urlString) || domain.includes('youtube') || domain.includes('youtu.be')) {
    return 'youtube';
  }

  // Other video
  if (
    domain.includes('vimeo') ||
    domain.includes('twitch.tv') ||
    domain.includes('tiktok.com') ||
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov')
  ) {
    return 'video';
  }

  // Audio
  if (
    domain.includes('spotify.com') ||
    domain.includes('soundcloud.com') ||
    domain.includes('bandcamp.com') ||
    domain.includes('podcasts.apple.com') ||
    lower.endsWith('.mp3') ||
    lower.endsWith('.wav') ||
    lower.endsWith('.ogg') ||
    lower.endsWith('.aac') ||
    lower.endsWith('.m4a')
  ) {
    return 'audio';
  }

  // Images
  if (
    domain.includes('unsplash.com') ||
    domain.includes('imgur.com') ||
    domain.includes('giphy.com') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.png') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.svg')
  ) {
    return 'image';
  }

  // Documents
  if (
    lower.endsWith('.pdf') ||
    lower.endsWith('.doc') ||
    lower.endsWith('.docx') ||
    lower.endsWith('.epub') ||
    lower.endsWith('.ppt') ||
    lower.endsWith('.pptx') ||
    lower.endsWith('.xls') ||
    lower.endsWith('.xlsx')
  ) {
    return 'document';
  }

  // Code repositories & tools
  if (
    domain.includes('github.com') ||
    domain.includes('gitlab.com') ||
    domain.includes('codepen.io') ||
    domain.includes('stackoverflow.com') ||
    domain.includes('npmjs.com') ||
    domain.includes('gist.github.com')
  ) {
    return 'code';
  }

  // Social media
  if (
    domain.includes('twitter.com') ||
    domain.includes('x.com') ||
    domain.includes('reddit.com') ||
    domain.includes('linkedin.com') ||
    domain.includes('instagram.com') ||
    domain.includes('threads.net') ||
    domain.includes('bluesky.app')
  ) {
    return 'social';
  }

  // Design inspiration
  if (
    domain.includes('figma.com') ||
    domain.includes('dribbble.com') ||
    domain.includes('behance.net') ||
    domain.includes('pinterest.com') ||
    domain.includes('awwwards.com') ||
    domain.includes('mobbin.com')
  ) {
    return 'design';
  }

  // Articles & blogs
  if (
    domain.includes('medium.com') ||
    domain.includes('dev.to') ||
    domain.includes('substack.com') ||
    domain.includes('hashnode.dev') ||
    domain.includes('notion.so')
  ) {
    return 'article';
  }

  return 'link';
}

/**
 * Generates an intuitive human-readable title from the URL structure.
 */
export function generateTitleFromUrl(urlString: string): string {
  try {
    const url = new URL(normalizeUrl(urlString));
    const domain = url.hostname.replace(/^www\./i, '');
    const pathParts = url.pathname
      .split('/')
      .filter(Boolean)
      .map((seg) => decodeURIComponent(seg).replace(/[-_+]/g, ' ').replace(/\.[a-z0-9]+$/i, ''));

    if (domain.includes('github.com') && pathParts.length >= 2) {
      return `${pathParts[0]} / ${pathParts[1]} — GitHub`;
    }

    if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
      return 'YouTube Video';
    }

    if (pathParts.length > 0) {
      const lastSeg = pathParts[pathParts.length - 1];
      const capitalized = lastSeg.charAt(0).toUpperCase() + lastSeg.slice(1);
      return `${capitalized} (${domain})`;
    }

    // Capitalize domain name
    const domainName = domain.split('.')[0];
    return domainName.charAt(0).toUpperCase() + domainName.slice(1);
  } catch {
    return 'Saved Link';
  }
}

export interface UrlAnalysisResult {
  url: string;
  domain: string;
  title: string;
  resourceType: VaultResourceType;
  faviconUrl: string;
  thumbnailUrl?: string;
  embedUrl?: string;
}

/**
 * Analyzes a URL and extracts rich preview metadata.
 */
export function analyzeUrl(rawUrl: string): UrlAnalysisResult {
  const normalized = normalizeUrl(rawUrl);
  const domain = extractDomain(normalized);
  const resourceType = detectResourceTypeFromUrl(normalized);
  const faviconUrl = getFaviconUrl(domain);
  const title = generateTitleFromUrl(normalized);

  let thumbnailUrl: string | undefined;
  let embedUrl: string | undefined;

  // Check YouTube
  const youtubeId = extractYouTubeVideoId(normalized);
  if (youtubeId) {
    thumbnailUrl = getYouTubeThumbnail(youtubeId);
    embedUrl = getYouTubeEmbedUrl(youtubeId);
  } else if (resourceType === 'image') {
    thumbnailUrl = normalized;
  }

  return {
    url: normalized,
    domain,
    title,
    resourceType,
    faviconUrl,
    thumbnailUrl,
    embedUrl,
  };
}

/**
 * Resource type presentation labels and colors.
 */
export const RESOURCE_TYPE_CONFIG: Record<
  VaultResourceType,
  { label: string; color: string; bg: string; border: string }
> = {
  link: { label: 'Web Link', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)' },
  youtube: { label: 'YouTube', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' },
  video: { label: 'Video', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' },
  image: { label: 'Image', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.3)' },
  document: { label: 'Document', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.3)' },
  audio: { label: 'Audio', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' },
  article: { label: 'Article', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.3)' },
  social: { label: 'Social', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.3)' },
  design: { label: 'Design', color: '#d946ef', bg: 'rgba(217, 70, 239, 0.12)', border: 'rgba(217, 70, 239, 0.3)' },
  code: { label: 'Code', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)' },
  note: { label: 'Idea / Note', color: '#eab308', bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.3)' },
  other: { label: 'Resource', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' },
};

/**
 * Format bytes into KB / MB.
 */
export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
  return `${size} ${units[i]}`;
}

