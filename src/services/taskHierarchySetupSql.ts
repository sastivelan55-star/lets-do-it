// SQL migration script and clipboard helper for Unlimited Hierarchical Task Builder
export const TASK_HIERARCHY_SETUP_SQL = `-- LifeMap OS: Unlimited Hierarchical Task Builder Migration
-- Run this in your Supabase Dashboard -> SQL Editor -> New Query -> Run

-- 1. Add parent_id column for unlimited recursive hierarchy
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE;

-- 2. Add order_index column for sibling ordering
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;

-- 3. Add performance indexes for hierarchy traversal and ordering
CREATE INDEX IF NOT EXISTS idx_tasks_user_parent ON public.tasks (user_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_order ON public.tasks (parent_id, order_index);
CREATE INDEX IF NOT EXISTS idx_tasks_user_order ON public.tasks (user_id, order_index);
`;

export async function copyHierarchySqlToClipboard(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(TASK_HIERARCHY_SETUP_SQL.trim());
    return true;
  } catch (err) {
    console.warn('Failed to copy to clipboard:', err);
    return false;
  }
}
