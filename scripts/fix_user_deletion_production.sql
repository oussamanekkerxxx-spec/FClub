-- One-shot script: Fix FKs + create safe_delete_user function
-- Paste this entire block into Supabase SQL Editor and run it.

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 1: Fix all missing ON DELETE CASCADE / SET NULL foreign keys
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION pg_temp.fix_user_deletion_fks()
RETURNS TABLE(
  action_taken TEXT,
  schema_name TEXT,
  table_name TEXT,
  column_name TEXT,
  old_rule TEXT,
  new_rule TEXT
) AS $$
DECLARE
  rec RECORD;
  v_col_nullable TEXT;
  v_new_rule TEXT;
  v_cols TEXT;
BEGIN
  FOR rec IN
    SELECT
      c.conname AS constraint_name,
      ns.nspname AS schema_n,
      t.relname AS tbl_name,
      array_agg(a.attname ORDER BY array_position(c.conkey, a.attnum)) AS col_names,
      ref_ns.nspname AS ref_schema,
      ref_t.relname AS ref_table,
      array_agg(ref_a.attname ORDER BY array_position(c.confkey, ref_a.attnum)) AS ref_col_names,
      CASE c.confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
        ELSE c.confdeltype::text
      END AS del_rule,
      c.confdeltype AS del_type
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace ns ON ns.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    JOIN pg_class ref_t ON ref_t.oid = c.confrelid
    JOIN pg_namespace ref_ns ON ref_ns.oid = ref_t.relnamespace
    JOIN pg_attribute ref_a ON ref_a.attrelid = ref_t.oid AND ref_a.attnum = ANY(c.confkey)
    WHERE c.contype = 'f'
      AND ref_t.relname IN ('profiles', 'users')
      AND ref_ns.nspname IN ('public', 'auth')
      AND ns.nspname = 'public'
      AND c.confdeltype NOT IN ('c', 'n')
    GROUP BY c.conname, ns.nspname, t.relname, ref_ns.nspname, ref_t.relname, c.confdeltype
  LOOP
    IF array_length(rec.col_names, 1) != 1 OR array_length(rec.ref_col_names, 1) != 1 THEN
      CONTINUE;
    END IF;

    IF rec.ref_col_names[1] != 'id' THEN
      CONTINUE;
    END IF;

    v_cols := rec.col_names[1];

    -- SET NULL for actor/reviewer/participant columns; CASCADE for everything else
    IF v_cols IN (
      'created_by','reviewed_by','banned_by','muted_by','winner_id',
      'host_id','completed_by','assigned_to','added_by',
      'participant_a_id','participant_b_id',
      'challenger_club_id','opponent_club_id',
      'host_club_id','opponent_club_id','winner_club_id',
      'skill_id','opponent_id'
    ) THEN
      v_new_rule := 'SET NULL';
    ELSE
      v_new_rule := 'CASCADE';
    END IF;

    -- Fall back to CASCADE if column is NOT NULL
    IF v_new_rule = 'SET NULL' THEN
      SELECT c.is_nullable INTO v_col_nullable
      FROM information_schema.columns c
      WHERE c.table_schema = rec.schema_n
        AND c.table_name   = rec.tbl_name
        AND c.column_name  = v_cols;

      IF v_col_nullable = 'NO' THEN
        v_new_rule := 'CASCADE';
      END IF;
    END IF;

    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I',
                   rec.schema_n, rec.tbl_name, rec.constraint_name);

    EXECUTE format(
      'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I.%I(%I) ON DELETE %s',
      rec.schema_n,
      rec.tbl_name,
      rec.tbl_name || '_' || v_cols || '_fkey',
      v_cols,
      rec.ref_schema,
      rec.ref_table,
      rec.ref_col_names[1],
      v_new_rule
    );

    action_taken := 'FIXED';
    schema_name  := rec.schema_n;
    table_name   := rec.tbl_name;
    column_name  := v_cols;
    old_rule     := rec.del_rule;
    new_rule     := v_new_rule;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Run the fix and show what changed
SELECT * FROM pg_temp.fix_user_deletion_fks();

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 2: Create safe_delete_user function (if it doesn't exist yet)
-- ═══════════════════════════════════════════════════════════════════════════════

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
  -- profiles.id -> auth.users(id) CASCADE handles the rest.
  DELETE FROM auth.users WHERE id = target_user_id;
  GET DIAGNOSTICS v_auth_deleted = ROW_COUNT;

  -- Belt-and-suspenders: delete orphaned profile if it survived
  DELETE FROM public.profiles WHERE id = target_user_id;
  GET DIAGNOSTICS v_profile_deleted = ROW_COUNT;

  RETURN format(
    'Deleted %s auth user(s), %s profile(s), cleaned %s array row(s).',
    v_auth_deleted, v_profile_deleted, v_array_cleaned
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
