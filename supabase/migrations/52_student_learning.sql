-- Merged from 52a, 52b, 52c, 52d — Student Learning tables, RLS, indexes

-- ── 1. club_courses ──
CREATE TABLE IF NOT EXISTS club_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  math_field TEXT CHECK (math_field IN ('math', 'physics', 'biology', 'chemistry')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. club_lessons ──
CREATE TABLE IF NOT EXISTS club_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES club_courses(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. club_shared_files ──
CREATE TABLE IF NOT EXISTS club_shared_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES club_courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES club_lessons(id) ON DELETE SET NULL,
  message_id UUID REFERENCES club_messages(id) ON DELETE SET NULL,
  channel_id UUID REFERENCES club_channels(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  file_kind TEXT NOT NULL CHECK (file_kind IN ('video', 'pdf', 'document', 'slides', 'spreadsheet', 'image', 'audio', 'other')),
  storage_provider TEXT NOT NULL DEFAULT 'cloudinary',
  storage_public_id TEXT,
  source TEXT NOT NULL DEFAULT 'chat' CHECK (source IN ('chat', 'course', 'lesson')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. RLS ──
ALTER TABLE club_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_shared_files ENABLE ROW LEVEL SECURITY;

-- Policies: club_courses
DO $$ BEGIN CREATE POLICY "club_courses_select" ON club_courses FOR SELECT USING (EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = club_courses.club_id AND club_memberships.user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "club_courses_insert" ON club_courses FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = club_courses.club_id AND club_memberships.user_id = auth.uid() AND club_memberships.role IN ('admin', 'moderator'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "club_courses_update" ON club_courses FOR UPDATE USING (created_by = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "club_courses_delete" ON club_courses FOR DELETE USING (created_by = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Policies: club_lessons
DO $$ BEGIN CREATE POLICY "club_lessons_select" ON club_lessons FOR SELECT USING (EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = club_lessons.club_id AND club_memberships.user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "club_lessons_insert" ON club_lessons FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = club_lessons.club_id AND club_memberships.user_id = auth.uid() AND club_memberships.role IN ('admin', 'moderator'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "club_lessons_update" ON club_lessons FOR UPDATE USING (EXISTS (SELECT 1 FROM club_courses WHERE club_courses.id = club_lessons.course_id AND club_courses.created_by = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "club_lessons_delete" ON club_lessons FOR DELETE USING (EXISTS (SELECT 1 FROM club_courses WHERE club_courses.id = club_lessons.course_id AND club_courses.created_by = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Policies: club_shared_files
DO $$ BEGIN CREATE POLICY "club_shared_files_select" ON club_shared_files FOR SELECT USING (EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = club_shared_files.club_id AND club_memberships.user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "club_shared_files_insert" ON club_shared_files FOR INSERT WITH CHECK (uploaded_by = auth.uid() AND EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = club_shared_files.club_id AND club_memberships.user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "club_shared_files_update" ON club_shared_files FOR UPDATE USING (uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = club_shared_files.club_id AND club_memberships.user_id = auth.uid() AND club_memberships.role IN ('admin', 'moderator'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "club_shared_files_delete" ON club_shared_files FOR DELETE USING (uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = club_shared_files.club_id AND club_memberships.user_id = auth.uid() AND club_memberships.role IN ('admin', 'moderator'))); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 5. Safe column additions (idempotent) ──
ALTER TABLE club_courses ADD COLUMN IF NOT EXISTS math_field TEXT;
ALTER TABLE club_courses ADD COLUMN IF NOT EXISTS description TEXT;

-- Ensure check constraint includes chemistry
DO $$
BEGIN
  ALTER TABLE club_courses DROP CONSTRAINT IF EXISTS club_courses_math_field_check;
  ALTER TABLE club_courses ADD CONSTRAINT club_courses_math_field_check
    CHECK (math_field IS NULL OR math_field IN ('math', 'physics', 'biology', 'chemistry'));
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- ── 6. Indexes ──
CREATE INDEX IF NOT EXISTS idx_club_courses_club_position ON club_courses(club_id, position);
CREATE INDEX IF NOT EXISTS idx_club_lessons_course_position ON club_lessons(course_id, position);
CREATE INDEX IF NOT EXISTS idx_club_lessons_club_created ON club_lessons(club_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_club_shared_files_club_created ON club_shared_files(club_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_club_shared_files_course_created ON club_shared_files(course_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_club_shared_files_lesson_created ON club_shared_files(lesson_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_club_shared_files_message ON club_shared_files(message_id);
