// Life OS — Grocery List Context & State Management with Cloud & Mobile Synchronization
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { GroceryItem, GroceryList, GroceryCategory, GroceryProgress } from '../types/grocery';
import {
  loadGroceryData,
  saveGroceryData,
  fetchCloudGroceryData,
  syncGroceryDataToCloud,
  createMobileSyncUrl,
  parseMobileSyncHash,
  type GroceryStorageState,
} from '../services/groceryService';
import { useAuth } from './AuthContext';
import { nanoid } from 'nanoid';

export type GroceryCloudStatus = 'synced' | 'syncing' | 'offline' | 'needs_setup';

interface GroceryContextType {
  lists: GroceryList[];
  activeListId: string;
  activeList: GroceryList | undefined;
  setActiveListId: (id: string) => void;
  items: GroceryItem[];
  activeListItems: GroceryItem[];
  filteredPendingItems: GroceryItem[];
  filteredPurchasedItems: GroceryItem[];
  selectedCategory: GroceryCategory | 'all';
  setSelectedCategory: (cat: GroceryCategory | 'all') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  progress: GroceryProgress;
  addItem: (item: Omit<GroceryItem, 'id' | 'listId' | 'isPurchased' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, updates: Partial<Omit<GroceryItem, 'id' | 'listId'>>) => void;
  deleteItem: (id: string) => void;
  togglePurchased: (id: string) => void;
  createList: (name: string, color?: string, icon?: string) => string;
  renameList: (id: string, newName: string) => void;
  deleteList: (id: string) => void;
  clearPurchasedInActiveList: () => void;

  // Cloud & Mobile Sync
  cloudSyncStatus: GroceryCloudStatus;
  cloudNeedsSetup: boolean;
  syncNow: () => Promise<void>;
  getMobileSyncUrl: () => string;
  importFromPayload: (payload: GroceryStorageState) => void;
  syncNotice: string | null;
  clearSyncNotice: () => void;
}

const GroceryContext = createContext<GroceryContextType | null>(null);

