# 02 — Arquitectura

## Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | **Next.js (App Router) + TypeScript** | React moderno, SSR/SSG, excelente para PWA y SEO futuro. |
| Estilos | **Tailwind CSS** | Rápido, consistente, mobile-first natural. |
| UI | Componentes propios + [shadcn/ui] opcional | Bonito e intuitivo sin reinventar. |
| Gráficos | **Recharts** (o similar) | Reportes visuales simples y responsivos. |
| Backend/DB | **Supabase** (Postgres) | Postgres real (bueno para reportes y divisiones), Auth y Storage incluidos. |
| Auth | **Supabase Auth** | Email/OTP + OAuth (Google) sin backend propio. |
| Seguridad | **RLS (Row Level Security)** | Cada usuario solo ve sus datos; base para grupos compartidos. |
| Hosting FE | **Vercel** | Deploy gratis, integrado con Next.js. |
| Hosting datos | **Supabase Cloud** | Capa gratuita generosa para arrancar. |

## Por qué Postgres (SQL) y no NoSQL

Los reportes (sumas por categoría, por mes), las divisiones por porcentaje/monto y las
cuotas se modelan mucho mejor con relaciones y consultas SQL. Además facilita migrar a un
SaaS multi-tenant con licencias.

## PWA

- `manifest.json` + service worker para instalación en el celular.
- Offline básico (cachear la shell de la app); la escritura real requiere conexión al inicio.
- Íconos e íconos de pantalla de inicio.

## Estructura de carpetas (propuesta)

```
gastx/
├─ docs/                      # Documentación (este contexto)
├─ public/                    # Íconos PWA, manifest
├─ src/
│  ├─ app/                    # Rutas (App Router)
│  │  ├─ (auth)/              # Login / registro
│  │  ├─ (app)/               # App autenticada
│  │  │  ├─ dashboard/
│  │  │  ├─ transactions/
│  │  │  ├─ recurring/
│  │  │  ├─ installments/
│  │  │  ├─ reports/
│  │  │  └─ settings/
│  ├─ components/             # Componentes UI reutilizables
│  ├─ lib/                    # Cliente Supabase, helpers (formato CRC, fechas)
│  ├─ hooks/                  # Hooks React
│  └─ types/                  # Tipos TS (generados de Supabase)
├─ supabase/
│  ├─ migrations/             # SQL de esquema (fuente de verdad de la DB)
│  └─ seed.sql                # Datos de ejemplo (categorías por defecto)
├─ CLAUDE.md
└─ README.md
```

## Manejo de dinero

- Guardar montos como `numeric(14,2)`. **Nunca** `float`.
- Formatear en UI con `Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' })`.
- Cada transacción guarda su `currency` (default `CRC`) para preparar multi-moneda.

## Entornos y despliegue

- **Local:** Supabase CLI (opcional) o proyecto Supabase de desarrollo + `next dev`.
- **Producción:** Vercel conectado al repo; variables `NEXT_PUBLIC_SUPABASE_URL` y
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Nunca commitear llaves de servicio.

## Preparado para el futuro

- **Grupos compartidos:** tablas `groups` / `group_members` ya contempladas en el modelo.
- **Licencias:** tabla `subscriptions`/`plans` a agregar en la fase de monetización.
- **Multi-moneda:** columna `currency` + futura tabla de tasas de cambio.
