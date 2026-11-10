// Life OS — Grocery List System Types

export type GroceryCategory =
  | 'fruits'
  | 'vegetables'
  | 'dairy'
  | 'meat-seafood'
  | 'snacks'
  | 'beverages'
  | 'bakery'
  | 'grains-staples'
  | 'household'
  | 'personal-care'
  | 'other';

export type GroceryUnit =
  | 'kg'
  | 'g'
  | 'litre'
  | 'ml'
  | 'pcs'
  | 'packs'
  | 'bottles'
  | 'cans'
  | 'box'
  | 'bunch';

export interface GroceryItem {
  id: string;
  listId: string;
  name: string;
  quantity: number;
  unit: GroceryUnit;
  category: GroceryCategory;
  estimatedPrice?: number;
  notes?: string;
  isPurchased: boolean;
  purchasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroceryList {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroceryProgress {
  total: number;
  purchased: number;
  remaining: number;
  percentage: number;
  totalEstimatedCost: number;
  purchasedCost: number;
}

export interface CategoryMeta {
  id: GroceryCategory;
  label: string;
  emoji: string;
  color: string;
}

export const GROCERY_CATEGORIES: CategoryMeta[] = [
  { id: 'fruits', label: 'Fruits', emoji: '🍎', color: '#f87171' },
  { id: 'vegetables', label: 'Vegetables', emoji: '🥦', color: '#34d399' },
  { id: 'dairy', label: 'Dairy', emoji: '🧀', color: '#fbbf24' },
  { id: 'meat-seafood', label: 'Meat & Seafood', emoji: '🥩', color: '#f43f5e' },
  { id: 'snacks', label: 'Snacks', emoji: '🍿', color: '#fb923c' },
  { id: 'beverages', label: 'Beverages', emoji: '☕', color: '#38bdf8' },
  { id: 'bakery', label: 'Bakery', emoji: '🥖', color: '#eab308' },
  { id: 'grains-staples', label: 'Grains & Staples', emoji: '🌾', color: '#a78bfa' },
  { id: 'household', label: 'Household', emoji: '🧼', color: '#06b6d4' },
  { id: 'personal-care', label: 'Personal Care', emoji: '🧴', color: '#ec4899' },
  { id: 'other', label: 'Other', emoji: '📦', color: '#94a3b8' },
];

export const GROCERY_UNITS: { id: GroceryUnit; label: string }[] = [
  { id: 'pcs', label: 'Pieces (pcs)' },
  { id: 'kg', label: 'Kilograms (kg)' },
  { id: 'g', label: 'Grams (g)' },
  { id: 'litre', label: 'Litres (L)' },
  { id: 'ml', label: 'Millilitres (ml)' },
  { id: 'packs', label: 'Packets (pk)' },
  { id: 'bottles', label: 'Bottles (btl)' },
  { id: 'cans', label: 'Cans' },
  { id: 'box', label: 'Boxes' },
  { id: 'bunch', label: 'Bunches' },
];

