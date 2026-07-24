-- Datos de demo para desarrollo local. Se corre automáticamente en
-- `supabase db reset` (ver supabase/config.toml [db.seed]). Nunca se aplica
-- en producción — es solo para tener la app poblada al probar el diseño.

do $$
declare
  v_recruiter_id uuid := 'cf55da6d-e24b-449a-b813-b75359516799';
  v_candidate_id uuid := 'ff4d1036-e212-4574-8009-e6b9250cee69';
  -- Compañía real del recruiter de prueba (ya existe desde módulos
  -- anteriores) — algunos jobs demo se cuelgan de ella para que el
  -- dashboard del recruiter también se vea poblado.
  v_company_pipeline uuid := 'e0a90308-078d-49ab-b569-8b4f23f86ff5';
  v_company_nimbus uuid := gen_random_uuid();
  v_company_vantage uuid := gen_random_uuid();
  v_company_fintra uuid := gen_random_uuid();
  v_company_northwind uuid := gen_random_uuid();
  v_company_solstice uuid := gen_random_uuid();
  v_job_frontend uuid := gen_random_uuid();
  v_job_backend uuid := gen_random_uuid();
  v_job_data uuid := gen_random_uuid();
  v_job_platform uuid := gen_random_uuid();
  v_job_fullstack uuid := gen_random_uuid();
  v_app_offer uuid;
  v_app_interview uuid;
  v_app_rejected uuid;
  v_feedback_id uuid;
  v_roadmap_id uuid;
  v_skill_react uuid := '76a09350-bb00-4a99-a2e2-e38bf09d7a8a';
  v_skill_ts uuid := 'fbe955bc-1c45-48d9-a5ab-df76590b546d';
  v_skill_node uuid := '98977347-1713-4eaf-bf9f-555595cb54ad';
  v_skill_postgres uuid := 'c152b7ae-16e1-4e21-89fe-7c4f8a62375f';
  v_skill_aws uuid := '158753d6-17f7-4486-9daf-5e7432844209';
  v_skill_docker uuid := '3d15762f-3c3e-4118-aff2-564a62d84b8e';
