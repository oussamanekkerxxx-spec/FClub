
CREATE TABLE IF NOT EXISTS bookings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id      uuid REFERENCES skills(id) ON DELETE CASCADE,
  student_id    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'agreed', 'completed', 'cancelled')),
  proposed_time timestamptz,
  neighborhood  text,
  student_note  text,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = student_id OR auth.uid() = teacher_id);

CREATE POLICY "Students can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Participants can update booking status"
  ON bookings FOR UPDATE
  USING (auth.uid() = student_id OR auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = student_id OR auth.uid() = teacher_id);

-- Indexes for dashboard queries ("Your sessions" stat)
CREATE INDEX idx_bookings_student ON bookings(student_id);
CREATE INDEX idx_bookings_teacher ON bookings(teacher_id);
