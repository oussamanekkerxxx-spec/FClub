-- 50_club_bans_mutes.sql
-- Per-club ban and mute system

CREATE TABLE club_bans (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id    UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id),
  reason     TEXT,
  banned_by  UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (club_id, user_id)
);

CREATE TABLE club_mutes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id    UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id),
  reason     TEXT,
  muted_by   UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (club_id, user_id)
);

-- Index for active ban/mute lookups (WHERE expires_at IS NULL OR expires_at > now())
CREATE INDEX idx_club_bans_active  ON club_bans (club_id, user_id) WHERE expires_at IS NULL OR expires_at > now();
CREATE INDEX idx_club_mutes_active ON club_mutes (club_id, user_id) WHERE expires_at IS NULL OR expires_at > now();

ALTER TABLE club_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_mutes ENABLE ROW LEVEL SECURITY;

-- Members can see their own ban/mute status
CREATE POLICY "Members can view own bans" ON club_bans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Members can view own mutes" ON club_mutes
  FOR SELECT USING (auth.uid() = user_id);

-- Mods and admins can view all bans/mutes in their clubs
CREATE POLICY "Mods can view club bans" ON club_bans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = club_bans.club_id
        AND club_memberships.user_id = auth.uid()
        AND club_memberships.status = 'active'
        AND club_memberships.role IN ('moderator', 'admin')
    )
  );

CREATE POLICY "Mods can view club mutes" ON club_mutes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = club_mutes.club_id
        AND club_memberships.user_id = auth.uid()
        AND club_memberships.status = 'active'
        AND club_memberships.role IN ('moderator', 'admin')
    )
  );

-- Only admins can insert/update/delete bans
CREATE POLICY "Admins can manage bans" ON club_bans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = club_bans.club_id
        AND club_memberships.user_id = auth.uid()
        AND club_memberships.status = 'active'
        AND club_memberships.role = 'admin'
    )
  );

-- Mods and admins can manage mutes
CREATE POLICY "Mods can manage mutes" ON club_mutes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM club_memberships
      WHERE club_memberships.club_id = club_mutes.club_id
        AND club_memberships.user_id = auth.uid()
        AND club_memberships.status = 'active'
        AND club_memberships.role IN ('moderator', 'admin')
    )
  );