ALTER TABLE board_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'board_posts' AND policyname = 'Anyone can read board posts') THEN CREATE POLICY "Anyone can read board posts" ON board_posts FOR SELECT USING (true); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'board_posts' AND policyname = 'Users can create own posts') THEN CREATE POLICY "Users can create own posts" ON board_posts FOR INSERT WITH CHECK (auth.uid() = author_id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'board_posts' AND policyname = 'Users can update own posts') THEN CREATE POLICY "Users can update own posts" ON board_posts FOR UPDATE USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'board_posts' AND policyname = 'Users can delete own posts') THEN CREATE POLICY "Users can delete own posts" ON board_posts FOR DELETE USING (auth.uid() = author_id); END IF; END $$;

-- Add default so inserts without expires_at don't fail
ALTER TABLE board_posts
  ALTER COLUMN expires_at SET DEFAULT now() + interval '30 days';
