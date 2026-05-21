ALTER TABLE public.club_projects DROP CONSTRAINT IF EXISTS club_projects_status_check;
ALTER TABLE public.club_projects
  ADD CONSTRAINT club_projects_status_check
  CHECK (status IN ('idea', 'active', 'paused', 'completed', 'open'));
