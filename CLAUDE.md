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
- Último módulo completado: Módulo 8 — ATS AI — Evaluación + Candidate Summary (migración `0007_ai.sql`: tabla `ai_evaluations` con RLS de solo lectura para recruiters del job; `src/lib/ai/evaluate.ts` con `evaluateApplication` (Anthropic `claude-opus-4-8`, structured outputs) + `inferYearsFromHistory` (cálculo determinístico de años por skill que además hace upsert de `candidate_skills` inferidas); disparo async post-apply vía `after()` en `applyToJobAction`; card del Kanban muestra score + summary con estado "Evaluando…" mientras no hay `ai_evaluations`)
- Próximo módulo: Módulo 9 — Rechazo con Feedback IA + Career Roadmap

## Reglas importantes

- NUNCA leer archivos enteros si solo se necesita una sección.
- NUNCA leer carpetas completas (`/src`) de una vez.
- SIEMPRE hacer commit después de cada módulo.
- NO agregar features fuera del MVP sin preguntar (Community y Interview Prep son v2).
- Un módulo por sesión. Ver `docs/mvp-roadmap.md`.
- La IA recomienda, el recruiter decide. Nunca rechazo automático.
- Al terminar un módulo: actualizar la sección "Estado actual" de este archivo.
