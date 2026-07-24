# Claude Code — Cheatsheet para proyectos SaaS

## El ciclo de cada módulo

```
1. Abrir Claude Code         →  claude
2. Dar prompt de inicio      →  (copiar de docs/session-template.md)
3. Construir el módulo       →  1 módulo por sesión
4. Hacer commit              →  git add . && git commit -m "feat: módulo X"
5. Actualizar CLAUDE.md      →  cambiar "Estado actual"
6. Cerrar sesión             →  /quit
```

## Comandos Claude Code más usados

| Comando | Cuándo usarlo |
|---|---|
| `/compact` | Contexto al 80%+ — comprime historial |
| `/clear` | `/compact` falla — sesión nueva limpia |
| `/resume` | Retomar sesión anterior después de `/clear` |
| `/context` | Ver cuánto contexto queda disponible |
| `Esc + Esc` | Retroceder mensajes antes de `/compact` |
| `/quit` | Cerrar Claude Code |

## Si algo se rompe

```
Contexto lleno → /compact
/compact falla → Esc+Esc → /compact
Todo falla     → /clear → nueva sesión → pegar prompt de inicio
```

## Archivos clave del proyecto

```
CLAUDE.md                  ← Claude Code lo lee en CADA sesión
docs/architecture.md       ← Arquitectura general
docs/database.md           ← Esquema de base de datos
docs/api.md                ← Server Actions y contratos
docs/mvp-roadmap.md        ← Módulos y estado actual
docs/ux-flows.md           ← Journeys y reglas de UX
docs/session-template.md   ← Template de prompt de inicio
```

## Regla de oro

> Un módulo por sesión. Commit al terminar. Nunca leer carpetas enteras.
