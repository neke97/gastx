# 00 — Prompt Maestro

Copiá y pegá este prompt para retomar el proyecto con Claude en cualquier sesión nueva.

---

## Prompt para arrancar/retomar

```
Estamos construyendo GastX, una app mobile-first (PWA) para registrar gastos e
ingresos, con soporte para movimientos recurrentes, división de gastos entre
personas, control de compras a cuotas y reportes visuales. El objetivo es que sea
bonita, intuitiva, gratuita de alojar y escalable hacia un SaaS con licencias.

Antes de hacer nada:
1. Leé CLAUDE.md y toda la carpeta docs/ (en especial 03-MODELO-DATOS.md,
   04-FEATURES.md y 05-ROADMAP.md).
2. Revisá 06-BITACORA.md para saber en qué punto quedamos.

Stack ya decidido (no re-discutir salvo que yo lo pida):
- Next.js (App Router) + TypeScript + Tailwind CSS, mobile-first, PWA.
- Supabase (Postgres + Auth + Storage + RLS).
- Deploy en Vercel + Supabase, capa gratuita.
- Moneda base CRC, modelo listo para multi-moneda.

Reglas:
- Respondeme en español; código y commits en inglés, UI/comentarios en español.
- Trabajamos por fases según 05-ROADMAP.md. Confirmá conmigo antes de saltar de fase.
- Dinero siempre en numeric(14,2), nunca float. RLS activo en toda tabla de usuario.
- Después de cada avance, actualizá 06-BITACORA.md.

Decime en qué fase/tarea estamos y proponé el siguiente paso concreto.
```

---

## Notas sobre cómo usar este prompt

- Si es una sesión totalmente nueva, este prompt + los `.md` le dan a Claude todo el contexto.
- Para tareas específicas, agregá al final algo como: *"Hoy quiero implementar la tabla
  `transactions` y su formulario de registro"*.
- Mantené este archivo actualizado si cambian decisiones fundamentales.
