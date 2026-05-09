CREATE TABLE IF NOT EXISTS feed_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  subtitle text,
  member_id uuid references profiles(id),
  skill_id uuid references skills(id),
  created_at timestamptz default now()
);
