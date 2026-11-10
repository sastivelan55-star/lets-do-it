// Life OS — Vault Context & State Management
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type {
  VaultResource,
  VaultCollection,
  VaultResourceType,
  VaultViewMode,
  VaultSortOption,
} from '../types/vault';
import {
  fetchVaultCollections,
  createVaultCollection,
  updateVaultCollection,
  deleteVaultCollection,
  fetchVaultResources,
  createVaultResource,
  updateVaultResource,
  deleteVaultResource,
  recordResourceView,
} from '../services/vaultService';
import { useAuth } from './AuthContext';

interface VaultContextType {
  resources: VaultResource[];
  collections: VaultCollection[];
  isLoading: boolean;
  activeCollectionId: string | null;
  setActiveCollectionId: (id: string | null) => void;
  selectedType: VaultResourceType | 'all';
  setSelectedType: (type: VaultResourceType | 'all') => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOption: VaultSortOption;
  setSortOption: (sort: VaultSortOption) => void;
  viewMode: VaultViewMode;
  setViewMode: (mode: VaultViewMode) => void;
  // Modals & Active elements
  detailResource: VaultResource | null;
  setDetailResource: (res: VaultResource | null) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  editingResource: VaultResource | null;
  setEditingResource: (res: VaultResource | null) => void;
  isCollectionModalOpen: boolean;
  setIsCollectionModalOpen: (open: boolean) => void;
  editingCollection: VaultCollection | null;
  setEditingCollection: (col: VaultCollection | null) => void;
  // Actions
  addResource: (data: Partial<VaultResource>) => Promise<VaultResource>;
  editResource: (resource: VaultResource) => Promise<VaultResource>;
  removeResource: (id: string) => Promise<void>;
  toggleFavourite: (id: string) => Promise<void>;
  toggleArchive: (id: string) => Promise<void>;
  viewResource: (resource: VaultResource) => void;
  addCollection: (data: Partial<VaultCollection>) => Promise<VaultCollection>;
  editCollection: (col: VaultCollection) => Promise<VaultCollection>;
  removeCollection: (id: string) => Promise<void>;
  // Filtered list
  filteredResources: VaultResource[];
  allTags: { tag: string; count: number }[];
  stats: {
    total: number;
    favourites: number;
    archived: number;
    collectionsCount: number;
    mediaCount: number;
  };
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  const [resources, setResources] = useState<VaultResource[]>([]);
  const [collections, setCollections] = useState<VaultCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & State
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<VaultResourceType | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<VaultSortOption>('newest');
  const [viewMode, setViewMode] = useState<VaultViewMode>('masonry');

  // Modals
  const [detailResource, setDetailResource] = useState<VaultResource | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<VaultResource | null>(null);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<VaultCollection | null>(null);

