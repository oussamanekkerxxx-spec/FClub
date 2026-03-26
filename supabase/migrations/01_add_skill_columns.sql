ALTER TABLE skills ADD COLUMN IF NOT EXISTS avg_rating numeric(3,2) default 0;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS reviews_count integer default 0;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS currency text default 'MAD';
ALTER TABLE skills ADD COLUMN IF NOT EXISTS who_for text;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS what_session_looks_like text;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS location text;
