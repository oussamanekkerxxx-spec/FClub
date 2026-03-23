# SkillClub — Project Launch Plan
### Phase 1: The Seed (Marrakesh, First 10 Paid Sessions)

---

## Current State Audit

**What's already built (mock data, frontend only):**
- Landing page with full sections (Hero, Features, Pricing, etc.)
- App shell: Feed, Browse, SkillDetail, Messages, Profile, Teach, Admin, Onboarding, Board, Settings
- Auth pages: Login, Signup, VerifyEmail — wired to Supabase, demo bypass works
- Trust Tier system (Explorer → Member → Verified → Teacher → Connector)
- 40+ shadcn/ui components ready to use
- GSAP scroll animations on landing page

**What's broken / missing:**
1. **No backend running.** `supabase.ts` defaults to `localhost:54321` (local Supabase CLI) or requires `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` env vars. This causes the `ERR_CONNECTION_REFUSED` errors seen in the console.
2. **`NewBookingModal.tsx` does not exist.** The component is referenced somewhere but the file was never created. This causes the `guestDropdownRef is not defined` crash.
3. **All data is mock.** `src/data/mockData.ts` powers everything — no real DB reads/writes.
4. **No booking flow.** Bookings exist as a schema concept but no UI is wired.
5. **No `.env` file.** Supabase credentials are not configured.

---

## Executive Decisions (Agreed)

| Decision | Choice | Reason |
|---|---|---|
| **Payments** | Defer Stripe. Use "Agreed" booking state | Reduces dev time; track 12% commission manually for first 10-50 sessions |
| **Platform** | PWA (Responsive Web App) only | No React Native / app store friction at MVP |
| **Location** | Neighborhood dropdown (Medina, Guéliz, Hivernage, etc.) | No Google Maps API cost or complexity |
| **Video** | Deferred | In-person Marrakesh focus first |
| **Auth** | Supabase Magic Links (passwordless) preferred, email+password fallback | Keeps onboarding warm and low-friction |
| **Onboarding** | Multi-step warm conversation UI | Core differentiator — must not feel like a form |

---

## Sprint 1: Fix the Foundation (Days 1–3)

**Goal:** App runs without errors. Auth works. Real Supabase connected.

### Task 1.1 — Fix the `ERR_CONNECTION_REFUSED` Error
- Create a `.env` file at `app/.env` with real Supabase credentials:
  ```
  VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
  VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
  ```
- Sign up at supabase.com, create a new project ("skillclub-prod" or "skillclub-dev").
- Copy the Project URL and anon public key into `.env`.
- Restart the Vite dev server.

### Task 1.2 — Fix the `NewBookingModal` Crash
- Create `src/components/bookings/NewBookingModal.tsx`.
- The component must declare `const guestDropdownRef = useRef(null)` before using it (line 247 crash is a missing `useRef` declaration).
- For Phase 1, the modal captures: skill, proposed time, neighborhood, and a short note. Ends in an `"agreed"` state (no payment).

### Task 1.3 — Supabase Schema (Run SQL Migrations)
Run the following tables in Supabase SQL Editor:

