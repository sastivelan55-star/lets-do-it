// Life OS — Personal Resource Library & Digital Vault Types

export type VaultResourceType =
  | 'link'
  | 'youtube'
  | 'video'
  | 'image'
  | 'document'
  | 'audio'
  | 'article'
  | 'social'
  | 'design'
  | 'code'
  | 'note'
  | 'other';

export interface VaultResource {
  id: string;
  userId: string;
  title: string;
  description?: string;
  resourceType: VaultResourceType;
  url?: string;
  filePath?: string; // Supabase storage bucket path
  fileSize?: number; // In bytes
  mimeType?: string;
  thumbnailUrl?: string;
  faviconUrl?: string;
  domain?: string;
  collectionId?: string;
  tags: string[];
  notes?: string;
  codeContent?: string;
  codeLanguage?: string;
  isFavourite: boolean;
  isArchived: boolean;
  viewCount: number;
  lastViewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  coverImage?: string;
  isFavourite: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export type VaultViewMode = 'masonry' | 'grid' | 'compact';
export type VaultSortOption = 'newest' | 'oldest' | 'title' | 'views';

