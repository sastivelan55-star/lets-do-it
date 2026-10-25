-- LifeMap OS: Task Recycle Bin Additive Migration
-- File: supabase/migrations/20261026000000_add_task_recycle_bin.sql
-- Enables safe soft deletion and restoration of tasks and subtask trees with user RLS

-- 1. Add is_deleted column (defaults to false for all existing and new records)
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

-- 2. Add deleted_at column (records ISO timestamp of deletion)
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 3. Add performance indexes for active vs recycled tasks per user
CREATE INDEX IF NOT EXISTS idx_tasks_user_is_deleted ON public.tasks (user_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_tasks_user_deleted_at ON public.tasks (user_id, deleted_at DESC) WHERE is_deleted = true;

-- 4. Verify RLS remains active (existing policies enforce auth.uid() = user_id on all operations)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
