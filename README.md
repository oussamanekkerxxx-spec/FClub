# FIGHTCLUB

A membership-based community platform where people teach what they know, learn what they want, and connect around shared interests. Not a course marketplace — a living club.

**Live:** https://fclub-nine.vercel.app

---

## What It Is

SkillClub connects three types of people:

- **The Giver** — someone with a skill to share (music, coding, cooking, languages…)
- **The Seeker** — someone curious and wanting to grow
- **The Connector** — someone who organizes events and builds community

The platform is built around trust, warm human design, and a message-first approach — no cold one-click purchasing of a person's time.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Routing | React Router v7 |
| Auth + Database | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| State Management | Zustand |
| Animations | GSAP |
| Deployment | Vercel |

---

## Features

### Authentication
- Email signup with confirmation flow
- Protected routes via `ProtectedRoute` wrapper
- Auth state managed via `AuthContext`

### Onboarding
- Warm conversational onboarding (not a cold form)
- Asks: "What are you curious about?", "What could you share?"
- Answers shape the user's feed and profile

### Skills Space
- Teachers create rich skill profiles (philosophy, format, price, availability)
- Browse and search by category, location, format
- Message-first contact — no cold booking
- Skill detail pages with teacher mini-profile

### Community
- Board for community posts and announcements
- Member profiles with trust score and activity history

### Messaging
- Real-time conversations via Supabase Realtime
- Linked to skill inquiries before booking

### Discovery Feed
- Personalized feed of teachers, events, and activity
- Location-aware content

### Trust System
- Tiered verification: Explorer → Member → Verified → Teacher → Connector
- Trust score built from session ratings, reliability, and community contributions

### Admin
- Admin dashboard for identity verification review and user management

---

## Pages

| Route | Page |
|-------|------|
| `/` | Landing page |
| `/signup` | Sign up |
| `/login` | Log in |
| `/verify-email` | Email confirmation |
| `/onboarding` | Warm onboarding flow |
| `/app/feed` | Discovery feed (default after login) |
| `/app/browse` | Browse all skills |
| `/app/skill/:slug` | Skill detail page |
| `/app/messages` | Conversations |
| `/app/profile` | Your profile |
| `/app/member/:id` | View another member's profile |
| `/app/teach` | Create or manage your skill listings |
| `/app/board` | Community board |
| `/app/settings` | Account settings |
| `/app/admin` | Admin panel (restricted) |

---

## Local Setup

### Prerequisites
- Node.js 18+
- A Supabase project

### Install

```bash
cd app
npm install
```

### Environment Variables

Create `app/.env` from the example:

```bash
cp .env.example .env
```

Fill in:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Run

```bash
npm run dev
# http://localhost:5173
```

### QA Seed Account (Complete Club Data)

The local seed now includes a full club scenario for end-to-end manual testing:

- Email: `oussama.nekker.xxx@gmail.com`
- Password: `skillclub2025`
- Seed file: `supabase/seeds/complete_account_oussama.sql`

If you use local Supabase reset/seed flow, it loads:

1. `supabase/seed.sql`
2. `supabase/seeds/complete_account_oussama.sql`

This fixture includes chat poll data, project cards + applications, events (workshop/sprint/showcase), quests, voice rooms, resources, playlists, unified requests, and leaderboard points.

### Build

```bash
npm run build
npm run preview
```

---

## Supabase Configuration

For the email confirmation flow to work correctly:

1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Set **Site URL** to your production URL (e.g. `https://fclub-nine.vercel.app`)
3. Add both your production URL and `http://localhost:5173` to **Redirect URLs**

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run all Vitest tests |
| `npm run test:contracts` | Run contract/fixture tests only |

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Deep Navy | `#1B2A4A` | Primary brand, headings |
| Warm Amber | `#C4873A` | CTAs, highlights |
| Parchment | `#F4F0E8` | Background |
| Forest Green | `#2D7A4F` | Community features |
| Deep Plum | `#5C3D8F` | Discovery feed |

Fonts: **Inter** (body) + **Playfair Display** (headings)

---

## License

MIT
