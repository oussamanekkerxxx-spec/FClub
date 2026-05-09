-- Migration: Battles system
-- 1v1 skill showcases with community voting

CREATE TABLE IF NOT EXISTS battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('video', 'code', 'image', 'text', 'audio')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'voting', 'closed', 'cancelled')),
  challenger_id UUID REFERENCES profiles(id),
  opponent_id UUID REFERENCES profiles(id),
  challenger_club_id UUID REFERENCES clubs(id),
  opponent_club_id UUID REFERENCES clubs(id),
  judge_type TEXT NOT NULL DEFAULT 'community_vote' CHECK (judge_type IN ('community_vote', 'panel', 'auto')),
  deadline TIMESTAMPTZ,
  winner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS battle_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID REFERENCES battles(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES profiles(id),
  content_url TEXT,
  description TEXT,
  votes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS battle_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID REFERENCES battles(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES battle_submissions(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(battle_id, voter_id)
);

-- RLS
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Battles are readable by club members"
  ON battles FOR SELECT
  USING (EXISTS (SELECT 1 FROM club_memberships WHERE club_id = battles.club_id AND user_id = auth.uid() AND status = 'active'));

CREATE POLICY "Battles can be created by club members"
  ON battles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM club_memberships WHERE club_id = battles.club_id AND user_id = auth.uid() AND status = 'active'));

CREATE POLICY "Battle submissions are readable by club members"
  ON battle_submissions FOR SELECT
  USING (EXISTS (SELECT 1 FROM battles b JOIN club_memberships cm ON b.club_id = cm.club_id WHERE b.id = battle_submissions.battle_id AND cm.user_id = auth.uid() AND cm.status = 'active'));

CREATE POLICY "Battle votes are readable by club members"
  ON battle_votes FOR SELECT
  USING (EXISTS (SELECT 1 FROM battles b JOIN club_memberships cm ON b.club_id = cm.club_id WHERE b.id = battle_votes.battle_id AND cm.user_id = auth.uid() AND cm.status = 'active'));

CREATE POLICY "Users can cast one vote per battle"
  ON battle_votes FOR INSERT
  WITH CHECK (voter_id = auth.uid());

-- Triggers
CREATE OR REPLACE FUNCTION update_battle_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE battle_submissions SET votes_count = votes_count + 1 WHERE id = NEW.submission_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE battle_submissions SET votes_count = GREATEST(votes_count - 1, 0) WHERE id = OLD.submission_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_battle_votes ON battle_votes;
CREATE TRIGGER trg_battle_votes AFTER INSERT OR DELETE ON battle_votes
  FOR EACH ROW EXECUTE FUNCTION update_battle_vote_count();

CREATE OR REPLACE FUNCTION award_battle_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'closed' AND NEW.winner_id IS NOT NULL AND OLD.status != 'closed' THEN
    INSERT INTO club_member_points (club_id, user_id, points, reason)
    VALUES (NEW.club_id, NEW.winner_id, 25, 'battle_winner');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_battle_winner ON battles;
CREATE TRIGGER trg_battle_winner AFTER UPDATE ON battles
  FOR EACH ROW WHEN (OLD.status != 'closed' AND NEW.status = 'closed')
  EXECUTE FUNCTION award_battle_points();

-- Indexes
CREATE INDEX idx_battles_club ON battles(club_id);
CREATE INDEX idx_battles_status ON battles(status);
CREATE INDEX idx_battle_submissions_battle ON battle_submissions(battle_id);
CREATE INDEX idx_battle_votes_battle ON battle_votes(battle_id);
