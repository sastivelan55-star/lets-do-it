// Life OS — Grocery List Storage & Persistence Service
import type { GroceryItem, GroceryList } from '../types/grocery';

const STORAGE_PREFIX = 'lifeos_groceries_';

export interface GroceryStorageState {
  lists: GroceryList[];
  items: GroceryItem[];
  activeListId: string;
}

const DEFAULT_LISTS: GroceryList[] = [
  {
    id: 'list-weekly',
    name: 'Weekly Groceries',
    color: '#10b981',
    icon: 'ShoppingCart',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'list-essentials',
    name: 'Home Essentials',
    color: '#38bdf8',
    icon: 'Package',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'list-party',
    name: 'Party Shopping',
    color: '#ec4899',
    icon: 'Sparkles',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const STARTER_ITEMS: GroceryItem[] = [
  {
    id: 'item-apples',
    listId: 'list-weekly',
    name: 'Crisp Red Apples',
    quantity: 1,
    unit: 'kg',
    category: 'fruits',
    estimatedPrice: 180,
    notes: 'Sweet & juicy for study snack',
    isPurchased: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-spinach',
    listId: 'list-weekly',
    name: 'Fresh Spinach (Keerai)',
    quantity: 2,
    unit: 'bunch',
    category: 'vegetables',
    estimatedPrice: 40,
    notes: 'Green leaves for lunch',
    isPurchased: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-milk',
    listId: 'list-weekly',
    name: 'Organic Milk',
    quantity: 2,
    unit: 'litre',
    category: 'dairy',
    estimatedPrice: 70,
    isPurchased: true,
    purchasedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-bread',
    listId: 'list-weekly',
    name: 'Whole Wheat Sourdough Bread',
    quantity: 1,
    unit: 'packs',
    category: 'bakery',
    estimatedPrice: 65,
    isPurchased: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'item-detergent',
    listId: 'list-essentials',
    name: 'Eco Laundry Detergent',
    quantity: 1,
    unit: 'bottles',
    category: 'household',
    estimatedPrice: 320,
    isPurchased: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function getStorageKey(userId?: string): string {
  const safeId = userId && userId.trim() ? userId.trim() : 'guest';
  return `${STORAGE_PREFIX}${safeId}`;
}

export function loadGroceryData(userId?: string): GroceryStorageState {
  const key = getStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return {
        lists: DEFAULT_LISTS,
        items: STARTER_ITEMS,
        activeListId: DEFAULT_LISTS[0].id,
      };
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.lists) || parsed.lists.length === 0) {
      return {
        lists: DEFAULT_LISTS,
        items: STARTER_ITEMS,
        activeListId: DEFAULT_LISTS[0].id,
      };
    }

    return {
      lists: parsed.lists,
      items: Array.isArray(parsed.items) ? parsed.items : [],
      activeListId: parsed.activeListId || parsed.lists[0].id,
    };
  } catch (err) {
    console.error('Failed to load grocery data from local storage:', err);
    return {
      lists: DEFAULT_LISTS,
      items: STARTER_ITEMS,
      activeListId: DEFAULT_LISTS[0].id,
    };
  }
}

export function saveGroceryData(userId: string | undefined, data: GroceryStorageState): void {
  const key = getStorageKey(userId);
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save grocery data to local storage:', err);
  }
}

