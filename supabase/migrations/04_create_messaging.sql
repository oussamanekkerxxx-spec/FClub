CREATE TABLE IF NOT EXISTS conversations (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid references skills(id),
  participant_ids uuid[] not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
CREATE INDEX IF NOT EXISTS idx_conv_participants ON conversations USING GIN(participant_ids);

CREATE TABLE IF NOT EXISTS messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references profiles(id),
  content text not null,
  created_at timestamptz default now()
);
CREATE INDEX IF NOT EXISTS idx_msg_conversation ON messages(conversation_id, created_at);

-- RLS: only participants can read/write
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Participants can view conversations') THEN CREATE POLICY "Participants can view conversations" ON conversations FOR SELECT USING (auth.uid() = ANY(participant_ids)); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Participants can insert conversations') THEN CREATE POLICY "Participants can insert conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = ANY(participant_ids)); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Participants can update conversations') THEN CREATE POLICY "Participants can update conversations" ON conversations FOR UPDATE USING (auth.uid() = ANY(participant_ids)); END IF; END $$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Participants can view messages') THEN CREATE POLICY "Participants can view messages" ON messages FOR SELECT USING (EXISTS (SELECT 1 FROM conversations WHERE id = messages.conversation_id AND auth.uid() = ANY(participant_ids))); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Participants can send messages') THEN CREATE POLICY "Participants can send messages" ON messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM conversations WHERE id = messages.conversation_id AND auth.uid() = ANY(participant_ids))); END IF; END $$;
