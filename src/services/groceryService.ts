// Life OS — Grocery List Storage, Cloud Synchronization & Mobile Transfer Service
import type { GroceryItem, GroceryList } from '../types/grocery';
import { getSupabase } from './supabaseClient';
import { logSafeError } from '../utils/errorUtils';

const STORAGE_PREFIX = 'lifeos_groceries_';

export interface GroceryStorageState {
  lists: GroceryList[];
  items: GroceryItem[];
  activeListId: string;
}

export interface DbGroceryListRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbGroceryItemRow {
  id: string;
  user_id: string;
  list_id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  estimated_price: number | null;
  notes: string | null;
  is_purchased: boolean;
  purchased_at: string | null;
  created_at: string;
  updated_at: string;
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

export const GROCERY_SETUP_SQL = `-- Life OS Grocery List System: Cloud Synchronization & Multi-Device Persistence
-- File: supabase/migrations/20261111000000_create_grocery_tables.sql
-- Additive, idempotent migration with Row-Level Security (RLS) & Realtime support

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.grocery_lists (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    color TEXT NOT NULL DEFAULT '#10b981',
    icon TEXT DEFAULT 'shopping-cart',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_grocery_lists_user_id ON public.grocery_lists (user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_lists_user_default ON public.grocery_lists (user_id, is_default);

ALTER TABLE public.grocery_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own grocery lists" ON public.grocery_lists;
DROP POLICY IF EXISTS "Users can insert own grocery lists" ON public.grocery_lists;
DROP POLICY IF EXISTS "Users can update own grocery lists" ON public.grocery_lists;
DROP POLICY IF EXISTS "Users can delete own grocery lists" ON public.grocery_lists;

CREATE POLICY "Users can select own grocery lists" ON public.grocery_lists FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own grocery lists" ON public.grocery_lists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own grocery lists" ON public.grocery_lists FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own grocery lists" ON public.grocery_lists FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.grocery_items (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    list_id TEXT NOT NULL REFERENCES public.grocery_lists(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    quantity NUMERIC NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit TEXT NOT NULL DEFAULT 'pcs',
    category TEXT NOT NULL DEFAULT 'other',
    estimated_price NUMERIC,
    notes TEXT,
    is_purchased BOOLEAN NOT NULL DEFAULT false,
    purchased_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_grocery_items_user_id ON public.grocery_items (user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_id ON public.grocery_items (list_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_user_list ON public.grocery_items (user_id, list_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_purchased ON public.grocery_items (user_id, is_purchased);

ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own grocery items" ON public.grocery_items;
DROP POLICY IF EXISTS "Users can insert own grocery items" ON public.grocery_items;
DROP POLICY IF EXISTS "Users can update own grocery items" ON public.grocery_items;
DROP POLICY IF EXISTS "Users can delete own grocery items" ON public.grocery_items;

CREATE POLICY "Users can select own grocery items" ON public.grocery_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own grocery items" ON public.grocery_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own grocery items" ON public.grocery_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own grocery items" ON public.grocery_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.grocery_lists;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.grocery_items;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;`;

function getStorageKey(userId?: string): string {
  const safeId = userId && userId.trim() ? userId.trim() : 'guest';
  return `${STORAGE_PREFIX}${safeId}`;
}

// ── SYNCHRONOUS LOCAL STORAGE PERSISTENCE (OFFLINE FIRST) ───────────────────
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

// ── SUPABASE CLOUD SYNCHRONIZATION ──────────────────────────────────────────
export async function fetchCloudGroceryData(
  userId: string
): Promise<{ state: GroceryStorageState | null; schemaMissing: boolean }> {
  const supabase = getSupabase();
  if (!supabase || !userId || userId === 'guest') {
    return { state: null, schemaMissing: false };
  }

  try {
    // 1. Fetch lists
    const listsRes = await supabase
      .from('grocery_lists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (listsRes.error) {
      const isMissing =
        listsRes.error.code === '42P01' ||
        listsRes.error.message.includes('does not exist') ||
        listsRes.error.message.includes('schema');
      return { state: null, schemaMissing: isMissing };
    }

    // 2. Fetch items
    const itemsRes = await supabase
      .from('grocery_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (itemsRes.error) {
      const isMissing =
        itemsRes.error.code === '42P01' ||
        itemsRes.error.message.includes('does not exist') ||
        itemsRes.error.message.includes('schema');
      return { state: null, schemaMissing: isMissing };
    }

    const cloudLists: GroceryList[] = (listsRes.data as DbGroceryListRow[]).map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color || '#10b981',
      icon: r.icon || 'ShoppingCart',
      isDefault: Boolean(r.is_default),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    const cloudItems: GroceryItem[] = (itemsRes.data as DbGroceryItemRow[]).map((r) => ({
      id: r.id,
      listId: r.list_id,
      name: r.name,
      quantity: Number(r.quantity) || 1,
      unit: (r.unit as any) || 'pcs',
      category: (r.category as any) || 'other',
      estimatedPrice: r.estimated_price !== null ? Number(r.estimated_price) : undefined,
      notes: r.notes || undefined,
      isPurchased: Boolean(r.is_purchased),
      purchasedAt: r.purchased_at || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    if (cloudLists.length > 0) {
      const state: GroceryStorageState = {
        lists: cloudLists,
        items: cloudItems,
        activeListId: cloudLists[0].id,
      };
      // Mirror to local storage for instant offline access
      saveGroceryData(userId, state);
      return { state, schemaMissing: false };
    }
  } catch (err) {
    logSafeError('fetchCloudGroceryData', err);
  }

  return { state: null, schemaMissing: false };
}

export async function syncGroceryDataToCloud(
  userId: string,
  data: GroceryStorageState
): Promise<{ success: boolean; schemaMissing: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase || !userId || userId === 'guest') {
    return { success: false, schemaMissing: false, error: 'User is not logged into cloud account' };
  }

  try {
    // Upsert Lists
    const listRows = data.lists.map((l) => ({
      id: l.id,
      user_id: userId,
      name: l.name,
      color: l.color || '#10b981',
      icon: l.icon || 'ShoppingCart',
      is_default: Boolean(l.isDefault),
      created_at: l.createdAt,
      updated_at: new Date().toISOString(),
    }));

    const listsRes = await supabase.from('grocery_lists').upsert(listRows, { onConflict: 'id' });
    if (listsRes.error) {
      const isMissing =
        listsRes.error.code === '42P01' ||
        listsRes.error.message.includes('does not exist') ||
        listsRes.error.message.includes('schema');
      return { success: false, schemaMissing: isMissing, error: listsRes.error.message };
    }

    // Upsert Items
    if (data.items.length > 0) {
      const itemRows = data.items.map((i) => ({
        id: i.id,
        user_id: userId,
        list_id: i.listId,
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        category: i.category,
        estimated_price: i.estimatedPrice ?? null,
        notes: i.notes ?? null,
        is_purchased: i.isPurchased,
        purchased_at: i.purchasedAt ?? null,
        created_at: i.createdAt,
        updated_at: new Date().toISOString(),
      }));

      const itemsRes = await supabase.from('grocery_items').upsert(itemRows, { onConflict: 'id' });
      if (itemsRes.error) {
        const isMissing =
          itemsRes.error.code === '42P01' ||
          itemsRes.error.message.includes('does not exist') ||
          itemsRes.error.message.includes('schema');
        return { success: false, schemaMissing: isMissing, error: itemsRes.error.message };
      }
    }

    return { success: true, schemaMissing: false };
  } catch (err: any) {
    logSafeError('syncGroceryDataToCloud', err);
    return { success: false, schemaMissing: false, error: err?.message || 'Network sync error' };
  }
}

// ── INSTANT MOBILE TRANSFER LINK (URL HASH / QR COMPATIBLE) ─────────────────
export function createMobileSyncUrl(data: GroceryStorageState): string {
  try {
    const jsonStr = JSON.stringify({
      lists: data.lists,
      items: data.items,
      activeListId: data.activeListId,
      t: Date.now(),
    });
    // Base64 encode for compact URL transfer
    const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/#grocery_sync=${encoded}`;
  } catch (err) {
    console.error('Failed to encode grocery sync url:', err);
    return '';
  }
}

export function parseMobileSyncHash(hash: string): GroceryStorageState | null {
  try {
    if (!hash || !hash.includes('grocery_sync=')) return null;
    const raw = hash.split('grocery_sync=')[1];
    if (!raw) return null;
    const jsonStr = decodeURIComponent(escape(atob(raw)));
    const parsed = JSON.parse(jsonStr);
    if (parsed && Array.isArray(parsed.lists) && Array.isArray(parsed.items)) {
      return {
        lists: parsed.lists,
        items: parsed.items,
        activeListId: parsed.activeListId || parsed.lists[0]?.id || 'list-weekly',
      };
    }
  } catch (err) {
    console.error('Failed to parse mobile sync payload:', err);
  }
  return null;
}
