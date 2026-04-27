-- Student Learning Files - Step 2: Add math_field column and indexes only
-- Run this if tables already exist with RLS

-- Add math_field column to club_courses if missing
ALTER TABLE club_courses ADD COLUMN IF NOT EXISTS math_field TEXT;

-- Add CHECK constraint if column exists but constraint missing
DO $$ 
BEGIN
  ALTER TABLE club_courses DROP CONSTRAINT IF EXISTS club_courses_math_field_check;
  ALTER TABLE club_courses ADD CONSTRAINT club_courses_math_field_check 
    CHECK (math_field IS NULL OR math_field IN ('math', 'physics', 'biology'));
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Create indexes (skip if exist)
CREATE INDEX IF NOT EXISTS idx_club_courses_club_position ON club_courses(club_id, position);
CREATE INDEX IF NOT EXISTS idx_club_lessons_course_position ON club_lessons(course_id, position);
CREATE INDEX IF NOT EXISTS idx_club_lessons_club_created ON club_lessons(club_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_club_shared_files_club_created ON club_shared_files(club_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_club_shared_files_course_created ON club_shared_files(course_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_club_shared_files_lesson_created ON club_shared_files(lesson_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_club_shared_files_message ON club_shared_files(message_id);