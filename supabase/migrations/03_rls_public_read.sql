ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skills' AND policyname = 'Skills publicly readable') THEN CREATE POLICY "Skills publicly readable" ON skills FOR SELECT USING (is_active = true); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Profiles publicly readable') THEN CREATE POLICY "Profiles publicly readable" ON profiles FOR SELECT USING (true); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Reviews publicly readable') THEN CREATE POLICY "Reviews publicly readable" ON reviews FOR SELECT USING (true); END IF; END $$;
