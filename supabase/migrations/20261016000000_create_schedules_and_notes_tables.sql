-- LifeMap Stage 2: Schedules and Notes Tables with Row-Level Security (RLS)
-- File: supabase/migrations/20261016000000_create_schedules_and_notes_tables.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. SCHEDULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
    description TEXT,
    date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    linked_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for schedules
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON public.schedules (user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_user_date ON public.schedules (user_id, date);
CREATE INDEX IF NOT EXISTS idx_schedules_user_start ON public.schedules (user_id, date, start_time);

-- Automatic updated_at trigger for schedules
DROP TRIGGER IF EXISTS set_schedules_updated_at ON public.schedules;
CREATE TRIGGER set_schedules_updated_at
    BEFORE UPDATE ON public.schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS) for schedules
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can select own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can insert own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can update own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can delete own schedules" ON public.schedules;

-- RLS Policies for schedules
CREATE POLICY "Users can select own schedules"
    ON public.schedules
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedules"
    ON public.schedules
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules"
    ON public.schedules
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules"
    ON public.schedules
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- ============================================================================
-- 2. NOTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
    content TEXT NOT NULL DEFAULT '',
    category TEXT,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for notes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes (user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_updated ON public.notes (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_user_category ON public.notes (user_id, category);

-- Automatic updated_at trigger for notes
DROP TRIGGER IF EXISTS set_notes_updated_at ON public.notes;
CREATE TRIGGER set_notes_updated_at
    BEFORE UPDATE ON public.notes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS) for notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can select own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON public.notes;

-- RLS Policies for notes
CREATE POLICY "Users can select own notes"
    ON public.notes
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
    ON public.notes
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
    ON public.notes
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
    ON public.notes
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- ============================================================================
-- 3. REALTIME PUBLICATION REGISTRATION (OPTIONAL)
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.schedules;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
