-- Dismissed skills: lets users hide skills from their feed
CREATE TABLE IF NOT EXISTS dismissed_skills (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_id uuid REFERENCES skills(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

ALTER TABLE dismissed_skills ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dismissed_skills' AND policyname = 'Users can view own dismissals') THEN CREATE POLICY "Users can view own dismissals" ON dismissed_skills FOR SELECT USING (auth.uid() = user_id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dismissed_skills' AND policyname = 'Users can insert own dismissals') THEN CREATE POLICY "Users can insert own dismissals" ON dismissed_skills FOR INSERT WITH CHECK (auth.uid() = user_id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dismissed_skills' AND policyname = 'Users can delete own dismissals') THEN CREATE POLICY "Users can delete own dismissals" ON dismissed_skills FOR DELETE USING (auth.uid() = user_id); END IF; END $$;
