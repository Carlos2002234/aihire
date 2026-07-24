# Guía paso a paso — De cero a MVP con Claude Code

Léela una vez completa antes de empezar. Después solo necesitarás el cheatsheet.

---

## DÍA 0 — Preparación (30 min, sin Claude Code)

1. **Cuentas** (todas tienen tier gratis para empezar):
   - supabase.com → crear proyecto → guardar `Project URL` y `anon key`
   - vercel.com → conectar con tu GitHub
   - console.anthropic.com → crear API key
   - resend.com → API key (puedes dejarlo para el Módulo 10)

2. **Crear el proyecto:**
   ```bash
   npx create-next-app@latest hireflow --typescript --tailwind --app --src-dir
   cd hireflow
   ```

3. **Copiar los docs:** mueve `CLAUDE.md`, `GUIA.md` y la carpeta `docs/` (estos archivos) a la raíz de `hireflow/`.

4. **Variables de entorno** — crear `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ANTHROPIC_API_KEY=...
   RESEND_API_KEY=...
   ```
   Verifica que `.gitignore` incluya `.env*`.

5. **Primer commit:**
   ```bash
   git add . && git commit -m "docs: arquitectura completa y setup inicial"
   ```
   Crea el repo en GitHub y haz push. Desde ahora, GitHub es tu red de seguridad.

---

## DÍA 1 en adelante — El ciclo (repetir por módulo)

Cada módulo = una sesión de Claude Code = idealmente un día o bloque de trabajo.

### 1. Abrir sesión
```bash
cd hireflow
claude
```

### 2. Pegar el prompt de inicio
Copia el template de `docs/session-template.md`, rellena el módulo del día
(la lista de archivos ya está en `docs/mvp-roadmap.md`).

### 3. Revisar el plan ANTES de que codee
Claude Code explicará su plan. Aquí es donde TÚ diriges:
- ¿Está tocando solo los archivos del módulo? Si no, córtalo.
- ¿Se está inventando features fuera del roadmap? Recuérdale CLAUDE.md.

### 4. Durante la sesión
- Prueba lo que construye en `localhost:3000` a medida que avanza. No esperes al final.
- Si algo no funciona, pega el error exacto — no lo describas con palabras.
- `/context` de vez en cuando. Si pasa de ~80%, corre `/compact`.

### 5. Cerrar la sesión (NUNCA saltarse esto)
```bash
git add . && git commit -m "feat: módulo N - descripción"
git push
```
Luego pídele a Claude Code (o hazlo tú): actualizar la sección
"Estado actual del proyecto" de CLAUDE.md, y commitear ese cambio también.

---

## Hitos de verificación (cómo saber que vas bien)

| Después del módulo | Debes poder... |
|---|---|
| 2 | Registrarte como candidato y como recruiter, y ver rutas protegidas |
| 3 | Llenar tu passport y ver la barra de completitud subir |
| 5 | Ver un job publicado en /jobs sin estar logueado |
| 6 | Aplicar a un job en menos de 1 minuto desde el móvil |
| 7 | Mover una card en el Kanban y ver el timeline del candidato actualizarse EN VIVO (dos navegadores abiertos) |
| 8 | Ver el AI summary de un candidato en su card del Kanban |
| 9 | Rechazar a un candidato y que reciba feedback + roadmap |
| 11 | Deploy en Vercel funcionando end-to-end |

**El hito del Módulo 7 es LA demo del producto.** Cuando funcione, ya tienes algo que enseñar.

## Consejos de supervivencia

1. **Tú eres el PM, Claude Code es el equipo.** Tu trabajo es mantener el alcance. El 90% de los proyectos con IA mueren por scope creep, no por bugs.
2. **Prueba con datos reales.** Crea 2 cuentas (candidato y recruiter) desde el Módulo 2 y úsalas siempre. Un seed script en el Módulo 6 ayuda mucho.
3. **Si un módulo se siente demasiado grande a mitad de sesión**, pártelo: commitea lo que funciona, agrega "Módulo N.5" al roadmap, nueva sesión.
4. **Migraciones solo hacia adelante.** Nunca edites una migración ya aplicada; crea una nueva.
5. **No pidas refactors globales.** Si el código huele, refactoriza solo dentro del módulo activo.
6. **Deploy temprano.** Conecta Vercel desde el Módulo 2, no al final. Los errores de producción se descubren mejor de a poco.
7. **Cuando dudes, relee tu propio CLAUDE.md.** Si una regla ya no aplica, cámbiala ahí — es el contrato entre tú y Claude Code.

## Estimación realista

Con dedicación parcial: 11 módulos ≈ 3–6 semanas hasta MVP deployado.
El Módulo 7 y el 8 son los más largos — está bien que tomen 2 sesiones cada uno.
