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

## 2026-07-16 — Fase 5: reportes y gráficos

**Hecho:**
- Página `/dashboard/reports` con dos gráficos (SVG/CSS puro, sin dependencias):
  - **Dona** de gastos del mes por categoría (usa el color de cada categoría; top 8 +
    "Otros"); leyenda con monto y %.
  - **Barras** ingresos vs gastos, últimos 6 meses, con tabla de valores (mes/ingresos/
    gastos/balance).
- Usé la skill `dataviz`: validé el par ingresos/gastos con el script →
  **teal `#0d9488` / rosa `#e11d48`** pasa CVD en claro y oscuro (verde/rojo puro fallaba).
  Cada gráfico trae leyenda + tabla (identidad no solo por color).
- Enlace "Reportes" en el header.
- **Verificado:** `npm run build` OK.

**Pendiente Fase 5 (menor):** gráfico de tendencia en línea; filtros por fecha/categoría;
tooltips interactivos (hoy hay `title` nativo + tabla de valores).

**Siguiente fase:** Fase 6 (pulido + PWA: offline, estados vacíos, generación automática
de recurrentes) o cerrar cabos (editar splits/categoría, navegación móvil).

---

## 2026-07-16 — Fase 4: cuotas → Fase 4 COMPLETA

**Hecho:**
- Migración `supabase/migrations/0005_installments.sql`: `installment_plans`,
  `installment_payments`, RLS, y columna `transactions.installment_plan_id`.
  **Falta aplicarla en Supabase.**
- Acciones (`installments/actions.ts`): `addPlan` (crea plan + genera cuotas 1..N,
  la última ajusta redondeo para cuadrar el total), `payInstallment` (registra un gasto
  y marca la cuota; completa el plan si no quedan pendientes), `unpayInstallment`
  (borra el gasto y revierte), `deletePlan`.
- `InstallmentForm` (cliente): nombre, total, # cuotas (con preview ≈ por cuota),
  categoría, primera fecha y frecuencia.
- Página `/dashboard/installments` (lista con barra de progreso pagado/total) y detalle
  `/dashboard/installments/[id]` (falta pagar / total / próxima + cuotas con pagar/desmarcar).
- Enlace "Cuotas" en el header; header ahora usa `flex-wrap` (mobile-first).
- **Verificado:** `npm run build` OK.

**Recordatorio al usuario:** aplicar `0005_installments.sql` en Supabase.

**Nota UX:** el header del dashboard ya tiene 4 enlaces + Salir; a futuro conviene una
navegación inferior (bottom nav) o menú para móvil.

**Siguiente fase:** Fase 5 (reportes y gráficos) — usar la skill `dataviz`.

---

## 2026-07-16 — Fase 3: recurrentes → Fase 3 COMPLETA

**Hecho:**
- Migración `supabase/migrations/0004_recurring.sql`: `recurring_templates`,
  `recurring_amount_history`, RLS, y columna `transactions.recurring_template_id`
  (trazabilidad). **Falta aplicarla en Supabase.**
- Acciones (`recurring/actions.ts`): `addRecurring` (crea + primer historial de precio),
  `updateRecurring` (si cambia el monto agrega historial desde hoy, luego redirige),
  `toggleActiveRecurring`, `deleteRecurring`, `generatePending` (genera transacciones de
  todas las activas cuya `next_run_on` ya llegó, avanzando periodo por periodo con
  `addPeriod`; usa el monto actual de la plantilla).
- `RecurringForm` (crear/editar): tipo, nombre, monto, categoría, frecuencia
  (diario/semanal/mensual/anual), intervalo "cada N", próxima fecha.
- `GeneratePendingButton` (cliente, useActionState) muestra cuántos se generaron.
- Página `/dashboard/recurring` (lista + form + generar) y edición
  `/dashboard/recurring/[id]` (con historial de precio visible).
- Enlace "Recurrentes" en el header del dashboard.
- **Verificado:** `npm run build` OK.

**Recordatorio al usuario:** aplicar `0004_recurring.sql` en el SQL Editor de Supabase.

**Nota técnica:** la generación usa el monto actual de la plantilla (no el histórico por
fecha); suficiente para MVP. Historial queda para referencia/reportes.

**Siguiente fase sugerida:** Fase 4 (cuotas) o Fase 5 (reportes/gráficos).

---

## 2026-07-16 — Fase 2 (parte 3): división de gastos entre personas

**Hecho:**
- Migración `supabase/migrations/0003_splits.sql`: tabla `transaction_splits`
  (transaction_id, person_id, split_mode, value, amount_resolved) + RLS por transacción
  padre + índice. **Falta aplicarla en Supabase.**
