-- 33: Message extras - forward support + pinned messages per channel

-- 1. Forward attribution columns on messages
ALTER TABLE public.club_messages
  ADD COLUMN IF NOT EXISTS forwarded_from_id   UUID REFERENCES public.club_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS forwarded_from_name TEXT;

-- 2. Pinned message per channel (single pin; extend to array for multi-pin later)
ALTER TABLE public.club_channels
  ADD COLUMN IF NOT EXISTS pinned_message_id UUID REFERENCES public.club_messages(id) ON DELETE SET NULL;

-- Admins/mods can update the pinned message on a channel
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'club_channels'
      AND policyname = 'Mods can pin messages in their clubs'
  ) THEN
    CREATE POLICY "Mods can pin messages in their clubs"
      ON public.club_channels FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.club_memberships cm
          WHERE cm.club_id = club_channels.club_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'moderator')
            AND cm.status = 'active'
        )
      );
  END IF;
END $$;
