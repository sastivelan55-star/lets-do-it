-- ============================================================================
-- LifeMap: Unified Cross-Platform Cloud Synchronization Migration
-- File: supabase/migrations/20261112000000_create_unified_cloud_sync_tables.sql
-- 
-- Safe, additive, idempotent migration establishing cloud synchronization across
-- all application modules: Projects, Roadmap, Reflections, User Settings,
-- Career, Creativity, Health, and Weekly Reviews.
-- 
-- Preserves all existing tables (tasks, schedules, notes, user_uploads,
-- communication_sessions, vault_collections, vault_resources, grocery_lists, grocery_items).
-- ============================================================================

-- Ensure pgcrypto extension is enabled for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Reusable timestamp trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. PROJECTS TABLE
-- ============================================================================
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

DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

CREATE POLICY "Users can select own projects" ON public.projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- 2. ROADMAP MILESTONES TABLE
-- ============================================================================
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
CREATE INDEX IF NOT EXISTS idx_roadmap_milestones_user_month ON public.roadmap_milestones (user_id, month);

DROP TRIGGER IF EXISTS set_roadmap_milestones_updated_at ON public.roadmap_milestones;
CREATE TRIGGER set_roadmap_milestones_updated_at
    BEFORE UPDATE ON public.roadmap_milestones
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.roadmap_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own roadmap milestones" ON public.roadmap_milestones;
DROP POLICY IF EXISTS "Users can insert own roadmap milestones" ON public.roadmap_milestones;
DROP POLICY IF EXISTS "Users can update own roadmap milestones" ON public.roadmap_milestones;
DROP POLICY IF EXISTS "Users can delete own roadmap milestones" ON public.roadmap_milestones;

CREATE POLICY "Users can select own roadmap milestones" ON public.roadmap_milestones FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own roadmap milestones" ON public.roadmap_milestones FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own roadmap milestones" ON public.roadmap_milestones FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own roadmap milestones" ON public.roadmap_milestones FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- 3. DAILY RECORDS (REFLECTIONS & PROGRESS) TABLE
-- ============================================================================
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

DROP TRIGGER IF EXISTS set_daily_records_updated_at ON public.daily_records;
CREATE TRIGGER set_daily_records_updated_at
    BEFORE UPDATE ON public.daily_records
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own daily records" ON public.daily_records;
DROP POLICY IF EXISTS "Users can insert own daily records" ON public.daily_records;
DROP POLICY IF EXISTS "Users can update own daily records" ON public.daily_records;
DROP POLICY IF EXISTS "Users can delete own daily records" ON public.daily_records;

CREATE POLICY "Users can select own daily records" ON public.daily_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily records" ON public.daily_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily records" ON public.daily_records FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own daily records" ON public.daily_records FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- 4. USER SETTINGS & PREFERENCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

DROP TRIGGER IF EXISTS set_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER set_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON public.user_settings;

CREATE POLICY "Users can select own settings" ON public.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON public.user_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- 5. CAREER ITEMS & INTERNSHIP APPLICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.career_items (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
    due_date DATE,
    link TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_career_items_user_id ON public.career_items (user_id);
ALTER TABLE public.career_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own career items" ON public.career_items;
DROP POLICY IF EXISTS "Users can insert own career items" ON public.career_items;
DROP POLICY IF EXISTS "Users can update own career items" ON public.career_items;
DROP POLICY IF EXISTS "Users can delete own career items" ON public.career_items;

CREATE POLICY "Users can select own career items" ON public.career_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own career items" ON public.career_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own career items" ON public.career_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own career items" ON public.career_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.internship_applications (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company TEXT NOT NULL CHECK (char_length(trim(company)) > 0),
    role TEXT NOT NULL CHECK (char_length(trim(role)) > 0),
    link TEXT,
    applied_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('researching', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn')),
    next_follow_up DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_internship_apps_user_id ON public.internship_applications (user_id);
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own internship apps" ON public.internship_applications;
DROP POLICY IF EXISTS "Users can insert own internship apps" ON public.internship_applications;
DROP POLICY IF EXISTS "Users can update own internship apps" ON public.internship_applications;
DROP POLICY IF EXISTS "Users can delete own internship apps" ON public.internship_applications;

CREATE POLICY "Users can select own internship apps" ON public.internship_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own internship apps" ON public.internship_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own internship apps" ON public.internship_applications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own internship apps" ON public.internship_applications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- 6. CONTENT ITEMS (CREATIVITY PAGE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.content_items (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
    idea TEXT,
    draft TEXT,
    planned_date DATE,
    published_date DATE,
    status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'draft', 'scheduled', 'published')),
    link TEXT,
    is_private BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_content_items_user_id ON public.content_items (user_id);
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own content items" ON public.content_items;
DROP POLICY IF EXISTS "Users can insert own content items" ON public.content_items;
DROP POLICY IF EXISTS "Users can update own content items" ON public.content_items;
DROP POLICY IF EXISTS "Users can delete own content items" ON public.content_items;

CREATE POLICY "Users can select own content items" ON public.content_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own content items" ON public.content_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own content items" ON public.content_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own content items" ON public.content_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- 7. HEALTH ENTRIES (HEALTH PAGE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.health_entries (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    sleep_hours NUMERIC,
    energy_note TEXT,
    mood_note TEXT,
    movement TEXT,
    relationships TEXT,
    reflection TEXT,
    gratitude TEXT,
    is_private BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_health_entries_user_date ON public.health_entries (user_id, date DESC);
ALTER TABLE public.health_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own health entries" ON public.health_entries;
DROP POLICY IF EXISTS "Users can insert own health entries" ON public.health_entries;
DROP POLICY IF EXISTS "Users can update own health entries" ON public.health_entries;
DROP POLICY IF EXISTS "Users can delete own health entries" ON public.health_entries;

CREATE POLICY "Users can select own health entries" ON public.health_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health entries" ON public.health_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own health entries" ON public.health_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own health entries" ON public.health_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- 8. WEEKLY REVIEWS (WEEKLY REVIEW PAGE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.weekly_reviews (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    wins JSONB NOT NULL DEFAULT '[]'::jsonb,
    challenges JSONB NOT NULL DEFAULT '[]'::jsonb,
    continue_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    reduce_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    postpone_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    next_week_focus JSONB NOT NULL DEFAULT '[]'::jsonb,
    completion_rate NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_weekly_reviews_user_week ON public.weekly_reviews (user_id, week_start DESC);
ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own weekly reviews" ON public.weekly_reviews;
DROP POLICY IF EXISTS "Users can insert own weekly reviews" ON public.weekly_reviews;
DROP POLICY IF EXISTS "Users can update own weekly reviews" ON public.weekly_reviews;
DROP POLICY IF EXISTS "Users can delete own weekly reviews" ON public.weekly_reviews;

CREATE POLICY "Users can select own weekly reviews" ON public.weekly_reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weekly reviews" ON public.weekly_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own weekly reviews" ON public.weekly_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own weekly reviews" ON public.weekly_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- 9. REALTIME PUBLICATION REGISTRATION
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.roadmap_milestones;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_records;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_settings;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.career_items;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.internship_applications;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.content_items;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.health_entries;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_reviews;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
