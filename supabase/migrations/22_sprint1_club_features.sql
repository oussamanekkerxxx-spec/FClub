
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES public.club_events(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view RSVPs"
  ON public.event_rsvps FOR SELECT USING (true);

CREATE POLICY "Authenticated users can RSVP"
  ON public.event_rsvps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can un-RSVP themselves"
  ON public.event_rsvps FOR DELETE
  USING (auth.uid() = user_id);

-- Add rsvp_count to club_events if not already present
ALTER TABLE public.club_events
  ADD COLUMN IF NOT EXISTS rsvp_count   int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_online     boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS meeting_link  text,
  ADD COLUMN IF NOT EXISTS duration_mins int;

-- Trigger to keep rsvp_count in sync
CREATE OR REPLACE FUNCTION public.update_event_rsvp_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.club_events SET rsvp_count = rsvp_count + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.club_events SET rsvp_count = GREATEST(0, rsvp_count - 1) WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_event_rsvp_count ON public.event_rsvps;
CREATE TRIGGER trg_event_rsvp_count
  AFTER INSERT OR DELETE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.update_event_rsvp_count();

-- Rich post metadata (polls, code snippets, topic tags, image)
ALTER TABLE public.club_posts
  ADD COLUMN IF NOT EXISTS post_type    text NOT NULL DEFAULT 'text',  -- 'text' | 'poll' | 'code'
  ADD COLUMN IF NOT EXISTS topic_tags   text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS code_lang    text,
  ADD COLUMN IF NOT EXISTS poll_options jsonb;  -- [{ "text": "Option A", "votes": 0 }]
