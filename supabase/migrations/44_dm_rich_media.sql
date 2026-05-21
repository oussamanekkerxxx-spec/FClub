ALTER TABLE "public"."messages" ALTER COLUMN "content" DROP NOT NULL;
ALTER TABLE "public"."messages" ADD COLUMN IF NOT EXISTS "image_url"     TEXT;
ALTER TABLE "public"."messages" ADD COLUMN IF NOT EXISTS "video_url"     TEXT;
ALTER TABLE "public"."messages" ADD COLUMN IF NOT EXISTS "pdf_url"       TEXT;
ALTER TABLE "public"."messages" ADD COLUMN IF NOT EXISTS "voice_url"     TEXT;
ALTER TABLE "public"."messages" ADD COLUMN IF NOT EXISTS "caption"       TEXT;
ALTER TABLE "public"."messages" ADD COLUMN IF NOT EXISTS "location_lat"  DOUBLE PRECISION;
ALTER TABLE "public"."messages" ADD COLUMN IF NOT EXISTS "location_lng"  DOUBLE PRECISION;
ALTER TABLE "public"."messages" ADD COLUMN IF NOT EXISTS "reply_to_id"   UUID REFERENCES "public"."messages"("id") ON DELETE SET NULL;
ALTER TABLE "public"."messages" ADD COLUMN IF NOT EXISTS "is_edited"     BOOLEAN DEFAULT FALSE;
ALTER TABLE "public"."messages" ADD COLUMN IF NOT EXISTS "deleted_at"    TIMESTAMPTZ;

-- 3. DM reactions
CREATE TABLE IF NOT EXISTS "public"."dm_reactions" (
  "id"         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "message_id" UUID NOT NULL REFERENCES "public"."messages"("id") ON DELETE CASCADE,
  "user_id"    UUID NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
  "emoji"      TEXT NOT NULL CHECK (char_length("emoji") <= 8),
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("message_id", "user_id", "emoji")
);

ALTER TABLE "public"."dm_reactions" ENABLE ROW LEVEL SECURITY;

-- Only participants of the conversation may react
CREATE POLICY "Participants can view dm_reactions" ON "public"."dm_reactions"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."messages" msg
      JOIN "public"."conversations" conv ON conv.id = msg.conversation_id
      WHERE msg.id = dm_reactions.message_id
        AND auth.uid() = ANY(conv.participant_ids)
    )
  );

CREATE POLICY "Participants can insert dm_reactions" ON "public"."dm_reactions"
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM "public"."messages" msg
      JOIN "public"."conversations" conv ON conv.id = msg.conversation_id
      WHERE msg.id = dm_reactions.message_id
        AND auth.uid() = ANY(conv.participant_ids)
    )
  );

CREATE POLICY "Users can delete own dm_reactions" ON "public"."dm_reactions"
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Update messages DELETE policy to allow soft-deletes by sender
CREATE POLICY "Senders can soft-delete own messages" ON "public"."messages"
  FOR UPDATE USING (auth.uid() = sender_id);

-- 5. Allow participants to update messages (edit, soft-delete)
-- (The INSERT/SELECT policies already exist from migration 04/16)

-- 6. Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE "public"."dm_reactions";
