-- Add dimension columns to messages table
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS image_width INT,
  ADD COLUMN IF NOT EXISTS image_height INT,
  ADD COLUMN IF NOT EXISTS video_width INT,
  ADD COLUMN IF NOT EXISTS video_height INT;

-- Add dimension columns to club_messages table
ALTER TABLE public.club_messages
  ADD COLUMN IF NOT EXISTS image_width INT,
  ADD COLUMN IF NOT EXISTS image_height INT,
  ADD COLUMN IF NOT EXISTS video_width INT,
  ADD COLUMN IF NOT EXISTS video_height INT;
