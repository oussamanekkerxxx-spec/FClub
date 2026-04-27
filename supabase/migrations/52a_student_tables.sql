-- Student Learning Files - Step 1: Tables only
-- Run this first. If it works, run step 2.

-- 1. club_courses
CREATE TABLE club_courses (
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

-- 2. club_lessons  
CREATE TABLE club_lessons (
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

-- 3. club_shared_files
CREATE TABLE club_shared_files (
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