export function GroceryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [lists, setLists] = useState<GroceryList[]>([]);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [activeListId, setActiveListId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<GroceryCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Cloud Sync State
  const [cloudSyncStatus, setCloudSyncStatus] = useState<GroceryCloudStatus>('offline');
  const [cloudNeedsSetup, setCloudNeedsSetup] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const clearSyncNotice = () => setSyncNotice(null);

  // 1. Initial Load: Check for Mobile Transfer Link in URL Hash first, then Local Storage
  useEffect(() => {
    // Check if mobile opened via transfer link (#grocery_sync=...)
    if (typeof window !== 'undefined' && window.location.hash.includes('grocery_sync=')) {
      const imported = parseMobileSyncHash(window.location.hash);
      if (imported) {
        setLists(imported.lists);
        setItems(imported.items);
        setActiveListId(imported.activeListId);
        saveGroceryData(userId, imported);
        setIsLoaded(true);
        setSyncNotice('Grocery list successfully synced to mobile via transfer link!');
        // Clean URL hash without reload
        try {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        } catch {}
        return;
      }
    }

    // Otherwise load local mirror
    const data = loadGroceryData(userId);
    setLists(data.lists);
    setItems(data.items);
    setActiveListId(data.activeListId);
    setIsLoaded(true);
  }, [userId]);

  // 2. Cloud Fetch: If user is authenticated, query Supabase for latest cloud lists
  useEffect(() => {
    if (!userId || userId === 'guest') {
      setCloudSyncStatus('offline');
      return;
    }

    let isMounted = true;
    async function loadCloud() {
      setCloudSyncStatus('syncing');
      try {
        const { state, schemaMissing } = await fetchCloudGroceryData(userId as string);
        if (!isMounted) return;

        if (schemaMissing) {
          setCloudNeedsSetup(true);
          setCloudSyncStatus('needs_setup');
          return;
        }

        if (state && state.lists.length > 0) {
          setLists(state.lists);
          setItems(state.items);
          setActiveListId(state.activeListId);
          setCloudSyncStatus('synced');
          setCloudNeedsSetup(false);
        } else {
          // If cloud has no records yet, upload current local list to initialize cloud!
          const localData = loadGroceryData(userId);
          const uploadRes = await syncGroceryDataToCloud(userId as string, localData);
          if (uploadRes.schemaMissing) {
            setCloudNeedsSetup(true);
            setCloudSyncStatus('needs_setup');
          } else if (uploadRes.success) {
            setCloudSyncStatus('synced');
            setCloudNeedsSetup(false);
          }
        }
      } catch {
        if (isMounted) setCloudSyncStatus('offline');
      }
    }

    loadCloud();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  // 3. Persist to Local Storage & Sync to Cloud on Changes
  useEffect(() => {
    if (!isLoaded) return;

    const currentState: GroceryStorageState = {
      lists,
      items,
      activeListId,
    };

    // Always mirror to local storage immediately
    saveGroceryData(userId, currentState);

    // If authenticated, sync to cloud asynchronously
    if (userId && userId !== 'guest' && !cloudNeedsSetup) {
      setCloudSyncStatus('syncing');
      syncGroceryDataToCloud(userId, currentState).then((res) => {
        if (res.schemaMissing) {
          setCloudNeedsSetup(true);
          setCloudSyncStatus('needs_setup');
        } else if (res.success) {
          setCloudSyncStatus('synced');
        } else {
          setCloudSyncStatus('offline');
        }
      });
    }
  }, [lists, items, activeListId, userId, isLoaded, cloudNeedsSetup]);

  // Manual Trigger to Push / Pull Cloud Sync
  const syncNow = useCallback(async () => {
    if (!userId || userId === 'guest') {
      setSyncNotice('Sign in to your Life OS account to enable cross-device cloud sync.');
      return;
    }
    setCloudSyncStatus('syncing');
    const currentState: GroceryStorageState = { lists, items, activeListId };
    const res = await syncGroceryDataToCloud(userId, currentState);
    if (res.schemaMissing) {
      setCloudNeedsSetup(true);
      setCloudSyncStatus('needs_setup');
      setSyncNotice('Supabase cloud table setup required. Click "Sync with Mobile" to run SQL.');
    } else if (res.success) {
      setCloudSyncStatus('synced');
      setCloudNeedsSetup(false);
      setSyncNotice('Grocery list successfully synced to cloud & mobile!');
    } else {
      setCloudSyncStatus('offline');
      setSyncNotice(`Sync issue: ${res.error || 'Server unreachable'}`);
    }
  }, [userId, lists, items, activeListId]);

  // Generate Mobile Instant Transfer Link
  const getMobileSyncUrl = useCallback(() => {
    return createMobileSyncUrl({ lists, items, activeListId });
  }, [lists, items, activeListId]);

  // Direct Payload Import
  const importFromPayload = useCallback(
    (payload: GroceryStorageState) => {
      setLists(payload.lists);
      setItems(payload.items);
      setActiveListId(payload.activeListId);
      saveGroceryData(userId, payload);
      setSyncNotice('Grocery list data imported successfully!');
    },
    [userId]
  );

  // Find active list object
  const activeList = useMemo(() => {
    return lists.find((l) => l.id === activeListId) || lists[0];
  }, [lists, activeListId]);

  // All items belonging to current list
  const activeListItems = useMemo(() => {
    const currentId = activeList?.id || activeListId;
    return items.filter((i) => i.listId === currentId);
  }, [items, activeList, activeListId]);

  // Filtered pending and purchased lists
  const { filteredPendingItems, filteredPurchasedItems } = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const matchesFilter = (item: GroceryItem) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q));
      return matchCat && matchQuery;
    };

    const pending = activeListItems.filter((i) => !i.isPurchased && matchesFilter(i));
    const purchased = activeListItems.filter((i) => i.isPurchased && matchesFilter(i));

    return {
      filteredPendingItems: pending,
      filteredPurchasedItems: purchased,
    };
  }, [activeListItems, selectedCategory, searchQuery]);

  // Shopping progress & estimated total costs
  const progress: GroceryProgress = useMemo(() => {
    const total = activeListItems.length;
    const purchased = activeListItems.filter((i) => i.isPurchased).length;
    const remaining = total - purchased;
    const percentage = total > 0 ? Math.round((purchased / total) * 100) : 0;

    let totalEstimatedCost = 0;
    let purchasedCost = 0;

    for (const item of activeListItems) {
      if (item.estimatedPrice && item.estimatedPrice > 0) {
        const itemTotal = item.estimatedPrice * (item.quantity > 0 ? item.quantity : 1);
        totalEstimatedCost += itemTotal;
        if (item.isPurchased) {
          purchasedCost += itemTotal;
        }
      }
    }

    return {
      total,
      purchased,
      remaining,
      percentage,
      totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
      purchasedCost: Math.round(purchasedCost * 100) / 100,
    };
  }, [activeListItems]);

  // Actions
  const addItem = useCallback(
    (itemData: Omit<GroceryItem, 'id' | 'listId' | 'isPurchased' | 'createdAt' | 'updatedAt'>) => {
      const currentListId = activeList?.id || activeListId;
      const now = new Date().toISOString();
      const newItem: GroceryItem = {
        ...itemData,
        id: `item_${Date.now()}_${nanoid(6)}`,
        listId: currentListId,
        isPurchased: false,
        createdAt: now,
        updatedAt: now,
      };
      setItems((prev) => [newItem, ...prev]);
    },
    [activeList, activeListId]
  );

  const updateItem = useCallback(
    (id: string, updates: Partial<Omit<GroceryItem, 'id' | 'listId'>>) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                ...updates,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );
    },
    []
  );

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const togglePurchased = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextPurchased = !item.isPurchased;
          return {
            ...item,
            isPurchased: nextPurchased,
            purchasedAt: nextPurchased ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
  }, []);

  const createList = useCallback(
    (name: string, color = '#10b981', icon = 'ShoppingCart'): string => {
      const now = new Date().toISOString();
      const newListId = `list_${Date.now()}_${nanoid(5)}`;
      const newList: GroceryList = {
        id: newListId,
        name: name.trim(),
        color,
        icon,
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      };
      setLists((prev) => [...prev, newList]);
      setActiveListId(newListId);
      return newListId;
    },
    []
  );

  const renameList = useCallback((id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setLists((prev) =>
      prev.map((list) =>
        list.id === id
          ? {
              ...list,
              name: trimmed,
              updatedAt: new Date().toISOString(),
            }
            : list
      )
    );
  }, []);

  const deleteList = useCallback(
    (id: string) => {
      setLists((prev) => {
        if (prev.length <= 1) return prev; // Cannot delete only list
        const remaining = prev.filter((l) => l.id !== id);
        if (activeListId === id) {
          setActiveListId(remaining[0].id);
        }
        return remaining;
      });
      // Also delete all items in that list
      setItems((prev) => prev.filter((item) => item.listId !== id));
    },
    [activeListId]
  );

  const clearPurchasedInActiveList = useCallback(() => {
    const currentId = activeList?.id || activeListId;
    setItems((prev) => prev.filter((i) => !(i.listId === currentId && i.isPurchased)));
  }, [activeList, activeListId]);

  return (
    <GroceryContext.Provider
      value={{
        lists,
        activeListId,
        activeList,
        setActiveListId,
        items,
        activeListItems,
        filteredPendingItems,
        filteredPurchasedItems,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        progress,
        addItem,
        updateItem,
        deleteItem,
        togglePurchased,
        createList,
        renameList,
        deleteList,
        clearPurchasedInActiveList,
        cloudSyncStatus,
        cloudNeedsSetup,
        syncNow,
        getMobileSyncUrl,
        importFromPayload,
        syncNotice,
        clearSyncNotice,
      }}
    >
      {children}
    </GroceryContext.Provider>
  );
}

export function useGrocery() {
  const context = useContext(GroceryContext);
  if (!context) {
    throw new Error('useGrocery must be used within a GroceryProvider');
  }
  return context;
}
