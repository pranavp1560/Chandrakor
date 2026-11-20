# Database Safety & Transaction Integrity Rule

## Scope & Target Database
- **Workspace:** `D:\Saree_E_Commers` (Omkar Saree Elegance)
- **Supabase Project Reference:** `redrcbdmoxfamzkqamrg`
- **Supabase Project URL:** `https://redrcbdmoxfamzkqamrg.supabase.co`
- **Database Host:** `db.redrcbdmoxfamzkqamrg.supabase.co:5432`

---

## Mandates & Safety Guidelines

### 1. Dedicated Target Database
- **All database transactions, schema migrations, seeds, and SQL queries** performed in this repository must target and reflect exclusively in the **`redrcbdmoxfamzkqamrg`** Supabase database.
- **Never** route queries, migrations, or data mutations to any other project instance when working in this directory.

### 2. Transaction Reflection & Sync
- **Remote Reflection:** Every database migration or schema modification created in `supabase/migrations/` must be applied and validated against the live `redrcbdmoxfamzkqamrg` instance.
- **Verification:** After running schema updates, migrations, or seed operations, always verify that the live database reflects the changes.
- **Type Synchronization:** Keep TypeScript models and schemas in `packages/shared-types/` synchronized with the live database structure whenever migrations occur.

### 3. Destructive Operation Safeguards
- **Accidental Loss Prevention:** Prohibit unconfirmed destructive SQL actions (`DROP TABLE`, `TRUNCATE`, `DROP DATABASE`, unconstrained `DELETE`).
- **Pre-Execution Check:** Inspect existing table schema and row counts prior to altering or replacing tables.
- **Transaction Wrapping:** Wrap multi-statement DDL/DML batches in atomic transactions (`BEGIN; ... COMMIT;`) to guarantee rollback on errors.

### 4. Security & Access Rules
- **Row-Level Security (RLS):** Ensure RLS is active on all exposed public tables with strict RBAC policies distinguishing customer and admin access.
- **Environment Integrity:** Ensure `.env` and `packages/supabase-client` consistently reference `redrcbdmoxfamzkqamrg`.
- **Audit Trails:** Ensure all tables maintain `created_at` and `updated_at` columns with automatic update triggers.
