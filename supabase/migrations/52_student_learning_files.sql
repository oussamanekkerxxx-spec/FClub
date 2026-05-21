
-- 1. club_courses
CREATE TABLE IF NOT EXISTS club_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. club_lessons
CREATE TABLE IF NOT EXISTS club_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES club_courses(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. club_shared_files
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE club_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_shared_files ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- RLS: club_courses
-- ----------------------------------------------------
CREATE POLICY "Courses viewable by club members"
  ON club_courses FOR SELECT
  USING (
    is_published = true
    OR EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = club_courses.club_id
      AND club_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Club members can create courses"
  ON club_courses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = club_courses.club_id
      AND club_memberships.user_id = auth.uid()
      AND club_memberships.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Course creators can update their courses"
  ON club_courses FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Course creators can delete their courses"
  ON club_courses FOR DELETE
  USING (created_by = auth.uid());

-- ----------------------------------------------------
-- RLS: club_lessons
-- ----------------------------------------------------
CREATE POLICY "Lessons viewable by club members"
  ON club_lessons FOR SELECT
  USING (
    is_published = true
    OR EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = club_lessons.club_id
      AND club_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Club mods/admins can create lessons"
  ON club_lessons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = club_lessons.club_id
      AND club_memberships.user_id = auth.uid()
      AND club_memberships.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Course creators can update lessons"
  ON club_lessons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_courses
      WHERE club_courses.id = club_lessons.course_id
      AND club_courses.created_by = auth.uid()
    )
  );

CREATE POLICY "Course creators can delete lessons"
  ON club_lessons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM club_courses
      WHERE club_courses.id = club_lessons.course_id
      AND club_courses.created_by = auth.uid()
    )
  );

-- ----------------------------------------------------
-- RLS: club_shared_files
-- ----------------------------------------------------
CREATE POLICY "Shared files viewable by club members"
  ON club_shared_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = club_shared_files.club_id
      AND club_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Club members can add shared files"
  ON club_shared_files FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = club_shared_files.club_id
      AND club_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Uploaders can update their shared files"
  ON club_shared_files FOR UPDATE
  USING (uploaded_by = auth.uid());

CREATE POLICY "Uploaders can delete their shared files"
  ON club_shared_files FOR DELETE
  USING (uploaded_by = auth.uid());

-- Additional: Moderators/admins can delete any shared files in their club
CREATE POLICY "Mods/admins can delete any shared files"
  ON club_shared_files FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = club_shared_files.club_id
      AND club_memberships.user_id = auth.uid()
      AND club_memberships.role IN ('admin', 'moderator')
    )
  );

-- Triggers
CREATE TRIGGER update_club_courses_updated_at
  BEFORE UPDATE ON club_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_club_lessons_updated_at
  BEFORE UPDATE ON club_lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_club_shared_files_updated_at
  BEFORE UPDATE ON club_shared_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_club_courses_club_position
  ON club_courses(club_id, position);

CREATE INDEX IF NOT EXISTS idx_club_lessons_course_position
  ON club_lessons(course_id, position);

CREATE INDEX IF NOT EXISTS idx_club_lessons_club_created
  ON club_lessons(club_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_club_shared_files_club_created
  ON club_shared_files(club_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_club_shared_files_course_created
  ON club_shared_files(course_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_club_shared_files_lesson_created
  ON club_shared_files(lesson_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_club_shared_files_message
  ON club_shared_files(message_id);