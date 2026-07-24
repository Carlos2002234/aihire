---
description: Cierra el módulo actual — verifica build, actualiza roadmap y CLAUDE.md, y commitea
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(git log:*), Bash(git remote:*), Bash(git push:*), Bash(npm run build:*), Bash(npm run lint:*), Read, Edit, Grep
---

## Context

- Estado actual (CLAUDE.md): !`grep -A 5 "## Estado actual del proyecto" CLAUDE.md`
- Roadmap (checklist): !`grep -n "^## Módulo\|- \[ \]\|- \[x\]" docs/mvp-roadmap.md`
- Git status: !`git status --short`
- Git diff (resumen): !`git diff --stat HEAD`
- Remote configurado: !`git remote -v`

## Tu tarea

Cerrá el módulo en el que se trabajó en esta sesión, siguiendo el flujo de `docs/cheatsheet.md` y `docs/session-template.md`.

1. **Verificar que compila.** Corré `npm run build`. Si falla, PARÁ acá y reportá el error — no sigas con los pasos siguientes hasta que se resuelva.
2. **Identificar el módulo recién terminado.** Es el que figura como "Próximo módulo" en la sección "Estado actual del proyecto" de `CLAUDE.md`, salvo que la conversación de esta sesión indique otro.
3. **Actualizar `docs/mvp-roadmap.md`.** Marcá como hechos (`- [x]`) los checkboxes del módulo recién terminado si no lo están ya. No toques checkboxes de otros módulos.
4. **Actualizar `CLAUDE.md`** → sección "Estado actual del proyecto":
   - `Último módulo completado`: el módulo recién terminado, con una descripción breve de una línea.
   - `Próximo módulo`: el siguiente en orden según `docs/mvp-roadmap.md`.
   - `Fase`: actualizar si corresponde (ej. "Pre-desarrollo" → "En desarrollo" en el primer módulo).
5. **Commit.** Revisá `git status` primero — nunca `git add -A` a ciegas, confirmá que no se cuela nada fuera del alcance del módulo. Agregá los archivos relevantes y commiteá con mensaje `feat: módulo N - descripción breve` (estilo `docs/session-template.md`).
6. **Push.** Si hay un remote configurado (`git remote -v` no vacío), hacé `git push`. Si no hay remote, avisale al usuario en vez de fallar en silencio o inventar uno.
7. Reportá en 3-4 líneas: qué módulo se cerró, qué se commiteó, y si se hizo push o no.

No agregues features nuevas ni toques módulos que no sean el de esta sesión.
