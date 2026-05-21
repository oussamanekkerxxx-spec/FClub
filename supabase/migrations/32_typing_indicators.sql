
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






Unread badge appears on channels with unread messages, clears on switch
     - Typing indicator appears/disappears in < 5s
     - Scrolling to top loads 50 earlier messages without losing position
     - Bold/italic/underline/code/spoiler formatting renders correctly in bubbles
     - Forward sends message to selected channel with "Forwarded" label
     - Pinned message banner loads from DB and scrolls on click
     - Blue double checkmarks appear only after other user has read
     - 3-image album renders as grid, 10-image album caps at grid
     - View-once media disappears after first play
     - Voice recording lock gesture works on mobile
     - Round video message bubble records and plays
     - AI grammar/rewrite/translate buttons work end-to-end via Edge Function
     - Self-destruct deletes message after timer expires