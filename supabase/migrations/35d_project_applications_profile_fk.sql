-- Add FK from project_applications.user_id to public.profiles(id)
-- so PostgREST can resolve the user:profiles(...) join in API queries.
-- (The existing auth.users FK is invisible to PostgREST which only traverses the public schema.)
ALTER TABLE public.project_applications
  ADD CONSTRAINT project_applications_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
