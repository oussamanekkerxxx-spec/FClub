
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name  text NOT NULL DEFAULT '',
  bio        text,
  avatar_url text,
  neighborhood text,
  location   text,
  city       text,
  region     text,
  phone      text,
  id_card_url    text,
  id_card_status text DEFAULT 'not_submitted'
    CHECK (id_card_status IN ('not_submitted','pending','approved','rejected')),
  trust_tier  integer DEFAULT 0,
  trust_score integer DEFAULT 0,
  archetype   text DEFAULT 'mixed',
  phone_verified   boolean DEFAULT false,
  id_verified      boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  what_i_teach text[] DEFAULT '{}',
  what_i_learn text[] DEFAULT '{}',
  languages    text[] DEFAULT '{}',
  role         text DEFAULT 'member',
  sessions_completed integer DEFAULT 0,
  reviews_count      integer DEFAULT 0,
  joined_at    timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Add any columns that may be missing from an older manually-created table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio        text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS neighborhood text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location   text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city       text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region     text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_tier  integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_score integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS archetype   text DEFAULT 'mixed';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified   boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_verified      boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS what_i_teach text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS what_i_learn text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages    text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role         text DEFAULT 'member';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sessions_completed integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reviews_count      integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS joined_at    timestamptz DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at   timestamptz DEFAULT now();

-- Enable RLS (safe to run even if already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Read: anyone can view profiles
DO $$ BEGIN
  CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Insert: users can create their own profile
DO $$ BEGIN
  CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Update: users can update their own profile
DO $$ BEGIN
  CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
