---
name: FightClub/SKILLCLUB QA Findings Summary
description: Key architectural issues and bug patterns found during QA audit of the fclub-nine.vercel.app application
type: project
---

Critical deployment issue: Missing vercel.json SPA rewrites causes all client-side routes to 404 on direct navigation/refresh.

**Why:** Vercel serves static files by default and does not know to route unknown paths to index.html for SPA handling.

**How to apply:** Any deployment fix must include `vercel.json` with `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`. This blocks all deep linking, OAuth redirects, and page refresh.

Key bug patterns:
- Demo user ID mismatch: AuthContext sets `"demo-user-id"` but guards check `"demo-user-bypass"` -- 9 files affected.
- Demo user has no Supabase session so `isEmailVerified` is false, causing redirect loop to /verify-email.
- Admin page at /app/admin has zero access control -- any authenticated user can access it. Still uses mock data.
- `user.interests` is silently aliased to `user.what_i_learn` in AuthContext mapProfileToUser (line 70).
- Many placeholder/non-functional features: header search, notification bell, media upload, avatar edit, footer links.
- Sidebar messages badge hardcoded to 1.
- Footer has stale 2024 copyright, broken nav links, and misleading Get Started/Sign In targets.
