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
- [x] CRUD de transacciones: agregar, listar, borrar y **editar** (`/dashboard/[id]`).
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
- [ ] `recurring_templates` + `recurring_amount_history`.
- [ ] CRUD de recurrentes (salario, pases de bus, mensualidad).
- [ ] Editar precio conservando historial.
- [ ] Generar transacciones desde recurrentes (manual: "generar pendientes").

## Fase 4 — Cuotas
- [ ] `installment_plans` + `installment_payments`.
- [ ] Crear plan y generar cuotas.
- [ ] Vista de control (pagado/faltante/próxima).
- [ ] Marcar cuota pagada → registrar transacción.

## Fase 5 — Reportes y gráficos
- [ ] Distribución por categoría (dona).
- [ ] Ingresos vs egresos por mes (barras).
- [ ] Tendencias (línea) y % por categoría.
- [ ] Filtros por fecha/categoría.

## Fase 6 — Pulido y PWA completa
- [ ] Offline básico, íconos, instalación.
- [ ] Mejoras de UX, animaciones, estados vacíos bonitos.
- [ ] Generación automática de recurrentes (job programado).

## Fase 7 — Escalar a producto (futuro)
- [ ] Grupos compartidos reales (`groups`, `group_members`).
- [ ] Multi-moneda con tasas de cambio.
- [ ] Licencias / suscripción (`plans`, `subscriptions`), planes free vs premium.

---

**Fase actual:** Fase 0 completada (scaffolding listo). Siguiente paso sugerido:
crear el proyecto en Supabase, conectar `.env.local`, y arrancar la Fase 1 (auth +
tablas `profiles`/`categories`/`transactions`).
