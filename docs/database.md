# Base de datos — HireFlow

Postgres (Supabase). Todas las tablas con RLS activado. `auth.users` la gestiona Supabase.

## Enums

```sql
create type user_role as enum ('candidate', 'recruiter');
create type work_mode as enum ('remote', 'hybrid', 'onsite');
create type employment_type as enum ('full_time', 'part_time', 'contract', 'internship');
create type experience_level as enum ('intern', 'junior', 'mid', 'senior', 'staff', 'lead');
create type application_stage as enum (
  'applied', 'under_review', 'recruiter_review', 'interview',
  'technical_interview', 'final_interview', 'offer', 'rejected'
);
create type rejection_reason as enum (
  'insufficient_experience', 'missing_technical_skills', 'salary_expectations',
  'language_level', 'better_qualified_candidate', 'culture_fit', 'other'
);
create type notification_type as enum (
  'application_submitted', 'status_changed', 'interview_invitation',
  'offer', 'rejection', 'feedback_available', 'new_matching_job'
);
```

## Tablas

### profiles
Extiende `auth.users`. Se crea con trigger `on auth.users insert`.

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | = auth.users.id |
| role | user_role | not null |
| full_name | text | |
| avatar_url | text | |
| headline | text | |
| location_country / location_city | text | |
| created_at | timestamptz | default now() |

### candidate_profiles (Career Passport)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK FK profiles | 1:1 con profiles (role=candidate) |
| bio | text | |
| github_url / linkedin_url / website_url | text | |
| salary_expectation_min / max | int | |
| salary_currency | text | default 'USD' |
| preferred_work_modes | work_mode[] | |
| availability | text | ej. 'immediate', '2_weeks' |
| open_to_work | boolean | default true |
| completion_pct | int | calculado por trigger/función |

### work_experiences
id uuid PK, candidate_id FK, title, company, description, technologies text[], start_date date, end_date date null (null = actual).

### educations
id, candidate_id FK, institution, degree, field, start_date, end_date.

### certifications
id, candidate_id FK, name, issuer, issue_date, expiry_date null, credential_url.

### candidate_skills
id, candidate_id FK, skill_id FK skills, years_experience numeric, **inferred boolean** (true si lo dedujo la IA del historial laboral), unique(candidate_id, skill_id).

### candidate_languages
id, candidate_id FK, language, level (A1–C2/native).

### projects
id, candidate_id FK, name, description, url, technologies text[].

### resumes
id, candidate_id FK, name, storage_path (Supabase Storage bucket `resumes`), is_ai_generated boolean, target_job_id FK jobs null, created_at.

### skills (catálogo global)
id, name unique, category. Seed inicial con ~200 skills tech + soft.

### companies
id, name, logo_url, description, industry, size, website, benefits text[], locations text[], photos text[], social jsonb, created_by FK profiles.

### recruiter_profiles
id PK FK profiles, company_id FK companies, position, verified boolean default false.

### jobs
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| company_id | FK companies | |
| recruiter_id | FK recruiter_profiles | |
| title, description, responsibilities, benefits | text | |
| location_country / location_city | text | |
| work_mode | work_mode | |
| employment_type | employment_type | |
| experience_level | experience_level | |
| salary_min / salary_max / salary_currency | | |
| status | text | 'draft' / 'open' / 'closed' |
| created_at / published_at | timestamptz | |

### job_required_skills
id, job_id FK, skill_id FK, min_years numeric, **required boolean** (true=obligatorio, false=opcional), language_level text null (para idiomas: 'C1').

### job_questions
id, job_id FK, question text, position int. **CHECK: máx 5 por job (validar en Server Action).**

### applications
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| job_id | FK jobs | |
| candidate_id | FK candidate_profiles | |
| resume_id | FK resumes | |
| stage | application_stage | default 'applied' |
| answers | jsonb | respuestas a job_questions |
| created_at / updated_at | timestamptz | |
| unique(job_id, candidate_id) | | no aplicar dos veces |

### application_events (timeline)
id, application_id FK, from_stage null, to_stage application_stage, actor_id FK profiles null, note text null, created_at. **Insert-only: nunca se borra ni edita.**

### ai_evaluations
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| application_id | FK unique | |
| match_score | int 0–100 | |
| summary | text | resumen ejecutivo para el recruiter |
| strengths | text[] | |
| gaps | text[] | |
| skill_analysis | jsonb | por skill: años detectados vs requeridos, evidencia |
| reasoning | text | la IA siempre explica su razonamiento |
| model | text | ej. 'claude-sonnet-4-6' |
| created_at | timestamptz | |

### feedback
id, application_id FK unique, rejection_reason rejection_reason, recruiter_comment text null, ai_message text, strengths text[], areas_to_improve text[], missing_skills text[], created_at.

### roadmaps
id, candidate_id FK, feedback_id FK null, title, created_at.

### roadmap_steps
id, roadmap_id FK, position int, title, description, type ('learn'/'project'/'certification'/'practice'/'apply'), completed boolean default false.

### notifications
id, user_id FK profiles, type notification_type, title, body, link text, read boolean default false, created_at. Índice: (user_id, read, created_at desc).

### saved_jobs
candidate_id FK, job_id FK, created_at. PK compuesta.

### coach_conversations / coach_messages
Conversaciones del AI Career Coach. coach_messages: id, conversation_id FK, role ('user'/'assistant'), content, created_at.

## Índices clave

```sql
create index on applications (job_id, stage);
create index on applications (candidate_id, created_at desc);
create index on application_events (application_id, created_at);
create index on jobs (status, published_at desc);
create index on notifications (user_id, read, created_at desc);
```

## RLS — reglas generales

- **candidate_*, resumes, roadmaps, coach_***: solo el dueño (`auth.uid() = candidate_id`).
- **applications**: candidato ve las suyas; recruiter ve las de sus jobs (`job.recruiter_id` de su compañía).
- **ai_evaluations**: solo recruiters del job. El candidato NO ve su score interno (sí ve el feedback).
- **feedback**: candidato ve el suyo cuando existe; recruiter del job puede crear.
- **jobs status='open'**: lectura pública. Draft/closed solo la compañía.
- **candidate_profiles**: lectura por recruiters solo si el candidato aplicó a un job suyo o tiene open_to_work=true (decidir en Módulo 5).
- **application_events**: candidato y recruiter del job leen; solo recruiter inserta (más el insert automático del apply).
