-- PsychPath Phase 1 schema
-- tables, triggers, RLS, learner-safe questions view

create extension if not exists "pgcrypto";

-- ---------- helpers ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role text not null default 'learner' check (role in ('learner', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Must come after profiles exists (SQL functions validate relations at create time)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- ---------- user_stats ----------
create table if not exists public.user_stats (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  total_xp integer not null default 0 check (total_xp >= 0),
  streak integer not null default 0 check (streak >= 0),
  last_active date,
  level integer not null default 1 check (level >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_stats_set_updated_at on public.user_stats;
create trigger user_stats_set_updated_at
  before update on public.user_stats
  for each row execute function public.set_updated_at();

-- ---------- professors ----------
create table if not exists public.professors (
  id uuid primary key default gen_random_uuid(),
  legacy_key text unique,
  name text not null,
  tagline text not null default '',
  bio text not null default '',
  avatar_config jsonb not null default '{}'::jsonb,
  voice_prompt text not null default '',
  sample_phrases jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists professors_set_updated_at on public.professors;
create trigger professors_set_updated_at
  before update on public.professors
  for each row execute function public.set_updated_at();

-- ---------- courses ----------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text not null default '',
  description text not null default '',
  color text not null default '#6C5CE7',
  icon text not null default '🧠',
  order_index integer not null default 0,
  is_published boolean not null default false,
  default_professor_id uuid references public.professors (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courses_order_idx on public.courses (order_index);

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

-- ---------- lessons ----------
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  legacy_key text unique,
  title text not null,
  order_index integer not null default 0,
  professor_id uuid references public.professors (id) on delete set null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lessons_course_order_idx on public.lessons (course_id, order_index);

drop trigger if exists lessons_set_updated_at on public.lessons;
create trigger lessons_set_updated_at
  before update on public.lessons
  for each row execute function public.set_updated_at();

-- ---------- chapters ----------
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  legacy_key text unique,
  title text not null,
  order_index integer not null default 0,
  cards jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chapters_lesson_order_idx on public.chapters (lesson_id, order_index);

drop trigger if exists chapters_set_updated_at on public.chapters;
create trigger chapters_set_updated_at
  before update on public.chapters
  for each row execute function public.set_updated_at();

-- ---------- questions ----------
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('chapter', 'lesson')),
  owner_id uuid not null,
  order_index integer not null default 0,
  prompt text not null,
  options jsonb not null default '[]'::jsonb,
  answer_index integer not null check (answer_index >= 0),
  explanation text not null default '',
  type text not null default 'mcq' check (type in ('mcq')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_type, owner_id, order_index)
);

create index if not exists questions_owner_idx on public.questions (owner_type, owner_id);

drop trigger if exists questions_set_updated_at on public.questions;
create trigger questions_set_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

-- ---------- progress ----------
create table if not exists public.user_chapter_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  best_score integer not null default 0,
  xp_earned integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, chapter_id)
);

drop trigger if exists user_chapter_progress_set_updated_at on public.user_chapter_progress;
create trigger user_chapter_progress_set_updated_at
  before update on public.user_chapter_progress
  for each row execute function public.set_updated_at();

create table if not exists public.user_lesson_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  best_score integer not null default 0,
  attempts integer not null default 0,
  passed boolean not null default false,
  passed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

drop trigger if exists user_lesson_progress_set_updated_at on public.user_lesson_progress;
create trigger user_lesson_progress_set_updated_at
  before update on public.user_lesson_progress
  for each row execute function public.set_updated_at();

-- ---------- generation_jobs ----------
create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'succeeded', 'failed', 'accepted')),
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists generation_jobs_set_updated_at on public.generation_jobs;
create trigger generation_jobs_set_updated_at
  before update on public.generation_jobs
  for each row execute function public.set_updated_at();

