-- Diagnostic script: check for orphaned profiles and non-FK user ID storage
-- Run this manually in the SQL Editor when investigating user deletion issues.
-- NOT a migration — do not place in supabase/migrations/.

-- ── 1. Diagnostic: show non-FK places that store user IDs ────────────────────

SELECT 'ARRAY columns (not cleaned by CASCADE)' AS issue_type,
       table_name,
       column_name,
       data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND data_type = 'ARRAY'
  AND udt_name = '_uuid'
UNION ALL
SELECT 'JSONB columns (may contain user IDs)' AS issue_type,
       table_name,
       column_name,
       data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND data_type = 'jsonb'
ORDER BY issue_type, table_name, column_name;

-- ── 2. Diagnostic: count orphaned profiles (no auth.users row) ───────────────

SELECT COUNT(*) AS orphaned_profile_count
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE u.id IS NULL;

-- ── 3. Optional: one-time cleanup of already-orphaned profiles ───────────────
-- Uncomment and run this if you have old orphaned profiles:
--
-- DELETE FROM public.profiles
-- WHERE id NOT IN (SELECT id FROM auth.users);
