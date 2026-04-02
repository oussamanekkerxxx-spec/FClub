
-- ─── club_projects ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  status      text NOT NULL DEFAULT 'idea'
                CHECK (status IN ('idea', 'active', 'paused', 'completed')),
  deadline    date,
  progress    int NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  github_url  text,
  figma_url   text,
  notion_url  text,
  created_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.club_projects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'club_projects' AND policyname = 'Everyone can view projects') THEN
    CREATE POLICY "Everyone can view projects" ON public.club_projects FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'club_projects' AND policyname = 'Members can create projects') THEN
    CREATE POLICY "Members can create projects" ON public.club_projects FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.club_memberships
          WHERE club_memberships.club_id = club_projects.club_id
            AND club_memberships.user_id = auth.uid()
            AND club_memberships.status = 'active'
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'club_projects' AND policyname = 'Creator can update project') THEN
    CREATE POLICY "Creator can update project" ON public.club_projects FOR UPDATE
      USING (auth.uid() = created_by);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'club_projects' AND policyname = 'Admins can delete projects') THEN
    CREATE POLICY "Admins can delete projects" ON public.club_projects FOR DELETE
      USING (
        auth.uid() = created_by OR
        EXISTS (
          SELECT 1 FROM public.club_memberships
          WHERE club_memberships.club_id = club_projects.club_id
            AND club_memberships.user_id = auth.uid()
            AND club_memberships.role IN ('admin', 'moderator')
            AND club_memberships.status = 'active'
        )
      );
  END IF;
END $$;

-- ─── project_tasks ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.club_projects(id) ON DELETE CASCADE,
  title       text NOT NULL,
  status      text NOT NULL DEFAULT 'todo'
                CHECK (status IN ('todo', 'in_progress', 'done')),
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_index int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_tasks' AND policyname = 'Everyone can view tasks') THEN
    CREATE POLICY "Everyone can view tasks" ON public.project_tasks FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_tasks' AND policyname = 'Members can add tasks') THEN
    CREATE POLICY "Members can add tasks" ON public.project_tasks FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.club_projects cp
          JOIN public.club_memberships cm ON cm.club_id = cp.club_id
          WHERE cp.id = project_tasks.project_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_tasks' AND policyname = 'Members can update tasks') THEN
    CREATE POLICY "Members can update tasks" ON public.project_tasks FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.club_projects cp
          JOIN public.club_memberships cm ON cm.club_id = cp.club_id
          WHERE cp.id = project_tasks.project_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_tasks' AND policyname = 'Members can delete tasks') THEN
    CREATE POLICY "Members can delete tasks" ON public.project_tasks FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.club_projects cp
          JOIN public.club_memberships cm ON cm.club_id = cp.club_id
          WHERE cp.id = project_tasks.project_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
        )
      );
  END IF;
END $$;

-- ─── project_members ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_members (
  project_id  uuid NOT NULL REFERENCES public.club_projects(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_members' AND policyname = 'Everyone can view project members') THEN
    CREATE POLICY "Everyone can view project members" ON public.project_members FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_members' AND policyname = 'Members can join projects') THEN
    CREATE POLICY "Members can join projects" ON public.project_members FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'project_members' AND policyname = 'Members can leave projects') THEN
    CREATE POLICY "Members can leave projects" ON public.project_members FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ─── club_member_points ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_member_points (
  club_id     uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points      int NOT NULL DEFAULT 0,
  streak_days int NOT NULL DEFAULT 0,
  last_active date,
  PRIMARY KEY (club_id, user_id)
);

ALTER TABLE public.club_member_points ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'club_member_points' AND policyname = 'Everyone can view points') THEN
    CREATE POLICY "Everyone can view points" ON public.club_member_points FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'club_member_points' AND policyname = 'System can upsert points') THEN
    CREATE POLICY "System can upsert points" ON public.club_member_points FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ─── award_club_points helper function ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.award_club_points(
  p_club_id uuid,
  p_user_id uuid,
  p_points  int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_active date;
  v_streak      int;
BEGIN
  SELECT last_active, streak_days
    INTO v_last_active, v_streak
    FROM public.club_member_points
   WHERE club_id = p_club_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.club_member_points(club_id, user_id, points, streak_days, last_active)
    VALUES (p_club_id, p_user_id, p_points, 1, current_date);
  ELSE
    -- update streak
    IF v_last_active = current_date - 1 THEN
      v_streak := v_streak + 1;
    ELSIF v_last_active < current_date - 1 THEN
      v_streak := 1;
    END IF;

    UPDATE public.club_member_points
       SET points      = points + p_points,
           streak_days = v_streak,
           last_active = current_date
     WHERE club_id = p_club_id AND user_id = p_user_id;
  END IF;
END;
$$;

-- ─── trigger: award points on club_post insert ──────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_award_post_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.award_club_points(NEW.club_id, NEW.author_id, 5);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_post_points ON public.club_posts;
CREATE TRIGGER award_post_points
  AFTER INSERT ON public.club_posts
  FOR EACH ROW EXECUTE FUNCTION public.trg_award_post_points();

-- ─── trigger: award points on club_post_reactions insert ────────────────────
CREATE OR REPLACE FUNCTION public.trg_award_reaction_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_club_id uuid;
BEGIN
  SELECT club_id INTO v_club_id FROM public.club_posts WHERE id = NEW.post_id;
  IF v_club_id IS NOT NULL THEN
    PERFORM public.award_club_points(v_club_id, NEW.user_id, 1);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_reaction_points ON public.club_post_reactions;
CREATE TRIGGER award_reaction_points
  AFTER INSERT ON public.club_post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.trg_award_reaction_points();

-- ─── trigger: award points on event_rsvps insert ────────────────────────────
CREATE OR REPLACE FUNCTION public.trg_award_rsvp_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_club_id uuid;
BEGIN
  SELECT club_id INTO v_club_id FROM public.club_events WHERE id = NEW.event_id;
  IF v_club_id IS NOT NULL THEN
    PERFORM public.award_club_points(v_club_id, NEW.user_id, 10);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS award_rsvp_points ON public.event_rsvps;
CREATE TRIGGER award_rsvp_points
  AFTER INSERT ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.trg_award_rsvp_points();
