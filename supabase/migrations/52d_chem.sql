-- Add chemistry option and description to courses
ALTER TABLE club_courses ADD COLUMN IF NOT EXISTS math_field TEXT;
ALTER TABLE club_courses ADD COLUMN IF NOT EXISTS description TEXT;

DO $$ 
BEGIN
  ALTER TABLE club_courses DROP CONSTRAINT IF EXISTS club_courses_math_field_check;
  ALTER TABLE club_courses ADD CONSTRAINT club_courses_math_field_check 
    CHECK (math_field IS NULL OR math_field IN ('math', 'physics', 'biology', 'chemistry'));
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;