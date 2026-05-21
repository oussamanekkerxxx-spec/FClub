
CREATE TABLE IF NOT EXISTS id_verification_requests (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Document metadata
  document_type       text        NOT NULL CHECK (document_type IN ('cin', 'passport', 'license')),
  front_path          text        NOT NULL,   -- Storage path in id-documents bucket
  back_path           text,                   -- NULL for passports (single-sided)

  -- Client-side quality scores (0–100, computed with Laplacian variance)
  quality_score_front integer     CHECK (quality_score_front BETWEEN 0 AND 100),
  quality_score_back  integer     CHECK (quality_score_back  BETWEEN 0 AND 100),

  -- OCR-extracted fields (written by the verify-id Edge Function)
  ocr_data            jsonb,
  -- Shape of ocr_data:
  -- {
  --   "name":        "BENALI YOUSSEF",
  --   "dob":         "1990-03-12",
  --   "id_number":   "BE123456",
  --   "expiry":      "2028-03-11",
  --   "nationality": "MAR",
  --   "mrz_line1":   "IDMARBE123456<<<<<<<<<<<<<<<<",
  --   "mrz_line2":   "9003121M2803119MAR<<<<<<<<<<<4"
  -- }

  -- MRZ checksum validation result (set by Edge Function)
  mrz_valid           boolean,

  -- Review workflow
  status              text        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  reviewer_id         uuid        REFERENCES profiles(id),
  reviewer_notes      text,
  reviewed_at         timestamptz,

  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Index for the admin queue (pending, oldest first)
CREATE INDEX IF NOT EXISTS idx_id_verif_status_created
  ON id_verification_requests (status, created_at ASC);

-- Index for looking up a user's own requests
CREATE INDEX IF NOT EXISTS idx_id_verif_user
  ON id_verification_requests (user_id, created_at DESC);

-- ── Row Level Security ─────────────────────────────────────────────────────────

ALTER TABLE id_verification_requests ENABLE ROW LEVEL SECURITY;

-- Users can read their own requests (to show pending / rejected status in the modal)
DO $$ BEGIN
  CREATE POLICY "users_read_own_verifications"
    ON id_verification_requests
    FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admins (role = 'admin' in profiles) can read all requests
DO $$ BEGIN
  CREATE POLICY "admins_read_all_verifications"
    ON id_verification_requests
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admins can update (approve / reject)
DO $$ BEGIN
  CREATE POLICY "admins_update_verifications"
    ON id_verification_requests
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- INSERT and the OCR write are done by the Edge Function using the service-role key,
-- which bypasses RLS — no INSERT policy needed for regular users.
