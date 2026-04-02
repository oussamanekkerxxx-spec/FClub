-- 29_club_chat_phase2.sql
-- Add Phase 2 features: message reactions and channel read receipts

CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES public.club_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read reactions" ON public.message_reactions FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reactions" ON public.message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reactions" ON public.message_reactions FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.channel_reads (
    channel_id UUID NOT NULL REFERENCES public.club_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (channel_id, user_id)
);
ALTER TABLE public.channel_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own read receipts" ON public.channel_reads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert/update their own receipts" ON public.channel_reads FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Enable real-time for message_reactions
begin;
  -- remove the supabase_realtime publication temporarily
  drop publication if exists supabase_realtime;
  
  -- re-create it with message_reactions added to the list of tables
  create publication supabase_realtime for table 
    public.club_messages,
    public.message_reactions;
commit;
