-- 41: Security hardening for project/points visibility policies

DO $$
DECLARE
  has_visibility boolean;
BEGIN
  IF to_regclass('public.club_projects') IS NULL THEN
    RETURN;
  END IF;

  DROP POLICY IF EXISTS "Everyone can view projects" ON public.club_projects;
  DROP POLICY IF EXISTS "Projects are viewable by club members or if public" ON public.club_projects;
  DROP POLICY IF EXISTS "Members can view projects" ON public.club_projects;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'club_projects'
      AND column_name = 'visibility'
  )
  INTO has_visibility;

  IF has_visibility THEN
    EXECUTE $policy$
      CREATE POLICY "Members can view projects"
      ON public.club_projects
      FOR SELECT
      USING (
        visibility = 'public'
        OR EXISTS (
          SELECT 1
          FROM public.club_memberships cm
          WHERE cm.club_id = club_projects.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
        )
      )
    $policy$;
  ELSE
    EXECUTE $policy$
      CREATE POLICY "Members can view projects"
      ON public.club_projects
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.club_memberships cm
          WHERE cm.club_id = club_projects.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
        )
      )
    $policy$;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.project_tasks') IS NULL THEN
    RETURN;
  END IF;

  DROP POLICY IF EXISTS "Everyone can view tasks" ON public.project_tasks;
  DROP POLICY IF EXISTS "Members can view tasks" ON public.project_tasks;

  CREATE POLICY "Members can view tasks"
    ON public.project_tasks
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.club_projects cp
        JOIN public.club_memberships cm ON cm.club_id = cp.club_id
        WHERE cp.id = project_tasks.project_id
          AND cm.user_id = auth.uid()
          AND cm.status = 'active'
      )
    );
END $$;

DO $$
BEGIN
  IF to_regclass('public.project_members') IS NULL THEN
    RETURN;
  END IF;

  DROP POLICY IF EXISTS "Everyone can view project members" ON public.project_members;
  DROP POLICY IF EXISTS "Members can view project members" ON public.project_members;

  CREATE POLICY "Members can view project members"
    ON public.project_members
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.club_projects cp
        JOIN public.club_memberships cm ON cm.club_id = cp.club_id
        WHERE cp.id = project_members.project_id
          AND cm.user_id = auth.uid()
          AND cm.status = 'active'
      )
    );
END $$;

DO $$
BEGIN
  IF to_regclass('public.club_member_points') IS NULL THEN
    RETURN;
  END IF;

  DROP POLICY IF EXISTS "Everyone can view points" ON public.club_member_points;
  DROP POLICY IF EXISTS "System can upsert points" ON public.club_member_points;
  DROP POLICY IF EXISTS "Members can view points" ON public.club_member_points;

  CREATE POLICY "Members can view points"
    ON public.club_member_points
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.club_memberships cm
        WHERE cm.club_id = club_member_points.club_id
          AND cm.user_id = auth.uid()
          AND cm.status = 'active'
      )
    );
END $$;

DO $$
DECLARE
  has_visibility boolean;
BEGIN
  IF to_regclass('public.project_roles') IS NULL OR to_regclass('public.project_skills') IS NULL THEN
    RETURN;
  END IF;

  DROP POLICY IF EXISTS "Roles are viewable by anyone who can view the project" ON public.project_roles;
  DROP POLICY IF EXISTS "Roles are viewable by project members or if project is public" ON public.project_roles;
  DROP POLICY IF EXISTS "Skills are viewable by anyone who can view the project" ON public.project_skills;
  DROP POLICY IF EXISTS "Skills are viewable by project members or if project is public" ON public.project_skills;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'club_projects'
      AND column_name = 'visibility'
  )
  INTO has_visibility;

  IF has_visibility THEN
    EXECUTE $policy$
      CREATE POLICY "Roles are viewable by project members or if project is public"
      ON public.project_roles
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.club_projects cp
          LEFT JOIN public.club_memberships cm
            ON cm.club_id = cp.club_id
           AND cm.user_id = auth.uid()
           AND cm.status = 'active'
          WHERE cp.id = project_roles.project_id
            AND (cp.visibility = 'public' OR cm.user_id IS NOT NULL)
        )
      )
    $policy$;

    EXECUTE $policy$
      CREATE POLICY "Skills are viewable by project members or if project is public"
      ON public.project_skills
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.club_projects cp
          LEFT JOIN public.club_memberships cm
            ON cm.club_id = cp.club_id
           AND cm.user_id = auth.uid()
           AND cm.status = 'active'
          WHERE cp.id = project_skills.project_id
            AND (cp.visibility = 'public' OR cm.user_id IS NOT NULL)
        )
      )
    $policy$;
  ELSE
    EXECUTE $policy$
      CREATE POLICY "Roles are viewable by project members or if project is public"
      ON public.project_roles
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.club_projects cp
          JOIN public.club_memberships cm
            ON cm.club_id = cp.club_id
           AND cm.user_id = auth.uid()
           AND cm.status = 'active'
          WHERE cp.id = project_roles.project_id
        )
      )
    $policy$;

    EXECUTE $policy$
      CREATE POLICY "Skills are viewable by project members or if project is public"
      ON public.project_skills
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.club_projects cp
          JOIN public.club_memberships cm
            ON cm.club_id = cp.club_id
           AND cm.user_id = auth.uid()
           AND cm.status = 'active'
          WHERE cp.id = project_skills.project_id
        )
      )
    $policy$;
  END IF;
END $$;
