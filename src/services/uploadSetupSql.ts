// Helper containing the SQL migration script for Supabase Media Vault & User Uploads
export const MEDIA_VAULT_SETUP_SQL = `-- LifeMap OS: Media Vault & User Uploads Migration (50 MB Max Size + TUS + RLS)
-- Run this in your Supabase Dashboard -> SQL Editor -> New Query -> Run

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Storage bucket (media-vault, private, 50MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'media-vault',
    'media-vault',
    false,
    52428800, -- 50 MB
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 52428800,
    allowed_mime_types = NULL;

-- 2. Storage RLS Policies
DROP POLICY IF EXISTS "Users can upload their own files to media-vault" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files in media-vault" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files in media-vault" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files in media-vault" ON storage.objects;

CREATE POLICY "Users can upload their own files to media-vault"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'media-vault' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own files in media-vault"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'media-vault' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own files in media-vault"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'media-vault' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own files in media-vault"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'media-vault' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Metadata Table
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

CREATE INDEX IF NOT EXISTS idx_user_uploads_user_id ON public.user_uploads (user_id);
CREATE INDEX IF NOT EXISTS idx_user_uploads_user_category ON public.user_uploads (user_id, category);
CREATE INDEX IF NOT EXISTS idx_user_uploads_user_created ON public.user_uploads (user_id, created_at DESC);

DROP TRIGGER IF EXISTS set_user_uploads_updated_at ON public.user_uploads;
CREATE TRIGGER set_user_uploads_updated_at
    BEFORE UPDATE ON public.user_uploads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.user_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own uploads" ON public.user_uploads;
DROP POLICY IF EXISTS "Users can insert own uploads" ON public.user_uploads;
DROP POLICY IF EXISTS "Users can update own uploads" ON public.user_uploads;
DROP POLICY IF EXISTS "Users can delete own uploads" ON public.user_uploads;

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
`;

export async function copySetupSqlToClipboard(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(MEDIA_VAULT_SETUP_SQL.trim());
    return true;
  } catch (err) {
    console.warn('Failed to copy to clipboard:', err);
    return false;
  }
}
