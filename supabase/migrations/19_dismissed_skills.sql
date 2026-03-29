-- Dismissed skills: lets users hide skills from their feed
CREATE TABLE dismissed_skills (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_id uuid REFERENCES skills(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

ALTER TABLE dismissed_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dismissals"
  ON dismissed_skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dismissals"
  ON dismissed_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dismissals"
  ON dismissed_skills FOR DELETE
  USING (auth.uid() = user_id);
