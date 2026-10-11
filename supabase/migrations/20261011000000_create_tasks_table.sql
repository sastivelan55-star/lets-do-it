-- LifeMap Stage 1B: Tasks Table and Row-Level Security (RLS)
-- File: supabase/migrations/20261011000000_create_tasks_table.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
    description TEXT,
    area TEXT NOT NULL CHECK (area IN ('technical', 'communication', 'career', 'creativity', 'health')),
    project_id TEXT,
    due_date DATE,
    planned_start TEXT,
    estimated_minutes INTEGER CHECK (estimated_minutes IS NULL OR estimated_minutes >= 0),
    actual_minutes INTEGER CHECK (actual_minutes IS NULL OR actual_minutes >= 0),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'not-started' CHECK (status IN ('not-started', 'in-progress', 'completed', 'rescheduled')),
    recurring_rule TEXT,
    notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Indexes for fast querying & user isolation
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date ON public.tasks (user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks (user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_area ON public.tasks (user_id, area);

-- 3. Automatic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies
-- SELECT: Authenticated users can only read tasks belonging to them
CREATE POLICY "Users can select own tasks"
    ON public.tasks
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- INSERT: Authenticated users can only insert tasks where user_id matches auth.uid()
CREATE POLICY "Users can insert own tasks"
    ON public.tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Authenticated users can only update their own tasks and cannot reassign user_id
CREATE POLICY "Users can update own tasks"
    ON public.tasks
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Authenticated users can only delete their own tasks
CREATE POLICY "Users can delete own tasks"
    ON public.tasks
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 6. Enable Realtime on tasks table (optional for live sync)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore if already added or in standard environment
    NULL;
END $$;
