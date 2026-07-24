-- Módulo 8: ATS AI — Evaluación + Candidate Summary

create table public.ai_evaluations (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id) on delete cascade,
  match_score int not null check (match_score between 0 and 100),
  summary text not null,
  strengths text[] not null default '{}',
  gaps text[] not null default '{}',
  skill_analysis jsonb not null default '{}',
  reasoning text not null,
  model text not null,
  created_at timestamptz not null default now()
);

alter table public.ai_evaluations enable row level security;

-- Solo lectura para recruiters de la compañía dueña del job. El candidato
-- nunca ve su score interno (database.md: "el candidato NO ve su score
-- interno, sí ve el feedback"). Los inserts/updates los hace el servidor
-- con la service role key (src/lib/ai/evaluate.ts), que bypassea RLS — no
-- hay policy de escritura para authenticated.
grant select on public.ai_evaluations to authenticated;

create policy "ai_evaluations_select_recruiter"
  on public.ai_evaluations for select
  to authenticated
  using (
    exists (
      select 1 from public.applications a
      join public.jobs j on j.id = a.job_id
      join public.recruiter_profiles rp on rp.company_id = j.company_id
      where a.id = ai_evaluations.application_id and rp.id = auth.uid()
    )
  );