-- ---------- auth bootstrap ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Learner'),
    'learner'
  )
  on conflict (id) do nothing;

  insert into public.user_stats (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- learner-safe view (no answer_index) ----------
-- security_invoker=false so the view can read questions without granting
-- learners SELECT on the base table (which would leak answer_index).
create or replace view public.questions_for_learner
with (security_invoker = false)
as
select
  q.id,
  q.owner_type,
  q.owner_id,
  q.order_index,
  q.prompt,
  q.options,
  q.explanation,
  q.type,
  q.created_at,
  q.updated_at
from public.questions q
where (
  q.owner_type = 'chapter'
  and exists (
    select 1
    from public.chapters c
    join public.lessons l on l.id = c.lesson_id
    join public.courses co on co.id = l.course_id
    where c.id = q.owner_id
      and c.is_published and l.is_published and co.is_published
  )
) or (
  q.owner_type = 'lesson'
  and exists (
    select 1
    from public.lessons l
    join public.courses co on co.id = l.course_id
    where l.id = q.owner_id
      and l.is_published and co.is_published
  )
);

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.user_stats enable row level security;
alter table public.professors enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.chapters enable row level security;
alter table public.questions enable row level security;
alter table public.user_chapter_progress enable row level security;
alter table public.user_lesson_progress enable row level security;
alter table public.generation_jobs enable row level security;

-- profiles
drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- user_stats
drop policy if exists user_stats_select_own on public.user_stats;
create policy user_stats_select_own on public.user_stats
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists user_stats_update_own on public.user_stats;
create policy user_stats_update_own on public.user_stats
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists user_stats_insert_own on public.user_stats;
create policy user_stats_insert_own on public.user_stats
  for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());

-- professors
drop policy if exists professors_select_authenticated on public.professors;
create policy professors_select_authenticated on public.professors
  for select to authenticated
  using (true);

drop policy if exists professors_admin_write on public.professors;
create policy professors_admin_write on public.professors
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- courses
drop policy if exists courses_select_published_or_admin on public.courses;
create policy courses_select_published_or_admin on public.courses
  for select to authenticated
  using (is_published = true or public.is_admin());

drop policy if exists courses_admin_write on public.courses;
create policy courses_admin_write on public.courses
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- lessons
drop policy if exists lessons_select_published_or_admin on public.lessons;
create policy lessons_select_published_or_admin on public.lessons
  for select to authenticated
  using (is_published = true or public.is_admin());

drop policy if exists lessons_admin_write on public.lessons;
create policy lessons_admin_write on public.lessons
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- chapters
drop policy if exists chapters_select_published_or_admin on public.chapters;
create policy chapters_select_published_or_admin on public.chapters
  for select to authenticated
  using (is_published = true or public.is_admin());

drop policy if exists chapters_admin_write on public.chapters;
create policy chapters_admin_write on public.chapters
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- questions: no learner SELECT on base table (answers live here)
drop policy if exists questions_admin_all on public.questions;
create policy questions_admin_all on public.questions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- progress
drop policy if exists ucp_select_own on public.user_chapter_progress;
create policy ucp_select_own on public.user_chapter_progress
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists ucp_insert_own on public.user_chapter_progress;
create policy ucp_insert_own on public.user_chapter_progress
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists ucp_update_own on public.user_chapter_progress;
create policy ucp_update_own on public.user_chapter_progress
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists ulp_select_own on public.user_lesson_progress;
create policy ulp_select_own on public.user_lesson_progress
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists ulp_insert_own on public.user_lesson_progress;
create policy ulp_insert_own on public.user_lesson_progress
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists ulp_update_own on public.user_lesson_progress;
create policy ulp_update_own on public.user_lesson_progress
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- generation_jobs admin only
drop policy if exists generation_jobs_admin on public.generation_jobs;
create policy generation_jobs_admin on public.generation_jobs
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.questions_for_learner to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.user_stats to authenticated;
grant select on public.professors, public.courses, public.lessons, public.chapters to authenticated;
grant select, insert, update on public.user_chapter_progress, public.user_lesson_progress to authenticated;
