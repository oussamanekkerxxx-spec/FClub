
CREATE TABLE IF NOT EXISTS public.club_typing (
    channel_id UUID NOT NULL REFERENCES public.club_channels(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (channel_id, user_id)
);

ALTER TABLE public.club_typing ENABLE ROW LEVEL SECURITY;

-- Members of the club can see who is typing
CREATE POLICY "Club members can read typing status"
  ON public.club_typing FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.club_channels cc
      JOIN public.club_memberships cm ON cm.club_id = cc.club_id
      WHERE cc.id = club_typing.channel_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

-- Users can upsert their own typing status
CREATE POLICY "Users can upsert their own typing status"
  ON public.club_typing FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own typing status"
  ON public.club_typing FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own typing status (on send/blur)
CREATE POLICY "Users can delete their own typing status"
  ON public.club_typing FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for typing indicators
ALTER PUBLICATION supabase_realtime ADD TABLE public.club_typing;

