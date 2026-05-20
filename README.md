# DSG Distribution Sales OS

The Distribution Strategy Group sales operating system. Skill 1 of 13 is the
Prospect Dossier generator. This repo is the Next.js + Supabase shell; the
Python FastAPI sidecar that does the actual research lives separately and is
stubbed here.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS with shadcn/ui primitives
- Supabase (Auth, Postgres, Storage)
- Resend (email)
- mammoth.js (in-browser .docx preview)

## Getting started

```bash
cp .env.example .env.local      # fill in Supabase + Resend + Python service URLs
npm install
npm run dev                     # http://localhost:3000
```

Run `supabase/migrations/20260520000000_init.sql` against your Supabase project
to create the `skill_runs`, `skill_outputs`, and `user_connections` tables (with
RLS) and the `dsg-outputs` storage bucket.

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
PYTHON_SERVICE_URL
PYTHON_SERVICE_API_KEY
RESEND_API_KEY
NEXT_PUBLIC_APP_URL
APP_ENV
```

In v1, `PYTHON_SERVICE_URL` is unused — the `/api/skills/prospect-dossier`
route returns a stubbed completed response after a 5-second delay so the UI can
be walked end-to-end.

## Pages

- `/login` magic-link auth
- `/dashboard` 13-skill grid plus recent activity
- `/skills/prospect-dossier` skill form, progress, and output view
- `/history` reverse-chronological list of generations
- `/settings` profile, connections (stubbed), notifications, retention

## Adding skills 2 through 13

1. Add the skill to `lib/skills.ts` with `status: "available"` and an `href`.
2. Create `app/skills/<id>/page.tsx` mirroring the Prospect Dossier page.
3. Create `app/api/skills/<id>/route.ts` mirroring the dossier route.
4. The dashboard and history shell pick the new skill up automatically.

## Brand

- Primary CTAs in DSG Red `#D32D37`.
- Section headers and key callouts in DSG Navy `#2E69B3`.
- Inter, generous whitespace, no gradients, no emojis.
