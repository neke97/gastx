# Supabase

Fuente de verdad del esquema de base de datos de GastX.

- `migrations/` — archivos SQL con el esquema (tablas, RLS, funciones). Ver el diseño
  en [`../docs/03-MODELO-DATOS.md`](../docs/03-MODELO-DATOS.md).
- `seed.sql` — (futuro) datos de ejemplo, como categorías por defecto.

## Flujo sugerido

1. Crear el proyecto en [supabase.com](https://supabase.com) (capa gratuita).
2. Copiar la URL y la anon/publishable key a `.env.local` (ver `.env.example`).
3. Las migraciones se pueden aplicar desde el SQL Editor del dashboard o con la
   Supabase CLI (`supabase db push`).

> Las migraciones se agregarán en la Fase 1 (tablas `profiles`, `categories`,
> `transactions`).
