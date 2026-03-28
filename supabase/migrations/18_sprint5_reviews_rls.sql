-- Sprint 5: Add RLS to reviews table

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can write reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

CREATE INDEX IF NOT EXISTS idx_reviews_skill ON reviews(skill_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);

-- Index for Admin id_card_status queries
CREATE INDEX IF NOT EXISTS idx_profiles_id_card_status ON profiles(id_card_status)
  WHERE id_card_status IS NOT NULL;
