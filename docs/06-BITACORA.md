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

## 2026-07-15 — Fase 1 (parte 5): borrar movimiento

**Hecho:**
- Supabase conectado por el usuario (`.env.local` con credenciales; nueva cuenta con
  otro correo por el límite de 2 proyectos gratis).
- Acción `deleteTransaction` (server action) + botón ✕ por fila en la lista del dashboard.
  Usa `<form action={...}>` directo en el server component (sin cliente).
- **Verificado:** `npm run build` OK.

**Siguiente paso (pieza pequeña):**
- Editar un movimiento (cierra el CRUD de `transactions`). Considerar confirmación al borrar.

---

## 2026-07-15 — Fase 1 (parte 4): resumen del mes

**Hecho:**
- Tarjeta de balance del mes actual en el dashboard: ingresos, gastos y balance,
  calculados desde una consulta del rango del mes (`occurred_on` entre inicio de mes
  y inicio del siguiente). Balance en verde/rojo según signo.
- **Verificado:** `npm run build` OK.

**Siguiente paso (pieza pequeña):**
- Editar / borrar un movimiento (completar el CRUD de `transactions`).

---

## 2026-07-15 — Fase 1 (parte 3): registrar y listar movimientos

**Hecho:**
- Acción `addTransaction` (server action) en `dashboard/actions.ts`: valida e inserta
  en `transactions`; devuelve estado para feedback en vivo (`useActionState`).
- `src/components/TransactionForm.tsx` (cliente): toggle Gasto/Ingreso, monto,
  categoría (filtrada por tipo), descripción y fecha; limpia el form al guardar.
- `dashboard/page.tsx`: carga categorías + últimos 30 movimientos y muestra el
  formulario y la lista (con formato ₡ y fecha es-CR; ingresos en verde, gastos en rojo).
- **Verificado:** `npm run build` OK.

**Nota:** commits de aquí en adelante SIN co-autoría de Claude (pedido del usuario).

**Siguiente paso (pieza pequeña):**
- Totales del mes (ingresos, gastos, balance) en el dashboard. Luego editar/borrar movimiento.

---

## 2026-07-15 — Fase 1 (parte 2): autenticación

**Hecho:**
- `middleware.ts` + `src/lib/supabase/middleware.ts`: refresco de sesión en cada request.
- `/login` (route group `(auth)`): pantalla email + contraseña con server actions
  `signIn` / `signUp`; muestra errores y mensajes vía searchParams.
- `/dashboard` (route group `(app)`): protegido (redirige a `/login` si no hay sesión),
  muestra el email y botón "Salir" (`signOut`).
- Botón "Ingresar" en la home hacia `/login`.
- **Verificado:** `npm run build` OK (rutas `/login`, `/dashboard` dinámicas, middleware activo).

**Notas:**
- `signUp` puede requerir confirmar el correo según la config de Supabase (por defecto ON).
- Falta probar en vivo: necesita `.env.local` con las credenciales y la migración 0001 aplicada.

**Siguiente paso (pieza pequeña):**
- Formulario para registrar un gasto/ingreso (insert en `transactions`) y listarlos.

---

## 2026-07-15 — Fase 1 (parte 1): migración núcleo

**Hecho:**
- `supabase/migrations/0001_core.sql`: tablas `profiles`, `categories`, `transactions`
  con RLS (cada usuario solo ve lo suyo), índices, categorías por defecto y trigger
  `on_auth_user_created` (crea profile + categorías al registrarse un usuario).

**Notas:**
- `transactions` tiene solo columnas núcleo; `recurring_template_id` e
  `installment_plan_id` se agregan por ALTER TABLE en fases 3 y 4.
- Aún **no aplicada** en Supabase; se pega en el SQL Editor cuando el proyecto esté creado.

**Siguiente paso (pieza pequeña):**
- Aplicar la migración en Supabase, y luego armar el login (auth) con Supabase.

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
