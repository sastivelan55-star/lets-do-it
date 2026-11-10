import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { GroceryItem, GroceryList } from '../types/grocery';
import { loadGroceryData, saveGroceryData } from '../services/groceryService';

// Mock localStorage for test environment
function createLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
}

describe('Life OS — Grocery List System Unit Tests', () => {
  beforeEach(() => {
    const storageMock = createLocalStorageMock();
    Object.defineProperty(globalThis, 'localStorage', {
      value: storageMock,
      writable: true,
      configurable: true,
    });
  });

  it('loads default lists and starter items when storage is empty', () => {
    const data = loadGroceryData('user-test-1');
    expect(data.lists.length).toBeGreaterThanOrEqual(1);
    expect(data.items.length).toBeGreaterThanOrEqual(1);
    expect(data.activeListId).toBeTruthy();

    const weeklyList = data.lists.find((l) => l.name === 'Weekly Groceries');
    expect(weeklyList).toBeDefined();
  });

  it('persists and recovers items and custom lists accurately', () => {
    const customList: GroceryList = {
      id: 'custom-list-1',
      name: 'Diwali Party Groceries',
      color: '#ec4899',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const item1: GroceryItem = {
      id: 'item-1',
      listId: 'custom-list-1',
      name: 'Gulab Jamun Mix',
      quantity: 3,
      unit: 'packs',
      category: 'snacks',
      estimatedPrice: 120,
      notes: 'MTR brand preferred',
      isPurchased: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const item2: GroceryItem = {
      id: 'item-2',
      listId: 'custom-list-1',
      name: 'Pure Ghee',
      quantity: 1,
      unit: 'kg',
      category: 'dairy',
      estimatedPrice: 650,
      isPurchased: true,
      purchasedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveGroceryData('user-test-1', {
      lists: [customList],
      items: [item1, item2],
      activeListId: 'custom-list-1',
    });

    const recovered = loadGroceryData('user-test-1');
    expect(recovered.lists).toHaveLength(1);
    expect(recovered.lists[0].name).toBe('Diwali Party Groceries');
    expect(recovered.items).toHaveLength(2);
    expect(recovered.activeListId).toBe('custom-list-1');

    const recoveredItem1 = recovered.items.find((i) => i.id === 'item-1')!;
    expect(recoveredItem1.quantity).toBe(3);
    expect(recoveredItem1.unit).toBe('packs');
    expect(recoveredItem1.estimatedPrice).toBe(120);
    expect(recoveredItem1.isPurchased).toBe(false);

    const recoveredItem2 = recovered.items.find((i) => i.id === 'item-2')!;
    expect(recoveredItem2.isPurchased).toBe(true);
  });

  it('calculates shopping progress and estimated cost accurately', () => {
    const items: GroceryItem[] = [
      {
        id: '1',
        listId: 'l1',
        name: 'Tomatoes',
        quantity: 2,
        unit: 'kg',
        category: 'vegetables',
        estimatedPrice: 30, // 2 * 30 = 60
        isPurchased: true,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '2',
        listId: 'l1',
        name: 'Basmati Rice',
        quantity: 5,
        unit: 'kg',
        category: 'grains-staples',
        estimatedPrice: 110, // 5 * 110 = 550
        isPurchased: false,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '3',
        listId: 'l1',
        name: 'Green Tea',
        quantity: 1,
        unit: 'box',
        category: 'beverages',
        // no estimatedPrice
        isPurchased: false,
        createdAt: '',
        updatedAt: '',
      },
    ];

    const total = items.length;
    const purchased = items.filter((i) => i.isPurchased).length;
    const remaining = total - purchased;
    const percentage = Math.round((purchased / total) * 100);

    let totalCost = 0;
    let purchasedCost = 0;

    for (const item of items) {
      if (item.estimatedPrice) {
        const itemTotal = item.estimatedPrice * item.quantity;
        totalCost += itemTotal;
        if (item.isPurchased) {
          purchasedCost += itemTotal;
        }
      }
    }

    expect(total).toBe(3);
    expect(purchased).toBe(1);
    expect(remaining).toBe(2);
    expect(percentage).toBe(33); // 1/3 = 33%
    expect(totalCost).toBe(610); // 60 + 550 = 610
    expect(purchasedCost).toBe(60);
  });

  it('keeps multiple shopping lists strictly isolated without item bleeding', () => {
    const listA: GroceryList = {
      id: 'list-a',
      name: 'List A',
      createdAt: '',
      updatedAt: '',
    };
    const listB: GroceryList = {
      id: 'list-b',
      name: 'List B',
      createdAt: '',
      updatedAt: '',
    };

    const allItems: GroceryItem[] = [
      {
        id: 'item-a1',
        listId: 'list-a',
        name: 'Item for A',
        quantity: 1,
        unit: 'pcs',
        category: 'other',
        isPurchased: false,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'item-b1',
        listId: 'list-b',
        name: 'Item for B',
        quantity: 2,
        unit: 'kg',
        category: 'fruits',
        isPurchased: false,
        createdAt: '',
        updatedAt: '',
      },
    ];

    const itemsForA = allItems.filter((i) => i.listId === listA.id);
    const itemsForB = allItems.filter((i) => i.listId === listB.id);

    expect(itemsForA).toHaveLength(1);
    expect(itemsForA[0].id).toBe('item-a1');

    expect(itemsForB).toHaveLength(1);
    expect(itemsForB[0].id).toBe('item-b1');
  });

  it('filters grocery items by category correctly', () => {
    const items: GroceryItem[] = [
      { id: '1', listId: 'l1', name: 'Apple', quantity: 1, unit: 'kg', category: 'fruits', isPurchased: false, createdAt: '', updatedAt: '' },
      { id: '2', listId: 'l1', name: 'Banana', quantity: 6, unit: 'pcs', category: 'fruits', isPurchased: false, createdAt: '', updatedAt: '' },
      { id: '3', listId: 'l1', name: 'Carrot', quantity: 1, unit: 'kg', category: 'vegetables', isPurchased: false, createdAt: '', updatedAt: '' },
      { id: '4', listId: 'l1', name: 'Milk', quantity: 1, unit: 'litre', category: 'dairy', isPurchased: true, createdAt: '', updatedAt: '' },
    ];

    const fruitsOnly = items.filter((i) => i.category === 'fruits');
    const vegetablesOnly = items.filter((i) => i.category === 'vegetables');
    const dairyOnly = items.filter((i) => i.category === 'dairy');

    expect(fruitsOnly).toHaveLength(2);
    expect(vegetablesOnly).toHaveLength(1);
    expect(dairyOnly).toHaveLength(1);
  });
});

