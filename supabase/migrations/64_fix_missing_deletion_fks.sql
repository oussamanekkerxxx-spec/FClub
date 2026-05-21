-- Migration 64: Fix missing ON DELETE CASCADE / SET NULL for tables created after migration 60
--
-- Migration 60 scanned the catalog and fixed FKs, but it ran before several newer
-- tables existed (stories, battles, tournaments, club_bans, club_mutes, etc.).
-- This migration re-runs the same dynamic scan with an updated column whitelist
-- so any newly-added restrictive FKs are also fixed.

CREATE OR REPLACE FUNCTION pg_temp.fix_user_deletion_fks_v2()
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
    -- Only handle single-column FKs to id (composite FKs are left alone)
    IF array_length(rec.col_names, 1) != 1 OR array_length(rec.ref_col_names, 1) != 1 THEN
      CONTINUE;
    END IF;

    IF rec.ref_col_names[1] != 'id' THEN
      CONTINUE;
    END IF;

    v_cols := rec.col_names[1];

    -- Decide: SET NULL or CASCADE?
    -- SET NULL for "actor/reviewer/participant" columns where the row should survive.
    IF v_cols IN (
      'created_by','reviewed_by','banned_by','muted_by','winner_id',
      'host_id','completed_by','assigned_to','added_by',
      'participant_a_id','participant_b_id',
      'challenger_club_id','opponent_club_id',
      'host_club_id','opponent_club_id','winner_club_id',
      'skill_id',
      'opponent_id'          -- battles.opponent_id: battle should survive if opponent deletes account
    ) THEN
      v_new_rule := 'SET NULL';
    ELSE
      v_new_rule := 'CASCADE';
    END IF;

    -- If we chose SET NULL, make sure the column is actually nullable
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

    -- Drop and recreate
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

-- Run the fix and report what was changed
SELECT * FROM pg_temp.fix_user_deletion_fks_v2();
