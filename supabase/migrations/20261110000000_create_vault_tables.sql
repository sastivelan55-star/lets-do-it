-- Life OS Stage 5: Personal Resource Library & Digital Vault Migration
-- File: supabase/migrations/20261110000000_create_vault_tables.sql
-- Idempotent, safe migration with Row-Level Security (RLS) and indexes

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Updated_at timestamp trigger helper (idempotent)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. VAULT COLLECTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vault_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    description TEXT,
    color TEXT NOT NULL DEFAULT '#a855f7',
    icon TEXT,
    cover_image TEXT,
    is_favourite BOOLEAN NOT NULL DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for vault_collections
CREATE INDEX IF NOT EXISTS idx_vault_collections_user_id ON public.vault_collections (user_id);
CREATE INDEX IF NOT EXISTS idx_vault_collections_user_order ON public.vault_collections (user_id, order_index ASC);
CREATE INDEX IF NOT EXISTS idx_vault_collections_favourite ON public.vault_collections (user_id, is_favourite);

-- Updated_at trigger for vault_collections
DROP TRIGGER IF EXISTS set_vault_collections_updated_at ON public.vault_collections;
CREATE TRIGGER set_vault_collections_updated_at
    BEFORE UPDATE ON public.vault_collections
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS on vault_collections
ALTER TABLE public.vault_collections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can select own vault collections" ON public.vault_collections;
DROP POLICY IF EXISTS "Users can insert own vault collections" ON public.vault_collections;
DROP POLICY IF EXISTS "Users can update own vault collections" ON public.vault_collections;
DROP POLICY IF EXISTS "Users can delete own vault collections" ON public.vault_collections;

-- RLS Policies for vault_collections
CREATE POLICY "Users can select own vault collections"
    ON public.vault_collections FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vault collections"
    ON public.vault_collections FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vault collections"
    ON public.vault_collections FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vault collections"
    ON public.vault_collections FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- ============================================================================
-- 2. VAULT RESOURCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vault_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
    description TEXT,
    resource_type TEXT NOT NULL DEFAULT 'link' CHECK (
        resource_type IN (
            'link', 'youtube', 'video', 'image', 'document', 
            'audio', 'article', 'social', 'design', 'code', 'note', 'other'
        )
    ),
    url TEXT,
    file_path TEXT,
    file_size BIGINT CHECK (file_size IS NULL OR file_size >= 0),
    mime_type TEXT,
    thumbnail_url TEXT,
    favicon_url TEXT,
    domain TEXT,
    collection_id UUID REFERENCES public.vault_collections(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}'::text[],
    notes TEXT,
    code_content TEXT,
    code_language TEXT,
    is_favourite BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
    last_viewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for vault_resources
CREATE INDEX IF NOT EXISTS idx_vault_resources_user_id ON public.vault_resources (user_id);
CREATE INDEX IF NOT EXISTS idx_vault_resources_collection ON public.vault_resources (collection_id);
CREATE INDEX IF NOT EXISTS idx_vault_resources_user_type ON public.vault_resources (user_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_vault_resources_user_fav ON public.vault_resources (user_id, is_favourite);
CREATE INDEX IF NOT EXISTS idx_vault_resources_user_archived ON public.vault_resources (user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_vault_resources_created ON public.vault_resources (user_id, created_at DESC);

-- Updated_at trigger for vault_resources
DROP TRIGGER IF EXISTS set_vault_resources_updated_at ON public.vault_resources;
CREATE TRIGGER set_vault_resources_updated_at
    BEFORE UPDATE ON public.vault_resources
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS on vault_resources
ALTER TABLE public.vault_resources ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can select own vault resources" ON public.vault_resources;
DROP POLICY IF EXISTS "Users can insert own vault resources" ON public.vault_resources;
DROP POLICY IF EXISTS "Users can update own vault resources" ON public.vault_resources;
DROP POLICY IF EXISTS "Users can delete own vault resources" ON public.vault_resources;

-- RLS Policies for vault_resources
CREATE POLICY "Users can select own vault resources"
    ON public.vault_resources FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vault resources"
    ON public.vault_resources FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vault resources"
    ON public.vault_resources FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vault resources"
    ON public.vault_resources FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Realtime publication (optional)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.vault_collections;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.vault_resources;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

