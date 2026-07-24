-- Módulo 11: Dashboards + Analytics

-- El dashboard de analytics del recruiter necesita agregar razones de
-- rechazo de sus propios jobs. feedback (0008) solo tenía policy de
-- lectura para el candidato — agregamos la del recruiter del job.
create policy "feedback_select_recruiter"
  on public.feedback for select
  to authenticated
  using (
    exists (
      select 1 from public.applications a
      join public.jobs j on j.id = a.job_id
      join public.recruiter_profiles rp on rp.company_id = j.company_id
      where a.id = feedback.application_id and rp.id = auth.uid()
    )
  );
