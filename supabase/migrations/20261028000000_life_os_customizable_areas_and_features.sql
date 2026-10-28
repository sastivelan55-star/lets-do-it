-- Life OS Additive Migration: Customizable Life Areas, Roadmap Integration, and Communication Sessions
-- File: supabase/migrations/20261028000000_life_os_customizable_areas_and_features.sql
-- Safe, additive migration preserving all existing tables, rows, and RLS policies

-- 1. Add roadmap_month column to public.tasks (allows tasks to be linked to roadmap months)
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS roadmap_month INTEGER;

-- Index for roadmap queries by user and month
CREATE INDEX IF NOT EXISTS idx_tasks_user_roadmap_month ON public.tasks (user_id, roadmap_month);

-- 2. Relax tasks.area CHECK constraint to allow custom user-defined life-planning areas
-- Existing default areas ('technical', 'communication', 'career', 'creativity', 'health') remain fully valid.
ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS tasks_area_check;

-- Ensure area is non-empty
ALTER TABLE public.tasks
ADD CONSTRAINT tasks_area_not_empty CHECK (char_length(trim(area)) > 0);

-- 3. Create communication_sessions table for practice and attendance tracking
CREATE TABLE IF NOT EXISTS public.communication_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TEXT,
    end_time TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes >= 0),
    activity_type TEXT NOT NULL DEFAULT 'speaking',
    topic TEXT NOT NULL CHECK (char_length(trim(topic)) > 0),
    description TEXT,
    notes TEXT,
    attendance_status TEXT NOT NULL DEFAULT 'attended' CHECK (attendance_status IN ('present', 'attended', 'missed', 'excused')),
    completion_status TEXT NOT NULL DEFAULT 'completed' CHECK (completion_status IN ('completed', 'partial', 'in-progress')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for communication_sessions
CREATE INDEX IF NOT EXISTS idx_comm_sessions_user_id ON public.communication_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_comm_sessions_user_date ON public.communication_sessions (user_id, date DESC);

-- Automatic updated_at trigger for communication_sessions
DROP TRIGGER IF EXISTS set_communication_sessions_updated_at ON public.communication_sessions;
CREATE TRIGGER set_communication_sessions_updated_at
    BEFORE UPDATE ON public.communication_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.communication_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for communication_sessions
DROP POLICY IF EXISTS "Users can select own communication sessions" ON public.communication_sessions;
DROP POLICY IF EXISTS "Users can insert own communication sessions" ON public.communication_sessions;
DROP POLICY IF EXISTS "Users can update own communication sessions" ON public.communication_sessions;
DROP POLICY IF EXISTS "Users can delete own communication sessions" ON public.communication_sessions;

CREATE POLICY "Users can select own communication sessions"
    ON public.communication_sessions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own communication sessions"
    ON public.communication_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own communication sessions"
    ON public.communication_sessions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own communication sessions"
    ON public.communication_sessions
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Optional Realtime Publication registration
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.communication_sessions;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
