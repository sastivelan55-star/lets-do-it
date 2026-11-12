// LifeMap: Unified Cloud Synchronization Migration SQL
// File: src/services/cloudSyncSetupSql.ts

export const UNIFIED_CLOUD_SYNC_SQL = `-- LifeMap: Unified Cross-Platform Cloud Synchronization
-- Execute this script in your Supabase Dashboard -> SQL Editor

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Projects
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('idea', 'planned', 'in-progress', 'paused', 'completed')),
    goals JSONB NOT NULL DEFAULT '[]'::jsonb,
    tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
    milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
    technologies JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    repo_url TEXT,
    next_action TEXT,
    start_date DATE,
    target_date DATE,
    priority TEXT DEFAULT 'medium',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects (user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON public.projects (user_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects (user_id, updated_at DESC);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

CREATE POLICY "Users can select own projects" ON public.projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. Roadmap Milestones
CREATE TABLE IF NOT EXISTS public.roadmap_milestones (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'not-started' CHECK (status IN ('not-started', 'in-progress', 'completed')),
    subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
    learning_sessions JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    start_date DATE,
    target_date DATE,
    completed_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_roadmap_milestones_user_id ON public.roadmap_milestones (user_id);
ALTER TABLE public.roadmap_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own roadmap milestones" ON public.roadmap_milestones;
DROP POLICY IF EXISTS "Users can insert own roadmap milestones" ON public.roadmap_milestones;
DROP POLICY IF EXISTS "Users can update own roadmap milestones" ON public.roadmap_milestones;
DROP POLICY IF EXISTS "Users can delete own roadmap milestones" ON public.roadmap_milestones;

CREATE POLICY "Users can select own roadmap milestones" ON public.roadmap_milestones FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own roadmap milestones" ON public.roadmap_milestones FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own roadmap milestones" ON public.roadmap_milestones FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own roadmap milestones" ON public.roadmap_milestones FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. Daily Records
CREATE TABLE IF NOT EXISTS public.daily_records (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    tasks_completed INTEGER NOT NULL DEFAULT 0,
    tasks_total INTEGER NOT NULL DEFAULT 0,
    minutes_spent INTEGER NOT NULL DEFAULT 0,
    reflection_note TEXT,
    mood INTEGER CHECK (mood IS NULL OR (mood >= 1 AND mood <= 5)),
    saved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_daily_record UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_records_user_date ON public.daily_records (user_id, date DESC);
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own daily records" ON public.daily_records;
DROP POLICY IF EXISTS "Users can insert own daily records" ON public.daily_records;
DROP POLICY IF EXISTS "Users can update own daily records" ON public.daily_records;
DROP POLICY IF EXISTS "Users can delete own daily records" ON public.daily_records;

CREATE POLICY "Users can select own daily records" ON public.daily_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily records" ON public.daily_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily records" ON public.daily_records FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own daily records" ON public.daily_records FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. User Settings
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON public.user_settings;

CREATE POLICY "Users can select own settings" ON public.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON public.user_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. Realtime Registration
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.roadmap_milestones;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_records;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_settings;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
`;
