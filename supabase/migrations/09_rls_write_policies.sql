-- RLS write policies for profiles, skills, and reviews
-- These are missing from 03_rls_public_read.sql which only adds SELECT policies.

-- Profiles: users can update their own profile
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id); END IF; END $$;

-- Profiles: users can insert their own profile (first login / trigger fallback)
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id); END IF; END $$;

-- Skills: teachers can insert their own skills
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skills' AND policyname = 'Teachers can insert own skills') THEN CREATE POLICY "Teachers can insert own skills" ON skills FOR INSERT WITH CHECK (auth.uid() = teacher_id); END IF; END $$;

-- Skills: teachers can update their own skills
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skills' AND policyname = 'Teachers can update own skills') THEN CREATE POLICY "Teachers can update own skills" ON skills FOR UPDATE USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id); END IF; END $$;

-- Reviews: authenticated users can insert reviews
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Users can insert reviews') THEN CREATE POLICY "Users can insert reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id); END IF; END $$;
