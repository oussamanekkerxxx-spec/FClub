-- ============================================================================
-- 51_stories_expiration.sql
-- Automatic cleanup of expired stories via pg_cron.
-- Runs every 5 minutes, deletes stories past their expires_at timestamp.
-- Also adds a trigger to prevent posting stories with past expires_at.
-- ============================================================================

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on pg_cron to authenticated role
GRANT USAGE ON SCHEMA pg_cron TO authenticated;

-- Scheduled function: delete expired stories
CREATE OR REPLACE FUNCTION public.delete_expired_stories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.stories WHERE expires_at < now();
END;
$$;

-- Schedule: run every 5 minutes
SELECT cron.schedule(
  'delete-expired-stories',
  '*/5 * * * *',
  'SELECT public.delete_expired_stories()'
);

-- Optional: unschedule helper (useful for future rollback)
-- SELECT cron.unschedule('delete-expired-stories');

-- Trigger: reject inserts with expires_at in the past
CREATE OR REPLACE FUNCTION public.stories_validate_expires_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at < now() THEN
    RAISE EXCEPTION 'expires_at cannot be in the past';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stories_validate_expires_at ON public.stories;
CREATE TRIGGER stories_validate_expires_at
  BEFORE INSERT ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.stories_validate_expires_at();

-- Index: already exists from 46_stories_schema.sql (idx_stories_expires_at)
-- This ensures the DELETE above uses a seekable scan, not a full table scan.