CREATE TABLE IF NOT EXISTS public.session_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  duration_hours DECIMAL(4,2) NOT NULL DEFAULT 1.0,
  price_paid INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'MAD',
  review_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for session ledger
CREATE INDEX idx_session_ledger_teacher ON public.session_ledger(teacher_id);
CREATE INDEX idx_session_ledger_learner ON public.session_ledger(learner_id);

-- Enable RLS
ALTER TABLE public.session_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON public.session_ledger FOR SELECT
  USING (auth.uid() = teacher_id OR auth.uid() = learner_id);

CREATE POLICY "Users can insert sessions involving themselves"
  ON public.session_ledger FOR INSERT
  WITH CHECK (auth.uid() = teacher_id OR auth.uid() = learner_id);


-- 2. Vouches/Endorsements (peer credibility)
CREATE TABLE IF NOT EXISTS public.vouches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_tag TEXT NOT NULL,
  vouch_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(voucher_id, recipient_id, skill_tag)
);

-- Indexes for vouches
CREATE INDEX idx_vouches_recipient ON public.vouches(recipient_id);

-- Enable RLS
ALTER TABLE public.vouches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vouches"
  ON public.vouches FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create vouches"
  ON public.vouches FOR INSERT
  WITH CHECK (auth.uid() = voucher_id AND auth.uid() != recipient_id);

CREATE POLICY "Users can delete their own vouches"
  ON public.vouches FOR DELETE
  USING (auth.uid() = voucher_id);


-- 3. Triggers to auto-update trust_score on profiles

-- Function logic to recalculate trust score
CREATE OR REPLACE FUNCTION recalculate_user_trust_score(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
  ledger_score INTEGER;
  vouches_score INTEGER;
BEGIN
  -- 10 points per hour taught
  SELECT COALESCE(SUM(duration_hours * 10), 0)
  INTO ledger_score
  FROM public.session_ledger
  WHERE teacher_id = target_user_id;

  -- 5 points per vouch received
  SELECT COUNT(*) * 5
  INTO vouches_score
  FROM public.vouches
  WHERE recipient_id = target_user_id;

  -- Update the profile
  UPDATE public.profiles
  SET trust_score = ledger_score + vouches_score
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for session_ledger
CREATE OR REPLACE FUNCTION trigger_update_trust_from_ledger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM recalculate_user_trust_score(NEW.teacher_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM recalculate_user_trust_score(OLD.teacher_id);
  END IF;
  RETURN NULL; -- AFTER trigger
END;
$$ LANGUAGE plpgsql;

-- Trigger function for vouches
CREATE OR REPLACE FUNCTION trigger_update_trust_from_vouches()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM recalculate_user_trust_score(NEW.recipient_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM recalculate_user_trust_score(OLD.recipient_id);
  END IF;
  RETURN NULL; -- AFTER trigger
END;
$$ LANGUAGE plpgsql;

-- Attach triggers
DROP TRIGGER IF EXISTS on_ledger_change ON public.session_ledger;
CREATE TRIGGER on_ledger_change
  AFTER INSERT OR UPDATE OR DELETE ON public.session_ledger
  FOR EACH ROW EXECUTE FUNCTION trigger_update_trust_from_ledger();

DROP TRIGGER IF EXISTS on_vouch_change ON public.vouches;
CREATE TRIGGER on_vouch_change
  AFTER INSERT OR UPDATE OR DELETE ON public.vouches
  FOR EACH ROW EXECUTE FUNCTION trigger_update_trust_from_vouches();