  // Initial load & when user changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    Promise.all([fetchVaultCollections(userId), fetchVaultResources(userId)])
      .then(([cols, res]) => {
        if (!isCancelled) {
          setCollections(cols);
          setResources(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load vault data', err);
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  // Resource Actions
  const addResource = useCallback(
    async (data: Partial<VaultResource>): Promise<VaultResource> => {
      const created = await createVaultResource(data, userId);
      setResources((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
      return created;
    },
    [userId]
  );

  const editResource = useCallback(
    async (resource: VaultResource): Promise<VaultResource> => {
      const updated = await updateVaultResource(resource, userId);
      setResources((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      if (detailResource?.id === updated.id) {
        setDetailResource(updated);
      }
      return updated;
    },
    [userId, detailResource]
  );

  const removeResource = useCallback(
    async (id: string): Promise<void> => {
      await deleteVaultResource(id, userId);
      setResources((prev) => prev.filter((r) => r.id !== id));
      if (detailResource?.id === id) {
        setDetailResource(null);
      }
    },
    [userId, detailResource]
  );

  const toggleFavourite = useCallback(
    async (id: string): Promise<void> => {
      const target = resources.find((r) => r.id === id);
      if (!target) return;
      const updated: VaultResource = { ...target, isFavourite: !target.isFavourite };
      // Optimistic update
      setResources((prev) => prev.map((r) => (r.id === id ? updated : r)));
      if (detailResource?.id === id) {
        setDetailResource(updated);
      }
      await updateVaultResource(updated, userId);
    },
    [resources, userId, detailResource]
  );

  const toggleArchive = useCallback(
    async (id: string): Promise<void> => {
      const target = resources.find((r) => r.id === id);
      if (!target) return;
      const updated: VaultResource = { ...target, isArchived: !target.isArchived };
      // Optimistic update
      setResources((prev) => prev.map((r) => (r.id === id ? updated : r)));
      if (detailResource?.id === id) {
        setDetailResource(updated);
      }
      await updateVaultResource(updated, userId);
    },
    [resources, userId, detailResource]
  );

  const viewResource = useCallback(
    (resource: VaultResource) => {
      setDetailResource(resource);
      // Asynchronously track view
      recordResourceView(resource.id, userId);
      setResources((prev) =>
        prev.map((r) =>
          r.id === resource.id
            ? { ...r, viewCount: (r.viewCount || 0) + 1, lastViewedAt: new Date().toISOString() }
            : r
        )
      );
    },
    [userId]
  );

  // Collection Actions
  const addCollection = useCallback(
    async (data: Partial<VaultCollection>): Promise<VaultCollection> => {
      const created = await createVaultCollection(data, userId);
      setCollections((prev) => [...prev, created]);
      return created;
    },
    [userId]
  );

  const editCollection = useCallback(
    async (col: VaultCollection): Promise<VaultCollection> => {
      const updated = await updateVaultCollection(col, userId);
      setCollections((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      return updated;
    },
    [userId]
  );

  const removeCollection = useCallback(
    async (id: string): Promise<void> => {
      await deleteVaultCollection(id, userId);
      setCollections((prev) => prev.filter((c) => c.id !== id));
      setResources((prev) =>
        prev.map((r) => (r.collectionId === id ? { ...r, collectionId: undefined } : r))
      );
      if (activeCollectionId === id) {
        setActiveCollectionId(null);
      }
    },
    [userId, activeCollectionId]
  );

  // All extracted unique tags with counts
  const allTags = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of resources) {
      if (!r.isArchived && Array.isArray(r.tags)) {
        for (const t of r.tags) {
          const clean = t.trim().toLowerCase();
          if (clean) {
            map[clean] = (map[clean] || 0) + 1;
          }
        }
      }
    }
    return Object.entries(map)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [resources]);

  // Overall Stats
  const stats = useMemo(() => {
    const total = resources.filter((r) => !r.isArchived).length;
    const favourites = resources.filter((r) => !r.isArchived && r.isFavourite).length;
    const archived = resources.filter((r) => r.isArchived).length;
    const collectionsCount = collections.length;
    const mediaCount = resources.filter(
      (r) => !r.isArchived && (r.resourceType === 'image' || r.resourceType === 'video' || r.resourceType === 'youtube' || r.resourceType === 'audio')
    ).length;
    return { total, favourites, archived, collectionsCount, mediaCount };
  }, [resources, collections]);

  // Filtered & Sorted Resources
  const filteredResources = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return resources
      .filter((r) => {
        // Active view filter (Archived vs Active)
        if (activeCollectionId === 'archived') {
          if (!r.isArchived) return false;
        } else {
          // Normal views ignore archived
          if (r.isArchived) return false;
        }

        // Special collection views
        if (activeCollectionId === 'favourites') {
          if (!r.isFavourite) return false;
        } else if (activeCollectionId === 'uncategorized') {
          if (r.collectionId) return false;
        } else if (activeCollectionId && activeCollectionId !== 'archived') {
          if (r.collectionId !== activeCollectionId) return false;
        }

        // Type filter
        if (selectedType !== 'all') {
          if (selectedType === 'video') {
            if (r.resourceType !== 'video' && r.resourceType !== 'youtube') return false;
          } else if (r.resourceType !== selectedType) {
            return false;
          }
        }

        // Tag filter
        if (selectedTag) {
          const hasTag = r.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
          if (!hasTag) return false;
        }

        // Text search
        if (q) {
          const matchTitle = r.title.toLowerCase().includes(q);
          const matchDesc = r.description?.toLowerCase().includes(q);
          const matchDomain = r.domain?.toLowerCase().includes(q);
          const matchUrl = r.url?.toLowerCase().includes(q);
          const matchNotes = r.notes?.toLowerCase().includes(q);
          const matchCode = r.codeContent?.toLowerCase().includes(q);
          const matchTags = r.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchDomain && !matchUrl && !matchNotes && !matchCode && !matchTags) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'newest') return b.createdAt.localeCompare(a.createdAt);
        if (sortOption === 'oldest') return a.createdAt.localeCompare(b.createdAt);
        if (sortOption === 'title') return a.title.localeCompare(b.title);
        if (sortOption === 'views') return (b.viewCount || 0) - (a.viewCount || 0);
        return 0;
      });
  }, [resources, activeCollectionId, selectedType, selectedTag, searchQuery, sortOption]);

  const value = {
    resources,
    collections,
    isLoading,
    activeCollectionId,
    setActiveCollectionId,
    selectedType,
    setSelectedType,
    selectedTag,
    setSelectedTag,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    viewMode,
    setViewMode,
    detailResource,
    setDetailResource,
    isAddModalOpen,
    setIsAddModalOpen,
    editingResource,
    setEditingResource,
    isCollectionModalOpen,
    setIsCollectionModalOpen,
    editingCollection,
    setEditingCollection,
    addResource,
    editResource,
    removeResource,
    toggleFavourite,
    toggleArchive,
    viewResource,
    addCollection,
    editCollection,
    removeCollection,
    filteredResources,
    allTags,
    stats,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault(): VaultContextType {
  const ctx = useContext(VaultContext);
  if (!ctx) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return ctx;
}

