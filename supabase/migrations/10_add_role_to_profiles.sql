-- Add role column to profiles for admin access control
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';

-- Admin-only update policy (replaces the open update if needed)
-- Admins can update any profile (e.g. approve verifications)
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
