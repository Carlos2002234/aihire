-- Módulo 9: Rechazo con Feedback IA + Career Roadmap

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id) on delete cascade,
  rejection_reason rejection_reason not null,
  recruiter_comment text,
  ai_message text not null,
  strengths text[] not null default '{}',
  areas_to_improve text[] not null default '{}',
  missing_skills text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidate_profiles (id) on delete cascade,
  feedback_id uuid references public.feedback (id) on delete set null,
  title text not null,
  created_at timestamptz not null default now()
);

create table public.roadmap_steps (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmaps (id) on delete cascade,
  position int not null,
  title text not null,
  description text,
  type text not null check (type in ('learn', 'project', 'certification', 'practice', 'apply')),
  completed boolean not null default false
);

create index on public.roadmaps (candidate_id);
create index on public.roadmap_steps (roadmap_id, position);

alter table public.feedback enable row level security;
alter table public.roadmaps enable row level security;
alter table public.roadmap_steps enable row level security;

-- feedback: el candidato ve el suyo cuando existe. La escritura pasa
-- siempre por reject_application_with_feedback (SECURITY DEFINER más
-- abajo) — sin policy de insert/update para authenticated.
grant select on public.feedback to authenticated;

create policy "feedback_select_candidate"
  on public.feedback for select
  to authenticated
  using (
    exists (
      select 1 from public.applications a
      where a.id = feedback.application_id and a.candidate_id = auth.uid()
    )
  );

-- roadmaps / roadmap_steps: los genera el servidor (service role, bypassea
-- RLS) a partir del feedback. El candidato solo lee los suyos y puede
-- marcar sus propios steps como completados.
grant select on public.roadmaps to authenticated;
grant select, update on public.roadmap_steps to authenticated;

create policy "roadmaps_select_owner"
  on public.roadmaps for select
  to authenticated
  using (candidate_id = auth.uid());

create policy "roadmap_steps_select_owner"
  on public.roadmap_steps for select
  to authenticated
  using (
    exists (
      select 1 from public.roadmaps r
      where r.id = roadmap_steps.roadmap_id and r.candidate_id = auth.uid()
    )
  );

create policy "roadmap_steps_update_owner"
  on public.roadmap_steps for update
  to authenticated
  using (
    exists (
      select 1 from public.roadmaps r
      where r.id = roadmap_steps.roadmap_id and r.candidate_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.roadmaps r
      where r.id = roadmap_steps.roadmap_id and r.candidate_id = auth.uid()
    )
  );

-- Rechaza una aplicación con feedback, de forma atómica: mueve la etapa,
-- registra el evento del timeline e inserta el feedback. moveStage nunca
-- permite pasar a 'rejected' directamente (docs/api.md) — este es el
-- único camino. Mismo patrón de autorización manual que move_application_stage.
create function public.reject_application_with_feedback(
  p_application_id uuid,
  p_rejection_reason rejection_reason,
  p_recruiter_comment text,
  p_ai_message text,
  p_strengths text[],
  p_areas_to_improve text[],
  p_missing_skills text[]
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_from_stage application_stage;
  v_job_id uuid;
  v_is_authorized boolean;
  v_feedback_id uuid;
begin
  select a.stage, a.job_id into v_from_stage, v_job_id
  from public.applications a
  where a.id = p_application_id;

  if not found then
    raise exception 'application not found';
  end if;

  select exists (
    select 1 from public.jobs j
    join public.recruiter_profiles rp on rp.company_id = j.company_id
    where j.id = v_job_id and rp.id = auth.uid()
  ) into v_is_authorized;

  if not v_is_authorized then
    raise exception 'not authorized to reject this application';
  end if;

  update public.applications
  set stage = 'rejected', updated_at = now()
  where id = p_application_id;

  insert into public.application_events (application_id, from_stage, to_stage, actor_id, note)
  values (p_application_id, v_from_stage, 'rejected', auth.uid(), p_recruiter_comment);

  insert into public.feedback (
    application_id, rejection_reason, recruiter_comment,
    ai_message, strengths, areas_to_improve, missing_skills
  )
  values (
    p_application_id, p_rejection_reason, p_recruiter_comment,
    p_ai_message, p_strengths, p_areas_to_improve, p_missing_skills
  )
  returning id into v_feedback_id;

  return v_feedback_id;
end;
$$;

grant execute on function public.reject_application_with_feedback to authenticated;
