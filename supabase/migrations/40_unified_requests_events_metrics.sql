-- Unified requests inbox + richer events + contribution metrics

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) Unified request pipeline
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_requests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id       uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  request_type  text NOT NULL
                CHECK (request_type IN ('room', 'project_help', 'event_help', 'other')),
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  requested_by  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         text NOT NULL,
  details       text,
  context       jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewed_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_club_requests_club_status_created
  ON public.club_requests(club_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_club_requests_requested_by
  ON public.club_requests(requested_by);

ALTER TABLE public.club_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'club_requests'
      AND policyname = 'Club members can view club requests'
  ) THEN
    CREATE POLICY "Club members can view club requests"
      ON public.club_requests FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.club_memberships cm
          WHERE cm.club_id = club_requests.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'club_requests'
      AND policyname = 'Members can create club requests'
  ) THEN
    CREATE POLICY "Members can create club requests"
      ON public.club_requests FOR INSERT
      WITH CHECK (
        requested_by = auth.uid()
        AND EXISTS (
          SELECT 1
          FROM public.club_memberships cm
          WHERE cm.club_id = club_requests.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'club_requests'
      AND policyname = 'Moderators can review club requests'
  ) THEN
    CREATE POLICY "Moderators can review club requests"
      ON public.club_requests FOR UPDATE
      USING (
        EXISTS (
          SELECT 1
          FROM public.club_memberships cm
          WHERE cm.club_id = club_requests.club_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'moderator')
            AND cm.status = 'active'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.club_memberships cm
          WHERE cm.club_id = club_requests.club_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'moderator')
            AND cm.status = 'active'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'club_requests'
      AND policyname = 'Requester can cancel own pending request'
  ) THEN
    CREATE POLICY "Requester can cancel own pending request"
      ON public.club_requests FOR UPDATE
      USING (requested_by = auth.uid() AND status = 'pending')
      WITH CHECK (requested_by = auth.uid() AND status IN ('pending', 'cancelled'));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) Event style + chat announcement linkage
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.club_events
  ADD COLUMN IF NOT EXISTS event_style text NOT NULL DEFAULT 'workshop',
  ADD COLUMN IF NOT EXISTS host_label  text,
  ADD COLUMN IF NOT EXISTS outcomes    text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'club_events_event_style_check'
  ) THEN
    ALTER TABLE public.club_events
      ADD CONSTRAINT club_events_event_style_check
      CHECK (event_style IN ('workshop', 'sprint', 'showcase'));
  END IF;
END $$;

