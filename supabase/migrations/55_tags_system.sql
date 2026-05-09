-- Migration: Structured taxonomy (tags system)
-- Replaces free-text what_i_teach / what_i_learn arrays with normalized tags

-- ── Core tags table ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  canonical_name TEXT NOT NULL,
  category TEXT CHECK (category IN ('skill', 'interest', 'hobby')),
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name)
);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are publicly readable"
  ON tags FOR SELECT
  USING (true);

-- ── Junction tables ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profile_tags (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('teach', 'learn', 'interest')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (profile_id, tag_id, relationship_type)
);

CREATE TABLE IF NOT EXISTS skill_tags (
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (skill_id, tag_id)
);

CREATE TABLE IF NOT EXISTS club_tags (
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (club_id, tag_id)
);

-- Enable RLS on junction tables
ALTER TABLE profile_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profile tags are publicly readable"
  ON profile_tags FOR SELECT USING (true);
CREATE POLICY "Users can manage their own profile tags"
  ON profile_tags FOR ALL USING (auth.uid() = profile_id);

CREATE POLICY "Skill tags are publicly readable"
  ON skill_tags FOR SELECT USING (true);
CREATE POLICY "Teachers can manage their skill tags"
  ON skill_tags FOR ALL USING (
    EXISTS (SELECT 1 FROM skills WHERE skills.id = skill_tags.skill_id AND skills.teacher_id = auth.uid())
  );

CREATE POLICY "Club tags are publicly readable"
  ON club_tags FOR SELECT USING (true);

-- ── Triggers: usage count ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tags SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = OLD.tag_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profile_tag_usage ON profile_tags;
CREATE TRIGGER trg_profile_tag_usage AFTER INSERT ON profile_tags
  FOR EACH ROW EXECUTE FUNCTION increment_tag_usage();

DROP TRIGGER IF EXISTS trg_profile_tag_remove ON profile_tags;
CREATE TRIGGER trg_profile_tag_remove AFTER DELETE ON profile_tags
  FOR EACH ROW EXECUTE FUNCTION decrement_tag_usage();

DROP TRIGGER IF EXISTS trg_skill_tag_usage ON skill_tags;
CREATE TRIGGER trg_skill_tag_usage AFTER INSERT ON skill_tags
  FOR EACH ROW EXECUTE FUNCTION increment_tag_usage();

DROP TRIGGER IF EXISTS trg_club_tag_usage ON club_tags;
CREATE TRIGGER trg_club_tag_usage AFTER INSERT ON club_tags
  FOR EACH ROW EXECUTE FUNCTION increment_tag_usage();

-- ── Backfill: migrate existing arrays ────────────────────────────────────────

DO $$
DECLARE
  rec RECORD;
  tag_name TEXT;
  tag_id UUID;
  rel_type TEXT;
BEGIN
  -- Migrate what_i_teach → profile_tags (relationship_type = 'teach')
  FOR rec IN SELECT id, what_i_teach FROM profiles WHERE what_i_teach IS NOT NULL AND array_length(what_i_teach, 1) > 0 LOOP
    FOREACH tag_name IN ARRAY rec.what_i_teach LOOP
      tag_name := trim(lower(tag_name));
      IF length(tag_name) = 0 THEN CONTINUE; END IF;

      INSERT INTO tags (name, canonical_name, category)
      VALUES (tag_name, tag_name, 'skill')
      ON CONFLICT (name) DO NOTHING;

      SELECT id INTO tag_id FROM tags WHERE name = tag_name;

      INSERT INTO profile_tags (profile_id, tag_id, relationship_type)
      VALUES (rec.id, tag_id, 'teach')
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  -- Migrate what_i_learn → profile_tags (relationship_type = 'learn')
  FOR rec IN SELECT id, what_i_learn FROM profiles WHERE what_i_learn IS NOT NULL AND array_length(what_i_learn, 1) > 0 LOOP
    FOREACH tag_name IN ARRAY rec.what_i_learn LOOP
      tag_name := trim(lower(tag_name));
      IF length(tag_name) = 0 THEN CONTINUE; END IF;

      INSERT INTO tags (name, canonical_name, category)
      VALUES (tag_name, tag_name, 'interest')
      ON CONFLICT (name) DO NOTHING;

      SELECT id INTO tag_id FROM tags WHERE name = tag_name;

      INSERT INTO profile_tags (profile_id, tag_id, relationship_type)
      VALUES (rec.id, tag_id, 'learn')
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_profile_tags_profile ON profile_tags(profile_id);
CREATE INDEX idx_profile_tags_tag ON profile_tags(tag_id);
CREATE INDEX idx_skill_tags_skill ON skill_tags(skill_id);
CREATE INDEX idx_club_tags_club ON club_tags(club_id);
CREATE INDEX idx_tags_usage ON tags(usage_count DESC);
