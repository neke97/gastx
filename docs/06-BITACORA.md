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

<!-- Plantilla para nuevas entradas:

## AAAA-MM-DD — Título corto

**Hecho:**
- ...

**Decisiones:**
- ...

**Siguiente paso:**
- ...

-->
