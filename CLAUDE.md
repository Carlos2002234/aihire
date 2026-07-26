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
- Último módulo completado: Módulo 13 (v2) — Community completo: Preguntas (Q&A con upvotes, "marcar como útil", badge de recruiter verificado, anónimo opcional), Salary Transparency (stats + histograma real con recharts + filtros + tabla anónima), Interview Experiences (compañías agregadas por dificultad/rondas + "preguntas más mencionadas" por coincidencia textual real, no NLP). Migración `0013_community.sql` (RLS lectura abierta a cualquier autenticado, insert solo propio; `mark_answer_helpful`/`increment_question_views` como funciones SECURITY DEFINER; upvotes desnormalizados vía trigger). Nav item nuevo en `/candidate/community`. Sin datos semilla falsos — arranca vacío hasta que usuarios reales publiquen. También se cerró Módulo 12 en esta sesión: AI Resume Builder rehecho como CV Builder de dos pasos (`/candidate/resume-builder`: ajustar a posición en texto libre → preview editable tipo documento → exportar PDF, migración `0012_resume_builder.sql`) y Career Coach rediseñado como chat real (markdown, avatares, prompts sugeridos, stop de streaming). Interview Prep (última pieza real de Módulo 12) sigue sin spec.
- Próximo módulo: a definir con el usuario — Interview Prep (sin spec), Módulo 14 (búsqueda avanzada de candidatos + matching proactivo), o volver al MVP. Pendiente aparte: producción le faltan las migraciones `0007` a `0013` (solo tiene hasta `0006` aplicada) — hilo abierto de antes, retomar cuando el usuario quiera resolverlo.

## Reglas importantes

- NUNCA leer archivos enteros si solo se necesita una sección.
- NUNCA leer carpetas completas (`/src`) de una vez.
- SIEMPRE hacer commit después de cada módulo.
- NO agregar features fuera del MVP sin preguntar (Community y Interview Prep son v2).
- Un módulo por sesión. Ver `docs/mvp-roadmap.md`.
- La IA recomienda, el recruiter decide. Nunca rechazo automático.
- Al terminar un módulo: actualizar la sección "Estado actual" de este archivo.
