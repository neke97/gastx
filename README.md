# GastX 💸

App para registrar **gastos e ingresos** de forma bonita, intuitiva y mobile-first. Funciona en la web (PWA instalable en el celular) y está pensada para escalar hacia un producto con licencias en el futuro.

## ✨ Qué hace

- Registrar gastos e ingresos rápido y fácil.
- Plantillas recurrentes (salario, mensualidad de la casa, pases de bus, etc.) editables cuando cambia el precio.
- Dividir un gasto entre personas por **porcentaje** o por **monto**.
- Control de compras a **cuotas** (pagos a plazos).
- Reportes y gráficos visuales: en qué se va la plata y cuánto.

## 🧱 Stack

- **Frontend:** Next.js (React) + TypeScript, mobile-first, PWA.
- **Backend / DB:** Supabase (Postgres + Auth + Storage).
- **Hosting:** Vercel (frontend) + Supabase (datos) — capa gratuita.
- **Moneda base:** Colón costarricense (CRC), modelo preparado para multi-moneda.

## 📚 Documentación

Todo el contexto del proyecto vive en [`docs/`](docs/). Empezá por ahí:

| Archivo | Para qué sirve |
|---|---|
| [00-PROMPT-MAESTRO.md](docs/00-PROMPT-MAESTRO.md) | Prompt para retomar el proyecto con Claude en cualquier sesión. |
| [01-VISION.md](docs/01-VISION.md) | Visión, objetivos y decisiones tomadas. |
| [02-ARQUITECTURA.md](docs/02-ARQUITECTURA.md) | Stack, estructura de carpetas y cómo se despliega. |
| [03-MODELO-DATOS.md](docs/03-MODELO-DATOS.md) | Esquema de base de datos (tablas, relaciones, RLS). |
| [04-FEATURES.md](docs/04-FEATURES.md) | Especificación funcional de cada característica. |
| [05-ROADMAP.md](docs/05-ROADMAP.md) | Fases del proyecto y qué se construye en cada una. |
| [06-BITACORA.md](docs/06-BITACORA.md) | Bitácora de progreso: qué se hizo y cuándo. |

## 🚀 Estado

Fase 0 — Documentación y setup inicial. Ver [05-ROADMAP.md](docs/05-ROADMAP.md).
