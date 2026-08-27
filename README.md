# PsychPath

Gamified, Duolingo-style psychology learning (master's-prep). Built from the MVP at
`reference/PsychPath.jsx`.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Postgres, Auth, Storage)
- Zod validation
- Anthropic (Phase 4+)

## Local setup

1. Copy env and fill secrets (anon + service role from your Supabase project):

   ```bash
   cp .env.example .env.local
   ```

2. Install and run:

   ```bash
   npm install
   npm run dev
   ```

3. Open [http://localhost:3001](http://localhost:3001). Health check:
   [http://localhost:3001/api/health](http://localhost:3001/api/health).

   PsychPath uses **port 3001** by default (so it doesn’t collide with other apps on 3000).

## Database (Phase 1)

Project ref: `nxihmfjmgnfrrfqvjxkn`

### Apply migration

**Option A — SQL Editor (fastest)**  
1. Open [SQL Editor](https://supabase.com/dashboard/project/nxihmfjmgnfrrfqvjxkn/sql/new)
2. Paste the full contents of [`supabase/migrations/20260827120000_init.sql`](supabase/migrations/20260827120000_init.sql)
3. Click **Run**

**Option B — CLI** (needs a [personal access token](https://supabase.com/dashboard/account/tokens))

```bash
set SUPABASE_ACCESS_TOKEN=your_token
npx supabase link --project-ref nxihmfjmgnfrrfqvjxkn
npx supabase db push --linked
```

**Option C — Database password**

```bash
npx supabase db query --db-url "postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres" -f supabase/migrations/20260827120000_init.sql
```

From Project Settings → Database you can copy the connection string.

### Seed MVP curriculum

```bash
npm run seed
```

Expected counts: **11** professors, **6** courses, **13** lessons, **24** chapters.

Re-running seed is safe (upserts by `slug` / `legacy_key`).

### Regenerate types (optional)

```bash
npm run db:types
```

## Environment

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only — never expose to the client |
| `ANTHROPIC_API_KEY` | Server only (Phase 4) |
| `NEXT_PUBLIC_APP_URL` | e.g. `http://localhost:3001` |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm run extract-mvp` | Rebuild curriculum JSON from MVP |
| `npm run seed` | Extract + seed into Supabase |
| `npm run db:types` | Regenerate `types/database.ts` |

## Phase status

- **Phase 0** — scaffold
- **Phase 1** — schema + seed
- **Phase 2** — auth + learner app
- **Phase 3** — admin CMS
- Phases 4–6 — AI, PWA, deploy

## Admin

Admins open `/admin` (also linked from the learner profile). Promote a user:

```sql
update public.profiles set role = 'admin' where id = '<auth-user-uuid>';
```

## Auth notes

- Email/password and magic-link sign-in are supported.
- In Supabase Dashboard → Authentication → URL configuration, set Site URL to
  `http://localhost:3001` (or your deploy URL) and add redirect URL
  `http://localhost:3001/auth/callback`.
- For local testing you can disable **Confirm email** under Authentication → Providers → Email.
