# MVP Roadmap — HireFlow

Regla: **un módulo por sesión de Claude Code**. Commit al terminar. Actualizar CLAUDE.md.

Los módulos 12–13 NO son parte del MVP. No construirlos sin decisión explícita.

---

## Módulo 1: Setup + Design System
- [x] `create-next-app` con TypeScript + Tailwind + App Router
- [x] Instalar y configurar shadcn/ui
- [x] Tokens de diseño: paleta dark-first, tipografía (Inter o Geist), spacing, radius
- [x] Componentes base: Button, Card, Badge, Input, EmptyState, PageHeader
- [x] Layout raíz + theme provider (dark default)
- Archivos: `src/app/globals.css` (Tailwind v4 CSS-first, no `tailwind.config.ts`), `src/components/ui/*`
- Dependencias: ninguna

## Módulo 2: Auth + Roles
- [x] Proyecto Supabase + migración inicial (enums, profiles, trigger on signup)
- [x] Clients Supabase (server/browser) + middleware de sesión
- [x] Register con selección de rol, Login, OAuth Google/GitHub
- [x] Verificación de email + rutas protegidas por rol
- Archivos: `supabase/migrations/0001_auth.sql`, `src/lib/supabase/*`, `src/app/(auth)/*`, `middleware.ts`
- Dependencias: Módulo 1

## Módulo 3: Career Passport
- [x] Migración: candidate_profiles, work_experiences, educations, certifications, candidate_skills, candidate_languages, projects, resumes, skills (con seed)
- [x] UI del passport por secciones con edición inline
- [x] Upload de CV a Storage
- [x] Barra de completitud (función de DB)
- Archivos: `0002_passport.sql`, `src/app/candidate/passport/*`, `src/actions/candidate.ts`
- Dependencias: Módulo 2

## Módulo 4: Company + Recruiter Profile
- [x] Migración: companies, recruiter_profiles
- [x] Onboarding de recruiter: crear/unirse a compañía
- [x] Página pública de compañía
- Archivos: `0003_companies.sql`, `src/app/recruiter/company/*`, `src/app/(public)/companies/[id]/*`
- Dependencias: Módulo 2

## Módulo 5: Job Creation + Job Board público
- [x] Migración: jobs, job_required_skills, job_questions
- [x] Form de creación (wizard corto): datos, skills con años mínimos, opcionales, máx 5 preguntas
- [x] Draft → publish → close
- [x] `/jobs` público con filtros + `/jobs/[id]`
- Archivos: `0004_jobs.sql`, `src/app/recruiter/jobs/*`, `src/app/(public)/jobs/*`, `src/actions/jobs.ts`
- Dependencias: Módulo 4

## Módulo 6: Easy Apply
- [x] Migración: applications, application_events, saved_jobs
- [x] Modal de apply: 1 clic → elegir resume → responder preguntas (si hay) → enviar
- [x] Guardar jobs. Estado "ya aplicaste".
- [x] Mobile-first: aplicar en <1 minuto
- Archivos: `0005_applications.sql`, `src/actions/applications.ts`, `src/components/candidate/EasyApplyModal.tsx`
- Dependencias: Módulos 3 y 5

## Módulo 7: Pipeline Kanban + Timeline del candidato ⭐ (corazón del producto)
- [x] Kanban del recruiter por job (drag & drop → moveStage)
- [x] Timeline visual en la app del candidato (application_events)
- [x] Supabase Realtime: el timeline se actualiza en vivo
- [x] Dashboard básico del candidato (lista de aplicaciones + estados)
- Archivos: `src/app/recruiter/pipeline/[jobId]/*`, `src/app/candidate/applications/*`, `src/components/shared/Timeline.tsx`
- Dependencias: Módulo 6

## Módulo 8: ATS AI — Evaluación + Candidate Summary
- [x] Migración: ai_evaluations
- [x] `evaluateApplication` (Anthropic): score, resumen ejecutivo, strengths, gaps, skill_analysis, reasoning
- [x] `inferYearsFromHistory`: inferir años por skill del historial laboral
- [x] Card de candidato en el Kanban muestra el summary (entendible en 20 segundos)
- [x] Disparo async post-apply + estado "evaluando..."
- Archivos: `0007_ai.sql`, `src/lib/ai/evaluate.ts`, `src/lib/ai/prompts.ts`
- Dependencias: Módulo 7

