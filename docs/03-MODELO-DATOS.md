# 03 — Modelo de Datos

Base: **Postgres (Supabase)**. Toda tabla con datos de usuario lleva **RLS**.
Montos en `numeric(14,2)`. Timestamps en `timestamptz`.

> Las tablas marcadas con 🔜 son de fases futuras; se documentan para no pintarnos a
> una esquina, pero se crean cuando toque según el roadmap.

## Diagrama de relaciones (resumen)

```
auth.users ──1:1── profiles
profiles ──1:N── categories
profiles ──1:N── transactions ──N:1── categories
transactions ──1:N── transaction_splits ──N:1── people
profiles ──1:N── people
profiles ──1:N── recurring_templates ──(genera)── transactions
profiles ──1:N── installment_plans ──1:N── installment_payments
profiles ──1:N── group_members ──N:1── groups   🔜
```

---

## Tablas

### `profiles`
Extiende `auth.users`. Perfil de la persona dueña de la cuenta.

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | = `auth.users.id` |
| display_name | text | |
| default_currency | text | default `'CRC'` |
| locale | text | default `'es-CR'` |
| created_at | timestamptz | default now() |

### `categories`
Categorías de gasto/ingreso, personalizables (con ícono y color).

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK→profiles | |
| name | text | ej. "Comida", "Transporte", "Salario" |
| kind | text | `'expense'` \| `'income'` |
| icon | text | nombre de ícono |
| color | text | hex |
| is_archived | boolean | default false |
| created_at | timestamptz | |

### `transactions`
El corazón: cada gasto o ingreso.

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK→profiles | |
| kind | text | `'expense'` \| `'income'` |
| amount | numeric(14,2) | monto total (siempre positivo) |
| currency | text | default `'CRC'` |
| category_id | uuid FK→categories | nullable |
| description | text | nota libre |
| occurred_on | date | fecha del movimiento |
| recurring_template_id | uuid FK→recurring_templates | si vino de una recurrente |
| installment_plan_id | uuid FK→installment_plans | si es pago de una cuota |
| created_at | timestamptz | |

Índices sugeridos: `(user_id, occurred_on)`, `(user_id, category_id)`.

### `people`
Personas para dividir gastos. **Fase 1:** simples etiquetas (sin cuenta).
**Fase futura:** pueden enlazarse a un usuario real (`linked_user_id`).

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK→profiles | dueño de la etiqueta |
| name | text | ej. "Ana", "Roommate" |
| linked_user_id | uuid | 🔜 nullable, para grupos reales |
| created_at | timestamptz | |

### `transaction_splits`
División de una transacción entre personas. Soporta **por monto** o **por porcentaje**.

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| transaction_id | uuid FK→transactions | |
| person_id | uuid FK→people | a quién le toca |
| split_mode | text | `'amount'` \| `'percent'` |
| value | numeric(14,2) | monto o porcentaje según `split_mode` |
| amount_resolved | numeric(14,2) | monto calculado final (se recalcula al guardar) |
| created_at | timestamptz | |

Regla de negocio: la suma de `amount_resolved` de los splits debe cuadrar con
`transactions.amount` (validar en la app / trigger).

### `recurring_templates`
Plantillas de movimientos recurrentes (salario, mensualidad, pases de bus).

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK→profiles | |
| kind | text | `'expense'` \| `'income'` |
| name | text | ej. "Pase de bus Ipis" |
| amount | numeric(14,2) | monto **actual** |
| currency | text | default `'CRC'` |
| category_id | uuid FK→categories | nullable |
| frequency | text | `'daily'`\|`'weekly'`\|`'monthly'`\|`'yearly'` |
| interval | int | cada N periodos (default 1) |
| next_run_on | date | próxima fecha a generar |
| is_active | boolean | default true |
| created_at | timestamptz | |

### `recurring_amount_history`
Historial de cambios de precio de una recurrente (para no perder el pasado al editar).

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| recurring_template_id | uuid FK | |
| amount | numeric(14,2) | monto en ese momento |
| effective_from | date | desde cuándo aplica |
| created_at | timestamptz | |

### `installment_plans`
Compras a cuotas / pagos a plazos.

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK→profiles | |
| name | text | ej. "Refrigeradora" |
| total_amount | numeric(14,2) | total de la compra |
| installments_count | int | número de cuotas |
| installment_amount | numeric(14,2) | monto por cuota |
| currency | text | default `'CRC'` |
| category_id | uuid FK→categories | nullable |
| start_date | date | primera cuota |
| frequency | text | usualmente `'monthly'` |
| is_completed | boolean | default false |
| created_at | timestamptz | |

### `installment_payments`
Cada cuota individual de un plan.

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| installment_plan_id | uuid FK | |
| number | int | # de cuota (1..N) |
| due_date | date | vencimiento |
| amount | numeric(14,2) | monto de esta cuota |
| paid_on | date | nullable; null = pendiente |
| transaction_id | uuid FK→transactions | nullable; si se registró como gasto |
| created_at | timestamptz | |

### 🔜 `groups` y `group_members` (fase futura)
Para grupos compartidos reales (varios usuarios comparten gastos).

`groups`: id, name, owner_id, created_at.
`group_members`: id, group_id, user_id, role, created_at.
Cuando existan, `transactions` y `people` referenciarán `group_id` para gastos compartidos.

### 🔜 `plans` y `subscriptions` (fase de monetización)
Para el modelo de licencias (free vs premium). Se define en su momento.

---

## Seguridad (RLS)

Política base para todas las tablas de usuario:

```sql
alter table <tabla> enable row level security;

create policy "own_rows" on <tabla>
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

Para tablas hijas sin `user_id` directo (ej. `transaction_splits`,
`installment_payments`), la política valida contra el `user_id` de la fila padre vía
`exists (...)`.
