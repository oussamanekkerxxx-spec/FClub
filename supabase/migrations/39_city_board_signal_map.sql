-- City Board v2: geolocation + relationship signals

ALTER TABLE public.board_posts
  ADD COLUMN IF NOT EXISTS location_lat double precision,
  ADD COLUMN IF NOT EXISTS location_lng double precision,
  ADD COLUMN IF NOT EXISTS location_precision text NOT NULL DEFAULT 'unknown'
    CHECK (location_precision IN ('exact', 'neighborhood', 'city', 'unknown'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'board_posts_location_lat_range'
  ) THEN
    ALTER TABLE public.board_posts
      ADD CONSTRAINT board_posts_location_lat_range
      CHECK (location_lat IS NULL OR (location_lat >= -90 AND location_lat <= 90));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'board_posts_location_lng_range'
  ) THEN
    ALTER TABLE public.board_posts
      ADD CONSTRAINT board_posts_location_lng_range
      CHECK (location_lng IS NULL OR (location_lng >= -180 AND location_lng <= 180));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_board_posts_created_at
  ON public.board_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_board_posts_geo
  ON public.board_posts(location_lat, location_lng)
  WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_board_posts_active_expires
  ON public.board_posts(expires_at)
  WHERE expires_at IS NOT NULL;

-- Explicit signals between users so recommendation logic can evolve
-- independently from source tables (messages/bookings/etc).
CREATE TABLE IF NOT EXISTS public.relationship_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  signal_type text NOT NULL CHECK (
    signal_type IN (
      'message',
      'booking',
      'session',
      'vouch',
      'board_connect_click',
      'board_profile_view',
      'activity_share'
    )
  ),
  signal_strength numeric(6,2) NOT NULL DEFAULT 1,
  context_type text,
  context_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_relationship_signals_actor
  ON public.relationship_signals(actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_relationship_signals_target
  ON public.relationship_signals(target_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_relationship_signals_pair_type
  ON public.relationship_signals(actor_id, target_id, signal_type);

ALTER TABLE public.relationship_signals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'relationship_signals'
      AND policyname = 'Users can read their relationship signals'
  ) THEN
    CREATE POLICY "Users can read their relationship signals"
      ON public.relationship_signals FOR SELECT
      USING (auth.uid() = actor_id OR auth.uid() = target_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'relationship_signals'
      AND policyname = 'Users can insert their own relationship signals'
  ) THEN
    CREATE POLICY "Users can insert their own relationship signals"
      ON public.relationship_signals FOR INSERT
      WITH CHECK (auth.uid() = actor_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'relationship_signals'
      AND policyname = 'Users can delete their own relationship signals'
  ) THEN
    CREATE POLICY "Users can delete their own relationship signals"
      ON public.relationship_signals FOR DELETE
      USING (auth.uid() = actor_id);
  END IF;
END
$$;
