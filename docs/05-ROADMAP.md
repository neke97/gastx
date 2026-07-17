# 05 — Roadmap por Fases

Construimos incremental. Cada fase deja algo usable. No adelantar features de fases
futuras sin acordarlo.

## Fase 0 — Documentación y setup ✅
- [x] Definir visión, stack y decisiones.
- [x] Crear documentación base en `docs/`.
- [x] Inicializar proyecto Next.js + Tailwind (Next 16, React 19, Tailwind v4).
- [x] Cliente Supabase (`src/lib/supabase/`) + plantilla `.env.example`.
- [x] Configurar PWA (manifest + service worker + ícono).
- [x] Git inicializado + `.gitignore` (con `.env.local` protegido).
- [ ] **Pendiente del usuario:** crear el proyecto en Supabase y pegar URL + key en `.env.local`.
- [ ] (Opcional) Generar íconos PNG 192/512 y maskable con un favicon generator.
- [ ] (Opcional) Crear repo en GitHub y conectar a Vercel.

## Fase 1 — Núcleo: gastos e ingresos
- [x] Auth (login/registro con Supabase): middleware de sesión, `/login`, `/dashboard` protegido, salir.
- [x] Migraciones: `profiles`, `categories`, `transactions` (`supabase/migrations/0001_core.sql`). *Falta aplicarla en Supabase.*
- [x] Seed de categorías por defecto (trigger `on_auth_user_created`).
- [x] CRUD de transacciones: agregar, listar, borrar y **editar** (`/dashboard/[id]`, incluye editar la división).
- [x] Dashboard básico: totales del mes y balance.
- [x] Formato CRC y fechas `es-CR` (`src/lib/format.ts`).

**Fase 1 completa ✅**

## Fase 2 — Categorías, personas y división
- [~] Gestión de categorías: crear (nombre/color/tipo), archivar/restaurar y borrar en `/dashboard/categories`. Falta editar y selector de ícono.
- [x] Tabla `people` (migración 0002) + gestión de personas en `/dashboard/people`.
- [x] `transaction_splits` (migración 0003): dividir por monto o porcentaje al crear.
- [x] Validación de que la suma cuadre (cliente + servidor). *Falta: editar splits en un movimiento existente.*

**Fase 2 casi completa** (pendiente menor: editar categoría/íconos y editar splits).

## Fase 3 — Recurrentes
- [x] `recurring_templates` + `recurring_amount_history` (migración 0004).
- [x] CRUD de recurrentes en `/dashboard/recurring` (crear/listar/editar/pausar/borrar).
- [x] Editar precio conservando historial (`recurring_amount_history`, visible en edición).
- [x] Generar transacciones desde recurrentes (botón "Generar pendientes", se pone al día).

**Fase 3 completa ✅**

## Fase 4 — Cuotas
- [x] `installment_plans` + `installment_payments` (migración 0005).
- [x] Crear plan y generar cuotas (última ajusta redondeo).
- [x] Vista de control en `/dashboard/installments/[id]` (pagado/faltante/próxima + barra).
- [x] Marcar cuota pagada → registra gasto; desmarcar lo revierte.

**Fase 4 completa ✅**

## Fase 5 — Reportes y gráficos
- [x] Distribución por categoría (dona) en `/dashboard/reports` (con % en leyenda).
- [x] Ingresos vs egresos por mes (barras, últimos 6 meses) + tabla de valores.
- [x] % por categoría (leyenda de la dona) + **tendencia del balance en línea** (`BalanceTrend`).
- [x] Filtro por **mes** en reportes (navegador ← mes →, vía `?month=YYYY-MM`); barras/tendencia = 6 meses terminando en el mes elegido.

**Fase 5 completa ✅**

## Fase 6 — Pulido y PWA completa
- [x] Navegación móvil: barra inferior (bottom nav) + sección "Más"; loading entre pantallas.
- [x] Íconos PNG 192/512 + maskable (generados con sharp desde `icon.svg`) + `apple-icon.png`.
- [x] Animación suave de entrada (`fade-in`, respeta reduce-motion). sw.js ya existía.
- [x] Generación automática de recurrentes: `/api/cron/generate-recurring` + `vercel.json`
      (cron diario 06:00 UTC) + cliente admin (service role). Se activa al desplegar.

**Fase 6 completa ✅**

## Fase 7 — Escalar a producto (futuro)
- [ ] Grupos compartidos reales (`groups`, `group_members`).
- [ ] Multi-moneda con tasas de cambio.
- [ ] Licencias / suscripción (`plans`, `subscriptions`), planes free vs premium.

---

**Fase actual:** Fase 0 completada (scaffolding listo). Siguiente paso sugerido:
crear el proyecto en Supabase, conectar `.env.local`, y arrancar la Fase 1 (auth +
tablas `profiles`/`categories`/`transactions`).
