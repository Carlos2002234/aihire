-- Módulo 6: Easy Apply

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  candidate_id uuid not null references public.candidate_profiles (id) on delete cascade,
  resume_id uuid not null references public.resumes (id),
  stage application_stage not null default 'applied',
  answers jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);

create table public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  from_stage application_stage,
  to_stage application_stage not null,
  actor_id uuid references public.profiles (id),
  note text,
  created_at timestamptz not null default now()
);

create table public.saved_jobs (
  candidate_id uuid not null references public.candidate_profiles (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (candidate_id, job_id)
);

create index on public.applications (job_id, stage);
create index on public.applications (candidate_id, created_at desc);
create index on public.application_events (application_id, created_at);

alter table public.applications enable row level security;
alter table public.application_events enable row level security;
alter table public.saved_jobs enable row level security;

grant select, insert on public.applications to authenticated;
grant select on public.application_events to authenticated;
grant select, insert, delete on public.saved_jobs to authenticated;

create policy "applications_select_own_or_company"
  on public.applications for select
  to authenticated
  using (
    candidate_id = auth.uid()
    or exists (
      select 1 from public.jobs j
      join public.recruiter_profiles rp on rp.company_id = j.company_id
      where j.id = applications.job_id and rp.id = auth.uid()
    )
  );

create policy "applications_insert_own"
  on public.applications for insert
  to authenticated
  with check (
    candidate_id = auth.uid()
    and exists (select 1 from public.jobs j where j.id = applications.job_id and j.status = 'open')
  );

create policy "application_events_select_own_or_company"
  on public.application_events for select
  to authenticated
  using (
    exists (
      select 1 from public.applications a
      where a.id = application_events.application_id
        and (
          a.candidate_id = auth.uid()
          or exists (
            select 1 from public.jobs j
            join public.recruiter_profiles rp on rp.company_id = j.company_id
            where j.id = a.job_id and rp.id = auth.uid()
          )
        )
    )
  );

create policy "saved_jobs_owner"
  on public.saved_jobs for all
  to authenticated
  using (candidate_id = auth.uid())
  with check (candidate_id = auth.uid());

-- El primer evento del timeline se crea solo al aplicar (nunca vía policy manual).
create function public.handle_new_application()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.application_events (application_id, from_stage, to_stage, actor_id)
  values (new.id, null, new.stage, new.candidate_id);
  return new;
end;
$$;

create trigger on_application_created
  after insert on public.applications
  for each row execute procedure public.handle_new_application();
