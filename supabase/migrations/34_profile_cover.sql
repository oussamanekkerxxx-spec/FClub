-- 34: Profile cover/background image
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cover_url TEXT;
