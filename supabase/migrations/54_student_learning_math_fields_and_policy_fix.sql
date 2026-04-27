-- Student learning compatibility repair
-- Safe to run after partial student-learning rollouts.
-- It only touches tables that already exist and normalizes policies/constraints.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'club_courses'
  ) THEN
    EXECUTE 'ALTER TABLE public.club_courses ADD COLUMN IF NOT EXISTS math_field text';
    EXECUTE 'ALTER TABLE public.club_courses ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    EXECUTE 'ALTER TABLE public.club_courses DROP CONSTRAINT IF EXISTS club_courses_math_field_check';
    EXECUTE $sql$
      ALTER TABLE public.club_courses
      ADD CONSTRAINT club_courses_math_field_check
      CHECK (
        math_field IS NULL
        OR math_field IN ('math', 'physics', 'biology', 'chemistry', 'algebra', 'analysis')
      )
    $sql$;
    EXECUTE 'ALTER TABLE public.club_courses ENABLE ROW LEVEL SECURITY';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'club_lessons'
  ) THEN
    EXECUTE 'ALTER TABLE public.club_lessons ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    EXECUTE 'ALTER TABLE public.club_lessons ENABLE ROW LEVEL SECURITY';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'club_shared_files'
  ) THEN
    EXECUTE 'ALTER TABLE public.club_shared_files ADD COLUMN IF NOT EXISTS math_field text';
    EXECUTE 'ALTER TABLE public.club_shared_files ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()';
    EXECUTE 'ALTER TABLE public.club_shared_files DROP CONSTRAINT IF EXISTS club_shared_files_math_field_check';
    EXECUTE $sql$
      ALTER TABLE public.club_shared_files
      ADD CONSTRAINT club_shared_files_math_field_check
      CHECK (
        math_field IS NULL
        OR math_field IN ('math', 'physics', 'biology', 'chemistry', 'algebra', 'analysis')
      )
    $sql$;
    EXECUTE 'ALTER TABLE public.club_shared_files ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'club_shared_files'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'club_courses'
  ) THEN
    EXECUTE $sql$
      UPDATE public.club_shared_files sf
      SET math_field = cc.math_field
      FROM public.club_courses cc
      WHERE sf.course_id = cc.id
        AND sf.math_field IS NULL
        AND cc.math_field IS NOT NULL
    $sql$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'club_courses'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Courses viewable by club members" ON public.club_courses';
    EXECUTE 'DROP POLICY IF EXISTS "Courses viewable by active club members" ON public.club_courses';
    EXECUTE 'DROP POLICY IF EXISTS "Club mods/admins can create courses" ON public.club_courses';
    EXECUTE 'DROP POLICY IF EXISTS "Active mods/admins can create courses" ON public.club_courses';
    EXECUTE 'DROP POLICY IF EXISTS "Club members can create courses" ON public.club_courses';
    EXECUTE 'DROP POLICY IF EXISTS "Course creators can update their courses" ON public.club_courses';
    EXECUTE 'DROP POLICY IF EXISTS "Course creators can update" ON public.club_courses';
    EXECUTE 'DROP POLICY IF EXISTS "Active mods/admins can update courses" ON public.club_courses';
    EXECUTE 'DROP POLICY IF EXISTS "Course creators can delete their courses" ON public.club_courses';
    EXECUTE 'DROP POLICY IF EXISTS "Course creators can delete" ON public.club_courses';
    EXECUTE 'DROP POLICY IF EXISTS "Active mods/admins can delete courses" ON public.club_courses';
    EXECUTE 'DROP POLICY IF EXISTS "club_courses_select" ON public.club_courses';
    EXECUTE 'DROP POLICY IF EXISTS "club_courses_insert" ON public.club_courses';
    EXECUTE 'DROP POLICY IF EXISTS "club_courses_update" ON public.club_courses';
    EXECUTE 'DROP POLICY IF EXISTS "club_courses_delete" ON public.club_courses';

    EXECUTE $sql$
      CREATE POLICY "Courses viewable by active club members"
      ON public.club_courses FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.club_memberships cm
          WHERE cm.club_id = club_courses.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
        )
      )
    $sql$;

    EXECUTE $sql$
      CREATE POLICY "Active mods/admins can create courses"
      ON public.club_courses FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.club_memberships cm
          WHERE cm.club_id = club_courses.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
            AND cm.role IN ('admin', 'moderator')
        )
      )
    $sql$;

    EXECUTE $sql$
      CREATE POLICY "Active mods/admins can update courses"
      ON public.club_courses FOR UPDATE
      USING (
        EXISTS (
          SELECT 1
          FROM public.club_memberships cm
          WHERE cm.club_id = club_courses.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
            AND cm.role IN ('admin', 'moderator')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.club_memberships cm
          WHERE cm.club_id = club_courses.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
            AND cm.role IN ('admin', 'moderator')
        )
      )
    $sql$;

    EXECUTE $sql$
      CREATE POLICY "Active mods/admins can delete courses"
      ON public.club_courses FOR DELETE
      USING (
        EXISTS (
          SELECT 1
          FROM public.club_memberships cm
          WHERE cm.club_id = club_courses.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
            AND cm.role IN ('admin', 'moderator')
        )
      )
    $sql$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'club_lessons'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Lessons viewable by club members" ON public.club_lessons';
    EXECUTE 'DROP POLICY IF EXISTS "Lessons viewable by active club members" ON public.club_lessons';
    EXECUTE 'DROP POLICY IF EXISTS "Club mods/admins can create lessons" ON public.club_lessons';
    EXECUTE 'DROP POLICY IF EXISTS "Active mods/admins can create lessons" ON public.club_lessons';
    EXECUTE 'DROP POLICY IF EXISTS "Course creators can update lessons" ON public.club_lessons';
    EXECUTE 'DROP POLICY IF EXISTS "Active mods/admins can update lessons" ON public.club_lessons';
    EXECUTE 'DROP POLICY IF EXISTS "Course creators can delete lessons" ON public.club_lessons';
    EXECUTE 'DROP POLICY IF EXISTS "Active mods/admins can delete lessons" ON public.club_lessons';
    EXECUTE 'DROP POLICY IF EXISTS "club_lessons_select" ON public.club_lessons';
    EXECUTE 'DROP POLICY IF EXISTS "club_lessons_insert" ON public.club_lessons';
    EXECUTE 'DROP POLICY IF EXISTS "club_lessons_update" ON public.club_lessons';
    EXECUTE 'DROP POLICY IF EXISTS "club_lessons_delete" ON public.club_lessons';

    EXECUTE $sql$
      CREATE POLICY "Lessons viewable by active club members"
      ON public.club_lessons FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.club_memberships cm
          WHERE cm.club_id = club_lessons.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
        )
      )
    $sql$;

    EXECUTE $sql$
      CREATE POLICY "Active mods/admins can create lessons"
      ON public.club_lessons FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.club_memberships cm
          WHERE cm.club_id = club_lessons.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
            AND cm.role IN ('admin', 'moderator')
        )
      )
    $sql$;

    EXECUTE $sql$
      CREATE POLICY "Active mods/admins can update lessons"
      ON public.club_lessons FOR UPDATE
      USING (
        EXISTS (
          SELECT 1
          FROM public.club_memberships cm
          WHERE cm.club_id = club_lessons.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
            AND cm.role IN ('admin', 'moderator')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.club_memberships cm
          WHERE cm.club_id = club_lessons.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
            AND cm.role IN ('admin', 'moderator')
        )
      )
    $sql$;

    EXECUTE $sql$
      CREATE POLICY "Active mods/admins can delete lessons"
      ON public.club_lessons FOR DELETE
      USING (
        EXISTS (
          SELECT 1
          FROM public.club_memberships cm
          WHERE cm.club_id = club_lessons.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
            AND cm.role IN ('admin', 'moderator')
        )
      )
    $sql$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'club_shared_files'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Shared files viewable by club members" ON public.club_shared_files';
    EXECUTE 'DROP POLICY IF EXISTS "Shared files viewable by active club members" ON public.club_shared_files';
    EXECUTE 'DROP POLICY IF EXISTS "Club members can add shared files" ON public.club_shared_files';
    EXECUTE 'DROP POLICY IF EXISTS "Active club members can add shared files" ON public.club_shared_files';
    EXECUTE 'DROP POLICY IF EXISTS "Uploaders can update their shared files" ON public.club_shared_files';
    EXECUTE 'DROP POLICY IF EXISTS "Members or mods can update shared files" ON public.club_shared_files';
    EXECUTE 'DROP POLICY IF EXISTS "Uploaders or active mods can update shared files" ON public.club_shared_files';
    EXECUTE 'DROP POLICY IF EXISTS "Uploaders can delete their shared files" ON public.club_shared_files';
    EXECUTE 'DROP POLICY IF EXISTS "Members or mods can delete shared files" ON public.club_shared_files';
    EXECUTE 'DROP POLICY IF EXISTS "Uploaders or active mods can delete shared files" ON public.club_shared_files';
    EXECUTE 'DROP POLICY IF EXISTS "Mods/admins can delete any shared files" ON public.club_shared_files';
    EXECUTE 'DROP POLICY IF EXISTS "club_shared_files_select" ON public.club_shared_files';
    EXECUTE 'DROP POLICY IF EXISTS "club_shared_files_insert" ON public.club_shared_files';
    EXECUTE 'DROP POLICY IF EXISTS "club_shared_files_update" ON public.club_shared_files';
    EXECUTE 'DROP POLICY IF EXISTS "club_shared_files_delete" ON public.club_shared_files';

    EXECUTE $sql$
      CREATE POLICY "Shared files viewable by active club members"
      ON public.club_shared_files FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.club_memberships cm
          WHERE cm.club_id = club_shared_files.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
        )
      )
    $sql$;

    EXECUTE $sql$
      CREATE POLICY "Active club members can add shared files"
      ON public.club_shared_files FOR INSERT
      WITH CHECK (
        uploaded_by = auth.uid()
        AND EXISTS (
          SELECT 1
          FROM public.club_memberships cm
          WHERE cm.club_id = club_shared_files.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
        )
      )
    $sql$;

    EXECUTE $sql$
      CREATE POLICY "Uploaders or active mods can update shared files"
      ON public.club_shared_files FOR UPDATE
      USING (
        uploaded_by = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.club_memberships cm
          WHERE cm.club_id = club_shared_files.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
            AND cm.role IN ('admin', 'moderator')
        )
      )
      WITH CHECK (
        uploaded_by = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.club_memberships cm
          WHERE cm.club_id = club_shared_files.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
            AND cm.role IN ('admin', 'moderator')
        )
      )
    $sql$;

    EXECUTE $sql$
      CREATE POLICY "Uploaders or active mods can delete shared files"
      ON public.club_shared_files FOR DELETE
      USING (
        uploaded_by = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.club_memberships cm
          WHERE cm.club_id = club_shared_files.club_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
            AND cm.role IN ('admin', 'moderator')
        )
      )
    $sql$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'club_courses'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_club_courses_club_math_field ON public.club_courses(club_id, math_field, position)';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'club_shared_files'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_club_shared_files_math_field_created ON public.club_shared_files(math_field, created_at DESC)';
  END IF;
END $$;
