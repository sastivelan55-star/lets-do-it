// Life OS — Grocery List Context & State Management
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { GroceryItem, GroceryList, GroceryCategory, GroceryProgress } from '../types/grocery';
import { loadGroceryData, saveGroceryData } from '../services/groceryService';
import { useAuth } from './AuthContext';
import { nanoid } from 'nanoid';

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

  // Load persisted data on mount / user change
  useEffect(() => {
    const data = loadGroceryData(userId);
    setLists(data.lists);
    setItems(data.items);
    setActiveListId(data.activeListId);
    setIsLoaded(true);
  }, [userId]);

  // Persist data whenever lists, items, or activeListId change (after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    saveGroceryData(userId, {
      lists,
      items,
      activeListId,
    });
  }, [lists, items, activeListId, userId, isLoaded]);

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
      const newItem: GroceryItem = {
        ...itemData,
        id: nanoid(),
        listId: currentListId,
        isPurchased: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setItems((prev) => [newItem, ...prev]);
    },
    [activeList, activeListId]
  );

  const updateItem = useCallback(
    (id: string, updates: Partial<Omit<GroceryItem, 'id' | 'listId'>>) => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                ...updates,
                updatedAt: new Date().toISOString(),
              }
            : i
        )
      );
    },
    []
  );

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const togglePurchased = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const nextState = !i.isPurchased;
        return {
          ...i,
          isPurchased: nextState,
          purchasedAt: nextState ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const createList = useCallback((name: string, color = '#10b981', icon = 'ShoppingCart'): string => {
    const id = `list-${nanoid(8)}`;
    const newList: GroceryList = {
      id,
      name: name.trim() || 'New List',
      color,
      icon,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLists((prev) => [...prev, newList]);
    setActiveListId(id);
    return id;
  }, []);

  const renameList = useCallback((id: string, newName: string) => {
    setLists((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              name: newName.trim() || l.name,
              updatedAt: new Date().toISOString(),
            }
          : l
      )
    );
  }, []);

  const deleteList = useCallback(
    (id: string) => {
      if (lists.length <= 1) return; // Always preserve at least one list

      // Remove the list and all its associated items
      setLists((prev) => prev.filter((l) => l.id !== id));
      setItems((prev) => prev.filter((i) => i.listId !== id));

      if (activeListId === id) {
        const remaining = lists.filter((l) => l.id !== id);
        if (remaining.length > 0) {
          setActiveListId(remaining[0].id);
        }
      }
    },
    [lists, activeListId]
  );

  const clearPurchasedInActiveList = useCallback(() => {
    const currentListId = activeList?.id || activeListId;
    setItems((prev) => prev.filter((i) => !(i.listId === currentListId && i.isPurchased)));
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