## Módulo 9: Rechazo con Feedback IA + Career Roadmap
- [x] Migración: feedback, roadmaps, roadmap_steps
- [x] Flujo de rechazo del recruiter: elegir razón → preview del feedback IA → enviar
- [x] Vista de feedback del candidato (por qué, fortalezas, gaps, comentario)
- [x] Roadmap generado automáticamente, con checkboxes de progreso
- Archivos: `0008_feedback.sql`, `src/lib/ai/feedback.ts`, `src/app/candidate/roadmap/*`
- Dependencias: Módulo 8

## Módulo 10: Notificaciones + Emails
- [x] Migración: notifications
- [x] Campana in-app con Realtime + página de notificaciones
- [x] Emails con Resend: status change, entrevista, oferta, feedback disponible
- Archivos: `0009_notifications.sql`, `src/lib/email/*`, `src/components/shared/NotificationBell.tsx`
- Dependencias: Módulo 7

## Módulo 11: Dashboards + Analytics
- [x] Dashboard candidato completo: métricas, response time, feedback recibido, jobs guardados, completitud
- [x] Dashboard recruiter: funnel, conversion rates, tiempos, razones de rechazo comunes
- [x] Gráficas (recharts) con estética premium
- Archivos: `src/app/candidate/dashboard/*`, `src/app/recruiter/dashboard/*`
- Dependencias: Módulos 9 y 10

---

## v2 (NO construir en MVP)

## Módulo 12: AI Resume Builder + Career Coach + Interview Prep
- [x] AI Resume Builder: CV Builder en dos pasos en `/candidate/resume-builder` — `generateTailoredResumeAction` genera contenido ajustado a una posición (texto libre, de HireFlow o externa) sin persistir nada, el candidato lo revisa/edita en una preview tipo documento, y `saveGeneratedResumeAction` recién ahí renderiza el PDF (`@react-pdf/renderer`) y lo sube. Reemplazó el viejo flujo de un clic
- [x] Career Coach: chat con streaming en `/candidate/coach`, tablas `coach_conversations`/`coach_messages`. Usa Vercel AI SDK (`ai` + `@ai-sdk/anthropic` + `@ai-sdk/react`, `useChat` + `streamText`) en vez del SDK crudo de Anthropic — única excepción en el proyecto, justificada porque el streaming a `useChat` necesita un endpoint HTTP (`/api/coach/route.ts`), algo que un Server Action no puede transportar. UI con markdown renderizado, avatares, prompts sugeridos, botón de detener generación
- [ ] Interview Prep: sin spec todavía — definir modelo de datos y flujo antes de construir
- Archivos (Resume Builder): `src/lib/ai/resume.tsx`, `src/actions/candidate.ts` (`generateTailoredResumeAction`, `saveGeneratedResumeAction`, `getResumeDownloadUrlAction`), `src/app/candidate/resume-builder/*`
- Archivos (Career Coach): `0011_coach.sql`, `src/app/api/coach/route.ts`, `src/app/candidate/coach/page.tsx`, `src/components/candidate/coach-chat.tsx`

## Módulo 13: Community
- [x] Migración `0013_community.sql`: `community_questions`/`community_answers`/`community_answer_votes` (upvotes desnormalizados vía trigger), `community_salary_entries`, `community_interview_experiences`; funciones `mark_answer_helpful` y `increment_question_views` (SECURITY DEFINER); RLS de lectura abierta a cualquier autenticado, insert solo propio
- [x] Preguntas y respuestas: `/candidate/community/questions` (listado + búsqueda + modal "Hacer una pregunta"), detalle con upvote, "marcar como útil" (solo el autor de la pregunta), badge de recruiter verificado (`recruiter_profiles.verified`), publicación anónima opcional
- [x] Salary Transparency: `/candidate/community/salary` — stats reales (promedio/mediana/máximo/mínimo) y distribución (histograma con recharts, skill de dataviz) calculados de los datos filtrados, filtros (país/puesto/experiencia/modalidad/compañía), tabla anónima, formulario en `/candidate/community/salary/share`
- [x] Interview Experiences: `/candidate/community/interviews` (compañías agregadas por dificultad/rondas promedio), página por compañía con "preguntas más mencionadas" (coincidencias textuales reales entre reportes, no NLP) y experiencias recientes, formulario en `/candidate/community/interviews/share`
- Archivos: `0013_community.sql`, `src/actions/community.ts`, `src/app/candidate/community/**`, `src/components/community/*`
- Nota: sin datos semilla falsos — el módulo arranca vacío hasta que usuarios reales publiquen contenido

## Módulo 14: Búsqueda avanzada de candidatos por recruiters + matching proactivo
