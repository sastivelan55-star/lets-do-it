-- ============================================================================
-- LifeMap: Advanced Task Management System Extensions
-- File: supabase/migrations/20261117120000_add_task_management_extensions.sql
--
-- Safe, additive migration adding starred status, custom list linkage,
-- recurrence start dates, reminders, and custom task lists table.
-- ============================================================================

-- 1. Additive columns to existing tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS list_id TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence_start_date DATE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reminder_date DATE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reminder_time TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS inline_subtasks JSONB DEFAULT '[]'::jsonb;

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_tasks_user_starred ON public.tasks (user_id, is_starred);
CREATE INDEX IF NOT EXISTS idx_tasks_user_list ON public.tasks (user_id, list_id);

-- 2. Custom Task Lists Table
CREATE TABLE IF NOT EXISTS public.custom_task_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    color TEXT NOT NULL DEFAULT '#8b5cf6',
    icon TEXT NOT NULL DEFAULT 'ListTodo',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_custom_task_lists_user ON public.custom_task_lists (user_id);

-- Updated_at trigger
DROP TRIGGER IF EXISTS set_custom_task_lists_updated_at ON public.custom_task_lists;
CREATE TRIGGER set_custom_task_lists_updated_at
    BEFORE UPDATE ON public.custom_task_lists
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.custom_task_lists ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can select own custom lists" ON public.custom_task_lists;
DROP POLICY IF EXISTS "Users can insert own custom lists" ON public.custom_task_lists;
DROP POLICY IF EXISTS "Users can update own custom lists" ON public.custom_task_lists;
DROP POLICY IF EXISTS "Users can delete own custom lists" ON public.custom_task_lists;

-- RLS Policies
CREATE POLICY "Users can select own custom lists"
    ON public.custom_task_lists
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom lists"
    ON public.custom_task_lists
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom lists"
    ON public.custom_task_lists
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom lists"
    ON public.custom_task_lists
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Realtime Publication
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_task_lists;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
