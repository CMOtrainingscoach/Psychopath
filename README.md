# PsychPath

Gamified, Duolingo-style psychology learning (master's-prep). Built from the MVP at
`reference/PsychPath.jsx`.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Postgres, Auth, Storage)
- Zod validation
- OpenAI (Phase 4+)

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
| `OPENAI_API_KEY` | Server only (Phase 4) |
| `OPENAI_MODEL` | Optional; default `gpt-5.6-terra` |
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
| `npm run test:ai-parse` | Zod + JSON extract smoke tests |
| `npm run test:gamification` | XP / level / streak unit tests |
| `npm run test` | Run all unit tests |
| `npm run smoke` | Hit health, manifest, SW on local or prod URL |

## Phase status

- **Phase 0** — scaffold
- **Phase 1** — schema + seed
- **Phase 2** — auth + learner app
- **Phase 3** — admin CMS
- **Phase 4** — AI generation (professor + lesson drafts → review → accept)
- **Phase 5** — PWA (installable, offline course reading)
- **Phase 6** — deploy polish

## Deploy (Vercel + Supabase)

**Live app:** [https://psychopath-silk.vercel.app](https://psychopath-silk.vercel.app)

### 1. Vercel project

1. Import the GitHub repo (`CMOtrainingscoach/Psychopath`).
2. Framework preset: **Next.js** (uses `vercel.json`).
3. Add environment variables (Production + Preview):

| Variable | Production example |
|----------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://nxihmfjmgnfrrfqvjxkn.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |
| `NEXT_PUBLIC_APP_URL` | `https://psychopath-silk.vercel.app` |
| `OPENAI_API_KEY` | Optional — required for `/admin/generate` |
| `OPENAI_MODEL` | Optional — default `gpt-5.6-terra` |

4. **Redeploy** after changing env vars (Deployments → ⋯ → Redeploy).

### 2. Supabase Auth URLs

In [Supabase → Authentication → URL configuration](https://supabase.com/dashboard/project/nxihmfjmgnfrrfqvjxkn/auth/url-configuration):

| Setting | Value |
|---------|--------|
| **Site URL** | `https://psychopath-silk.vercel.app` |
| **Redirect URLs** | `https://psychopath-silk.vercel.app/auth/callback` |
| | `http://localhost:3001/auth/callback` |

Keep localhost in redirect URLs for local dev. Magic links and OAuth use `/auth/callback`.

### 3. Database

Apply the migration and seed once (see [Database](#database-phase-1) above). Production uses the same Supabase project.

### 4. Promote an admin

After a user signs up, run in the Supabase SQL editor:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'you@example.com'
);
```

Then open `/admin` while signed in as that user.

### 5. Post-deploy smoke test

```bash
npm run smoke -- https://psychopath-silk.vercel.app
```

Or manually:

- `/` — landing page loads
- `/api/health` — `{ "ok": true, "configured": true, "supabase": true }`
- `/login` → sign in → `/learn` — learner app
- `/admin` — admin CMS (admin role only)
- `/manifest.webmanifest` — PWA manifest
- `/learn` (while online) — then offline reading works after Phase 5 SW caches data

### 6. Custom domain (optional)

Add the domain in Vercel → Project → Settings → Domains, then update:

- `NEXT_PUBLIC_APP_URL`
- Supabase Site URL + redirect URLs

Redeploy after env changes.

## PWA (Phase 5)

PsychPath is installable as a standalone app:

- **Manifest** — brand theme `#6c5ce7`, icons 192/512, start URL `/learn`
- **Service worker** (Serwist) — caches app shell + course API responses for offline reading
- **Offline** — previously loaded courses stay readable; quiz grading is blocked with a clear message
- **Install** — use the prompt on the profile screen, or your browser’s “Install app” option

After deploying, open `/learn` once while online so course data is cached. Lighthouse PWA checks should pass on the production URL.

## AI generation (Phase 4)

1. Set `OPENAI_API_KEY` in `.env.local` and on Vercel (optional `OPENAI_MODEL`).
2. Open `/admin/generate` (admin only).
3. Generate a **professor** or **lesson** draft (default model: `gpt-5.6-terra`).
4. Review/edit JSON, complete the fact-check checklist, **Accept into CMS**.
5. Publish from the normal course/lesson editors.

Limit: **20 generations per admin per UTC day**. Drafts live in `generation_jobs`.

## Admin

Admins open `/admin` (also linked from the learner profile). Promote a user:

```sql
update public.profiles set role = 'admin' where id = '<auth-user-uuid>';
```

## Auth notes

- Email/password and magic-link sign-in are supported.
- For **local** dev: Site URL `http://localhost:3001`, redirect `http://localhost:3001/auth/callback`.
- For **production**: see [Deploy](#deploy-vercel--supabase) for Supabase URL settings.
- For local testing you can disable **Confirm email** under Authentication → Providers → Email.
