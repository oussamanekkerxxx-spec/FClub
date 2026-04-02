
ALTER PUBLICATION supabase_realtime ADD TABLE public.club_messages;

-- Mods and admins can delete messages in clubs they manage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'club_messages'
      AND policyname = 'Mods can delete messages in their clubs'
  ) THEN
    CREATE POLICY "Mods can delete messages in their clubs"
      ON public.club_messages FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.club_channels cc
          JOIN public.club_memberships cm ON cm.club_id = cc.club_id
          WHERE cc.id = club_messages.channel_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'moderator')
            AND cm.status = 'active'
        )
      );
  END IF;
END $$;
