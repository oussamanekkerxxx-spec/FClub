CREATE TABLE reviews (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid references skills(id),
  reviewer_id uuid references profiles(id),
  rating smallint check (rating between 1 and 5),
  content text,
  tags text[],
  created_at timestamptz default now()
);
