-- Módulo 3: Career Passport
-- Catálogo de skills + tablas del passport del candidato + completion_pct + storage de CVs.

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null
);

grant select on public.skills to authenticated;
alter table public.skills enable row level security;
create policy "skills_select_all"
  on public.skills for select
  to authenticated
  using (true);

insert into public.skills (name, category) values
  ('JavaScript', 'language'), ('TypeScript', 'language'), ('Python', 'language'),
  ('Java', 'language'), ('C#', 'language'), ('C++', 'language'), ('C', 'language'),
  ('Go', 'language'), ('Rust', 'language'), ('Ruby', 'language'), ('PHP', 'language'),
  ('Swift', 'language'), ('Kotlin', 'language'), ('Dart', 'language'), ('SQL', 'language'),
  ('Bash', 'language'), ('R', 'language'), ('Scala', 'language'), ('Elixir', 'language'),
  ('React', 'frontend'), ('Next.js', 'frontend'), ('Vue', 'frontend'), ('Angular', 'frontend'),
  ('Svelte', 'frontend'), ('Tailwind CSS', 'frontend'), ('HTML', 'frontend'), ('CSS', 'frontend'),
  ('Redux', 'frontend'), ('SASS/SCSS', 'frontend'), ('Webpack', 'frontend'), ('Vite', 'frontend'),
  ('Node.js', 'backend'), ('Express', 'backend'), ('NestJS', 'backend'), ('Django', 'backend'),
  ('Flask', 'backend'), ('FastAPI', 'backend'), ('Ruby on Rails', 'backend'), ('Spring Boot', 'backend'),
  ('.NET', 'backend'), ('Laravel', 'backend'), ('GraphQL', 'backend'), ('REST APIs', 'backend'),
  ('gRPC', 'backend'), ('Microservices', 'backend'),
  ('PostgreSQL', 'database'), ('MySQL', 'database'), ('MongoDB', 'database'), ('Redis', 'database'),
  ('SQLite', 'database'), ('Elasticsearch', 'database'), ('DynamoDB', 'database'),
  ('Supabase', 'database'), ('Firebase', 'database'), ('Cassandra', 'database'),
  ('AWS', 'cloud_devops'), ('GCP', 'cloud_devops'), ('Azure', 'cloud_devops'), ('Docker', 'cloud_devops'),
  ('Kubernetes', 'cloud_devops'), ('Terraform', 'cloud_devops'), ('CI/CD', 'cloud_devops'),
  ('GitHub Actions', 'cloud_devops'), ('Vercel', 'cloud_devops'), ('Linux', 'cloud_devops'),
  ('Nginx', 'cloud_devops'), ('Ansible', 'cloud_devops'), ('Prometheus/Grafana', 'cloud_devops'),
  ('Machine Learning', 'data_ai'), ('Deep Learning', 'data_ai'), ('PyTorch', 'data_ai'),
  ('TensorFlow', 'data_ai'), ('Pandas', 'data_ai'), ('NumPy', 'data_ai'), ('Data Engineering', 'data_ai'),
  ('ETL', 'data_ai'), ('LLMs / Prompt Engineering', 'data_ai'), ('Computer Vision', 'data_ai'),
  ('NLP', 'data_ai'), ('Apache Spark', 'data_ai'), ('Airflow', 'data_ai'),
  ('iOS Development', 'mobile'), ('Android Development', 'mobile'), ('React Native', 'mobile'),
  ('Flutter', 'mobile'),
  ('Unit Testing', 'testing_qa'), ('Integration Testing', 'testing_qa'), ('E2E Testing', 'testing_qa'),
  ('Jest', 'testing_qa'), ('Cypress', 'testing_qa'), ('Playwright', 'testing_qa'), ('QA Manual', 'testing_qa'),
  ('Test Automation', 'testing_qa'),
  ('Figma', 'design'), ('UI Design', 'design'), ('UX Research', 'design'), ('Design Systems', 'design'),
  ('Prototyping', 'design'), ('Wireframing', 'design'), ('Accessibility (a11y)', 'design'),
  ('Scrum', 'process'), ('Kanban', 'process'), ('Agile', 'process'), ('Product Management', 'process'),
  ('Technical Writing', 'process'), ('Code Review', 'process'), ('Mentoring', 'process'),
  ('Communication', 'soft_skill'), ('Leadership', 'soft_skill'), ('Teamwork', 'soft_skill'),
  ('Problem Solving', 'soft_skill'), ('Time Management', 'soft_skill'), ('Adaptability', 'soft_skill'),
  ('Critical Thinking', 'soft_skill'), ('Negotiation', 'soft_skill'), ('Stakeholder Management', 'soft_skill')
on conflict (name) do nothing;

create table public.candidate_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  bio text,
  github_url text,
  linkedin_url text,
  website_url text,
  salary_expectation_min int,
  salary_expectation_max int,
  salary_currency text not null default 'USD',
  preferred_work_modes work_mode[],
  availability text,
  open_to_work boolean not null default true,
  completion_pct int not null default 0,
  updated_at timestamptz not null default now()
);

create table public.work_experiences (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles (id) on delete cascade,
  title text not null,
  company text not null,
  description text,
  technologies text[],
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now()
);

