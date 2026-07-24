-- Módulo 7: Pipeline Kanban + Timeline del candidato

-- Mueve una aplicación de etapa y registra el evento atómicamente.
-- SECURITY DEFINER con autorización manual (mismo patrón que el resto del
-- proyecto): solo un recruiter de la compañía dueña del job puede moverla.
create function public.move_application_stage(
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
  v_is_authorized boolean;
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
    raise exception 'not authorized to move this application';
  end if;

  update public.applications
  set stage = p_to_stage, updated_at = now()
  where id = p_application_id;

  insert into public.application_events (application_id, from_stage, to_stage, actor_id, note)
  values (p_application_id, v_from_stage, p_to_stage, auth.uid(), p_note);
end;
$$;

grant execute on function public.move_application_stage to authenticated;

-- El timeline del candidato se actualiza en vivo.
alter publication supabase_realtime add table public.application_events;

-- El Kanban necesita mostrar nombre y CV del candidato. candidate_profiles,
-- profiles y resumes son dueño-only hasta ahora — sin esto, el embed vía
-- applications(candidate_profiles(profiles(...)), resumes(...)) devuelve
-- null en silencio (la fila de applications sí es visible, pero RLS de la
-- tabla referenciada igual filtra la relación anidada).
create policy "candidate_profiles_select_recruiter"
  on public.candidate_profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.applications a
      join public.jobs j on j.id = a.job_id
      join public.recruiter_profiles rp on rp.company_id = j.company_id
      where a.candidate_id = candidate_profiles.id and rp.id = auth.uid()
    )
  );

create policy "profiles_select_recruiter_of_applicant"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.applications a
      join public.jobs j on j.id = a.job_id
      join public.recruiter_profiles rp on rp.company_id = j.company_id
      where a.candidate_id = profiles.id and rp.id = auth.uid()
    )
  );

create policy "resumes_select_recruiter"
  on public.resumes for select
  to authenticated
  using (
    exists (
      select 1 from public.applications a
      join public.jobs j on j.id = a.job_id
      join public.recruiter_profiles rp on rp.company_id = j.company_id
      where a.resume_id = resumes.id and rp.id = auth.uid()
    )
  );
