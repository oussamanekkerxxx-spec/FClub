-- Migration 63: safe_delete_user() function
--
-- Creates a function that safely deletes a user and cleans up
-- arrays that store user IDs without FK constraints.
--
-- For diagnostic queries (orphaned profiles, array columns), see:
--   scripts/diagnose_orphaned_profiles.sql

-- ── Create safe_delete_user() function ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.safe_delete_user(target_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_auth_deleted INT := 0;
  v_profile_deleted INT := 0;
  v_array_cleaned INT := 0;
BEGIN
  -- Verify user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RETURN 'User not found in auth.users';
  END IF;

  -- Clean arrays that store user IDs without FK constraints
  UPDATE public.conversations
  SET participant_ids = array_remove(participant_ids, target_user_id)
  WHERE target_user_id = ANY(participant_ids);
  GET DIAGNOSTICS v_array_cleaned = ROW_COUNT;

  -- Delete from auth.users.
  -- Because profiles.id → auth.users(id) CASCADE,
  -- this will cascade through every public table that references profiles.
  DELETE FROM auth.users WHERE id = target_user_id;
  GET DIAGNOSTICS v_auth_deleted = ROW_COUNT;

  -- If for some reason the profile survived (orphaned from a past broken FK),
  -- delete it explicitly. This cascades to everything referencing profiles.
  DELETE FROM public.profiles WHERE id = target_user_id;
  GET DIAGNOSTICS v_profile_deleted = ROW_COUNT;

  RETURN format(
    'Deleted %s auth user(s), %s profile(s), cleaned %s array row(s).',
    v_auth_deleted, v_profile_deleted, v_array_cleaned
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 4. Optional: one-time cleanup of already-orphaned profiles ───────────────
-- Uncomment and run this if you have old orphaned profiles:
--
-- DELETE FROM public.profiles
-- WHERE id NOT IN (SELECT id FROM auth.users);