create table public.educations (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles (id) on delete cascade,
  institution text not null,
  degree text not null,
  field text,
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now()
);

create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles (id) on delete cascade,
  name text not null,
  issuer text not null,
  issue_date date,
  expiry_date date,
  credential_url text,
  created_at timestamptz not null default now()
);

create table public.candidate_skills (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  years_experience numeric,
  inferred boolean not null default false,
  created_at timestamptz not null default now(),
  unique (candidate_id, skill_id)
);

create table public.candidate_languages (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles (id) on delete cascade,
  language text not null,
  level text not null,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles (id) on delete cascade,
  name text not null,
  description text,
  url text,
  technologies text[],
  created_at timestamptz not null default now()
);

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles (id) on delete cascade,
  name text not null,
  storage_path text not null,
  is_ai_generated boolean not null default false,
  target_job_id uuid,
  created_at timestamptz not null default now()
);

-- RLS: dueño únicamente en todo el passport (docs/database.md — regla general).
alter table public.candidate_profiles enable row level security;
alter table public.work_experiences enable row level security;
alter table public.educations enable row level security;
alter table public.certifications enable row level security;
alter table public.candidate_skills enable row level security;
alter table public.candidate_languages enable row level security;
alter table public.projects enable row level security;
alter table public.resumes enable row level security;

grant select, insert, update, delete on public.candidate_profiles to authenticated;
grant select, insert, update, delete on public.work_experiences to authenticated;
grant select, insert, update, delete on public.educations to authenticated;
grant select, insert, update, delete on public.certifications to authenticated;
grant select, insert, update, delete on public.candidate_skills to authenticated;
grant select, insert, update, delete on public.candidate_languages to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.resumes to authenticated;

create policy "candidate_profiles_owner"
  on public.candidate_profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "work_experiences_owner"
  on public.work_experiences for all
  using (auth.uid() = candidate_id)
  with check (auth.uid() = candidate_id);

create policy "educations_owner"
  on public.educations for all
  using (auth.uid() = candidate_id)
  with check (auth.uid() = candidate_id);

create policy "certifications_owner"
  on public.certifications for all
  using (auth.uid() = candidate_id)
  with check (auth.uid() = candidate_id);

create policy "candidate_skills_owner"
  on public.candidate_skills for all
  using (auth.uid() = candidate_id)
  with check (auth.uid() = candidate_id);

create policy "candidate_languages_owner"
  on public.candidate_languages for all
  using (auth.uid() = candidate_id)
  with check (auth.uid() = candidate_id);

create policy "projects_owner"
  on public.projects for all
  using (auth.uid() = candidate_id)
  with check (auth.uid() = candidate_id);

create policy "resumes_owner"
  on public.resumes for all
  using (auth.uid() = candidate_id)
  with check (auth.uid() = candidate_id);

-- completion_pct: 5 secciones × 20%, recalculado en cada cambio relevante del passport.
create function public.recalculate_passport_completion(p_candidate_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  pct int := 0;
begin
  select
    (case when coalesce(cp.bio, '') <> '' then 20 else 0 end)
    + (case when exists (select 1 from public.work_experiences where candidate_id = p_candidate_id) then 20 else 0 end)
    + (case when exists (select 1 from public.educations where candidate_id = p_candidate_id) then 20 else 0 end)
    + (case when (select count(*) from public.candidate_skills where candidate_id = p_candidate_id) >= 3 then 20 else 0 end)
    + (case when exists (select 1 from public.resumes where candidate_id = p_candidate_id) then 20 else 0 end)
  into pct
  from public.candidate_profiles cp
  where cp.id = p_candidate_id;

  update public.candidate_profiles
  set completion_pct = coalesce(pct, 0), updated_at = now()
  where id = p_candidate_id;
end;
$$;

create function public.trigger_recalculate_passport_completion()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_passport_completion(old.candidate_id);
    return old;
  end if;
  perform public.recalculate_passport_completion(new.candidate_id);
  return new;
end;
$$;

create function public.trigger_recalculate_passport_completion_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.recalculate_passport_completion(new.id);
  return new;
end;
$$;

create trigger recalc_completion_on_profile
  after insert or update of bio on public.candidate_profiles
  for each row execute procedure public.trigger_recalculate_passport_completion_profile();

create trigger recalc_completion_on_work_experiences
  after insert or update or delete on public.work_experiences
  for each row execute procedure public.trigger_recalculate_passport_completion();

create trigger recalc_completion_on_educations
  after insert or update or delete on public.educations
  for each row execute procedure public.trigger_recalculate_passport_completion();

create trigger recalc_completion_on_candidate_skills
  after insert or update or delete on public.candidate_skills
  for each row execute procedure public.trigger_recalculate_passport_completion();

create trigger recalc_completion_on_resumes
  after insert or update or delete on public.resumes
  for each row execute procedure public.trigger_recalculate_passport_completion();

-- Storage: bucket privado de CVs, un candidato solo accede a sus propios archivos
-- bajo el prefijo resumes/{candidate_id}/...
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

create policy "resumes_storage_owner_select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "resumes_storage_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "resumes_storage_owner_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
