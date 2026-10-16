-- LifeMap Stage 3: Media Vault & User Uploads with Supabase Storage and RLS
-- File: supabase/migrations/20261016100000_create_media_vault_and_uploads.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. STORAGE BUCKET CREATION (media-vault)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'media-vault',
    'media-vault',
    false, -- Private bucket: access requires authenticated session or signed URL
    26214400, -- 25 MB max file size limit
    ARRAY[
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'video/webm', 'video/quicktime', 'video/ogg',
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/webm',
        'application/pdf', 'text/plain', 'text/markdown', 'text/csv',
        'application/json', 'application/zip',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- 2. STORAGE RLS POLICIES (media-vault bucket)
-- ============================================================================
-- Drop existing policies if they already exist
DROP POLICY IF EXISTS "Users can upload their own files to media-vault" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files in media-vault" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files in media-vault" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files in media-vault" ON storage.objects;

-- RLS: Authenticated users can insert objects into media-vault if the first folder matches their auth.uid()
CREATE POLICY "Users can upload their own files to media-vault"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'media-vault' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Authenticated users can select/read objects in media-vault if the first folder matches their auth.uid()
CREATE POLICY "Users can view their own files in media-vault"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'media-vault' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Authenticated users can update objects in media-vault if the first folder matches their auth.uid()
CREATE POLICY "Users can update their own files in media-vault"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'media-vault' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Authenticated users can delete objects in media-vault if the first folder matches their auth.uid()
CREATE POLICY "Users can delete their own files in media-vault"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'media-vault' AND
    (storage.foldername(name))[1] = auth.uid()::text
);


-- ============================================================================
-- 3. USER UPLOADS METADATA TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL CHECK (char_length(trim(file_name)) > 0),
    file_path TEXT NOT NULL UNIQUE,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    mime_type TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('image', 'video', 'audio', 'document', 'other')),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for fast user queries, filtering, and sorting
CREATE INDEX IF NOT EXISTS idx_user_uploads_user_id ON public.user_uploads (user_id);
CREATE INDEX IF NOT EXISTS idx_user_uploads_user_category ON public.user_uploads (user_id, category);
CREATE INDEX IF NOT EXISTS idx_user_uploads_user_created ON public.user_uploads (user_id, created_at DESC);

-- Automatic updated_at trigger for user_uploads
DROP TRIGGER IF EXISTS set_user_uploads_updated_at ON public.user_uploads;
CREATE TRIGGER set_user_uploads_updated_at
    BEFORE UPDATE ON public.user_uploads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS) on public.user_uploads
ALTER TABLE public.user_uploads ENABLE ROW LEVEL SECURITY;

-- Drop existing table policies if any
DROP POLICY IF EXISTS "Users can select own uploads" ON public.user_uploads;
DROP POLICY IF EXISTS "Users can insert own uploads" ON public.user_uploads;
DROP POLICY IF EXISTS "Users can update own uploads" ON public.user_uploads;
DROP POLICY IF EXISTS "Users can delete own uploads" ON public.user_uploads;

-- RLS Policies for user_uploads table
CREATE POLICY "Users can select own uploads"
    ON public.user_uploads
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploads"
    ON public.user_uploads
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own uploads"
    ON public.user_uploads
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own uploads"
    ON public.user_uploads
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
