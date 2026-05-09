-- 50_club_bans_mutes.sql
-- Per-club ban and mute system

CREATE TABLE IF NOT EXISTS club_bans (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id    UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id),
  reason     TEXT,
  banned_by  UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (club_id, user_id)
);

CREATE TABLE IF NOT EXISTS club_mutes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id    UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id),
  reason     TEXT,
  muted_by   UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (club_id, user_id)
);

-- Index for active ban/mute lookups (expires_at included for runtime filtering)
CREATE INDEX IF NOT EXISTS idx_club_bans_active ON club_bans (club_id, user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_club_mutes_active ON club_mutes (club_id, user_id, expires_at);

ALTER TABLE club_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_mutes ENABLE ROW LEVEL SECURITY;

-- Members can see their own ban/mute status
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'club_bans' AND policyname = 'Members can view own bans') THEN CREATE POLICY "Members can view own bans" ON club_bans FOR SELECT USING (auth.uid() = user_id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'club_mutes' AND policyname = 'Members can view own mutes') THEN CREATE POLICY "Members can view own mutes" ON club_mutes FOR SELECT USING (auth.uid() = user_id); END IF; END $$;

-- Mods and admins can view all bans/mutes in their clubs
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'club_bans' AND policyname = 'Mods can view club bans') THEN CREATE POLICY "Mods can view club bans" ON club_bans FOR SELECT USING (EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = club_bans.club_id AND club_memberships.user_id = auth.uid() AND club_memberships.status = 'active' AND club_memberships.role IN ('moderator', 'admin'))); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'club_mutes' AND policyname = 'Mods can view club mutes') THEN CREATE POLICY "Mods can view club mutes" ON club_mutes FOR SELECT USING (EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = club_mutes.club_id AND club_memberships.user_id = auth.uid() AND club_memberships.status = 'active' AND club_memberships.role IN ('moderator', 'admin'))); END IF; END $$;

-- Only admins can insert/update/delete bans
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'club_bans' AND policyname = 'Admins can manage bans') THEN CREATE POLICY "Admins can manage bans" ON club_bans FOR ALL USING (EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = club_bans.club_id AND club_memberships.user_id = auth.uid() AND club_memberships.status = 'active' AND club_memberships.role = 'admin')); END IF; END $$;

-- Mods and admins can manage mutes
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'club_mutes' AND policyname = 'Mods can manage mutes') THEN CREATE POLICY "Mods can manage mutes" ON club_mutes FOR ALL USING (EXISTS (SELECT 1 FROM club_memberships WHERE club_memberships.club_id = club_mutes.club_id AND club_memberships.user_id = auth.uid() AND club_memberships.status = 'active' AND club_memberships.role IN ('moderator', 'admin'))); END IF; END $$;