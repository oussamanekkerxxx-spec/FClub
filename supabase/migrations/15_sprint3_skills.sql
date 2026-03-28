-- Sprint 3: Add cover image URL to skills table
ALTER TABLE skills ADD COLUMN IF NOT EXISTS cover_image_url text;
