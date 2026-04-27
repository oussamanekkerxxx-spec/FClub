-- Student Learning Files - Step 2: RLS and Indexes
-- Run this after step 1 (run each only once, or drop existing first)

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "club_courses_select" ON club_courses;
DROP POLICY IF EXISTS "club_courses_insert" ON club_courses;
DROP POLICY IF EXISTS "club_courses_update" ON club_courses;
DROP POLICY IF EXISTS "club_courses_delete" ON club_courses;
DROP POLICY IF EXISTS "club_lessons_select" ON club_lessons;
DROP POLICY IF EXISTS "club_lessons_insert" ON club_lessons;
DROP POLICY IF EXISTS "club_lessons_update" ON club_lessons;
DROP POLICY IF EXISTS "club_lessons_delete" ON club_lessons;
DROP POLICY IF EXISTS "club_shared_files_select" ON club_shared_files;
DROP POLICY IF EXISTS "club_shared_files_insert" ON club_shared_files;
DROP POLICY IF EXISTS "club_shared_files_update" ON club_shared_files;
DROP POLICY IF EXISTS "club_shared_files_delete" ON club_shared_files;

-- Enable RLS
ALTER TABLE club_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_shared_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies - club_courses
CREATE POLICY "club_courses_select" ON club_courses FOR SELECT USING (EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = club_courses.club_id AND club_memberships.user_id = auth.uid()));
CREATE POLICY "club_courses_insert" ON club_courses FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = club_courses.club_id AND club_memberships.user_id = auth.uid() AND club_memberships.role IN ('admin', 'moderator')));
CREATE POLICY "club_courses_update" ON club_courses FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "club_courses_delete" ON club_courses FOR DELETE USING (created_by = auth.uid());

-- RLS Policies - club_lessons
CREATE POLICY "club_lessons_select" ON club_lessons FOR SELECT USING (EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = club_lessons.club_id AND club_memberships.user_id = auth.uid()));
CREATE POLICY "club_lessons_insert" ON club_lessons FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = club_lessons.club_id AND club_memberships.user_id = auth.uid() AND club_memberships.role IN ('admin', 'moderator')));
CREATE POLICY "club_lessons_update" ON club_lessons FOR UPDATE USING (EXISTS (SELECT 1 FROM club_courses WHERE club_courses.id = club_lessons.course_id AND club_courses.created_by = auth.uid()));
CREATE POLICY "club_lessons_delete" ON club_lessons FOR DELETE USING (EXISTS (SELECT 1 FROM club_courses WHERE club_courses.id = club_lessons.course_id AND club_courses.created_by = auth.uid()));

-- RLS Policies - club_shared_files
CREATE POLICY "club_shared_files_select" ON club_shared_files FOR SELECT USING (EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = club_shared_files.club_id AND club_memberships.user_id = auth.uid()));
CREATE POLICY "club_shared_files_insert" ON club_shared_files FOR INSERT WITH CHECK (uploaded_by = auth.uid() AND EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = club_shared_files.club_id AND club_memberships.user_id = auth.uid()));
CREATE POLICY "club_shared_files_update" ON club_shared_files FOR UPDATE USING (uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = club_shared_files.club_id AND club_memberships.user_id = auth.uid() AND club_memberships.role IN ('admin', 'moderator')));
CREATE POLICY "club_shared_files_delete" ON club_shared_files FOR DELETE USING (uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = club_shared_files.club_id AND club_memberships.user_id = auth.uid() AND club_memberships.role IN ('admin', 'moderator')));

-- Add math_field column if doesn't exist
ALTER TABLE club_courses ADD COLUMN IF NOT EXISTS math_field TEXT CHECK (math_field IN ('math', 'physics', 'biology'));

-- Indexes (use OR REPLACE to avoid errors)
DROP INDEX IF EXISTS idx_club_courses_club_position;
DROP INDEX IF EXISTS idx_club_lessons_course_position;
DROP INDEX IF EXISTS idx_club_lessons_club_created;
DROP INDEX IF EXISTS idx_club_shared_files_club_created;
DROP INDEX IF EXISTS idx_club_shared_files_course_created;
DROP INDEX IF EXISTS idx_club_shared_files_lesson_created;
DROP INDEX IF EXISTS idx_club_shared_files_message;

CREATE INDEX idx_club_courses_club_position ON club_courses(club_id, position);
CREATE INDEX idx_club_lessons_course_position ON club_lessons(course_id, position);
CREATE INDEX idx_club_lessons_club_created ON club_lessons(club_id, created_at DESC);
CREATE INDEX idx_club_shared_files_club_created ON club_shared_files(club_id, created_at DESC);
CREATE INDEX idx_club_shared_files_course_created ON club_shared_files(course_id, created_at DESC);
CREATE INDEX idx_club_shared_files_lesson_created ON club_shared_files(lesson_id, created_at DESC);
CREATE INDEX idx_club_shared_files_message ON club_shared_files(message_id);