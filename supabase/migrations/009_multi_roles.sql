-- ============================================================
-- RIVERS PLATFORM — Multi-role support
-- Adds a roles TEXT[] column so users can hold more than one role.
-- The existing `role` column stays as the primary/default role
-- and continues to drive RLS policies unchanged.
-- ============================================================

-- 1. Add the column
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS roles TEXT[] NOT NULL DEFAULT '{}';

-- 2. Seed from existing primary role for all current users
UPDATE public.users
SET roles = ARRAY[role]
WHERE roles = '{}';

-- 3. Trigger: auto-seed roles on INSERT if caller omits the column
CREATE OR REPLACE FUNCTION public.sync_primary_role_to_roles()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.roles = '{}' OR NEW.roles IS NULL THEN
    NEW.roles := ARRAY[NEW.role];
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_roles ON public.users;
CREATE TRIGGER trg_sync_roles
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_primary_role_to_roles();
