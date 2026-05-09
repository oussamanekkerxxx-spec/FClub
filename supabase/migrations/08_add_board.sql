CREATE TABLE IF NOT EXISTS board_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id),
  type text not null,
  title text not null,
  content text,
  neighborhood text,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);
