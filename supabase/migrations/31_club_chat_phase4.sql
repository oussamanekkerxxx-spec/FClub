-- Phase 4 Migrations: Advanced Group Powers, Customization & Privacy

-- 1. Add Slow Mode to channels
ALTER TABLE "public"."club_channels" ADD COLUMN IF NOT EXISTS "slow_mode_delay" INT DEFAULT 0;

-- 2. Add scheduling and delivery flags to messages
ALTER TABLE "public"."club_messages" ADD COLUMN IF NOT EXISTS "scheduled_at" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "public"."club_messages" ADD COLUMN IF NOT EXISTS "is_silent" BOOLEAN DEFAULT FALSE;
ALTER TABLE "public"."club_messages" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP WITH TIME ZONE;

-- 3. User Chat Preferences
CREATE TABLE IF NOT EXISTS "public"."user_chat_preferences" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "wallpaper_class" TEXT DEFAULT 'wall-default',
    "is_dark_mode" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("user_id")
);

-- RLS for preferences
ALTER TABLE "public"."user_chat_preferences" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences" 
ON "public"."user_chat_preferences" FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
ON "public"."user_chat_preferences" FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON "public"."user_chat_preferences" FOR UPDATE 
USING (auth.uid() = user_id);

-- Add real-time replication for preferences
-- NOTE: Do NOT drop/recreate the publication — that wipes all other tables.
-- Migrations 27, 29, and 30 already added club_messages, message_reactions,
-- polls, poll_options, and poll_votes. We only need to add user_chat_preferences.
ALTER PUBLICATION supabase_realtime ADD TABLE "public"."user_chat_preferences";
