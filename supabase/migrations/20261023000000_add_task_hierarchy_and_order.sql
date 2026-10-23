-- LifeMap OS: Unlimited Hierarchical Task Builder Migration
-- File: supabase/migrations/20261023000000_add_task_hierarchy_and_order.sql
-- Enables unlimited nested subtasks to arbitrary depth with sibling ordering and RLS

-- 1. Add parent_id column referencing public.tasks(id) with ON DELETE CASCADE
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE;

-- 2. Add order_index column for sibling ordering
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;

-- 3. Add performance indexes for parent-child lookups, tree ordering, and user queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_parent ON public.tasks (user_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_order ON public.tasks (parent_id, order_index);
CREATE INDEX IF NOT EXISTS idx_tasks_user_order ON public.tasks (user_id, order_index);

-- 4. Verify RLS remains active (existing policies enforce auth.uid() = user_id on all operations)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
