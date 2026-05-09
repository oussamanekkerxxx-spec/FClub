-- Migration: Tournaments system
-- Club vs club competitive brackets

CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_club_id UUID REFERENCES clubs(id),
  opponent_club_id UUID REFERENCES clubs(id),
  name TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('single_elimination', 'round_robin')),
  max_participants INT NOT NULL DEFAULT 8,
  status TEXT NOT NULL DEFAULT 'registering' CHECK (status IN ('registering', 'active', 'completed', 'cancelled')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  winner_club_id UUID REFERENCES clubs(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournament_participants (
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  club_id UUID REFERENCES clubs(id),
  seed INT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'eliminated')),
  PRIMARY KEY (tournament_id, user_id)
);

CREATE TABLE IF NOT EXISTS tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  round INT NOT NULL,
  match_number INT NOT NULL,
  participant_a_id UUID REFERENCES profiles(id),
  participant_b_id UUID REFERENCES profiles(id),
  winner_id UUID REFERENCES profiles(id),
  battle_id UUID REFERENCES battles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  scheduled_at TIMESTAMPTZ,
  UNIQUE(tournament_id, round, match_number)
);

-- RLS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournaments are readable by club members"
  ON tournaments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM club_memberships WHERE club_id IN (tournaments.host_club_id, tournaments.opponent_club_id) AND user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Tournament participants are readable by club members"
  ON tournament_participants FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM tournaments t JOIN club_memberships cm ON t.host_club_id = cm.club_id OR t.opponent_club_id = cm.club_id WHERE t.id = tournament_participants.tournament_id AND cm.user_id = auth.uid() AND cm.status = 'active')
  );

CREATE POLICY "Tournament matches are readable by club members"
  ON tournament_matches FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM tournaments t JOIN club_memberships cm ON t.host_club_id = cm.club_id OR t.opponent_club_id = cm.club_id WHERE t.id = tournament_matches.tournament_id AND cm.user_id = auth.uid() AND cm.status = 'active')
  );

-- Bracket generation function
CREATE OR REPLACE FUNCTION generate_tournament_bracket(p_tournament_id UUID)
RETURNS VOID AS $$
DECLARE
  v_participants INT;
  v_rounds INT;
  v_i INT;
  v_match INT;
BEGIN
  SELECT COUNT(*) INTO v_participants FROM tournament_participants WHERE tournament_id = p_tournament_id;
  IF v_participants < 2 THEN RETURN; END IF;

  v_rounds := CEIL(LOG(2, v_participants));

  FOR v_i IN 1..v_rounds LOOP
    FOR v_match IN 1..GREATEST(1, v_participants / (2 ^ v_i)) LOOP
      INSERT INTO tournament_matches (tournament_id, round, match_number)
      VALUES (p_tournament_id, v_i, v_match)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Indexes
CREATE INDEX idx_tournaments_host ON tournaments(host_club_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournament_matches_tournament ON tournament_matches(tournament_id);
