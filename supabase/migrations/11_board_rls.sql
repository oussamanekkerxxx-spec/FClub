-- Fix board_posts: enable RLS, add policies, and add a default for expires_at
-- Root cause: table had no RLS policies (all writes silently blocked) and
-- expires_at was NOT NULL with no default (inserts without it fail).

ALTER TABLE board_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read board posts"
  ON board_posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create own posts"
  ON board_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts"
  ON board_posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts"
  ON board_posts FOR DELETE
  USING (auth.uid() = author_id);

-- Add default so inserts without expires_at don't fail
ALTER TABLE board_posts
  ALTER COLUMN expires_at SET DEFAULT now() + interval '30 days';
