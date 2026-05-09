-- ============================================================================
-- 00_init.sql
-- Base schema reconstruction for tables created via Supabase dashboard/SQL
-- editor before migrations were introduced. This makes `supabase db reset`
-- work on a fresh clone for the first time.
--
-- Tables reconstructed here:
--   skills, profiles, clubs, club_memberships, club_events, club_posts,
--   club_post_reactions, join_requests, quests, quest_steps, quest_participants
--
-- All CREATE statements use IF NOT EXISTS so re-running is harmless.
-- ============================================================================

-- Ensure pgcrypto is available (used by gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Utility: update_updated_at_column ─────────────────────────────────────
-- Used by triggers in later migrations (e.g. 35_club_projects.sql)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─── skills ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  description text,
  philosophy text,
  who_for text,
  what_session_looks_like text,
  price_per_hour integer DEFAULT 0,
  currency text NOT NULL DEFAULT 'MAD',
  format text,
  location text,
  neighborhood text,
  languages text[],
  level text,
  avg_rating numeric(3,2) DEFAULT 0,
  reviews_count integer DEFAULT 0,
  tags text[],
  cover_gradient text,
  cover_image_url text,
  is_free boolean DEFAULT false,
  is_group boolean DEFAULT false,
  max_headcount integer,
  current_headcount integer DEFAULT 0,
  availability_note text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- ─── profiles ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  bio text,
  avatar_url text,
  neighborhood text,
  location text,
  city text,
  region text,
  phone text,
  id_card_url text,
  id_card_status text DEFAULT 'not_submitted'
    CHECK (id_card_status IN ('not_submitted','pending','approved','rejected')),
  trust_tier integer DEFAULT 0,
  trust_score integer DEFAULT 0,
  archetype text DEFAULT 'mixed',
  phone_verified boolean DEFAULT false,
  id_verified boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  what_i_teach text[] DEFAULT '{}',
  what_i_learn text[] DEFAULT '{}',
  languages text[] DEFAULT '{}',
  role text DEFAULT 'member',
  sessions_completed integer DEFAULT 0,
  reviews_count integer DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ─── clubs ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  cover_image_url text,
  cover_gradient text,
  avatar_url text,
  is_private boolean NOT NULL DEFAULT false,
  rules text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  city text,
  region text,
  member_count integer NOT NULL DEFAULT 0,
  post_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ─── club_memberships ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'pending',
  joined_at timestamptz DEFAULT now()
);

ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;

-- ─── club_events ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  format text NOT NULL DEFAULT 'both',
  event_style text NOT NULL DEFAULT 'workshop',
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  max_attendees integer,
  attendee_count integer NOT NULL DEFAULT 0,
  image_url text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  rsvp_count integer NOT NULL DEFAULT 0,
  is_online boolean NOT NULL DEFAULT true,
  meeting_link text,
  duration_mins integer,
  host_label text,
  outcomes text
);

ALTER TABLE public.club_events ENABLE ROW LEVEL SECURITY;

-- ─── club_posts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  video_url text,
  pdf_url text,
  is_pinned boolean NOT NULL DEFAULT false,
  reaction_count integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  post_type text NOT NULL DEFAULT 'text',
  topic_tags text[] NOT NULL DEFAULT '{}',
  code_lang text,
  poll_options jsonb
);

ALTER TABLE public.club_posts ENABLE ROW LEVEL SECURITY;

-- ─── club_post_reactions ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.club_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.club_post_reactions ENABLE ROW LEVEL SECURITY;

-- ─── join_requests ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- ─── quests ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  difficulty text NOT NULL DEFAULT 'beginner',
  max_participants integer,
  participant_count integer NOT NULL DEFAULT 0,
  step_count integer NOT NULL DEFAULT 0,
  deadline timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ─── quest_steps ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quest_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id uuid NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  completed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed_at timestamptz
);

-- ─── quest_participants ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quest_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id uuid NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now()
);
