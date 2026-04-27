-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access" ON club_memberships;
DROP POLICY IF EXISTS "Enable read access" ON voice_rooms;
DROP POLICY IF EXISTS "Enable insert" ON voice_rooms;
DROP POLICY IF EXISTS "Enable update" ON voice_rooms;

-- Create new policies for club_memberships
CREATE POLICY "Enable read access" ON club_memberships FOR SELECT USING (true);

-- Create new policies for voice_rooms
CREATE POLICY "Enable read access" ON voice_rooms FOR SELECT USING (true);
CREATE POLICY "Enable insert" ON voice_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Enable update" ON voice_rooms FOR UPDATE USING (true);