DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'club_memberships' AND policyname = 'Members can join clubs'
  ) THEN
    CREATE POLICY "Members can join clubs"
      ON public.club_memberships FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Allow admins/mods to approve join requests by inserting membership for another user
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'club_memberships' AND policyname = 'Admins can approve members'
  ) THEN
    CREATE POLICY "Admins can approve members"
      ON public.club_memberships FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.club_memberships AS admin_m
          WHERE admin_m.club_id = club_memberships.club_id
            AND admin_m.user_id = auth.uid()
            AND admin_m.role IN ('admin', 'moderator')
            AND admin_m.status = 'active'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'club_memberships' AND policyname = 'Members can leave clubs'
  ) THEN
    CREATE POLICY "Members can leave clubs"
      ON public.club_memberships FOR DELETE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'club_memberships' AND policyname = 'Admins can remove members'
  ) THEN
    CREATE POLICY "Admins can remove members"
      ON public.club_memberships FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.club_memberships AS admin_m
          WHERE admin_m.club_id = club_memberships.club_id
            AND admin_m.user_id = auth.uid()
            AND admin_m.role = 'admin'
            AND admin_m.status = 'active'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'club_memberships' AND policyname = 'Admins can update member roles'
  ) THEN
    CREATE POLICY "Admins can update member roles"
      ON public.club_memberships FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.club_memberships AS admin_m
          WHERE admin_m.club_id = club_memberships.club_id
            AND admin_m.user_id = auth.uid()
            AND admin_m.role IN ('admin', 'moderator')
            AND admin_m.status = 'active'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'join_requests' AND policyname = 'Admins can approve join requests'
  ) THEN
    CREATE POLICY "Admins can approve join requests"
      ON public.join_requests FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.club_memberships
          WHERE club_memberships.club_id = join_requests.club_id
            AND club_memberships.user_id = auth.uid()
            AND club_memberships.role IN ('admin', 'moderator')
            AND club_memberships.status = 'active'
        )
      );
  END IF;
END $$;

-- Ensure unique membership per user per club (required for upsert onConflict to work)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'club_memberships_club_id_user_id_key'
  ) THEN
    ALTER TABLE public.club_memberships
      ADD CONSTRAINT club_memberships_club_id_user_id_key UNIQUE (club_id, user_id);
  END IF;
END $$;

-- Fix 3: Add is_active to skills (missing column causing 400 on all skills queries)
ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Fix 2: Add new columns if migration 22 was not yet applied
-- These are safe to run multiple times (IF NOT EXISTS / idempotent)
ALTER TABLE public.club_posts
  ADD COLUMN IF NOT EXISTS post_type    text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS topic_tags   text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS code_lang    text,
  ADD COLUMN IF NOT EXISTS poll_options jsonb;


ALTER TABLE public.club_events
  ADD COLUMN IF NOT EXISTS rsvp_count    int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_online     boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS meeting_link  text,
  ADD COLUMN IF NOT EXISTS duration_mins int;

-- event_rsvps table (also safe to re-run)
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES public.club_events(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'event_rsvps' AND policyname = 'Members can view RSVPs'
  ) THEN
    CREATE POLICY "Members can view RSVPs" ON public.event_rsvps FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'event_rsvps' AND policyname = 'Authenticated users can RSVP'
  ) THEN
    CREATE POLICY "Authenticated users can RSVP" ON public.event_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'event_rsvps' AND policyname = 'Users can un-RSVP themselves'
  ) THEN
    CREATE POLICY "Users can un-RSVP themselves" ON public.event_rsvps FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Allow club members to insert club_posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'club_posts' AND policyname = 'Members can create posts'
  ) THEN
    CREATE POLICY "Members can create posts"
      ON public.club_posts FOR INSERT
      WITH CHECK (
        auth.uid() = author_id
        AND EXISTS (
          SELECT 1 FROM public.club_memberships
          WHERE club_memberships.club_id = club_posts.club_id
            AND club_memberships.user_id = auth.uid()
            AND club_memberships.status = 'active'
        )
      );
  END IF;
END $$;

-- Allow members to create club events (mods/admins in practice)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'club_events' AND policyname = 'Members can create events'
  ) THEN
    CREATE POLICY "Members can create events"
      ON public.club_events FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.club_memberships
          WHERE club_memberships.club_id = club_events.club_id
            AND club_memberships.user_id = auth.uid()
            AND club_memberships.role IN ('admin', 'moderator')
            AND club_memberships.status = 'active'
        )
      );
  END IF;
END $$;

-- Allow users to react to posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'club_post_reactions' AND policyname = 'Members can react to posts'
  ) THEN
    CREATE POLICY "Members can react to posts"
      ON public.club_post_reactions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'club_post_reactions' AND policyname = 'Members can remove own reactions'
  ) THEN
    CREATE POLICY "Members can remove own reactions"
      ON public.club_post_reactions FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;
