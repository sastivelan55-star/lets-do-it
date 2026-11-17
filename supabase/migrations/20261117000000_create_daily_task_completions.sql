-- ============================================================================
-- LifeMap: Daily Execution Dashboard — Task Completions Table
-- File: supabase/migrations/20261117000000_create_daily_task_completions.sql
--
-- Creates the daily_task_completions table to track per-occurrence completion
-- state for both recurring and one-time tasks on a given calendar date.
-- Safe, additive, idempotent migration.
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.daily_task_completions (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID         NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id         UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    occurrence_date DATE         NOT NULL,
    is_completed    BOOLEAN      NOT NULL DEFAULT false,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_task_occurrence UNIQUE (task_id, occurrence_date)
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_dtc_task_id   ON public.daily_task_completions (task_id);
CREATE INDEX IF NOT EXISTS idx_dtc_user_date ON public.daily_task_completions (user_id, occurrence_date);
CREATE INDEX IF NOT EXISTS idx_dtc_user_id   ON public.daily_task_completions (user_id);

-- ============================================================================
-- 3. UPDATED-AT TRIGGER (uses existing public.handle_updated_at() function)
-- ============================================================================
DROP TRIGGER IF EXISTS set_daily_task_completions_updated_at ON public.daily_task_completions;
CREATE TRIGGER set_daily_task_completions_updated_at
    BEFORE UPDATE ON public.daily_task_completions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.daily_task_completions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can select own daily completions" ON public.daily_task_completions;
DROP POLICY IF EXISTS "Users can insert own daily completions" ON public.daily_task_completions;
DROP POLICY IF EXISTS "Users can update own daily completions" ON public.daily_task_completions;
DROP POLICY IF EXISTS "Users can delete own daily completions" ON public.daily_task_completions;

-- SELECT
CREATE POLICY "Users can select own daily completions"
    ON public.daily_task_completions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "Users can insert own daily completions"
    ON public.daily_task_completions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "Users can update own daily completions"
    ON public.daily_task_completions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE
CREATE POLICY "Users can delete own daily completions"
    ON public.daily_task_completions
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================================================
-- 5. REALTIME PUBLICATION (safe — only adds if supabase_realtime exists)
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_task_completions;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore if already added or not applicable in this environment
    NULL;
END $$;