```sql
-- Users extended profile (linked to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text,
  last_name text,
  avatar_url text,
  bio text,
  city text default 'Marrakesh',
  neighborhood text,
  trust_tier int default 0,
  trust_score numeric default 0,
  archetype text default 'mixed',
  phone_verified boolean default false,
  id_verified boolean default false,
  onboarding_completed boolean default false,
  what_i_teach text[] default '{}',
  what_i_learn text[] default '{}',
  languages text[] default '{}',
  sessions_completed int default 0,
  reviews_count int default 0,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
create policy "Users can view all profiles" on public.profiles for select using (true);
create policy "Users can edit own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Skills
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text,
  neighborhood text,
  price_per_hour numeric default 0,
  currency text default 'MAD',
  is_free boolean default false,
  is_active boolean default true,
  avg_rating numeric default 0,
  reviews_count int default 0,
  created_at timestamptz default now()
);

alter table public.skills enable row level security;
create policy "Anyone can view active skills" on public.skills for select using (is_active = true);
create policy "Teachers can manage own skills" on public.skills for all using (auth.uid() = teacher_id);

-- Bookings
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid references public.skills(id),
  student_id uuid references public.profiles(id),
  teacher_id uuid references public.profiles(id),
  status text default 'pending' check (status in ('pending', 'agreed', 'completed', 'cancelled')),
  proposed_time timestamptz,
  neighborhood text,
  student_note text,
  commission_tracked boolean default false,
  created_at timestamptz default now()
);

alter table public.bookings enable row level security;
create policy "Participants can see their bookings" on public.bookings for select using (auth.uid() = student_id or auth.uid() = teacher_id);
create policy "Students can create bookings" on public.bookings for insert with check (auth.uid() = student_id);
create policy "Participants can update status" on public.bookings for update using (auth.uid() = student_id or auth.uid() = teacher_id);

-- Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  sender_id uuid references public.profiles(id),
  content text not null,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;
create policy "Participants can view messages" on public.messages for select using (
  exists (select 1 from public.bookings b where b.id = booking_id and (b.student_id = auth.uid() or b.teacher_id = auth.uid()))
);
create policy "Participants can send messages" on public.messages for insert with check (auth.uid() = sender_id);

-- Enable Realtime for messages
alter publication supabase_realtime add table public.messages;
```

### Task 1.4 — Auto-Create Profile on Signup
Add a Supabase Edge Function or database trigger to auto-insert a row into `profiles` when a new user signs up via `auth.users`:

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

---

## Sprint 2: Replace Mock Data with Real Data (Days 4–7)

**Goal:** Skills feed and browse pull from Supabase. Users can post skills.

### Task 2.1 — Wire `AuthContext` to Real Profile
- After login, fetch the user's profile from `profiles` table by `user.id`.
- Replace the hardcoded `mockUser` with the fetched profile.
- If no profile exists yet, redirect to `/onboarding`.

### Task 2.2 — Wire the `Teach` Page
- `src/pages/Teach.tsx` currently shows mock skills.
- On submit, insert a new row into `skills` table linked to `auth.uid()`.
- On load, query skills where `teacher_id = auth.uid()`.

### Task 2.3 — Wire the `Browse` & `Feed` Pages
- `src/pages/Browse.tsx` and `src/pages/Feed.tsx` use `mockData.ts`.
- Replace with a Supabase query: `select * from skills where is_active = true`.
- Join with `profiles` for teacher info.

### Task 2.4 — Wire `SkillDetail` Page
- `src/pages/SkillDetail.tsx` shows skill info + triggers booking.
- Fetch skill by slug from DB.
- Integrate `NewBookingModal` here as the CTA button.

### Task 2.5 — Wire the Onboarding Flow
- `src/pages/Onboarding.tsx` multi-step form captures `what_i_teach`, `what_i_learn`, `neighborhood`, `languages`.
- On completion, `upsert` into `profiles` and set `onboarding_completed = true`.

---

## Sprint 3: Booking Flow & Chat (Days 8–10)

**Goal:** A student can request a session, teacher can accept, they can message each other.

### Task 3.1 — Build `NewBookingModal.tsx` (Full)
Located at `src/components/bookings/NewBookingModal.tsx`:
- Step 1: Show skill info + teacher availability note
- Step 2: Pick a neighborhood (dropdown: Medina, Guéliz, Hivernage, Mellah, Palmeraie, Other)
- Step 3: Propose a date/time (use the existing `Calendar` UI component)
- Step 4: Add a short note to the teacher
- Submit → insert into `bookings` table with `status: 'pending'`

### Task 3.2 — Teacher Notification & Accept/Decline
- On the teacher's `Feed` or a new `Bookings` tab: show pending booking requests.
- Accept button → update `status` to `'agreed'`.
- Decline button → update `status` to `'cancelled'`.

