-- Módulo 10: Notificaciones + Emails

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index on public.notifications (user_id, read, created_at desc);

alter table public.notifications enable row level security;

-- Las notificaciones las genera el servidor (triggers SECURITY DEFINER en
-- los cambios de etapa, o el service role tras generar el roadmap). El
-- dueño solo lee las suyas y puede marcarlas como leídas.
grant select, update on public.notifications to authenticated;

create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter publication supabase_realtime add table public.notifications;

-- Notifica a los recruiters de la compañía cuando llega una aplicación nueva.
create function public.notify_new_application()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_job_title text;
  v_company_id uuid;
  v_candidate_name text;
begin
  select j.title, j.company_id into v_job_title, v_company_id
  from public.jobs j
  where j.id = new.job_id;

  select p.full_name into v_candidate_name
  from public.profiles p
  where p.id = new.candidate_id;

  insert into public.notifications (user_id, type, title, body, link)
  select
    rp.id,
    'application_submitted',
    'Nueva aplicación',
    coalesce(v_candidate_name, 'Un candidato') || ' aplicó a ' || v_job_title,
    '/recruiter/pipeline/' || new.job_id
  from public.recruiter_profiles rp
  where rp.company_id = v_company_id;

  return new;
end;
$$;

create trigger on_application_created_notify
  after insert on public.applications
  for each row execute procedure public.notify_new_application();

-- Reemplaza move_application_stage (0006) para además notificar al
-- candidato del cambio de etapa (entrevista, oferta, o genérico).
create or replace function public.move_application_stage(
  p_application_id uuid,
  p_to_stage application_stage,
  p_note text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_from_stage application_stage;
  v_job_id uuid;
  v_candidate_id uuid;
  v_job_title text;
  v_is_authorized boolean;
  v_notification_type notification_type;
  v_notification_title text;
begin
  select a.stage, a.job_id, a.candidate_id into v_from_stage, v_job_id, v_candidate_id
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
    raise exception 'not authorized to move this application';
  end if;

  update public.applications
  set stage = p_to_stage, updated_at = now()
  where id = p_application_id;

  insert into public.application_events (application_id, from_stage, to_stage, actor_id, note)
  values (p_application_id, v_from_stage, p_to_stage, auth.uid(), p_note);

  select j.title into v_job_title from public.jobs j where j.id = v_job_id;

  if p_to_stage in ('interview', 'technical_interview', 'final_interview') then
    v_notification_type := 'interview_invitation';
    v_notification_title := 'Te invitaron a una entrevista';
  elsif p_to_stage = 'offer' then
    v_notification_type := 'offer';
    v_notification_title := '¡Tenés una oferta!';
  else
    v_notification_type := 'status_changed';
    v_notification_title := 'Tu aplicación cambió de estado';
  end if;

  insert into public.notifications (user_id, type, title, body, link)
  values (
    v_candidate_id,
    v_notification_type,
    v_notification_title,
    'Tu aplicación a ' || v_job_title || ' cambió de etapa.',
    '/candidate/applications'
  );
end;
$$;

-- Reemplaza reject_application_with_feedback (0008) para además notificar
-- al candidato del rechazo.
create or replace function public.reject_application_with_feedback(
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
  v_candidate_id uuid;
  v_job_title text;
  v_is_authorized boolean;
  v_feedback_id uuid;
begin
  select a.stage, a.job_id, a.candidate_id into v_from_stage, v_job_id, v_candidate_id
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

  select j.title into v_job_title from public.jobs j where j.id = v_job_id;

  insert into public.notifications (user_id, type, title, body, link)
  values (
    v_candidate_id,
    'rejection',
    'Tu aplicación no continúa',
    'Tu aplicación a ' || v_job_title || ' fue rechazada. Revisá tu feedback.',
    '/candidate/applications'
  );

  return v_feedback_id;
end;
$$;
