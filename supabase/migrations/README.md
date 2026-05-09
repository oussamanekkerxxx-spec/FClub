# Supabase Migrations

This directory contains all database schema migrations for the FightClub app.

## Rules

1. **Always use `IF NOT EXISTS`** for `CREATE TABLE`, `CREATE INDEX`, `CREATE POLICY`, and `CREATE TRIGGER`
2. **Use `CREATE OR REPLACE`** for functions
3. **No `SELECT` queries that return data** in migrations — diagnostics belong in `scripts/`
4. **No sub-numbering** — use sequential integers (`NN_description.sql`, not `NNa_` or `NNb_`)
5. **Keep migrations idempotent** — safe to re-run on a fresh database
6. **For policies**, use the `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies ...) THEN ... END IF; END $$;` pattern

## Creating a new migration

```bash
# Use the next sequential number
# Example: if the last file is 62_*.sql, create 63_your_feature.sql
```

## Running migrations locally

```bash
supabase db reset        # Reset local DB and re-run all migrations + seed
supabase db push         # Push pending migrations to linked project
```

## Migration history

| Range | Era |
|---|---|
| 01–24 | Early prototype (skills, reviews, messaging, feed) |
| 25–34 | Club v1 (chat, playlists, projects) |
| 35–45 | Club v2 (RLS hardening, DMs, stories) |
| 46–58 | Student features, tags, trust, battles, tournaments |
| 59–63 | Deletion cascade fixes, diagnostics, media dimensions |
