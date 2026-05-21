

-- ----------------------------------------------------
-- RLS: club_courses - fix read to be member-only
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Courses viewable by club members" ON club_courses;

CREATE POLICY "Courses viewable by club members"
  ON club_courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = club_courses.club_id
      AND club_memberships.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------
-- RLS: club_lessons - fix read to be member-only  
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Lessons viewable by club members" ON club_lessons;

CREATE POLICY "Lessons viewable by club members"
  ON club_lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = club_lessons.club_id
      AND club_memberships.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------
-- RLS: club_shared_files - ensure member read/write
-- ----------------------------------------------------
-- Already correct, but verify
-- Read: Members (already correct)
-- Insert: Members (already correct - uploaded_by = auth.uid() AND member)

-- Note: Update policy should allow mods to edit too for moderation
DROP POLICY IF EXISTS "Uploaders can update their shared files" ON club_shared_files;

CREATE POLICY "Members can update shared files"
  ON club_shared_files FOR UPDATE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = club_shared_files.club_id
      AND club_memberships.user_id = auth.uid()
      AND club_memberships.role IN ('admin', 'moderator')
    )
  );