-- Allow description to be NULL on club_projects (optional field in the wizard)
ALTER TABLE public.club_projects ALTER COLUMN description DROP NOT NULL;
