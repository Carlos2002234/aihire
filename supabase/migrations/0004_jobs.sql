-- Módulo 5: Job Creation + Job Board público

-- El job board público necesita resolver skills(name) para visitantes
-- anónimos (job_required_skills embebe skills). La migración de Módulo 3
-- solo le dio acceso a authenticated; falta anon.
grant select on public.skills to anon;
create policy "skills_select_anon"
  on public.skills for select
  to anon
  using (true);

-- Postgres no garantiza short-circuit del OR dentro de un USING: las policies
-- de jobs/job_required_skills/job_questions/companies chequean membership vía
-- "exists (select ... from recruiter_profiles ...)" incluso cuando la fila ya
-- es pública (status='open'). Sin grant, esa subquery revienta con
-- "permission denied" para anon en vez de simplemente evaluar a false.
-- RLS de recruiter_profiles (owner-only) sigue protegiendo los datos reales.
grant select on public.recruiter_profiles to anon;

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  recruiter_id uuid not null references public.recruiter_profiles (id),
  title text not null,
  description text,
  responsibilities text,
  benefits text,
  location_country text,
  location_city text,
  work_mode work_mode,
  employment_type employment_type,
  experience_level experience_level,
  salary_min int,
  salary_max int,
  salary_currency text not null default 'USD',
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table public.job_required_skills (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  min_years numeric,
  required boolean not null default true,
  language_level text,
  unique (job_id, skill_id)
);

create table public.job_questions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  question text not null,
  position int not null
);

create index on public.jobs (status, published_at desc);

alter table public.jobs enable row level security;
alter table public.job_required_skills enable row level security;
alter table public.job_questions enable row level security;

grant select on public.jobs to anon;
grant select, insert, update on public.jobs to authenticated;
grant select on public.job_required_skills to anon;
grant select, insert, update, delete on public.job_required_skills to authenticated;
grant select on public.job_questions to anon;
grant select, insert, update, delete on public.job_questions to authenticated;

create policy "jobs_select_public"
  on public.jobs for select
  to anon, authenticated
  using (status = 'open');

create policy "jobs_select_company_members"
  on public.jobs for select
  to authenticated
  using (
    exists (
      select 1 from public.recruiter_profiles rp
      where rp.id = auth.uid() and rp.company_id = jobs.company_id
    )
  );

create policy "jobs_insert_company_members"
  on public.jobs for insert
  to authenticated
  with check (
    recruiter_id = auth.uid()
    and exists (
      select 1 from public.recruiter_profiles rp
      where rp.id = auth.uid() and rp.company_id = jobs.company_id
    )
  );

create policy "jobs_update_company_members"
  on public.jobs for update
  to authenticated
  using (
    exists (
      select 1 from public.recruiter_profiles rp
      where rp.id = auth.uid() and rp.company_id = jobs.company_id
    )
  )
  with check (
    exists (
      select 1 from public.recruiter_profiles rp
      where rp.id = auth.uid() and rp.company_id = jobs.company_id
    )
  );

create policy "job_required_skills_select"
  on public.job_required_skills for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.jobs j
      where j.id = job_required_skills.job_id
        and (
          j.status = 'open'
          or exists (
            select 1 from public.recruiter_profiles rp
            where rp.id = auth.uid() and rp.company_id = j.company_id
          )
        )
    )
  );

create policy "job_required_skills_write"
  on public.job_required_skills for all
  to authenticated
  using (
    exists (
      select 1 from public.jobs j
      join public.recruiter_profiles rp on rp.company_id = j.company_id
      where j.id = job_required_skills.job_id and rp.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.jobs j
      join public.recruiter_profiles rp on rp.company_id = j.company_id
      where j.id = job_required_skills.job_id and rp.id = auth.uid()
    )
  );

create policy "job_questions_select"
  on public.job_questions for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.jobs j
      where j.id = job_questions.job_id
        and (
          j.status = 'open'
          or exists (
            select 1 from public.recruiter_profiles rp
            where rp.id = auth.uid() and rp.company_id = j.company_id
          )
        )
    )
  );

create policy "job_questions_write"
  on public.job_questions for all
  to authenticated
  using (
    exists (
      select 1 from public.jobs j
      join public.recruiter_profiles rp on rp.company_id = j.company_id
      where j.id = job_questions.job_id and rp.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.jobs j
      join public.recruiter_profiles rp on rp.company_id = j.company_id
      where j.id = job_questions.job_id and rp.id = auth.uid()
    )
  );
