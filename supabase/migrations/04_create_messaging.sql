CREATE TABLE conversations (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid references skills(id),
  participant_ids uuid[] not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
CREATE INDEX idx_conv_participants ON conversations USING GIN(participant_ids);

CREATE TABLE messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references profiles(id),
  content text not null,
  created_at timestamptz default now()
);
CREATE INDEX idx_msg_conversation ON messages(conversation_id, created_at);

-- RLS: only participants can read/write
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view conversations" ON conversations
  FOR SELECT USING (auth.uid() = ANY(participant_ids));
CREATE POLICY "Participants can insert conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = ANY(participant_ids));
CREATE POLICY "Participants can update conversations" ON conversations
  FOR UPDATE USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Participants can view messages" ON messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM conversations WHERE id = messages.conversation_id AND auth.uid() = ANY(participant_ids)
  ));
CREATE POLICY "Participants can send messages" ON messages
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM conversations WHERE id = messages.conversation_id AND auth.uid() = ANY(participant_ids)
  ));
