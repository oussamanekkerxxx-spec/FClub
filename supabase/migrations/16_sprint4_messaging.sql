-- Sprint 4: Conversations, Messages, Group Enrollments, Feed Events

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id uuid REFERENCES skills(id) ON DELETE SET NULL,
  participant_ids uuid[] NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their conversations" ON conversations
  FOR SELECT USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Authenticated users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = ANY(participant_ids));

CREATE POLICY "Participants can update conversations" ON conversations
  FOR UPDATE USING (auth.uid() = ANY(participant_ids));

CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING GIN(participant_ids);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND auth.uid() = ANY(participant_ids)
    )
  );

CREATE POLICY "Participants can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND auth.uid() = ANY(participant_ids)
    )
  );

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);

-- Group Enrollments
CREATE TABLE IF NOT EXISTS group_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id uuid REFERENCES skills(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  enrolled_at timestamptz DEFAULT now(),
  UNIQUE(skill_id, member_id)
);

ALTER TABLE group_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view enrollments" ON group_enrollments
  FOR SELECT USING (true);

CREATE POLICY "Users can enroll themselves" ON group_enrollments
  FOR INSERT WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Users can unenroll themselves" ON group_enrollments
  FOR DELETE USING (auth.uid() = member_id);

-- Feed Events
CREATE TABLE IF NOT EXISTS feed_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  skill_id uuid REFERENCES skills(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'new_skill',
  title text NOT NULL,
  subtitle text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feed events" ON feed_events
  FOR SELECT USING (true);

CREATE POLICY "Users can create own feed events" ON feed_events
  FOR INSERT WITH CHECK (auth.uid() = member_id);

CREATE INDEX IF NOT EXISTS idx_feed_events_created ON feed_events(created_at DESC);