begin
  -- Solo sembrar si el recruiter/candidato de prueba ya existen (creados por
  -- los tests end-to-end de módulos anteriores).
  if not exists (select 1 from public.profiles where id = v_recruiter_id)
     or not exists (select 1 from public.profiles where id = v_candidate_id) then
    raise notice 'Seed omitido: usuarios de prueba no encontrados.';
    return;
  end if;

  insert into public.companies (id, name, description, industry, size, created_by)
  values
    (v_company_nimbus, 'Nimbus Cloud', 'Infraestructura cloud-native para equipos de plataforma.', 'Cloud/Infra', '201-500', v_recruiter_id),
    (v_company_vantage, 'Vantage Analytics', 'Analytics en tiempo real para e-commerce.', 'Data/Analytics', '51-200', v_recruiter_id),
    (v_company_fintra, 'Fintra', 'Infraestructura de pagos para fintechs de LATAM.', 'Fintech', '51-200', v_recruiter_id),
    (v_company_northwind, 'Northwind Labs', 'Investigación aplicada en IA para salud.', 'Health Tech', '11-50', v_recruiter_id),
    (v_company_solstice, 'Solstice Health', 'Plataforma de gestión clínica.', 'Health Tech', '201-500', v_recruiter_id)
  on conflict (id) do nothing;

  insert into public.jobs (
    id, company_id, recruiter_id, title, description, responsibilities,
    location_country, location_city, work_mode, employment_type, experience_level,
    salary_min, salary_max, salary_currency, status, published_at
  )
  values
    (v_job_frontend, v_company_nimbus, v_recruiter_id, 'Frontend Engineer',
     'Buscamos une Frontend Engineer para liderar la evolución de nuestro dashboard de infraestructura.',
     'Construir y mantener componentes React/TypeScript, colaborar con diseño, mejorar performance.',
     'Argentina', 'Buenos Aires', 'remote', 'full_time', 'mid', 90000, 130000, 'USD', 'open', now()),
    (v_job_backend, v_company_pipeline, v_recruiter_id, 'Backend Engineer (Node.js)',
     'Diseñá y escalá los servicios que procesan millones de eventos de e-commerce por día.',
     'Diseño de APIs, optimización de queries, ownership de servicios en producción.',
     'México', 'Ciudad de México', 'hybrid', 'full_time', 'senior', 110000, 150000, 'USD', 'open', now()),
    (v_job_data, v_company_pipeline, v_recruiter_id, 'Data Engineer',
     'Construí los pipelines de datos que soportan la infraestructura de pagos de Fintra.',
     'ETL sobre Postgres/Airflow, modelado de datos, calidad de datos.',
     'Colombia', 'Bogotá', 'remote', 'full_time', 'mid', 85000, 120000, 'USD', 'open', now()),
    (v_job_platform, v_company_northwind, v_recruiter_id, 'Platform Engineer',
     'Escalá la infraestructura cloud que corre nuestros modelos de IA para salud.',
     'Kubernetes, CI/CD, observabilidad, cost optimization.',
     'Chile', 'Santiago', 'onsite', 'full_time', 'senior', 120000, 160000, 'USD', 'open', now()),
    (v_job_fullstack, v_company_solstice, v_recruiter_id, 'Full Stack Engineer',
     'Sumate al equipo que construye la próxima generación de nuestra plataforma clínica.',
     'Feature end-to-end: DB, API, UI. Trabajo directo con producto.',
     'España', 'Madrid', 'hybrid', 'full_time', 'mid', 45000, 65000, 'EUR', 'open', now())
  on conflict (id) do nothing;

  -- Career Passport del candidato de prueba
  insert into public.work_experiences (candidate_id, title, company, description, technologies, start_date, end_date)
  values
    (v_candidate_id, 'Senior Frontend Engineer', 'Bluewave Labs',
     'Lideré la migración del dashboard principal a React + TypeScript, mejorando el tiempo de carga en 40%.',
     array['React','TypeScript','Node.js'], '2023-02-01', null),
    (v_candidate_id, 'Frontend Developer', 'Cortex Software',
     'Desarrollo de features end-to-end en un producto SaaS B2B, colaborando con diseño y backend.',
     array['React','Node.js'], '2020-06-01', '2023-01-15')
  on conflict do nothing;

  insert into public.candidate_skills (candidate_id, skill_id, years_experience, inferred)
  values
    (v_candidate_id, v_skill_react, 4, false),
    (v_candidate_id, v_skill_ts, 3, false),
    (v_candidate_id, v_skill_node, 3, false),
    (v_candidate_id, v_skill_postgres, 2, false),
    (v_candidate_id, v_skill_aws, 1.5, false),
    (v_candidate_id, v_skill_docker, 2, false)
  on conflict (candidate_id, skill_id) do nothing;

  insert into public.educations (candidate_id, institution, degree, field, start_date, end_date)
  values (v_candidate_id, 'Universidad de Buenos Aires', 'Licenciatura', 'Ciencias de la Computación', '2015-03-01', '2019-12-01')
  on conflict do nothing;

  -- Aplicaciones adicionales en distintas etapas, para poblar el funnel y
  -- el tracker de aplicaciones del dashboard.
  insert into public.applications (id, job_id, candidate_id, resume_id, stage)
  select gen_random_uuid(), v_job_frontend, v_candidate_id, r.id, 'offer'
  from public.resumes r where r.candidate_id = v_candidate_id limit 1
  on conflict (job_id, candidate_id) do nothing
  returning id into v_app_offer;

  insert into public.applications (id, job_id, candidate_id, resume_id, stage)
  select gen_random_uuid(), v_job_backend, v_candidate_id, r.id, 'technical_interview'
  from public.resumes r where r.candidate_id = v_candidate_id limit 1
  on conflict (job_id, candidate_id) do nothing
  returning id into v_app_interview;

  insert into public.applications (id, job_id, candidate_id, resume_id, stage)
  select gen_random_uuid(), v_job_data, v_candidate_id, r.id, 'rejected'
  from public.resumes r where r.candidate_id = v_candidate_id limit 1
  on conflict (job_id, candidate_id) do nothing
  returning id into v_app_rejected;

  if v_app_rejected is not null then
    insert into public.feedback (application_id, rejection_reason, ai_message, strengths, areas_to_improve, missing_skills)
    values (
      v_app_rejected, 'missing_technical_skills',
      'Tu perfil de frontend es sólido, pero para este rol de Data Engineer buscamos más experiencia con pipelines de datos y orquestación. Seguí construyendo sobre tu base de backend — vas por buen camino.',
      array['Buena comunicación técnica', 'Sólida base en Node.js'],
      array['Profundizar en modelado de datos', 'Experiencia con orquestadores tipo Airflow'],
      array['Airflow', 'dbt']
    )
    on conflict (application_id) do nothing
    returning id into v_feedback_id;

    if v_feedback_id is not null then
      insert into public.roadmaps (candidate_id, feedback_id, title)
      values (v_candidate_id, v_feedback_id, 'Roadmap: de Frontend a Data Engineering')
      returning id into v_roadmap_id;

      insert into public.roadmap_steps (roadmap_id, position, title, description, type, completed)
      values
        (v_roadmap_id, 0, 'Curso de fundamentos de Airflow', 'Entendé DAGs, tasks y scheduling — la base de cualquier pipeline de datos.', 'learn', true),
        (v_roadmap_id, 1, 'Proyecto: pipeline de datos end-to-end', 'Armá un pipeline que extraiga, transforme y cargue datos reales usando Airflow + dbt.', 'project', false),
        (v_roadmap_id, 2, 'Certificación en dbt fundamentals', 'Certificación corta que valida tu conocimiento de modelado de datos.', 'certification', false),
        (v_roadmap_id, 3, 'Volver a aplicar a roles de Data Engineering', 'Con el proyecto y la certificación, tu perfil va a ser mucho más competitivo.', 'apply', false);
    end if;
  end if;
end $$;
