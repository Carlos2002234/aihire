# UX Flows — HireFlow

Referencias visuales: Linear, Ashby, Notion, Vercel. Dark mode first, minimal, tipografía impecable.

## Journey — Candidato

```
Landing → Register (rol: candidato) → Verificar email
→ Onboarding passport (3 pasos: básicos → experiencia → skills/preferencias)
→ /jobs (explorar con filtros)
→ Job detail → Easy Apply (modal, <1 min)
→ Dashboard: ve la aplicación en "Applied"
→ [recruiter mueve card] → notificación + timeline se actualiza en vivo
→ Caso A: Interview → ... → Offer 🎉
→ Caso B: Rejected → Feedback (por qué, fortalezas, gaps) → Roadmap personalizado
→ Completa pasos del roadmap → vuelve a aplicar
```

Pantallas candidato: dashboard, passport (edición por secciones), applications (lista + detalle con timeline), feedback view, roadmap, saved jobs, notificaciones, settings.

## Journey — Recruiter

```
Landing → Register (rol: recruiter) → Crear/unirse a compañía
→ Crear job (wizard: básicos → skills requeridos con años → preguntas opcionales)
→ Publicar → llegan aplicaciones
→ Kanban: cada card = candidato con AI summary (score, años, top skills, gaps)
→ Entiende al candidato en 20 segundos → arrastra card
→ Rechazo: elegir razón → preview del feedback IA → editar si quiere → enviar
→ Analytics: funnel, tiempos, conversiones
```

Pantallas recruiter: dashboard, jobs (lista + crear/editar), pipeline kanban por job, candidate detail (summary IA + passport + resume), company profile, analytics, notificaciones.

## Momentos clave de diseño (donde se gana o pierde el producto)

1. **Easy Apply modal** — debe sentirse instantáneo. Un clic, resume preseleccionado, confetti sutil al enviar.
2. **Timeline del candidato** — vertical, con estados claros, animación al cambiar de etapa en vivo. Es la promesa anti-ghosting hecha visual.
3. **Card de candidato en Kanban** — densa pero legible: nombre, score, años, 3 skills top, 1 gap. Nada más.
4. **Pantalla de rechazo** — jamás debe sentirse como un portazo. Tono constructivo, roadmap inmediatamente visible como "siguiente paso".

## Estados de UI obligatorios en TODA pantalla

- **Loading**: skeletons (no spinners genéricos)
- **Empty**: ilustración sutil + CTA ("Aún no tienes aplicaciones → Explorar jobs")
- **Error**: mensaje claro + retry
- **Success**: toasts discretos; confetti solo en apply enviado y oferta recibida

## Reglas de UX

- Máx. 2 clics para aplicar desde un job detail.
- El candidato SIEMPRE sabe en qué etapa está — nunca un estado ambiguo.
- Mobile: apply y timeline perfectos en 375px antes de considerar terminado el módulo.
- Nada de formularios largos: edición inline, autosave donde sea posible.
