-- Life OS Grocery List System: Cloud Synchronization & Multi-Device Persistence
-- File: supabase/migrations/20261111000000_create_grocery_tables.sql
-- Additive, idempotent migration with Row-Level Security (RLS) & Realtime support

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. GROCERY LISTS TABLE
-- ============================================================================
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

-- Indexes for grocery_lists
CREATE INDEX IF NOT EXISTS idx_grocery_lists_user_id ON public.grocery_lists (user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_lists_user_default ON public.grocery_lists (user_id, is_default);

-- Enable RLS on grocery_lists
ALTER TABLE public.grocery_lists ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can select own grocery lists" ON public.grocery_lists;
DROP POLICY IF EXISTS "Users can insert own grocery lists" ON public.grocery_lists;
DROP POLICY IF EXISTS "Users can update own grocery lists" ON public.grocery_lists;
DROP POLICY IF EXISTS "Users can delete own grocery lists" ON public.grocery_lists;

-- RLS Policies for grocery_lists
CREATE POLICY "Users can select own grocery lists"
    ON public.grocery_lists FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own grocery lists"
    ON public.grocery_lists FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own grocery lists"
    ON public.grocery_lists FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own grocery lists"
    ON public.grocery_lists FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================================================
-- 2. GROCERY ITEMS TABLE
-- ============================================================================
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

-- Indexes for grocery_items
CREATE INDEX IF NOT EXISTS idx_grocery_items_user_id ON public.grocery_items (user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_id ON public.grocery_items (list_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_user_list ON public.grocery_items (user_id, list_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_purchased ON public.grocery_items (user_id, is_purchased);

-- Enable RLS on grocery_items
ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can select own grocery items" ON public.grocery_items;
DROP POLICY IF EXISTS "Users can insert own grocery items" ON public.grocery_items;
DROP POLICY IF EXISTS "Users can update own grocery items" ON public.grocery_items;
DROP POLICY IF EXISTS "Users can delete own grocery items" ON public.grocery_items;

-- RLS Policies for grocery_items
CREATE POLICY "Users can select own grocery items"
    ON public.grocery_items FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own grocery items"
    ON public.grocery_items FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own grocery items"
    ON public.grocery_items FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own grocery items"
    ON public.grocery_items FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Optional Realtime Publication registration
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.grocery_lists;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.grocery_items;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

