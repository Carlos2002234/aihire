-- Módulo 2: Auth + Roles
-- Enums del schema completo (docs/database.md) + tabla profiles + trigger de signup.

create type user_role as enum ('candidate', 'recruiter');
create type work_mode as enum ('remote', 'hybrid', 'onsite');
create type employment_type as enum ('full_time', 'part_time', 'contract', 'internship');
create type experience_level as enum ('intern', 'junior', 'mid', 'senior', 'staff', 'lead');
create type application_stage as enum (
  'applied', 'under_review', 'recruiter_review', 'interview',
  'technical_interview', 'final_interview', 'offer', 'rejected'
);
create type rejection_reason as enum (
  'insufficient_experience', 'missing_technical_skills', 'salary_expectations',
  'language_level', 'better_qualified_candidate', 'culture_fit', 'other'
);
create type notification_type as enum (
  'application_submitted', 'status_changed', 'interview_invitation',
  'offer', 'rejection', 'feedback_available', 'new_matching_job'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null,
  full_name text,
  avatar_url text,
  headline text,
  location_country text,
  location_city text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

grant select, update on public.profiles to authenticated;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Crea el profile automáticamente al registrarse.
-- El role viaja en raw_user_meta_data (seteado en signUp / actualizado post-OAuth
-- desde el callback). Default 'candidate' para altas que no lo especifiquen (OAuth).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, avatar_url)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'candidate'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
