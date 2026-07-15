# 05 — Roadmap por Fases

Construimos incremental. Cada fase deja algo usable. No adelantar features de fases
futuras sin acordarlo.

## Fase 0 — Documentación y setup ✅ (en curso)
- [x] Definir visión, stack y decisiones.
- [x] Crear documentación base en `docs/`.
- [ ] Inicializar proyecto Next.js + Tailwind.
- [ ] Crear proyecto Supabase y conectar variables de entorno.
- [ ] Configurar PWA (manifest + service worker).

## Fase 1 — Núcleo: gastos e ingresos
- [ ] Auth (login/registro con Supabase).
- [ ] Migraciones: `profiles`, `categories`, `transactions`.
- [ ] Seed de categorías por defecto.
- [ ] CRUD de transacciones (agregar/editar/borrar/listar).
- [ ] Dashboard básico: totales del mes y balance.
- [ ] Formato CRC y fechas `es-CR`.

## Fase 2 — Categorías, personas y división
- [ ] Gestión de categorías (crear/editar/color/ícono/archivar).
- [ ] Tabla `people` + gestión de personas (etiquetas).
- [ ] `transaction_splits`: dividir gasto por monto o porcentaje.
- [ ] Validación de que la suma cuadre.

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

**Fase actual:** Fase 0. Siguiente paso sugerido: inicializar el proyecto Next.js +
Tailwind y conectar Supabase.
