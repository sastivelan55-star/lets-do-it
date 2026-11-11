// Life OS — Grocery List Context & Automatic Cloud Synchronization
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { GroceryItem, GroceryList, GroceryCategory, GroceryProgress } from '../types/grocery';
import {
  loadGroceryData,
  saveGroceryData,
  fetchCloudGroceryData,
  syncGroceryDataToCloud,
  deleteCloudGroceryItem,
  deleteCloudGroceryList,
  type GroceryStorageState,
} from '../services/groceryService';
import { getSupabase } from '../services/supabaseClient';
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

  // Cloud Sync
  cloudSyncStatus: GroceryCloudStatus;
  cloudNeedsSetup: boolean;
  syncNow: () => Promise<void>;
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

  // 1. Initial Load: Load local storage cache immediately for instant render
  useEffect(() => {
    const data = loadGroceryData(userId);
    setLists(data.lists);
    setItems(data.items);
    setActiveListId(data.activeListId);
    setIsLoaded(true);
  }, [userId]);

  // 2. Cloud Sync: When authenticated, sync with Supabase Cloud
  const pullCloudData = useCallback(async () => {
    if (!userId || userId === 'guest') {
      setCloudSyncStatus('offline');
      return;
    }

    setCloudSyncStatus('syncing');
    try {
      const { state, schemaMissing } = await fetchCloudGroceryData(userId);
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
        // Cloud has no data yet — push local list to seed cloud
        const localData = loadGroceryData(userId);
        const pushRes = await syncGroceryDataToCloud(userId, localData);
        if (pushRes.schemaMissing) {
          setCloudNeedsSetup(true);
          setCloudSyncStatus('needs_setup');
        } else if (pushRes.success) {
          setCloudSyncStatus('synced');
          setCloudNeedsSetup(false);
        }
      }
    } catch {
      setCloudSyncStatus('offline');
    }
  }, [userId]);

  // Initial cloud fetch on mount or user change
  useEffect(() => {
    pullCloudData();
  }, [pullCloudData]);

  // 3. Auto-sync on Window Focus / Visibility Change (ensures mobile gets latest updates when opened)
  useEffect(() => {
    if (!userId || userId === 'guest') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pullCloudData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [userId, pullCloudData]);

  // 4. Supabase Realtime Subscription: Update immediately when changed on desktop/mobile
  useEffect(() => {
    if (!userId || userId === 'guest') return;

    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel(`grocery_realtime_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'grocery_items', filter: `user_id=eq.${userId}` },
        () => {
          fetchCloudGroceryData(userId).then(({ state }) => {
            if (state) {
              setLists(state.lists);
              setItems(state.items);
              saveGroceryData(userId, state);
            }
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'grocery_lists', filter: `user_id=eq.${userId}` },
        () => {
          fetchCloudGroceryData(userId).then(({ state }) => {
            if (state) {
              setLists(state.lists);
              setItems(state.items);
              saveGroceryData(userId, state);
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // 5. Persist to Local Storage & Push to Cloud on Changes
  useEffect(() => {
    if (!isLoaded) return;

    const currentState: GroceryStorageState = {
      lists,
      items,
      activeListId,
    };

    // Always mirror to local storage immediately
    saveGroceryData(userId, currentState);

    // If authenticated, push updates to cloud in background
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

  // Manual Trigger to Force-Sync
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
      setSyncNotice('Database schema setup required in Supabase.');
    } else if (res.success) {
      setCloudSyncStatus('synced');
      setCloudNeedsSetup(false);
      setSyncNotice('Grocery list successfully synced across web & mobile!');
    } else {
      setCloudSyncStatus('offline');
      setSyncNotice(`Sync notice: ${res.error || 'Server unreachable'}`);
    }
  }, [userId, lists, items, activeListId]);

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

  const deleteItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (userId && userId !== 'guest') {
        deleteCloudGroceryItem(userId, id);
      }
    },
    [userId]
  );

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
      if (userId && userId !== 'guest') {
        deleteCloudGroceryList(userId, id);
      }
    },
    [activeListId, userId]
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
