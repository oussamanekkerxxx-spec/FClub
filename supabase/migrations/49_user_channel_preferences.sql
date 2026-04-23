-- Create table for user-specific channel preferences (pinned, archived)
CREATE TABLE IF NOT EXISTS public.user_channel_preferences (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.club_channels(id) ON DELETE CASCADE,
  is_pinned boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, channel_id)
);

ALTER TABLE public.user_channel_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own channel preferences"
  ON public.user_channel_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_channel_preferences;
