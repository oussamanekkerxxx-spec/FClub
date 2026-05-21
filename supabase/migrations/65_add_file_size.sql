-- Migration 65: Add file_size column to club_shared_files

ALTER TABLE public.club_shared_files
  ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Update existing rows to have a default size of 0
UPDATE public.club_shared_files
  SET file_size = 0
  WHERE file_size IS NULL;
