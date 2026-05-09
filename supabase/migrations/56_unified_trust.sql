-- Migration: Unified trust scoring system
-- Server becomes the single source of truth for trust scores and tiers.

-- ── Unified recalculation function ───────────────────────────────────────────

DROP FUNCTION IF EXISTS recalculate_user_trust_score(UUID);

CREATE OR REPLACE FUNCTION recalculate_user_trust_score(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_score INT := 0;
  v_tier INT := 0;
  v_profile RECORD;
  v_session_points INT := 0;
  v_vouch_points INT := 0;
  v_engagement_points INT := 0;
BEGIN
  -- Base: profile completeness (0-30)
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF v_profile.avatar_url IS NOT NULL THEN v_score := v_score + 5; END IF;
  IF v_profile.bio IS NOT NULL AND length(v_profile.bio) > 20 THEN v_score := v_score + 5; END IF;
  IF v_profile.phone_verified THEN v_score := v_score + 10; END IF;
  IF v_profile.id_verified THEN v_score := v_score + 10; END IF;

  -- Activity: teaching sessions (10 pts per hour, max 40)
  SELECT COALESCE(SUM(LEAST(duration_hours, 4) * 10), 0) INTO v_session_points
  FROM session_ledger WHERE teacher_id = p_user_id;
  v_score := v_score + LEAST(v_session_points, 40);

  -- Community: vouches (5 pts each, max 20)
  SELECT COALESCE(COUNT(*) * 5, 0) INTO v_vouch_points
  FROM vouches WHERE recipient_id = p_user_id;
  v_score := v_score + LEAST(v_vouch_points, 20);

  -- Engagement: streak and activity (max 10)
  SELECT COALESCE(MAX(streak_days), 0) INTO v_engagement_points
  FROM club_member_points WHERE user_id = p_user_id;
  v_score := v_score + LEAST(v_engagement_points, 10);

  -- Cap at 100
  v_score := LEAST(v_score, 100);

  -- Determine tier (aligned with app config: 0, 20, 50, 75, 100)
  IF v_score >= 100 THEN v_tier := 4;
  ELSIF v_score >= 75 THEN v_tier := 3;
  ELSIF v_score >= 50 THEN v_tier := 2;
  ELSIF v_score >= 20 THEN v_tier := 1;
  ELSE v_tier := 0;
  END IF;

  -- Update profile (only if changed to avoid unnecessary writes)
  IF v_profile.trust_score IS DISTINCT FROM v_score OR v_profile.trust_tier IS DISTINCT FROM v_tier THEN
    UPDATE profiles SET
      trust_score = v_score,
      trust_tier = v_tier
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ── Trigger function ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_recalculate_trust()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'session_ledger' THEN
    PERFORM recalculate_user_trust_score(NEW.teacher_id);
  ELSIF TG_TABLE_NAME = 'vouches' THEN
    PERFORM recalculate_user_trust_score(NEW.recipient_id);
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    PERFORM recalculate_user_trust_score(NEW.id);
  ELSIF TG_TABLE_NAME = 'club_member_points' THEN
    PERFORM recalculate_user_trust_score(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Attach triggers ──────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_trust_session ON session_ledger;
CREATE TRIGGER trg_trust_session
  AFTER INSERT ON session_ledger
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_trust();

DROP TRIGGER IF EXISTS trg_trust_vouch ON vouches;
CREATE TRIGGER trg_trust_vouch
  AFTER INSERT ON vouches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_trust();

DROP TRIGGER IF EXISTS trg_trust_profile ON profiles;
CREATE TRIGGER trg_trust_profile
  AFTER UPDATE OF avatar_url, bio, phone_verified, id_verified ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_trust();

DROP TRIGGER IF EXISTS trg_trust_engagement ON club_member_points;
CREATE TRIGGER trg_trust_engagement
  AFTER INSERT OR UPDATE OF streak_days ON club_member_points
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_trust();

-- ── Backfill: recalculate all existing users ─────────────────────────────────

DO $$
DECLARE
  user_id UUID;
BEGIN
  FOR user_id IN SELECT id FROM profiles LOOP
    PERFORM recalculate_user_trust_score(user_id);
  END LOOP;
END $$;
