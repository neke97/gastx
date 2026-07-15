# 01 — Visión y Objetivos

## Idea central

Una app personal de finanzas **bonita e intuitiva**, usada principalmente desde el
**celular** pero funcional en la **web**. Registrar gastos e ingresos de forma rápida,
entender en qué se va la plata, y llevar control de compromisos recurrentes y cuotas.

## Objetivos

1. **Rápido de usar:** registrar un gasto en pocos toques.
2. **Mobile-first:** experiencia pensada para el celular; instalable como PWA.
3. **Gratuito de operar** al inicio (capas gratuitas de Vercel + Supabase).
4. **Escalable:** arquitectura que soporte crecer a muchos usuarios y, a futuro,
   un modelo con **licencias / suscripción**.

## Funcionalidades clave (visión completa)

- Registrar **gastos** e **ingresos** con categoría, monto, fecha y nota.
- **Recurrentes:** plantillas para movimientos que se repiten (salario, mensualidad
  de casa, "Pase de bus Ipis", "Pase de bus San Antonio", etc.). Editables cuando
  cambia el precio, conservando historial.
- **División de gastos entre personas** por porcentaje o por monto.
- **Cuotas:** control de compras a plazos (total, número de cuotas, cuánto falta).
- **Reportes y gráficos** visuales (no necesariamente descargables): distribución de
  gastos, ingresos vs egresos, tendencias por mes y por categoría.

## Decisiones tomadas (2026-07-15)

| Tema | Decisión |
|---|---|
| Stack | Next.js + Supabase |
| Móvil | PWA (con opción de empaquetar nativo a futuro) |
| División entre personas | Por fases: primero "personas como etiquetas", luego grupos compartidos reales |
| Moneda | CRC como principal; modelo de datos preparado para multi-moneda |

## Visión a futuro (no bloqueante)

- Grupos compartidos reales (tipo Splitwise): cada persona con su cuenta.
- Multi-moneda con conversión.
- Modelo de licencias / suscripción (planes free vs premium).
- Posible empaquetado como app nativa (Capacitor) para las tiendas.
