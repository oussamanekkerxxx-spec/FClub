ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skills publicly readable" ON skills FOR SELECT USING (is_active = true);
CREATE POLICY "Profiles publicly readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Reviews publicly readable" ON reviews FOR SELECT USING (true);
