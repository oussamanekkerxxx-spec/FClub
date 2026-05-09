-- ============================================================================
-- 46_stories_schema.sql
-- Adds ephemeral "Stories" tables, views, and reactions with RLS policies.
-- ============================================================================

-- 1. Create stories table
CREATE TABLE IF NOT EXISTS public.stories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id uuid REFERENCES public.profiles(id) NOT NULL,
  club_id uuid REFERENCES public.clubs(id), -- Optional: if story is posted to a specific club
  media_type text NOT NULL CHECK (media_type IN ('image', 'video', 'text')),
  media_url text,
  caption text,
  background_gradient text,
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '24 hours') NOT NULL
);

-- Index for querying unexpired stories efficiently
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON public.stories(author_id);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Stories are viewable by any authenticated user if they haven't expired
-- (If club_id is set, could optionally restrict to club members, but keeping open for community discoverability)
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stories' AND policyname = 'Stories are viewable by anyone') THEN CREATE POLICY "Stories are viewable by anyone" ON public.stories FOR SELECT TO authenticated USING (expires_at > now() OR auth.uid() = author_id); END IF; END $$;

-- Users can insert their own stories
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stories' AND policyname = 'Users can insert their own stories') THEN CREATE POLICY "Users can insert their own stories" ON public.stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id); END IF; END $$;

-- Authors can delete their own stories
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stories' AND policyname = 'Users can delete their own stories') THEN CREATE POLICY "Users can delete their own stories" ON public.stories FOR DELETE TO authenticated USING (auth.uid() = author_id); END IF; END $$;


-- 2. Create story_views table
CREATE TABLE IF NOT EXISTS public.story_views (
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id),
  viewed_at timestamptz DEFAULT now(),
  PRIMARY KEY (story_id, viewer_id)
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Stories author can see who viewed, and viewers can see their own views
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'story_views' AND policyname = 'Views read policy') THEN CREATE POLICY "Views read policy" ON public.story_views FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.stories WHERE id = story_views.story_id AND author_id = auth.uid()) OR viewer_id = auth.uid()); END IF; END $$;

-- Any authenticated user can record a view for themselves
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'story_views' AND policyname = 'Users can insert their own views') THEN CREATE POLICY "Users can insert their own views" ON public.story_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id); END IF; END $$;


-- 3. Create story_reactions table
CREATE TABLE IF NOT EXISTS public.story_reactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;

-- Reactions can be seen by the story author, and the user who reacted
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'story_reactions' AND policyname = 'Reactions read policy') THEN CREATE POLICY "Reactions read policy" ON public.story_reactions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.stories WHERE id = story_reactions.story_id AND author_id = auth.uid()) OR user_id = auth.uid()); END IF; END $$;

-- Users can react
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'story_reactions' AND policyname = 'Users can insert own reactions') THEN CREATE POLICY "Users can insert own reactions" ON public.story_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id); END IF; END $$;

-- Users can delete their own reactions
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'story_reactions' AND policyname = 'Users can delete own reactions') THEN CREATE POLICY "Users can delete own reactions" ON public.story_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id); END IF; END $$;

-- Realtime for live feedback
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_reactions;
