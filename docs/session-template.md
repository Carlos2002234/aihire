# Template para nueva sesión de Claude Code

## Prompt de inicio estándar (copiar, rellenar, pegar):

```
Lee primero:
- CLAUDE.md (contexto del proyecto)
- docs/mvp-roadmap.md (solo la sección del módulo de hoy)
- docs/database.md (solo las tablas del módulo de hoy)

Hoy trabajamos en: Módulo [N] — [NOMBRE]
Archivos a crear: [copiar la lista del roadmap]
Archivos a modificar: [LISTA ESPECÍFICA]
No tocar: [módulos ya terminados]

Empieza explicando tu plan antes de codear.
Al terminar: recuérdame hacer commit y actualizar CLAUDE.md.
```

## Ejemplo real (Módulo 7):

```
Lee primero:
- CLAUDE.md
- docs/mvp-roadmap.md (Módulo 7)
- docs/database.md (tablas applications y application_events)
- docs/ux-flows.md (sección "Momentos clave de diseño")

Hoy trabajamos en: Módulo 7 — Pipeline Kanban + Timeline
Archivos a crear: src/app/recruiter/pipeline/[jobId]/*, src/app/candidate/applications/*, src/components/shared/Timeline.tsx
No tocar: auth, passport, jobs (módulos 2-5 ya terminados)

Empieza explicando tu plan antes de codear.
```

## Si la sesión se rompe (prompt too long):

1. `/compact` → si falla:
2. `Esc + Esc` para retroceder mensajes, luego `/compact` → si falla:
3. `/clear` → nueva sesión con este mismo template

## Fin de sesión (OBLIGATORIO):

```bash
git add .
git commit -m "feat: módulo [N] - [descripción breve]"
```

Luego actualizar CLAUDE.md → sección "Estado actual del proyecto".
