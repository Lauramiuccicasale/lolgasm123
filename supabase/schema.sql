-- =============================================
-- Scholarship Eligibility Mapper — Supabase Schema
-- =============================================
-- Award levels: Distinction award=3, Advanced achievement award=2, Secondary achievement award=1
-- Performance levels: Outstanding=4, Exceeds expectations=3, Meets expectations=2, Does not yet meet expectations=1

create extension if not exists "uuid-ossp";

create table if not exists universities (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists requirement_profiles (
  id           uuid primary key default uuid_generate_v4(),
  university_id uuid not null references universities(id) on delete cascade,
  track_name   text not null,
  min_award    integer not null default 1 check (min_award between 1 and 3),
  min_det      integer not null default 0,
  min_maths    integer not null default 1 check (min_maths between 1 and 4),
  min_sci      integer not null default 1 check (min_sci between 1 and 4),
  min_arabic   integer not null default 1 check (min_arabic between 1 and 4),
  min_english  integer not null default 1 check (min_english between 1 and 4),
  min_lss      integer not null default 1 check (min_lss between 1 and 4),
  created_at   timestamptz not null default now(),
  unique (university_id, track_name)
);

create table if not exists students (
  id           uuid primary key default uuid_generate_v4(),
  student_code text not null unique,
  name         text not null,
  award_level  integer not null default 1 check (award_level between 1 and 3),
  det_score    integer not null default 0,
  maths        integer not null default 1 check (maths between 1 and 4),
  sci          integer not null default 1 check (sci between 1 and 4),
  arabic       integer not null default 1 check (arabic between 1 and 4),
  english      integer not null default 1 check (english between 1 and 4),
  lss          integer not null default 1 check (lss between 1 and 4),
  created_at   timestamptz not null default now()
);

create table if not exists advisor_notes (
  id          uuid primary key default uuid_generate_v4(),
  student_id  uuid not null references students(id) on delete cascade,
  profile_id  uuid not null references requirement_profiles(id) on delete cascade,
  note_text   text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (student_id, profile_id)
);

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger advisor_notes_updated_at
  before update on advisor_notes
  for each row execute function update_updated_at();

alter table universities        enable row level security;
alter table requirement_profiles enable row level security;
alter table students            enable row level security;
alter table advisor_notes       enable row level security;

create policy "auth_full_access" on universities
  for all to authenticated using (true) with check (true);

create policy "auth_full_access" on requirement_profiles
  for all to authenticated using (true) with check (true);

create policy "auth_full_access" on students
  for all to authenticated using (true) with check (true);

create policy "auth_full_access" on advisor_notes
  for all to authenticated using (true) with check (true);
