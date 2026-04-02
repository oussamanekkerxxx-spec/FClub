
-- ─── club_channels ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_channels (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id      uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name         text NOT NULL,
  description  text,
  is_announcement_only boolean NOT NULL DEFAULT false,
  created_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_index  int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.club_channels ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'club_channels' AND policyname = 'Members can view club channels') THEN
    CREATE POLICY "Members can view club channels"
      ON public.club_channels FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.club_memberships
          WHERE club_memberships.club_id = club_channels.club_id
            AND club_memberships.user_id = auth.uid()
            AND club_memberships.status = 'active'
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'club_channels' AND policyname = 'Mods can manage club channels') THEN
    CREATE POLICY "Mods can manage club channels"
      ON public.club_channels FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.club_memberships
          WHERE club_memberships.club_id = club_channels.club_id
            AND club_memberships.user_id = auth.uid()
            AND club_memberships.role IN ('admin', 'moderator')
            AND club_memberships.status = 'active'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.club_memberships
          WHERE club_memberships.club_id = club_channels.club_id
            AND club_memberships.user_id = auth.uid()
            AND club_memberships.role IN ('admin', 'moderator')
            AND club_memberships.status = 'active'
        )
      );
  END IF;
END $$;


-- ─── club_messages ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.club_channels(id) ON DELETE CASCADE,
  sender_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.club_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'club_messages' AND policyname = 'Members can view messages in their clubs') THEN
    CREATE POLICY "Members can view messages in their clubs"
      ON public.club_messages FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.club_channels cc
          JOIN public.club_memberships cm ON cm.club_id = cc.club_id
          WHERE cc.id = club_messages.channel_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'club_messages' AND policyname = 'Members can insert messages if not announcement only') THEN
    CREATE POLICY "Members can insert messages if not announcement only"
      ON public.club_messages FOR INSERT
      WITH CHECK (
        -- User is the sender
        auth.uid() = sender_id
        AND
        -- User is an active member
        EXISTS (
          SELECT 1 FROM public.club_channels cc
          JOIN public.club_memberships cm ON cm.club_id = cc.club_id
          WHERE cc.id = club_messages.channel_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
            AND (
              -- Can ALWAYS post if it's NOT an announcement channel
              cc.is_announcement_only = false
              OR
              -- If it IS an announcement channel, must be mod/admin
              (cc.is_announcement_only = true AND cm.role IN ('admin', 'moderator'))
            )
        )
      );
  END IF;
END $$;