### Task 3.3 — Wire the Messages Page
- `src/pages/Messages.tsx` currently uses mock conversations.
- Replace with Supabase Realtime: subscribe to `messages` for all bookings the user is part of.
- On send, insert into `messages` table.
- Use `supabase.channel()` for real-time updates.

### Task 3.4 — Admin Dashboard (Manual Trust Verification)
- `src/pages/Admin.tsx` already exists.
- Wire it to show all users from `profiles`.
- Add a toggle to set `id_verified = true` for manually verified early adopters.
- Protect this route: only allow if `user.trust_tier === 4` or a hardcoded admin email.

---

## Sprint 4: PWA & Launch Prep (Days 11–13)

**Goal:** App feels native on mobile. Ready to share the link.

### Task 4.1 — PWA Configuration
- Add a `manifest.json` to `public/` with app name, icons, theme color (Deep Navy `#1B2A4A`).
- Configure Vite PWA plugin (`vite-plugin-pwa`) for offline caching of shell.
- Add `<meta name="theme-color" content="#1B2A4A">` to `index.html`.

### Task 4.2 — Mobile-First Polish
- Audit every page on a 375px viewport (iPhone SE size).
- Fix any layout breaks in Feed, Browse, SkillDetail, Messages.
- Ensure tap targets are at least 44×44px.

### Task 4.3 — Environment & Deployment
- Deploy frontend to **Vercel** or **Netlify** (both support Vite out of the box).
- Set environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the deployment dashboard.
- Configure Supabase Auth redirect URLs to include the production domain.
- Enable Supabase Email Auth (and optionally Magic Links).

### Task 4.4 — Seed Real Data
- Create 5–10 real teacher profiles manually in the Supabase dashboard.
- Seed the `skills` table with Marrakesh-specific offerings (Arabic calligraphy, darija lessons, cooking, etc.).
- This replaces `mockData.ts` for the real launch.

---

## Critical Path Summary

```
Day 1-3:  Fix ERR_CONNECTION_REFUSED → Create .env → Run SQL migrations
          Fix NewBookingModal crash → Create the file with useRef
Day 4-7:  Wire Auth → Wire Teach/Browse/Feed → Wire Onboarding
Day 8-10: Build booking flow → Teacher accept/decline → Real-time chat
Day 11-13: PWA setup → Mobile audit → Deploy to Vercel → Seed real data
```

---

## Bug Fix Reference (From Gemini Session)

| Error | Root Cause | Fix |
|---|---|---|
| `ERR_CONNECTION_REFUSED 127.0.0.1:8000/api/v1/auth/me` | No Supabase instance running; fallback URL is wrong port | Create `.env` with real Supabase cloud credentials |
| `NewBookingModal.tsx:247 guestDropdownRef is not defined` | Component file was never created; `useRef` declaration missing | Create `NewBookingModal.tsx` with proper `const guestDropdownRef = useRef(null)` |

---

## File Structure to Create

```
app/
├── .env                                          ← ADD: Supabase credentials
├── lunching_project_plan.md                      ← THIS FILE
└── src/
    ├── components/
    │   └── bookings/
    │       └── NewBookingModal.tsx               ← CREATE: Fixes crash
    ├── lib/
    │   └── supabase.ts                           ← EXISTS: just needs real .env
    └── pages/
        └── (all existing pages need Supabase wiring, not rewriting)
```

---

## Post-Launch Milestones

- **Sessions 1-10:** Fully manual. Track commission as IOU in a spreadsheet.
- **Sessions 11-50:** Add Stripe Checkout (single link, no full integration needed).
- **Sessions 51+:** Full Stripe Connect for teacher payouts and automated 12% commission split.
- **Month 2:** Review system (insert into `reviews` table, update `avg_rating` on `skills`).
- **Month 3:** Neighborhood-based search filters + trust tier auto-promotion logic.