ALTER TABLE public.club_messages
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.club_events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_club_messages_event_id
  ON public.club_messages(event_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) Let moderators/admins review project applications across the club
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'project_applications'
      AND policyname = 'Club moderators can view project applications'
  ) THEN
    CREATE POLICY "Club moderators can view project applications"
      ON public.project_applications FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.club_projects cp
          JOIN public.club_memberships cm ON cm.club_id = cp.club_id
          WHERE cp.id = project_applications.project_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'moderator')
            AND cm.status = 'active'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'project_applications'
      AND policyname = 'Club moderators can update project applications'
  ) THEN
    CREATE POLICY "Club moderators can update project applications"
      ON public.project_applications FOR UPDATE
      USING (
        EXISTS (
          SELECT 1
          FROM public.club_projects cp
          JOIN public.club_memberships cm ON cm.club_id = cp.club_id
          WHERE cp.id = project_applications.project_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'moderator')
            AND cm.status = 'active'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.club_projects cp
          JOIN public.club_memberships cm ON cm.club_id = cp.club_id
          WHERE cp.id = project_applications.project_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('admin', 'moderator')
            AND cm.status = 'active'
        )
      );
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4) Stronger contribution metrics (chat/project/quest)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'award_club_points'
      AND n.nspname = 'public'
  ) THEN
    -- Chat activity (+2 per message)
    CREATE OR REPLACE FUNCTION public.trg_award_chat_message_points()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $fn$
    DECLARE
      v_club_id uuid;
    BEGIN
      SELECT cc.club_id
        INTO v_club_id
      FROM public.club_channels cc
      WHERE cc.id = NEW.channel_id;

      IF v_club_id IS NOT NULL AND NEW.sender_id IS NOT NULL THEN
        PERFORM public.award_club_points(v_club_id, NEW.sender_id, 2);
      END IF;
      RETURN NEW;
    END;
    $fn$;

    DROP TRIGGER IF EXISTS award_chat_message_points ON public.club_messages;
    CREATE TRIGGER award_chat_message_points
      AFTER INSERT ON public.club_messages
      FOR EACH ROW EXECUTE FUNCTION public.trg_award_chat_message_points();

    -- Project creation (+15)
    CREATE OR REPLACE FUNCTION public.trg_award_project_creation_points()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $fn$
    DECLARE
      v_user_id uuid;
    BEGIN
      v_user_id := COALESCE(NEW.created_by, NEW.creator_id);
      IF v_user_id IS NOT NULL THEN
        PERFORM public.award_club_points(NEW.club_id, v_user_id, 15);
      END IF;
      RETURN NEW;
    END;
    $fn$;

    DROP TRIGGER IF EXISTS award_project_creation_points ON public.club_projects;
    CREATE TRIGGER award_project_creation_points
      AFTER INSERT ON public.club_projects
      FOR EACH ROW EXECUTE FUNCTION public.trg_award_project_creation_points();

    -- Project acceptance (+12 applicant, +4 creator)
    CREATE OR REPLACE FUNCTION public.trg_award_project_acceptance_points()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $fn$
    DECLARE
      v_club_id uuid;
      v_creator uuid;
      v_old_status text;
    BEGIN
      v_old_status := COALESCE(OLD.status, '');
      IF NEW.status = 'accepted' AND v_old_status <> 'accepted' THEN
        SELECT cp.club_id, COALESCE(cp.created_by, cp.creator_id)
          INTO v_club_id, v_creator
        FROM public.club_projects cp
        WHERE cp.id = NEW.project_id;

        IF v_club_id IS NOT NULL AND NEW.user_id IS NOT NULL THEN
          PERFORM public.award_club_points(v_club_id, NEW.user_id, 12);
        END IF;
        IF v_club_id IS NOT NULL AND v_creator IS NOT NULL AND v_creator <> NEW.user_id THEN
          PERFORM public.award_club_points(v_club_id, v_creator, 4);
        END IF;
      END IF;
      RETURN NEW;
    END;
    $fn$;

    DROP TRIGGER IF EXISTS award_project_acceptance_points ON public.project_applications;
    CREATE TRIGGER award_project_acceptance_points
      AFTER UPDATE ON public.project_applications
      FOR EACH ROW EXECUTE FUNCTION public.trg_award_project_acceptance_points();

    -- Quest participation (+4)
    IF to_regclass('public.quest_participants') IS NOT NULL
       AND to_regclass('public.quests') IS NOT NULL THEN
      CREATE OR REPLACE FUNCTION public.trg_award_quest_join_points()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $fn$
      DECLARE
        v_club_id uuid;
      BEGIN
        SELECT q.club_id INTO v_club_id
        FROM public.quests q
        WHERE q.id = NEW.quest_id;

        IF v_club_id IS NOT NULL AND NEW.user_id IS NOT NULL THEN
          PERFORM public.award_club_points(v_club_id, NEW.user_id, 4);
        END IF;
        RETURN NEW;
      END;
      $fn$;

      DROP TRIGGER IF EXISTS award_quest_join_points ON public.quest_participants;
      CREATE TRIGGER award_quest_join_points
        AFTER INSERT ON public.quest_participants
        FOR EACH ROW EXECUTE FUNCTION public.trg_award_quest_join_points();
    END IF;

    -- Quest step completion (+6) and quest completion bonus (+20 once)
    IF to_regclass('public.quest_steps') IS NOT NULL
       AND to_regclass('public.quests') IS NOT NULL THEN
      CREATE OR REPLACE FUNCTION public.trg_award_quest_step_points()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $fn$
      DECLARE
        v_club_id uuid;
        v_prev_status text;
      BEGIN
        IF (NOT COALESCE(OLD.is_completed, false))
           AND COALESCE(NEW.is_completed, false)
           AND NEW.completed_by IS NOT NULL THEN
          SELECT q.club_id, q.status
            INTO v_club_id, v_prev_status
          FROM public.quests q
          WHERE q.id = NEW.quest_id;

          IF v_club_id IS NOT NULL THEN
            PERFORM public.award_club_points(v_club_id, NEW.completed_by, 6);
          END IF;

          IF v_club_id IS NOT NULL
             AND v_prev_status IS DISTINCT FROM 'completed'
             AND NOT EXISTS (
               SELECT 1
               FROM public.quest_steps qs
               WHERE qs.quest_id = NEW.quest_id
                 AND COALESCE(qs.is_completed, false) = false
             ) THEN
            UPDATE public.quests
            SET status = 'completed'
            WHERE id = NEW.quest_id;
            PERFORM public.award_club_points(v_club_id, NEW.completed_by, 20);
          END IF;
        END IF;
        RETURN NEW;
      END;
      $fn$;

      DROP TRIGGER IF EXISTS award_quest_step_points ON public.quest_steps;
      CREATE TRIGGER award_quest_step_points
        AFTER UPDATE ON public.quest_steps
        FOR EACH ROW EXECUTE FUNCTION public.trg_award_quest_step_points();
    END IF;
  END IF;
END $$;
