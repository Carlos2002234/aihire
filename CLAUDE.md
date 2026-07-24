# HireFlow — AI Hiring Platform

> Nombre provisional. Si lo cambias, actualiza solo este archivo.

## Visión

Plataforma de contratación con IA donde ningún candidato es ghosteado: toda aplicación termina en entrevista, oferta o feedback útil que genera un plan de mejora.

## Stack

- Frontend: Next.js 15 (App Router) + TypeScript estricto + Tailwind CSS + shadcn/ui
- Backend/DB: Supabase (PostgreSQL + Auth + Storage + RLS)
- IA: Anthropic API (ATS filtering, resúmenes, feedback, career coach)
- Deploy: Vercel
- Emails: Resend
- Estado servidor: Server Actions + React Server Components (evitar API routes salvo webhooks)

## Convenciones de código

- TypeScript estricto siempre. Nada de `any`.
- Componentes en PascalCase, funciones en camelCase, archivos de componentes `PascalCase.tsx`.
- `/src/components` para UI, `/src/lib` para lógica, `/src/hooks` para hooks, `/src/types` para tipos compartidos.
- Server Components por defecto; `"use client"` solo cuando hay interactividad.
- Toda mutación pasa por Server Actions en `/src/actions/`.
- Toda tabla de Supabase tiene RLS activado. Sin excepciones.
- Tipos de DB generados con `supabase gen types` en `/src/types/database.ts`.
- Dark mode first. Tokens de diseño centralizados en `src/app/globals.css` (Tailwind v4, config CSS-first vía `@theme` — no hay `tailwind.config.ts`), nunca colores hardcodeados.
- Llamadas a Anthropic API solo desde el servidor (`/src/lib/ai/`), nunca desde el cliente.

## Estado actual del proyecto

- Fase: En desarrollo
- Último módulo completado: Módulo 5 — Job Creation + Job Board público (migración `0004_jobs.sql`: jobs/job_required_skills/job_questions con lectura pública solo si `status='open'`; flujo recruiter crear→editar (datos, skills, preguntas máx. 5)→publicar/cerrar en `/recruiter/jobs`, job board público con filtros en `/jobs` + `/jobs/[id]`, probado end-to-end)
- Próximo módulo: Módulo 6 — Easy Apply

## Reglas importantes

- NUNCA leer archivos enteros si solo se necesita una sección.
- NUNCA leer carpetas completas (`/src`) de una vez.
- SIEMPRE hacer commit después de cada módulo.
- NO agregar features fuera del MVP sin preguntar (Community y Interview Prep son v2).
- Un módulo por sesión. Ver `docs/mvp-roadmap.md`.
- La IA recomienda, el recruiter decide. Nunca rechazo automático.
- Al terminar un módulo: actualizar la sección "Estado actual" de este archivo.
