-- Migration 45: DM read receipts
-- Tracks per-user last-read timestamp per conversation so we can show unread badges.

CREATE TABLE IF NOT EXISTS public.dm_reads (
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  last_read_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, conversation_id)
);

ALTER TABLE public.dm_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dm_reads" ON public.dm_reads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dm_reads" ON public.dm_reads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dm_reads" ON public.dm_reads
  FOR UPDATE USING (auth.uid() = user_id);