- `addTransaction` extendido: helper `buildSplitRows` valida personas del usuario,
  que la suma cuadre (100% en modo %, o el total en modo monto, tolerancia ₡1),
  ajusta redondeo en la última fila. Inserta la transacción, obtiene su id, inserta los
  splits; si fallan, borra la transacción (evita datos a medias).
- `TransactionForm` (solo al crear): sección "Dividir entre personas" con modo
  monto/%, filas persona+valor, botones "+ Persona" y "Repartir igual", monto controlado,
  indicador de "falta X" y bloqueo del submit hasta que cuadre. Enlace a agregar personas
  si no hay.
- Dashboard: pasa `people` al form y muestra "Dividido: Ana ₡… · Beto ₡…" por movimiento
  (query embebe `transaction_splits(people(name))`).
- **Verificado:** `npm run build` OK.

**Recordatorio al usuario:** aplicar `0003_splits.sql` en el SQL Editor de Supabase.

**Pendiente Fase 2 (menor):** editar splits de un movimiento existente; editar categoría
(nombre/color) e íconos.

**Siguiente fase sugerida:** Fase 3 (recurrentes) o Fase 5 (reportes/gráficos).

---

## 2026-07-15 — Fase 2 (parte 2): personas (etiquetas)

**Hecho:**
- Migración `supabase/migrations/0002_people.sql`: tabla `people` (user_id, name,
  linked_user_id para el futuro) + RLS + índice. **Falta aplicarla en Supabase.**
- Página `/dashboard/people`: form para agregar y lista con borrar (server actions
  `addPerson` / `deletePerson`, sin componente cliente).
- Enlace "Personas" en el header del dashboard.
- **Verificado:** `npm run build` OK.

**Recordatorio al usuario:** aplicar `0002_people.sql` en el SQL Editor de Supabase.

**Siguiente paso (pieza pequeña):**
- Migración `0003`: `transaction_splits`. Luego dividir un gasto por monto/porcentaje
  al registrarlo, validando que la suma cuadre.

---

## 2026-07-15 — Fase 2 (parte 1): gestión de categorías

**Hecho:**
- Página `/dashboard/categories`: lista agrupada por Gastos/Ingresos, con punto de color.
- `CategoryForm` (cliente): crear categoría con toggle tipo, nombre y paleta de colores.
- Acciones `addCategory`, `toggleArchiveCategory` (archivar/restaurar) y `deleteCategory`
  (borra; los movimientos quedan sin categoría por el FK ON DELETE SET NULL).
- Enlace "Categorías" en el header del dashboard.
- Nota de routing: la ruta estática `/dashboard/categories` tiene prioridad sobre la
  dinámica `/dashboard/[id]`, así que no chocan.
- **Verificado:** `npm run build` OK.

**Falta en categorías:** editar (nombre/color) y selector de ícono (hoy solo color).

**Siguiente paso (pieza pequeña):**
- Tabla `people` (migración 0002) + gestión de personas (etiquetas).

---

## 2026-07-15 — Fase 1 (parte 7): editar movimiento + mejoras de UX → Fase 1 COMPLETA

**Hecho:**
- Acción `updateTransaction` + página de edición `/dashboard/[id]` (carga el movimiento,
  reusa el formulario y redirige al dashboard al guardar).
- `TransactionForm` ahora sirve para crear y editar (prop `initial`); enlace ✎ por fila.
- **Fix UX categorías:** el `<select>` tenía texto claro sobre fondo blanco en modo
  oscuro (ilegible). Ahora fondo/texto explícitos: `bg-white text-black` /
  `dark:bg-neutral-900 dark:text-white`.
- **Fecha:** default a hoy, campo controlado + botones rápidos "Hoy" y "Ayer".
- **Verificado:** `npm run build` OK (ruta `/dashboard/[id]` generada).

**Estado:** Fase 1 COMPLETA (auth + CRUD de movimientos + resumen del mes + formato es-CR).

**Siguiente (Fase 2):** gestión de categorías, personas (etiquetas) y división de gastos.

---

## 2026-07-15 — Fase 1 (parte 6): validación de config Supabase

**Hecho:**
- El usuario pegó la URL con el prefijo "URL: " → error "Invalid supabaseUrl".
  Corregido en `.env.local`.
- Nuevo `src/lib/supabase/config.ts` (`getSupabaseConfig`): valida que las variables
  existan y que la URL sea http/https válida, con mensajes claros en español.
- `client.ts`, `server.ts` y `middleware.ts` ahora usan ese validador.
- **Verificado:** `npm run build` OK.

**Recordatorio:** cambios en `.env.local` requieren reiniciar `npm run dev`.

**Siguiente paso (pieza pequeña):**
- Editar un movimiento (cierra el CRUD).

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
