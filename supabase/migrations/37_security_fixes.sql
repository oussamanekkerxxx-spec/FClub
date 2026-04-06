-- ─── 1. Missing media columns on club_messages ───────────────────────────────
ALTER TABLE public.club_messages
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS pdf_url   TEXT;

-- ─── 2. Missing image column on club_posts ───────────────────────────────────
ALTER TABLE public.club_posts
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ─── 3. Fix polls RLS — scope reads to club members only ─────────────────────
DROP POLICY IF EXISTS "Enable read access for authenticated users to polls" ON public.polls;
DROP POLICY IF EXISTS "Club members can view polls" ON public.polls;
CREATE POLICY "Club members can view polls"
  ON public.polls FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM   public.club_messages  cm
      JOIN   public.club_channels  cc  ON cc.id  = cm.channel_id
      JOIN   public.club_memberships mbr ON mbr.club_id = cc.club_id
      WHERE  cm.id           = polls.message_id
        AND  mbr.user_id     = auth.uid()
        AND  mbr.status      = 'active'
    )
  );

-- Tighten INSERT: only active members may create polls
DROP POLICY IF EXISTS "Enable insert access for authenticated users to polls" ON public.polls;
DROP POLICY IF EXISTS "Club members can create polls" ON public.polls;
CREATE POLICY "Club members can create polls"
  ON public.polls FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM   public.club_messages  cm
      JOIN   public.club_channels  cc  ON cc.id  = cm.channel_id
      JOIN   public.club_memberships mbr ON mbr.club_id = cc.club_id
      WHERE  cm.id       = polls.message_id
        AND  mbr.user_id = auth.uid()
        AND  mbr.status  = 'active'
    )
  );

-- ─── 4. Fix poll_options RLS ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Enable read access for authenticated users to poll options" ON public.poll_options;
DROP POLICY IF EXISTS "Club members can view poll options" ON public.poll_options;
CREATE POLICY "Club members can view poll options"
  ON public.poll_options FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM   public.polls          p
      JOIN   public.club_messages  cm  ON cm.id  = p.message_id
      JOIN   public.club_channels  cc  ON cc.id  = cm.channel_id
      JOIN   public.club_memberships mbr ON mbr.club_id = cc.club_id
      WHERE  p.id        = poll_options.poll_id
        AND  mbr.user_id = auth.uid()
        AND  mbr.status  = 'active'
    )
  );

DROP POLICY IF EXISTS "Enable insert access for authenticated users to poll options" ON public.poll_options;
DROP POLICY IF EXISTS "Club members can create poll options" ON public.poll_options;
CREATE POLICY "Club members can create poll options"
  ON public.poll_options FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM   public.polls          p
      JOIN   public.club_messages  cm  ON cm.id  = p.message_id
      JOIN   public.club_channels  cc  ON cc.id  = cm.channel_id
      JOIN   public.club_memberships mbr ON mbr.club_id = cc.club_id
      WHERE  p.id        = poll_options.poll_id
        AND  mbr.user_id = auth.uid()
        AND  mbr.status  = 'active'
    )
  );

-- ─── 5. Fix poll_votes RLS ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Enable read access for authenticated users to poll votes" ON public.poll_votes;
DROP POLICY IF EXISTS "Club members can view poll votes" ON public.poll_votes;
CREATE POLICY "Club members can view poll votes"
  ON public.poll_votes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM   public.poll_options   po
      JOIN   public.polls          p   ON p.id   = po.poll_id
      JOIN   public.club_messages  cm  ON cm.id  = p.message_id
      JOIN   public.club_channels  cc  ON cc.id  = cm.channel_id
      JOIN   public.club_memberships mbr ON mbr.club_id = cc.club_id
      WHERE  po.id       = poll_votes.option_id
        AND  mbr.user_id = auth.uid()
        AND  mbr.status  = 'active'
    )
  );

-- ─── 6. Fix event_rsvps RLS — scope to club members ──────────────────────────
DROP POLICY IF EXISTS "Members can view RSVPs" ON public.event_rsvps;
DROP POLICY IF EXISTS "Club members can view RSVPs" ON public.event_rsvps;
CREATE POLICY "Club members can view RSVPs"
  ON public.event_rsvps FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM   public.club_events    ce
      JOIN   public.club_memberships mbr ON mbr.club_id = ce.club_id
      WHERE  ce.id       = event_rsvps.event_id
        AND  mbr.user_id = auth.uid()
        AND  mbr.status  = 'active'
    )
  );

-- ─── 7. Fix vouches RLS — require authentication (prevents anonymous scraping) ─
DO $$
BEGIN
  IF to_regclass('public.vouches') IS NULL THEN
    RETURN;
  END IF;

  DROP POLICY IF EXISTS "Anyone can view vouches" ON public.vouches;
  DROP POLICY IF EXISTS "Authenticated users can view vouches" ON public.vouches;

  CREATE POLICY "Authenticated users can view vouches"
    ON public.vouches FOR SELECT TO authenticated
    USING (true);
END $$;



