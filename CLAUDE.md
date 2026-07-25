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
- Último módulo completado: Módulo 12 (parcial, v2) — AI Resume Builder (rehecho), Career Coach, y CV Builder ajustado a posición. Resume Builder ahora es de dos pasos: `generateTailoredResumeAction` (candidato pega título/descripción de cualquier posición, texto libre, de HireFlow o externa) genera el contenido vía `src/lib/ai/resume.tsx` y lo devuelve al cliente sin persistir nada; el candidato lo revisa/edita en `/candidate/resume-builder` (headline, resumen, bullets, educación, skills, certificaciones); recién al confirmar, `saveGeneratedResumeAction` renderiza el PDF (`@react-pdf/renderer`) y lo sube. Reemplazó el viejo flujo de un clic que solo targeteaba jobs guardados de HireFlow y no tenía paso de revisión. Migración `0011_coach.sql` sigue igual (Career Coach sin cambios). Migración `0012_resume_builder.sql`: `resumes.target_position_title`/`target_position_description` (sin FK a jobs, la posición puede ser externa). De paso se agregó `getResumeDownloadUrlAction` (signed URL) — antes no existía forma de descargar un CV ya subido/generado. Interview Prep (última pieza del Módulo 12) sigue sin spec. Esta sesión también rediseñó la UI de `/jobs`, `/jobs/[id]`, `/candidate/applications`, `/candidate/roadmap`, `/candidate/passport`, y `/login`+`/register` al estilo de referencias visuales que pasó el usuario (sidebar persistente vía `AppShell` en páginas públicas cuando hay sesión).
- Próximo módulo: a definir con el usuario — Interview Prep (sin spec, resto del Módulo 12), o volver al MVP. Pendiente aparte: producción le faltan las migraciones `0007` a `0012` (solo tiene hasta `0006` aplicada) — hilo abierto de antes, retomar cuando el usuario quiera resolverlo.

## Reglas importantes

- NUNCA leer archivos enteros si solo se necesita una sección.
- NUNCA leer carpetas completas (`/src`) de una vez.
- SIEMPRE hacer commit después de cada módulo.
- NO agregar features fuera del MVP sin preguntar (Community y Interview Prep son v2).
- Un módulo por sesión. Ver `docs/mvp-roadmap.md`.
- La IA recomienda, el recruiter decide. Nunca rechazo automático.
- Al terminar un módulo: actualizar la sección "Estado actual" de este archivo.
