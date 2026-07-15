# 04 — Especificación Funcional

Detalle de cada característica: qué hace, cómo se comporta y reglas de negocio.

## 1. Registro de gastos e ingresos

- Botón grande y accesible (mobile-first) para "Agregar movimiento".
- Campos: tipo (gasto/ingreso), monto, categoría, fecha (default hoy), nota.
- Categorías con ícono y color para reconocerlas de un vistazo.
- Al guardar, aparece en la lista de movimientos y suma en el dashboard.

**Reglas:**
- Monto siempre positivo; el `kind` define si suma o resta.
- Formato de moneda `es-CR` (₡).

## 2. Recurrentes (salario, mensualidad, pases de bus)

- Crear plantillas con: nombre, tipo, monto, categoría, frecuencia (diaria/semanal/
  mensual/anual) e intervalo.
- La app **genera automáticamente** las transacciones en `next_run_on` (fase 3 puede ser
  manual "generar ahora"; fase 4, automático con job programado).
- **Editar precio:** al cambiar el monto, se guarda en `recurring_amount_history` con
  `effective_from`. Las transacciones ya generadas **no** cambian; solo las futuras.
- Ejemplos del usuario: "Pase de bus Ipis", "Pase de bus San Antonio", salario, cuota de casa.

**Reglas:**
- Editar el monto no reescribe el pasado (historial preservado).
- Se puede pausar (`is_active = false`) sin borrar.

## 3. División de gastos entre personas

**Fase 1 — personas como etiquetas:**
- El usuario crea "personas" (contactos) sin cuenta propia.
- Al registrar un gasto, puede dividirlo entre personas por:
  - **Monto:** asignar ₡X a cada quien.
  - **Porcentaje:** asignar %X; la app calcula el monto.
- La app muestra cuánto le corresponde a cada persona y valida que la suma cuadre con el total.

**Fase futura — grupos compartidos:**
- Personas enlazadas a usuarios reales; cada quien ve su parte; saldos entre miembros.

**Reglas:**
- `sum(amount_resolved) == transactions.amount` (tolerancia de redondeo de ₡1).
- Modo mixto (algunos por monto, resto por %) se resuelve al guardar.

## 4. Cuotas / pagos a plazos

- Crear un plan: nombre, total, número de cuotas, fecha de inicio, frecuencia, categoría.
- La app genera las `installment_payments` (1..N) con sus fechas de vencimiento.
- Vista de control: cuánto se ha pagado, cuánto falta, próxima cuota.
- Marcar una cuota como pagada → opcionalmente crea una `transaction` de gasto.

**Reglas:**
- `installment_amount * installments_count ≈ total_amount` (ajustar última cuota por redondeo).
- Al pagar todas, `is_completed = true`.

## 5. Reportes y gráficos

Visuales, dentro de la app (no requieren descarga):

- **Distribución de gastos por categoría** (dona/pastel) — "en qué se va la plata".
- **Ingresos vs egresos** por mes (barras).
- **Tendencia** de gasto por mes (línea).
- **% de ingresos** que se va en cada categoría.
- Filtros por rango de fechas y por categoría.

**Reglas:**
- Cálculos por consultas SQL agregadas (sum/group by) para rendimiento.
- Respetar la moneda base; multi-moneda se normaliza a futuro.

## 6. Dashboard (pantalla principal)

- Resumen del mes: total ingresos, total gastos, balance.
- Próximas recurrentes y cuotas por vencer.
- Accesos rápidos: agregar movimiento, ver reportes.

## 7. Cuenta y ajustes

- Login con Supabase Auth (email/OTP y/o Google).
- Ajustes: nombre, moneda por defecto, gestión de categorías y personas.

## Principios de UX

- **Mobile-first**: todo usable con una mano, botones grandes.
- **Pocos toques** para la acción más común (agregar gasto).
- **Bonito**: colores por categoría, íconos, transiciones suaves.
- **Claro**: siempre visible el balance y a dónde va la plata.
