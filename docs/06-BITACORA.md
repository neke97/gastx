# 06 — Bitácora de Progreso

Registro cronológico de lo que se va haciendo. **Actualizar después de cada avance.**
Formato: fecha, qué se hizo, decisiones y qué sigue.

---

## 2026-07-15 — Arranque del proyecto

**Hecho:**
- Definición de visión, objetivos y alcance con el usuario.
- Decisiones de arquitectura tomadas (ver `01-VISION.md`):
  - Stack: Next.js + Supabase.
  - Móvil: PWA (nativo opcional a futuro).
  - División de gastos: por fases (personas-etiqueta → grupos reales).
  - Moneda: CRC principal, modelo listo para multi-moneda.
- Creada la documentación base en `docs/` (00 a 06) + `README.md` + `CLAUDE.md`.

**Decisiones clave:**
- Postgres (SQL) sobre NoSQL para facilitar reportes, divisiones y multi-tenant.
- Dinero en `numeric(14,2)`; RLS obligatorio en tablas de usuario.
- Editar montos de recurrentes conserva historial (`recurring_amount_history`).

**Siguiente paso:**
- Fase 0: inicializar Next.js + Tailwind, crear proyecto Supabase y conectar variables.

---

## 2026-07-15 — Fase 0: scaffolding del proyecto

**Hecho:**
- Inicializado Next.js con `create-next-app`: **Next.js 16.2.10, React 19.2.4,
  TypeScript, Tailwind CSS v4** (config vía CSS, no `tailwind.config.js`), App Router,
  `src/`, alias `@/*`, ESLint.
- Estructura de carpetas: `src/lib` (con `supabase/client.ts`, `supabase/server.ts`,
  `format.ts`), `src/components`, `src/hooks`, `src/types`, `supabase/migrations`.
- Instalado `@supabase/supabase-js` y `@supabase/ssr`; clientes de navegador y servidor
  listos (patrón cookies async de Next 16).
- `.env.example` con variables de Supabase + `.env.local` (ignorado por git).
- **PWA:** `src/app/manifest.ts` (manifest nativo de Next), `public/sw.js` (service
  worker con cache network-first para navegación), `public/icon.svg`, registro del SW
  solo en producción (`ServiceWorkerRegister`), headers de `sw.js` en `next.config.ts`.
- `layout.tsx` con metadata, idioma `es-CR`, theme color emerald, apple web app.
- `page.tsx` con pantalla de bienvenida provisional.
- `git` ya estaba inicializado por create-next-app; commit con todo el scaffolding.
- **Verificado:** `npm run build` pasa (compila + typecheck OK).

**Decisiones / notas técnicas:**
- Next 16 + React 19 son más nuevos que el conocimiento base del asistente; la doc
  oficial vive en `node_modules/next/dist/docs/` (ver `AGENTS.md`). Consultarla al codear.
- Tailwind v4: la configuración va en `globals.css` con `@import "tailwindcss"` y
  `@theme`, no hay `tailwind.config.js`.
- Íconos PWA: por ahora SVG escalable; generar PNG 192/512 + maskable es tarea de pulido.
- Advertencia menor: Node v20.18 vs 20.19 que pide una dep de ESLint; no bloquea.
  Recomendable actualizar a Node 20.19+ o 22 LTS más adelante.

**Siguiente paso:**
- Usuario: crear proyecto en Supabase y pegar URL + anon key en `.env.local`.
- Fase 1: auth con Supabase + migraciones `profiles`, `categories`, `transactions` + CRUD.

---

<!-- Plantilla para nuevas entradas:

## AAAA-MM-DD — Título corto

**Hecho:**
- ...

**Decisiones:**
- ...

**Siguiente paso:**
- ...

-->
