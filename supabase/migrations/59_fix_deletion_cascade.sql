-- Migration: Fix missing ON DELETE CASCADE constraints
-- Problem: Early migrations created FKs without CASCADE. Later migrations used
-- CREATE TABLE IF NOT EXISTS, so restrictive constraints were never updated.
-- This blocked club deletion, user deletion, and skill deletion.
--
-- NOTE (2026-05-05): The hardcoded FK-fixing section was removed.
-- It has been superseded by migration 60, which uses dynamic SQL to discover
-- and fix ALL foreign keys referencing profiles(id) and auth.users(id).
-- Migration 60 is robust against tables created outside migrations (dashboard,
-- deleted migrations, etc.) and avoids the dangerous safe_add_fk behaviour
-- that drops ALL FKs on a column.


-- ── Add missing DELETE RLS policies ───────────────────────────────────────────

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can delete their conversations" ON conversations;
  CREATE POLICY "Users can delete their conversations"
    ON conversations FOR DELETE
    USING (auth.uid() = ANY(participant_ids));
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Skipping conversations policy: table does not exist';
END;
$$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
  CREATE POLICY "Users can delete their own messages"
    ON messages FOR DELETE
    USING (auth.uid() = sender_id);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Skipping messages policy: table does not exist';
END;
$$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
  CREATE POLICY "Users can delete own profile"
    ON profiles FOR DELETE
    USING (auth.uid() = id);
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Skipping profiles policy: table does not exist';
END;
$$;

-- ── Create notifications table (missing from migrations) ──────────────────────

DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS notifications (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type       TEXT        NOT NULL,
    title      TEXT        NOT NULL,
    body       TEXT,
    data       JSONB       DEFAULT '{}',
    read       BOOLEAN     DEFAULT false,
    link       TEXT,
    actor_id   UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );

  ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
  CREATE POLICY "Users can read own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
  CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
  CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
  CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

  -- Ensure columns exist if the table was created earlier without them
  ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS read     BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS link     TEXT,
    ADD COLUMN IF NOT EXISTS actor_id UUID;

  CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications(user_id, "read") WHERE "read" = false;
END;
$$;

-- ── Add notifications to realtime ─────────────────────────────────────────────
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'notifications already in realtime publication';
END;
$$;
