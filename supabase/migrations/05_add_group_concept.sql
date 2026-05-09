ALTER TABLE skills ADD COLUMN IF NOT EXISTS is_group boolean default false;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS max_headcount integer;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS current_headcount integer default 0;

CREATE TABLE IF NOT EXISTS group_enrollments (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid references skills(id),
  member_id uuid references profiles(id),
  status text default 'enrolled' check (status in ('enrolled', 'waitlisted', 'cancelled')),
  created_at timestamptz default now(),
  UNIQUE(skill_id, member_id)
);
