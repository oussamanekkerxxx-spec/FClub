-- RLS write policies for profiles, skills, and reviews
-- These are missing from 03_rls_public_read.sql which only adds SELECT policies.

-- Profiles: users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profiles: users can insert their own profile (first login / trigger fallback)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Skills: teachers can insert their own skills
CREATE POLICY "Teachers can insert own skills" ON skills
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- Skills: teachers can update their own skills
CREATE POLICY "Teachers can update own skills" ON skills
  FOR UPDATE USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- Reviews: authenticated users can insert reviews
CREATE POLICY "Users can insert reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
