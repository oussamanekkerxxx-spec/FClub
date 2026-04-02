
-- ─── club_playlists ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_playlists (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id      uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  accent_color text NOT NULL DEFAULT '#8B7BFF',
  cover_emoji  text NOT NULL DEFAULT '📂',
  created_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_index  int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.club_playlists ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'club_playlists' AND policyname = 'Anyone can view playlists') THEN
    CREATE POLICY "Anyone can view playlists"
      ON public.club_playlists FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'club_playlists' AND policyname = 'Mods can manage playlists') THEN
    CREATE POLICY "Mods can manage playlists"
      ON public.club_playlists FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.club_memberships
          WHERE club_memberships.club_id = club_playlists.club_id
            AND club_memberships.user_id = auth.uid()
            AND club_memberships.role IN ('admin', 'moderator')
            AND club_memberships.status = 'active'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.club_memberships
          WHERE club_memberships.club_id = club_playlists.club_id
            AND club_memberships.user_id = auth.uid()
            AND club_memberships.role IN ('admin', 'moderator')
            AND club_memberships.status = 'active'
        )
      );
  END IF;
END $$;

-- ─── club_playlist_videos ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_playlist_videos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id    uuid NOT NULL REFERENCES public.club_playlists(id) ON DELETE CASCADE,
  title          text NOT NULL,
  video_url      text NOT NULL,
  thumbnail_url  text,
  duration_label text,
  order_index    int NOT NULL DEFAULT 0,
  added_by       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.club_playlist_videos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'club_playlist_videos' AND policyname = 'Anyone can view playlist videos') THEN
    CREATE POLICY "Anyone can view playlist videos"
      ON public.club_playlist_videos FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'club_playlist_videos' AND policyname = 'Mods can manage playlist videos') THEN
    CREATE POLICY "Mods can manage playlist videos"
      ON public.club_playlist_videos FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.club_playlists cp
          JOIN public.club_memberships cm ON cm.club_id = cp.club_id
          WHERE cp.id = club_playlist_videos.playlist_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'moderator')
            AND cm.status = 'active'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.club_playlists cp
          JOIN public.club_memberships cm ON cm.club_id = cp.club_id
          WHERE cp.id = club_playlist_videos.playlist_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'moderator')
            AND cm.status = 'active'
        )
      );
  END IF;
END $$;
