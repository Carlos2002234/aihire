-- Módulo 4: Company + Recruiter Profile

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  description text,
  industry text,
  size text,
  website text,
  benefits text[],
  locations text[],
  photos text[],
  social jsonb,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.recruiter_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  company_id uuid references public.companies (id) on delete set null,
  position text,
  verified boolean not null default false
);

alter table public.companies enable row level security;
alter table public.recruiter_profiles enable row level security;

grant select, insert, update on public.companies to authenticated;
grant select on public.companies to anon;
grant select, insert, update on public.recruiter_profiles to authenticated;

-- companies: lectura pública (página pública de compañía), edición solo por
-- recruiters que pertenecen a esa compañía.
create policy "companies_select_public"
  on public.companies for select
  to anon, authenticated
  using (true);

create policy "companies_insert_own"
  on public.companies for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "companies_update_members"
  on public.companies for update
  to authenticated
  using (
    exists (
      select 1 from public.recruiter_profiles rp
      where rp.id = auth.uid() and rp.company_id = companies.id
    )
  )
  with check (
    exists (
      select 1 from public.recruiter_profiles rp
      where rp.id = auth.uid() and rp.company_id = companies.id
    )
  );

-- recruiter_profiles: dueño únicamente.
create policy "recruiter_profiles_owner"
  on public.recruiter_profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);
