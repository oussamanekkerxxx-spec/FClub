-- Phase 3: Voice, Location, and Polls

-- Add new payload columns to club_messages
ALTER TABLE public.club_messages 
ADD COLUMN IF NOT EXISTS voice_url TEXT,
ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;

-- Create polls table
CREATE TABLE IF NOT EXISTS public.polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES public.club_messages(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    multiple_answers BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll_options table
CREATE TABLE IF NOT EXISTS public.poll_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    text TEXT NOT NULL
);

-- Create poll_votes table
CREATE TABLE IF NOT EXISTS public.poll_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(option_id, user_id)
);

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_polls_message_id ON public.polls(message_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON public.poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_option_id ON public.poll_votes(option_id);

-- Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Basic Polls RLS (Authenticated users can view and create polls)
CREATE POLICY "Enable read access for authenticated users to polls" ON public.polls FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users to polls" ON public.polls FOR INSERT TO authenticated WITH CHECK (true);

-- Basic Poll Options RLS (Authenticated users can view and create options)
CREATE POLICY "Enable read access for authenticated users to poll options" ON public.poll_options FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users to poll options" ON public.poll_options FOR INSERT TO authenticated WITH CHECK (true);

-- Basic Poll Votes RLS (Authenticated users can view, vote, and unvote)
CREATE POLICY "Enable read access for authenticated users to poll votes" ON public.poll_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users to vote" ON public.poll_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable delete access for authenticated users to unvote" ON public.poll_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable Realtime for Polls so votes sync instantly
ALTER PUBLICATION supabase_realtime ADD TABLE polls;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_options;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_votes;
