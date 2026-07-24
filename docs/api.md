# API / Server Actions — HireFlow

Todas las mutaciones son Server Actions en `/src/actions/`. Auth vía sesión de Supabase (middleware). Validación de inputs con Zod en cada action.

## /src/actions/auth.ts
| Action | Input | Output | Auth |
|---|---|---|---|
| signUp | email, password, role | { userId } o error | pública |
| signInWithOAuth | provider ('google'/'github'), role? | redirect | pública |
| signOut | — | redirect | sesión |

Notas: el trigger de DB crea `profiles`. Email verification la maneja Supabase.

## /src/actions/candidate.ts
| Action | Input | Output |
|---|---|---|
| updatePassport | campos parciales de candidate_profiles | perfil actualizado |
| addExperience / updateExperience / deleteExperience | work_experience | ok |
| addEducation, addCertification, addProject, addLanguage | ídem | ok |
| upsertSkill | skill_id, years | ok |
| uploadResume | file (form-data) | resume row |

`completion_pct` se recalcula con función de DB tras cada cambio.

## /src/actions/jobs.ts (recruiter)
| Action | Input | Output |
|---|---|---|
| createJob | JobInput + requiredSkills[] + questions[] (máx 5, validar) | job |
| updateJob / publishJob / closeJob | jobId, campos | job |

## /src/actions/applications.ts
| Action | Input | Output | Quién |
|---|---|---|---|
| easyApply | jobId, resumeId, answers? | application | candidato |
| moveStage | applicationId, toStage, note? | application | recruiter del job |
| rejectWithFeedback | applicationId, reason, recruiterComment? | feedback + roadmap | recruiter |

**easyApply** hace en una transacción: insert application + insert application_event ('applied') + notificación. Luego dispara `evaluateApplication` async (no bloquea la respuesta).

**moveStage** hace: update stage + insert event + notificación in-app + email. Nunca permite mover a 'rejected' directamente (eso pasa por rejectWithFeedback).

## /src/lib/ai/ (server-only, Anthropic API)
| Función | Input | Output |
|---|---|---|
| evaluateApplication | application + passport + job requirements | ai_evaluation (score, summary, strengths, gaps, skill_analysis, reasoning) |
| generateFeedback | application + evaluation + rejection_reason + comment | mensaje personalizado + strengths + areas + missing_skills |
| generateRoadmap | feedback + passport | roadmap con steps ordenados |
| generateResume | passport + targetJob? | markdown del CV → PDF |
| careerCoachReply | historial + mensaje | respuesta streaming |
| inferYearsFromHistory | work_experiences | skills con años inferidos (inferred=true) |

Reglas de IA:
- Prompts versionados como constantes en `/src/lib/ai/prompts.ts`.
- Toda evaluación guarda `reasoning` — la IA siempre explica.
- La IA nunca cambia `stage`. Solo recomienda.
- Salidas estructuradas: pedir JSON estricto y validar con Zod; reintentar 1 vez si falla el parse.

## /src/actions/notifications.ts
markAsRead(id), markAllAsRead(). Lectura vía RSC + Realtime subscription en el cliente.

## /src/actions/search.ts
searchJobs(filters: { q, country, city, salaryMin, workMode[], experienceLevel, industry }) — paginado, solo jobs open. searchCompanies(q), searchCandidates (solo recruiters, respeta RLS).

## Webhooks (/src/app/api/webhooks/)
- `resend` — bounces de email (v2, opcional).
