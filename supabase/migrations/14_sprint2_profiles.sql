-- Sprint 2: Add phone, id_card_url, and id_card_status columns to profiles

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_card_url text;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_card_status text
  DEFAULT 'not_submitted'
  CHECK (id_card_status IN ('not_submitted', 'pending', 'approved', 'rejected'));

-- avatar_url already exists (from initial schema), but ensure it's present
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
