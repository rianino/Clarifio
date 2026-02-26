-- Clarifio initial schema
-- Run this in the Supabase SQL editor or via `supabase db push`

-- Programs: top-level organizational unit per user
create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Courses: belong to a program
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references programs(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Note sessions: one per lecture, belong to a course
create table if not exists note_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade not null,
  name text not null,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Terms: flagged terms within a session, with optional AI definitions
create table if not exists terms (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references note_sessions(id) on delete cascade not null,
  term text not null,
  definition text,
  created_at timestamptz default now()
);

-- ──────────────────────────────────────────────
-- Row Level Security
-- ──────────────────────────────────────────────

alter table programs enable row level security;
create policy "Users can CRUD own programs" on programs
  for all using (auth.uid() = user_id);

alter table courses enable row level security;
create policy "Users can CRUD own courses" on courses
  for all using (
    program_id in (select id from programs where user_id = auth.uid())
  );

alter table note_sessions enable row level security;
create policy "Users can CRUD own sessions" on note_sessions
  for all using (
    course_id in (
      select c.id from courses c
      join programs p on c.program_id = p.id
      where p.user_id = auth.uid()
    )
  );

alter table terms enable row level security;
create policy "Users can CRUD own terms" on terms
  for all using (
    session_id in (
      select ns.id from note_sessions ns
      join courses c on ns.course_id = c.id
      join programs p on c.program_id = p.id
      where p.user_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────
-- updated_at triggers
-- ──────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger programs_updated_at before update on programs
  for each row execute function update_updated_at();

create trigger courses_updated_at before update on courses
  for each row execute function update_updated_at();

create trigger note_sessions_updated_at before update on note_sessions
  for each row execute function update_updated_at();
