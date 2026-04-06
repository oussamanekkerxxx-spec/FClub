-- Primary complete QA account
-- email: oussama.nekker.xxx@gmail.com
-- password: skillclub2025

DO $$
DECLARE
  v_account_id uuid := 'f1b9e0f6-3f0a-4f4d-9a29-4d92de9df4a1';
  v_email text := 'oussama.nekker.xxx@gmail.com';

  v_yasmine uuid := 'd866a014-436f-4055-aff5-e51efae24dc1';
  v_karim uuid := 'a937c050-482f-48e0-bb82-cf8a4ca33e9b';
  v_layla uuid := '19d08e9d-c2bb-498c-84ed-4f7f25091d09';
  v_sofia uuid := 'e09cfeb6-5999-4c13-a4e9-0639d494bdde';
  v_adam uuid := 'a4a11c1d-6202-4fc4-bbba-c90a1923e100';
  v_hassan uuid := '1c60fcbb-ab5c-43f1-b8ae-24ecb9541a7d';

  v_club uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f001';
  v_ch_general uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f011';
  v_ch_ann uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f012';
  v_ch_projects uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f013';

  v_msg_poll uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f021';
  v_msg_project uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f022';
  v_msg_event uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f023';
  v_msg_resource uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f024';
  v_msg_video uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f025';

  v_event_workshop uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f051';
  v_event_sprint uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f052';
  v_event_showcase uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f053';

  v_poll uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f031';
  v_poll_python uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f041';
  v_poll_react uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f042';
  v_poll_vite uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f043';
  v_poll_sql uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f044';

  v_project_1 uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f061';
  v_project_2 uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f062';
  v_role_backend uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f071';
  v_role_frontend uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f072';
  v_role_data uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f073';

  v_quest_1 uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f0b1';
  v_quest_2 uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f0b2';

  v_room_active uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f0d1';
  v_room_scheduled uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f0d2';

  v_playlist uuid := '31084af2-9b91-4e14-84f3-9fe7f7a5f0f1';
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token, is_sso_user
  )
  VALUES (
    v_account_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_email,
    crypt('skillclub2025', gen_salt('bf')),
    now(), now(), now(),
    '', '', '', '', false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    updated_at = now();

  INSERT INTO public.profiles (
    id, first_name, last_name, avatar_url, bio, neighborhood, location, city,
    trust_tier, trust_score, archetype, what_i_teach, what_i_learn, languages, sessions_completed, joined_at
  )
  VALUES (
    v_account_id,
    'Oussama',
    'Nekker',
    'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop&crop=face',
    'Product-minded full-stack builder focused on practical education projects and real execution.',
    'Gueliz',
    'Gueliz, Marrakesh',
    'Marrakesh',
    4,
    4.92,
    'connector',
    ARRAY['Python', 'React', 'Vite', 'SQL', 'Product Strategy'],
    ARRAY['WebRTC', 'Event Facilitation'],
    ARRAY['Arabic', 'French', 'English'],
    76,
    '2025-09-01T10:00:00Z'
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    avatar_url = EXCLUDED.avatar_url,
    bio = EXCLUDED.bio,
    neighborhood = EXCLUDED.neighborhood,
    location = EXCLUDED.location,
    city = EXCLUDED.city,
    trust_tier = EXCLUDED.trust_tier,
    trust_score = EXCLUDED.trust_score,
    archetype = EXCLUDED.archetype,
    what_i_teach = EXCLUDED.what_i_teach,
    what_i_learn = EXCLUDED.what_i_learn,
    languages = EXCLUDED.languages,
    sessions_completed = EXCLUDED.sessions_completed,
    joined_at = EXCLUDED.joined_at;

  IF to_regclass('public.clubs') IS NOT NULL THEN
    INSERT INTO public.clubs (
      id, slug, name, description, category, cover_gradient, is_private, rules, tags,
      city, region, member_count, post_count, created_by, created_at, updated_at
    )
    VALUES (
      v_club,
      'skill-builders-lab',
      'Skill Builders Lab',
      'A hands-on club for practical education projects. Poll in chat, launch projects, run events, ship outcomes.',
      'technology',
      'from-slate-900 to-amber-700',
      false,
      ARRAY['Respect all levels.', 'Share progress weekly.', 'Keep discussions practical.'],
      ARRAY['python', 'react', 'vite', 'sql', 'projects', 'events'],
      'Marrakesh',
      'Marrakesh-Safi',
      6,
      1,
      v_account_id,
      '2026-03-28T09:00:00Z',
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      slug = EXCLUDED.slug,
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      category = EXCLUDED.category,
      cover_gradient = EXCLUDED.cover_gradient,
      is_private = EXCLUDED.is_private,
      rules = EXCLUDED.rules,
      tags = EXCLUDED.tags,
      city = EXCLUDED.city,
      region = EXCLUDED.region,
      created_by = EXCLUDED.created_by,
      updated_at = now();
  END IF;

  IF to_regclass('public.club_memberships') IS NOT NULL THEN
    INSERT INTO public.club_memberships (id, club_id, user_id, role, status, joined_at)
    VALUES
      ('32084af2-9b91-4e14-84f3-9fe7f7a5f001', v_club, v_account_id, 'admin', 'active', '2026-03-28T09:05:00Z'),
      ('32084af2-9b91-4e14-84f3-9fe7f7a5f002', v_club, v_karim, 'moderator', 'active', '2026-03-28T10:00:00Z'),
      ('32084af2-9b91-4e14-84f3-9fe7f7a5f003', v_club, v_layla, 'member', 'active', '2026-03-29T09:00:00Z'),
      ('32084af2-9b91-4e14-84f3-9fe7f7a5f004', v_club, v_sofia, 'member', 'active', '2026-03-30T11:30:00Z'),
      ('32084af2-9b91-4e14-84f3-9fe7f7a5f005', v_club, v_hassan, 'member', 'active', '2026-03-31T08:45:00Z'),
      ('32084af2-9b91-4e14-84f3-9fe7f7a5f006', v_club, v_adam, 'member', 'active', '2026-04-01T14:20:00Z')
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;
  END IF;

  IF to_regclass('public.join_requests') IS NOT NULL THEN
    INSERT INTO public.join_requests (id, club_id, user_id, status, created_at)
    VALUES ('31084af2-9b91-4e14-84f3-9fe7f7a5f121', v_club, v_yasmine, 'pending', '2026-04-05T08:00:00Z')
    ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, created_at = EXCLUDED.created_at;
  END IF;

  IF to_regclass('public.club_channels') IS NOT NULL THEN
    INSERT INTO public.club_channels (id, club_id, name, description, is_announcement_only, created_by, order_index, created_at)
    VALUES
      (v_ch_general, v_club, 'general', 'General async updates', false, v_account_id, 0, '2026-03-28T09:10:00Z'),
      (v_ch_ann, v_club, 'announcements', 'Moderator announcements and official notes', true, v_account_id, 1, '2026-03-28T09:10:30Z'),
      (v_ch_projects, v_club, 'projects', 'Project pitches, roles, and checkpoints', false, v_account_id, 2, '2026-03-28T09:11:00Z')
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      is_announcement_only = EXCLUDED.is_announcement_only,
      order_index = EXCLUDED.order_index;
  END IF;

  IF to_regclass('public.club_events') IS NOT NULL THEN
    BEGIN
      INSERT INTO public.club_events (
        id, club_id, title, description, format, event_style, location, starts_at, ends_at,
        max_attendees, attendee_count, created_by, created_at, duration_mins, is_online, meeting_link, host_label, outcomes, rsvp_count
      )
      VALUES
        (
          v_event_workshop, v_club, 'Python API Workshop',
          'Build a production-ready FastAPI endpoint with auth and tests.',
          'online', 'workshop', null,
          '2026-04-15T17:00:00Z', '2026-04-15T18:30:00Z',
          60, 18, v_account_id, '2026-04-05T10:00:00Z', 90, true,
          'https://meet.google.com/skill-builders-workshop',
          'Lead: Oussama',
          'Leave with a working endpoint + test checklist.',
          18
        ),
        (
          v_event_sprint, v_club, 'Frontend Sprint Night',
          'Pair up and ship one meaningful UI improvement in 90 minutes.',
          'both', 'sprint', 'Atlas Cowork, Gueliz',
          '2026-04-20T18:30:00Z', '2026-04-20T20:00:00Z',
          35, 12, v_karim, '2026-04-05T10:05:00Z', 90, false,
          null,
          'Facilitator: Karim',
          'One merged UI improvement per team.',
          12
        ),
        (
          v_event_showcase, v_club, 'Demo Day Showcase',
          'Teams present what they built, lessons learned, and next milestones.',
          'in-person', 'showcase', 'Riad Tech Hall, Marrakesh',
          '2026-05-01T16:00:00Z', '2026-05-01T18:00:00Z',
          80, 26, v_account_id, '2026-04-05T10:10:00Z', 120, false,
          null,
          'Hosts: Oussama + Moderators',
          'Public walkthrough of projects and contribution highlights.',
          26
        )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        format = EXCLUDED.format,
        starts_at = EXCLUDED.starts_at,
        ends_at = EXCLUDED.ends_at,
        max_attendees = EXCLUDED.max_attendees,
        attendee_count = EXCLUDED.attendee_count;
    EXCEPTION WHEN undefined_column THEN
      INSERT INTO public.club_events (
        id, club_id, title, description, format, location, starts_at, ends_at,
        max_attendees, attendee_count, created_by, created_at
      )
      VALUES
        (v_event_workshop, v_club, 'Python API Workshop', 'Build a production-ready FastAPI endpoint with auth and tests.', 'online', null, '2026-04-15T17:00:00Z', '2026-04-15T18:30:00Z', 60, 18, v_account_id, '2026-04-05T10:00:00Z'),
        (v_event_sprint, v_club, 'Frontend Sprint Night', 'Pair up and ship one meaningful UI improvement in 90 minutes.', 'both', 'Atlas Cowork, Gueliz', '2026-04-20T18:30:00Z', '2026-04-20T20:00:00Z', 35, 12, v_karim, '2026-04-05T10:05:00Z'),
        (v_event_showcase, v_club, 'Demo Day Showcase', 'Teams present what they built, lessons learned, and next milestones.', 'in-person', 'Riad Tech Hall, Marrakesh', '2026-05-01T16:00:00Z', '2026-05-01T18:00:00Z', 80, 26, v_account_id, '2026-04-05T10:10:00Z')
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        format = EXCLUDED.format,
        starts_at = EXCLUDED.starts_at,
        ends_at = EXCLUDED.ends_at,
        max_attendees = EXCLUDED.max_attendees,
        attendee_count = EXCLUDED.attendee_count;
    END;
  END IF;

  IF to_regclass('public.event_rsvps') IS NOT NULL THEN
    INSERT INTO public.event_rsvps (id, event_id, user_id, created_at)
    VALUES
      ('33084af2-9b91-4e14-84f3-9fe7f7a5f001', v_event_workshop, v_account_id, '2026-04-05T12:00:00Z'),
      ('33084af2-9b91-4e14-84f3-9fe7f7a5f002', v_event_workshop, v_karim, '2026-04-05T12:01:00Z'),
      ('33084af2-9b91-4e14-84f3-9fe7f7a5f003', v_event_workshop, v_layla, '2026-04-05T12:02:00Z'),
      ('33084af2-9b91-4e14-84f3-9fe7f7a5f004', v_event_sprint, v_sofia, '2026-04-05T12:05:00Z'),
      ('33084af2-9b91-4e14-84f3-9fe7f7a5f005', v_event_showcase, v_adam, '2026-04-05T12:06:00Z')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF to_regclass('public.club_messages') IS NOT NULL THEN
    BEGIN
      INSERT INTO public.club_messages (id, channel_id, sender_id, content, created_at, pdf_url, video_url, event_id)
      VALUES
        (v_msg_poll, v_ch_general, v_account_id, 'Quick poll before we launch the next activity: which stack do you want first?', '2026-04-05T13:00:00Z', null, null, null),
        (v_msg_project, v_ch_projects, v_account_id, 'Project pitch posted: Mentor Match API. Check roles and apply if interested.', '2026-04-05T13:10:00Z', null, null, null),
        (v_msg_event, v_ch_ann, v_account_id, 'Created an event: Python API Workshop. RSVP now.', '2026-04-05T13:20:00Z', null, null, v_event_workshop),
        (v_msg_resource, v_ch_projects, v_karim, 'Shared the requirements doc for this sprint.', '2026-04-05T13:30:00Z', 'https://example.com/docs/skill-builders-requirements.pdf', null, null),
        (v_msg_video, v_ch_projects, v_sofia, 'Recorded walkthrough: setup + local environment.', '2026-04-05T13:40:00Z', null, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', null)
      ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, created_at = EXCLUDED.created_at;
    EXCEPTION WHEN undefined_column THEN
      INSERT INTO public.club_messages (id, channel_id, sender_id, content, created_at)
      VALUES
        (v_msg_poll, v_ch_general, v_account_id, 'Quick poll before we launch the next activity: which stack do you want first?', '2026-04-05T13:00:00Z'),
        (v_msg_project, v_ch_projects, v_account_id, 'Project pitch posted: Mentor Match API. Check roles and apply if interested.', '2026-04-05T13:10:00Z'),
        (v_msg_event, v_ch_ann, v_account_id, 'Created an event: Python API Workshop. RSVP now.', '2026-04-05T13:20:00Z'),
        (v_msg_resource, v_ch_projects, v_karim, 'Shared the requirements doc for this sprint.', '2026-04-05T13:30:00Z'),
        (v_msg_video, v_ch_projects, v_sofia, 'Recorded walkthrough: setup + local environment.', '2026-04-05T13:40:00Z')
      ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, created_at = EXCLUDED.created_at;
    END;
  END IF;

  IF to_regclass('public.polls') IS NOT NULL THEN
    INSERT INTO public.polls (id, message_id, question, is_anonymous, multiple_answers, created_at)
    VALUES (v_poll, v_msg_poll, 'Which track should we prioritize first?', false, false, '2026-04-05T13:00:15Z')
    ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question;
  END IF;

  IF to_regclass('public.poll_options') IS NOT NULL THEN
    INSERT INTO public.poll_options (id, poll_id, text)
    VALUES
      (v_poll_python, v_poll, 'Python'),
      (v_poll_react, v_poll, 'React'),
      (v_poll_vite, v_poll, 'Vite'),
      (v_poll_sql, v_poll, 'SQL')
    ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text;
  END IF;

  IF to_regclass('public.poll_votes') IS NOT NULL THEN
    INSERT INTO public.poll_votes (id, option_id, user_id, created_at)
    VALUES
      ('34084af2-9b91-4e14-84f3-9fe7f7a5f001', v_poll_python, v_account_id, '2026-04-05T13:01:00Z'),
      ('34084af2-9b91-4e14-84f3-9fe7f7a5f002', v_poll_python, v_karim, '2026-04-05T13:01:30Z'),
      ('34084af2-9b91-4e14-84f3-9fe7f7a5f003', v_poll_react, v_layla, '2026-04-05T13:02:10Z'),
      ('34084af2-9b91-4e14-84f3-9fe7f7a5f004', v_poll_vite, v_sofia, '2026-04-05T13:02:35Z'),
      ('34084af2-9b91-4e14-84f3-9fe7f7a5f005', v_poll_sql, v_hassan, '2026-04-05T13:03:00Z')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF to_regclass('public.club_projects') IS NOT NULL THEN
    BEGIN
      INSERT INTO public.club_projects (
        id, club_id, title, description, status, created_at, channel_id, creator_id, message_id,
        pitch, start_date, duration_weeks, hours_per_week, visibility
      )
      VALUES
        (
          v_project_1,
          v_club,
          'Mentor Match API',
          'Match learners with mentors by goals, stack, and weekly availability.',
          'active',
          '2026-04-05T13:10:20Z',
          v_ch_projects,
          v_account_id,
          v_msg_project,
          'Build a practical mentor-matching backend with measurable progress.',
          '2026-04-08',
          6,
          5,
          'club'
        ),
        (
          v_project_2,
          v_club,
          'Frontend Quest Board',
          'Design and ship a clean quest board experience for club collaboration.',
          'idea',
          '2026-04-05T13:15:00Z',
          v_ch_projects,
          v_karim,
          null,
          'Refresh quest cards + details for mobile and desktop.',
          '2026-04-10',
          4,
          4,
          'club'
        )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        status = EXCLUDED.status;
    EXCEPTION WHEN undefined_column THEN
      INSERT INTO public.club_projects (id, club_id, title, description, status, created_at)
      VALUES
        (v_project_1, v_club, 'Mentor Match API', 'Match learners with mentors by goals, stack, and weekly availability.', 'active', '2026-04-05T13:10:20Z'),
        (v_project_2, v_club, 'Frontend Quest Board', 'Design and ship a clean quest board experience for club collaboration.', 'idea', '2026-04-05T13:15:00Z')
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, status = EXCLUDED.status;
    END;
  END IF;

  IF to_regclass('public.project_roles') IS NOT NULL THEN
    INSERT INTO public.project_roles (id, project_id, title, slots_needed)
    VALUES
      (v_role_backend, v_project_1, 'Backend Engineer', 2),
      (v_role_frontend, v_project_1, 'Frontend Engineer', 2),
      (v_role_data, v_project_1, 'Data Analyst', 1)
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, slots_needed = EXCLUDED.slots_needed;
  END IF;

  IF to_regclass('public.project_skills') IS NOT NULL THEN
    INSERT INTO public.project_skills (id, project_id, skill_name)
    VALUES
      ('31084af2-9b91-4e14-84f3-9fe7f7a5f081', v_project_1, 'Python'),
      ('31084af2-9b91-4e14-84f3-9fe7f7a5f082', v_project_1, 'FastAPI'),
      ('31084af2-9b91-4e14-84f3-9fe7f7a5f083', v_project_1, 'SQL')
    ON CONFLICT (id) DO UPDATE SET skill_name = EXCLUDED.skill_name;
  END IF;

  IF to_regclass('public.project_applications') IS NOT NULL THEN
    BEGIN
      INSERT INTO public.project_applications (
        id, project_id, role_id, user_id, experience, availability_hours, status, created_at
      )
      VALUES
        (
          '31084af2-9b91-4e14-84f3-9fe7f7a5f091',
          v_project_1,
          v_role_backend,
          v_hassan,
          'Built automation scripts in Python and wants to contribute to API endpoints.',
          6,
          'pending',
          '2026-04-05T14:00:00Z'
        ),
        (
          '31084af2-9b91-4e14-84f3-9fe7f7a5f092',
          v_project_1,
          v_role_frontend,
          v_layla,
          'Comfortable with React component systems and accessibility checks.',
          5,
          'accepted',
          '2026-04-05T14:05:00Z'
        ),
        (
          '31084af2-9b91-4e14-84f3-9fe7f7a5f093',
          v_project_1,
          v_role_data,
          v_sofia,
          'Can help with SQL modeling and reporting dashboards.',
          4,
          'pending',
          '2026-04-05T14:10:00Z'
        )
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;
    EXCEPTION WHEN undefined_column THEN
      INSERT INTO public.project_applications (
        id, project_id, user_id, experience, availability_hours, status, created_at
      )
      VALUES
        ('31084af2-9b91-4e14-84f3-9fe7f7a5f091', v_project_1, v_hassan, 'Built automation scripts in Python and wants to contribute to API endpoints.', 6, 'pending', '2026-04-05T14:00:00Z'),
        ('31084af2-9b91-4e14-84f3-9fe7f7a5f092', v_project_1, v_layla, 'Comfortable with React component systems and accessibility checks.', 5, 'accepted', '2026-04-05T14:05:00Z'),
        ('31084af2-9b91-4e14-84f3-9fe7f7a5f093', v_project_1, v_sofia, 'Can help with SQL modeling and reporting dashboards.', 4, 'pending', '2026-04-05T14:10:00Z')
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;
    END;
  END IF;

  IF to_regclass('public.project_members') IS NOT NULL THEN
    INSERT INTO public.project_members (project_id, user_id, joined_at)
    VALUES
      (v_project_1, v_account_id, '2026-04-05T14:30:00Z'),
      (v_project_1, v_karim, '2026-04-05T14:31:00Z'),
      (v_project_1, v_layla, '2026-04-05T14:32:00Z')
    ON CONFLICT DO NOTHING;
  END IF;

  IF to_regclass('public.project_tasks') IS NOT NULL THEN
    INSERT INTO public.project_tasks (id, project_id, title, status, assigned_to, order_index, created_at)
    VALUES
      ('35084af2-9b91-4e14-84f3-9fe7f7a5f001', v_project_1, 'Design entity schema', 'done', v_karim, 0, '2026-04-05T14:40:00Z'),
      ('35084af2-9b91-4e14-84f3-9fe7f7a5f002', v_project_1, 'Set up API scaffolding', 'in_progress', v_account_id, 1, '2026-04-05T14:41:00Z'),
      ('35084af2-9b91-4e14-84f3-9fe7f7a5f003', v_project_1, 'Implement matching endpoint', 'todo', v_hassan, 2, '2026-04-05T14:42:00Z'),
      ('35084af2-9b91-4e14-84f3-9fe7f7a5f004', v_project_1, 'Write integration notes', 'todo', null, 3, '2026-04-05T14:43:00Z')
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, assigned_to = EXCLUDED.assigned_to;
  END IF;

  IF to_regclass('public.club_requests') IS NOT NULL THEN
    INSERT INTO public.club_requests (
      id, club_id, request_type, status, requested_by, title, details, context, reviewed_by, reviewed_at, created_at
    )
    VALUES
      (
        '31084af2-9b91-4e14-84f3-9fe7f7a5f111',
        v_club,
        'room',
        'pending',
        v_hassan,
        'Pair-programming voice room',
        'Can we open a 45-minute room for Python + SQL debugging tonight?',
        '{"topic_hint":"python + sql debugging","duration_mins":45}'::jsonb,
        null,
        null,
        '2026-04-05T15:00:00Z'
      ),
      (
        '31084af2-9b91-4e14-84f3-9fe7f7a5f112',
        v_club,
        'project_help',
        'pending',
        v_sofia,
        'Need frontend QA support',
        'Looking for 2 members to review accessibility and responsive behavior.',
        '{"project_id":"31084af2-9b91-4e14-84f3-9fe7f7a5f061","priority":"high"}'::jsonb,
        null,
        null,
        '2026-04-05T15:05:00Z'
      ),
      (
        '31084af2-9b91-4e14-84f3-9fe7f7a5f113',
        v_club,
        'event_help',
        'accepted',
        v_layla,
        'Need workshop co-host',
        'Need a co-host to run Q&A and triage beginner questions.',
        '{"event_id":"31084af2-9b91-4e14-84f3-9fe7f7a5f051"}'::jsonb,
        v_account_id,
        '2026-04-05T15:20:00Z',
        '2026-04-05T15:10:00Z'
      )
    ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, reviewed_by = EXCLUDED.reviewed_by, reviewed_at = EXCLUDED.reviewed_at;
  END IF;

  IF to_regclass('public.quests') IS NOT NULL THEN
    BEGIN
      INSERT INTO public.quests (
        id, club_id, title, description, status, difficulty, max_participants,
        participant_count, step_count, deadline, created_by, created_at
      )
      VALUES
        (
          v_quest_1,
          v_club,
          'Build API Starter Taskforce',
          'Beginner-friendly quest to ship the first endpoint and tests.',
          'open',
          'beginner',
          6,
          2,
          2,
          '2026-04-18T23:59:59Z',
          v_account_id,
          '2026-04-05T15:30:00Z'
        ),
        (
          v_quest_2,
          v_club,
          'Ship Demo Day Showcase',
          'Prepare demo script, visuals, and rollout checklist.',
          'in_progress',
          'intermediate',
          8,
          3,
          2,
          '2026-04-28T23:59:59Z',
          v_karim,
          '2026-04-05T15:35:00Z'
        )
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty;
    EXCEPTION WHEN undefined_column THEN
      INSERT INTO public.quests (
        id, club_id, title, description, status, difficulty, max_participants, deadline, created_by, created_at
      )
      VALUES
        (v_quest_1, v_club, 'Build API Starter Taskforce', 'Beginner-friendly quest to ship the first endpoint and tests.', 'open', 'beginner', 6, '2026-04-18T23:59:59Z', v_account_id, '2026-04-05T15:30:00Z'),
        (v_quest_2, v_club, 'Ship Demo Day Showcase', 'Prepare demo script, visuals, and rollout checklist.', 'in_progress', 'intermediate', 8, '2026-04-28T23:59:59Z', v_karim, '2026-04-05T15:35:00Z')
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, difficulty = EXCLUDED.difficulty;
    END;
  END IF;

  IF to_regclass('public.quest_steps') IS NOT NULL THEN
    INSERT INTO public.quest_steps (id, quest_id, title, description, order_index, is_completed, completed_by, completed_at)
    VALUES
      ('31084af2-9b91-4e14-84f3-9fe7f7a5f0c1', v_quest_1, 'Define API scope', 'Confirm entities and payload contract.', 0, true, v_account_id, '2026-04-05T16:00:00Z'),
      ('31084af2-9b91-4e14-84f3-9fe7f7a5f0c2', v_quest_1, 'Implement auth middleware', 'Add token checks and shared error handling.', 1, false, null, null),
      ('31084af2-9b91-4e14-84f3-9fe7f7a5f0c3', v_quest_2, 'Prepare 5-minute demo script', 'Align storyline with real contribution metrics.', 0, true, v_karim, '2026-04-05T16:10:00Z'),
      ('31084af2-9b91-4e14-84f3-9fe7f7a5f0c4', v_quest_2, 'Finalize visual checklist board', 'Tag owners for all final fixes.', 1, false, null, null)
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, is_completed = EXCLUDED.is_completed, completed_by = EXCLUDED.completed_by, completed_at = EXCLUDED.completed_at;
  END IF;

  IF to_regclass('public.quest_participants') IS NOT NULL THEN
    INSERT INTO public.quest_participants (quest_id, user_id, joined_at)
    VALUES
      (v_quest_1, v_account_id, '2026-04-05T15:40:00Z'),
      (v_quest_1, v_hassan, '2026-04-05T15:41:00Z'),
      (v_quest_2, v_account_id, '2026-04-05T15:42:00Z'),
      (v_quest_2, v_karim, '2026-04-05T15:43:00Z'),
      (v_quest_2, v_layla, '2026-04-05T15:44:00Z')
    ON CONFLICT DO NOTHING;
  END IF;

  IF to_regclass('public.voice_rooms') IS NOT NULL THEN
    INSERT INTO public.voice_rooms (
      id, club_id, name, status, host_id, participant_count, max_participants, topic, scheduled_at, started_at, created_at
    )
    VALUES
      (
        v_room_active,
        v_club,
        'Python Office Hours',
        'active',
        v_karim,
        4,
        20,
        'Debugging API tasks and test strategy',
        null,
        '2026-04-05T16:15:00Z',
        '2026-04-05T16:15:00Z'
      ),
      (
        v_room_scheduled,
        v_club,
        'React Architecture Clinic',
        'scheduled',
        v_account_id,
        0,
        18,
        'State management and scalable components',
        '2026-04-09T19:00:00Z',
        null,
        '2026-04-05T16:20:00Z'
      )
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status, scheduled_at = EXCLUDED.scheduled_at;
  END IF;

  IF to_regclass('public.club_resources') IS NOT NULL THEN
    INSERT INTO public.club_resources (id, club_id, title, url, type, added_by, created_at)
    VALUES (
      '31084af2-9b91-4e14-84f3-9fe7f7a5f0e1',
      v_club,
      'Project Brief (Notion)',
      'https://www.notion.so/example/skill-builders-brief',
      'document',
      v_account_id,
      '2026-04-05T16:30:00Z'
    )
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, url = EXCLUDED.url, type = EXCLUDED.type;
  END IF;

  IF to_regclass('public.club_playlists') IS NOT NULL THEN
    INSERT INTO public.club_playlists (id, club_id, title, description, accent_color, cover_emoji, created_by, order_index, created_at)
    VALUES (
      v_playlist,
      v_club,
      'Sprint Recordings',
      'Video updates shared in chat for async members.',
      '#F59E0B',
      'VID',
      v_account_id,
      0,
      '2026-04-05T16:40:00Z'
    )
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, accent_color = EXCLUDED.accent_color, cover_emoji = EXCLUDED.cover_emoji;
  END IF;

  IF to_regclass('public.club_playlist_videos') IS NOT NULL THEN
    INSERT INTO public.club_playlist_videos (id, playlist_id, title, video_url, thumbnail_url, duration_label, order_index, added_by, created_at)
    VALUES
      (
        '31084af2-9b91-4e14-84f3-9fe7f7a5f101',
        v_playlist,
        'Kickoff: project context',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        '08:20',
        0,
        v_account_id,
        '2026-04-05T16:45:00Z'
      ),
      (
        '31084af2-9b91-4e14-84f3-9fe7f7a5f102',
        v_playlist,
        'Backend planning review',
        'https://www.youtube.com/watch?v=oHg5SJYRHA0',
        'https://img.youtube.com/vi/oHg5SJYRHA0/mqdefault.jpg',
        '11:05',
        1,
        v_karim,
        '2026-04-05T16:46:00Z'
      )
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, video_url = EXCLUDED.video_url, duration_label = EXCLUDED.duration_label;
  END IF;

  IF to_regclass('public.club_posts') IS NOT NULL THEN
    INSERT INTO public.club_posts (id, club_id, author_id, content, is_pinned, created_at, updated_at)
    VALUES (
      '31084af2-9b91-4e14-84f3-9fe7f7a5f131',
      v_club,
      v_account_id,
      'Welcome to the spring build cycle. Poll in chat, join a quest, and pick one deliverable this week.',
      true,
      '2026-04-05T17:00:00Z',
      '2026-04-05T17:00:00Z'
    )
    ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, is_pinned = EXCLUDED.is_pinned, updated_at = EXCLUDED.updated_at;
  END IF;

  IF to_regclass('public.club_member_points') IS NOT NULL THEN
    INSERT INTO public.club_member_points (club_id, user_id, points, streak_days, last_active)
    VALUES
      (v_club, v_account_id, 188, 7, current_date),
      (v_club, v_karim, 174, 6, current_date),
      (v_club, v_layla, 146, 5, current_date),
      (v_club, v_sofia, 132, 4, current_date),
      (v_club, v_hassan, 117, 3, current_date),
      (v_club, v_adam, 96, 2, current_date)
    ON CONFLICT (club_id, user_id) DO UPDATE SET
      points = EXCLUDED.points,
      streak_days = EXCLUDED.streak_days,
      last_active = EXCLUDED.last_active;
  END IF;

  IF to_regclass('public.clubs') IS NOT NULL THEN
    UPDATE public.clubs c
    SET
      member_count = (
        SELECT COUNT(*) FROM public.club_memberships cm WHERE cm.club_id = c.id AND cm.status = 'active'
      ),
      post_count = (
        SELECT COUNT(*) FROM public.club_posts cp WHERE cp.club_id = c.id
      ),
      updated_at = now()
    WHERE c.id = v_club;
  END IF;

  IF to_regclass('public.club_channels') IS NOT NULL THEN
    BEGIN
      UPDATE public.club_channels SET pinned_message_id = v_msg_event WHERE id = v_ch_ann;
    EXCEPTION WHEN undefined_column THEN
      NULL;
    END;
  END IF;
END $$;
