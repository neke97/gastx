# CLAUDE.md — Contexto para Claude Code

Este archivo se carga automáticamente en cada sesión. Léelo antes de trabajar.

## Qué es este proyecto

**GastX**: app mobile-first (PWA) para registrar gastos e ingresos, con recurrentes,
división de gastos entre personas, control de cuotas y reportes visuales. Pensada para
escalar a un SaaS con licencias.

## Idioma

- El usuario habla **español** (Costa Rica). Responder siempre en español.
- Código, nombres de variables y commits en **inglés**. Comentarios y UI en **español**.

## Stack (ya decidido — no re-discutir)

- Next.js (App Router) + TypeScript + Tailwind CSS.
- Supabase (Postgres, Auth, Storage, RLS).
- Deploy: Vercel + Supabase (capa gratuita).
- PWA instalable. Moneda base CRC, modelo listo para multi-moneda.

## Reglas de trabajo

1. **Antes de codear**, revisá la doc en `docs/` (especialmente `03-MODELO-DATOS.md` y `04-FEATURES.md`).
2. **Después de cada avance**, actualizá `docs/06-BITACORA.md` con lo hecho y la fecha.
3. Si cambia una decisión de arquitectura o datos, actualizá el `.md` correspondiente.
4. Trabajar por **fases** según `docs/05-ROADMAP.md`. No adelantar features de fases futuras sin acordarlo.
5. Montos: guardar como `numeric(14,2)`. Nunca usar `float` para dinero.
6. Seguridad: toda tabla con datos de usuario debe tener **RLS** activo en Supabase.

## Convenciones

- Componentes React en PascalCase; hooks `useX`; archivos de ruta según App Router.
- Mobile-first siempre: diseñar primero para pantalla angosta.
- Fechas y montos: formatear con locale `es-CR`.

## Estructura de docs

Ver tabla en [README.md](README.md). La bitácora (`docs/06-BITACORA.md`) es la fuente de verdad del progreso.
