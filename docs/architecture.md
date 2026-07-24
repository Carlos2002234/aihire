# Arquitectura — HireFlow

## Diagrama general

```
┌─────────────────────────────────────────────────────────┐
│                     VERCEL (Next.js 15)                 │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  App Candidato│  │ App Recruiter│  │   Público    │  │
│  │  /candidate/* │  │ /recruiter/* │  │  /jobs, /    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         └────────────┬────┴─────────────────┘          │
│                      │                                  │
│              Server Actions (/src/actions)              │
│                      │                                  │
│         ┌────────────┼──────────────┐                   │
│         │            │              │                   │
└─────────┼────────────┼──────────────┼───────────────────┘
          │            │              │
   ┌──────▼─────┐ ┌────▼──────┐ ┌────▼─────────┐
   │  SUPABASE  │ │ ANTHROPIC │ │    RESEND    │
   │ Postgres   │ │    API    │ │   (emails)   │
   │ Auth       │ │ /lib/ai/* │ └──────────────┘
   │ Storage    │ └───────────┘
   │ Realtime   │
   └────────────┘
```

## Flujo de datos principal (el corazón del producto)

```
Candidato aplica (Easy Apply)
   → INSERT en applications + application_events
   → Trigger: análisis IA de la aplicación (async)
   → ai_evaluations guarda score + resumen ejecutivo
Recruiter mueve card en Kanban
   → UPDATE applications.stage + INSERT application_events
   → Notificación in-app + email al candidato
   → El timeline del candidato se actualiza (Supabase Realtime)
Recruiter rechaza (selecciona razón)
   → IA genera feedback personalizado + roadmap
   → feedback + roadmaps guardados
   → Candidato recibe: por qué, fortalezas, gaps, plan de mejora
```

## Decisiones técnicas clave

| Decisión | Por qué |
|---|---|
| Supabase en vez de backend propio | Auth social, storage de CVs, RLS y Realtime resueltos. Un dev solo no debe construir eso. |
| Server Actions en vez de REST API | Menos código, type-safety end-to-end, menos superficie de ataque. |
| Análisis IA asíncrono (no bloquea el apply) | Aplicar debe tomar <1 min. El score llega segundos después vía Realtime. |
| ai_evaluations como tabla separada | Auditar la IA, re-evaluar sin tocar la aplicación, transparencia ("explica su razonamiento"). |
| Supabase Realtime para el timeline | El candidato ve el cambio de estado en vivo sin refrescar. Es el momento "wow" del producto. |
| Stage como enum en Postgres | Un solo origen de verdad para el pipeline: Kanban del recruiter y timeline del candidato leen lo mismo. |

## Estructura de carpetas

```
/
├── CLAUDE.md
├── docs/
├── supabase/
│   └── migrations/          # SQL versionado, una migración por módulo
├── src/
│   ├── app/
│   │   ├── (public)/        # landing, /jobs, /jobs/[id], /companies/[id]
│   │   ├── (auth)/          # login, register, verify
│   │   ├── candidate/       # dashboard, passport, applications, roadmap, coach
│   │   ├── recruiter/       # dashboard, jobs, pipeline, analytics, company
│   │   └── api/webhooks/    # solo webhooks externos
│   ├── actions/             # Server Actions por dominio (applications.ts, jobs.ts...)
│   ├── components/
│   │   ├── ui/              # shadcn/ui + primitivos del design system
│   │   ├── candidate/
│   │   ├── recruiter/
│   │   └── shared/          # Timeline, StageBadge, EmptyState...
│   ├── lib/
│   │   ├── supabase/        # clients server/browser, middleware
│   │   ├── ai/              # prompts + llamadas Anthropic (evaluate.ts, feedback.ts, coach.ts)
│   │   └── email/           # templates Resend
│   ├── hooks/
│   └── types/
│       └── database.ts      # generado por supabase gen types
└── tailwind.config.ts
```

## Middleware y protección de rutas

- `middleware.ts` verifica sesión de Supabase.
- `/candidate/*` requiere rol `candidate`; `/recruiter/*` requiere rol `recruiter`.
- El rol vive en `profiles.role` y se cachea en el JWT (custom claim).
