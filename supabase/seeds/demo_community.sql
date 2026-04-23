-- =============================================================================
-- demo_community.sql
-- Generic QA / local dev seed — community fixtures only.
--
-- ⚠️  This file contains NO real credentials or personal data.
--     The primary account (v_account_id) must already exist in auth.users
--     before running this seed. Create it via the Supabase Dashboard or
--     `supabase auth admin create-user` and paste its UUID below.
--
-- Usage:
--   1. Set ACCOUNT_ID to the UUID of your local dev / QA user.
--   2. Run:  supabase db seed --file supabase/seeds/demo_community.sql
--      Or paste directly into the Supabase SQL editor.
-- =============================================================================

DO $$
DECLARE
  -- ── Primary account (must already exist in auth.users) ────────────────────
  v_account_id uuid := '00000000-0000-0000-0000-000000000000'; -- ← replace with your dev user UUID

  -- ── Supporting personas (created inline below if missing) ─────────────────
  v_yasmine uuid := 'd866a014-436f-4055-aff5-e51efae24dc1';
  v_karim   uuid := 'a937c050-482f-48e0-bb82-cf8a4ca33e9b';
  v_layla   uuid := '19d08e9d-c2bb-498c-84ed-4f7f25091d09';
  v_sofia   uuid := 'e09cfeb6-5999-4c13-a4e9-0639d494bdde';
  v_adam    uuid := 'a4a11c1d-6202-4fc4-bbba-c90a1923e100';
  v_hassan  uuid := '1c60fcbb-ab5c-43f1-b8ae-24ecb9541a7d';

  -- ── Club & channel IDs ────────────────────────────────────────────────────
  v_club        uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f001';
  v_ch_general  uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f011';
  v_ch_ann      uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f012';
  v_ch_projects uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f013';

  -- ── Message IDs ───────────────────────────────────────────────────────────
  v_msg_poll     uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f021';
  v_msg_project  uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f022';
  v_msg_event    uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f023';
  v_msg_resource uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f024';
  v_msg_video    uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f025';

  -- ── Event IDs ─────────────────────────────────────────────────────────────
  v_event_workshop uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f051';
  v_event_sprint   uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f052';
  v_event_showcase uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f053';

  -- ── Poll IDs ──────────────────────────────────────────────────────────────
  v_poll        uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f031';
  v_poll_python uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f041';
  v_poll_react  uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f042';
  v_poll_vite   uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f043';
  v_poll_sql    uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f044';

  -- ── Project IDs ───────────────────────────────────────────────────────────
  v_project_1    uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f061';
  v_project_2    uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f062';
  v_role_backend  uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f071';
  v_role_frontend uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f072';
  v_role_data     uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f073';

  -- ── Quest IDs ─────────────────────────────────────────────────────────────
  v_quest_1 uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f0b1';
  v_quest_2 uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f0b2';

  -- ── Room IDs ──────────────────────────────────────────────────────────────
  v_room_active    uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f0d1';
  v_room_scheduled uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f0d2';

  -- ── Playlist ID ───────────────────────────────────────────────────────────
  v_playlist uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f0f1';

BEGIN

  -- ── Supporting persona profiles (safe placeholder avatars) ─────────────────
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url, bio, city, trust_tier, trust_score, languages)
  VALUES
    (v_yasmine, 'Yasmine', 'Berrada', 'https://i.pravatar.cc/150?u=yasmine', 'UX researcher and visual designer.', 'Marrakesh', 2, 3.80, ARRAY['Arabic','French']),
    (v_karim,   'Karim',   'Tazi',    'https://i.pravatar.cc/150?u=karim',   'Backend engineer, Python enthusiast.', 'Marrakesh', 3, 4.20, ARRAY['Arabic','French','English']),
    (v_layla,   'Layla',   'Mansour', 'https://i.pravatar.cc/150?u=layla',   'Frontend developer, React & a11y advocate.', 'Casablanca', 2, 3.65, ARRAY['Arabic','English']),
    (v_sofia,   'Sofia',   'Alami',   'https://i.pravatar.cc/150?u=sofia',   'Data analyst with SQL expertise.', 'Rabat', 2, 3.50, ARRAY['French','English']),
    (v_adam,    'Adam',    'Chraibi', 'https://i.pravatar.cc/150?u=adam',    'DevOps and infra tinkerer.', 'Marrakesh', 2, 3.45, ARRAY['Arabic','French']),
    (v_hassan,  'Hassan',  'Qadri',   'https://i.pravatar.cc/150?u=hassan',  'Python hobbyist, building automation tools.', 'Marrakesh', 2, 3.30, ARRAY['Arabic','French'])
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    avatar_url = EXCLUDED.avatar_url,
    bio        = EXCLUDED.bio,
    city       = EXCLUDED.city;

END $$;
