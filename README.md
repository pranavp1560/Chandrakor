# CHANDRAKOR — Premium Indian Saree E-Commerce Platform
## Phase 1 Foundation: Database, Storage, Admin Panel & Customer Storefront

---

### Brand Identity & Design System

**Chandrakor** is a luxury Indian saree brand inspired by centuries of royal handloom heritage. The name *Chandrakor* represents the auspicious crescent moon, a timeless symbol of regal poise and divine grace.

#### Color Palette
- **Warm Ivory:** `#F8F5EF` (Primary storefront canvas)
- **Soft Cream:** `#EFE7DA` (Card backgrounds, subtle borders)
- **Deep Burgundy:** `#6E2638` (Primary brand color & focal actions)
- **Muted Maroon:** `#823B4B` (Secondary brand accents)
- **Antique Gold:** `#B69A65` (Refined metallic accent)
- **Deep Charcoal:** `#292723` (High-readability typography)
- **Warm Grey:** `#77736C` (Metadata, breadcrumbs, borders)
- **Pure White:** `#FFFFFF` (Surface contrast)

#### Typography
- **Headings & Brand Title:** *Cormorant Garamond* / *Playfair Display* (Refined editorial serif)
- **Body & Controls:** *Inter* (Clean, modern geometric sans-serif)

---

## 1. Project Monorepo Architecture

```text
D:\Saree_E_Commers/
├── apps/
│   ├── customer/                      # Customer storefront (Port: 5173)
│   │   ├── src/
│   │   │   ├── components/            # Header, Footer, ProductCard, CartDrawer, SearchModal
│   │   │   ├── context/               # CartContext (persistent guest cart, live stock sync)
│   │   │   ├── pages/                 # HomePage, ShopPage, ProductDetailPage, CartPage, AboutPage
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── index.css
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── admin/                         # Staff Admin Management Panel (Port: 5174)
│       ├── src/
│       │   ├── components/            # AdminLayout, ImageUploader (Supabase Storage)
│       │   ├── context/               # AuthContext (Supabase Auth, RBAC check, session)
│       │   ├── pages/                 # DashboardPage, ProductsPage, CategoriesPage,
│       │   │                          # InventoryPage, CollectionsPage, BannersPage,
│       │   │                          # AdminsPage, SettingsPage, LoginPage
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── index.css
│       ├── package.json
│       └── vite.config.ts
│
├── packages/
│   ├── shared-types/                  # Shared TypeScript interfaces & models
│   └── supabase-client/               # Shared typed Supabase client singleton
│
├── supabase/
│   └── migrations/
│       ├── 20261120000001_initial_schema.sql  # Core DDL, triggers, RLS, RPCs, Storage
│       └── 20261120000002_seed_data.sql       # Demo categories, collections, banners, products
│
├── .env                               # Live Supabase environment configuration
├── .env.example                       # Redacted environment template
├── package.json                       # Root workspaces configuration
└── README.md
```

---

## 2. Database Schema (Supabase `redrcbdmoxfamzkqamrg`)

All database transactions, migrations, and operations exclusively target the dedicated Supabase project `redrcbdmoxfamzkqamrg`.

### Core Tables & Row-Level Security (RLS)

| Table | Purpose | Public Access | Admin Access |
|---|---|---|---|
| `categories` | Hierarchical saree categories & subcategories | SELECT (Active only) | FULL CRUD (RLS `is_admin()`) |
| `products` | Saree products with fabric, occasion, length, blouse, weight | SELECT (Active only) | FULL CRUD (RLS `is_admin()`) |
| `product_images` | Multi-image gallery with display order & primary flags | SELECT | FULL CRUD (RLS `is_admin()`) |
| `inventory` | Physical available stock, reserved stock, low-stock threshold | SELECT | FULL CRUD (RLS `is_admin()`) |
| `inventory_movements` | Immutable audit log of every stock change | None | SELECT / INSERT (RLS `is_admin()`) |
| `roles` | RBAC roles (Super Admin, Product Manager, etc.) | None | SELECT (RLS `is_admin()`) |
| `permissions` | Granular permission keys | None | SELECT (RLS `is_admin()`) |
| `role_permissions` | Role-to-permission mapping | None | SELECT (RLS `is_admin()`) |
| `admin_profiles` | Authorized staff accounts linked to `auth.users` | Self profile | Super Admin manage |
| `admin_activity_logs` | Admin action audits | None | SELECT / INSERT (RLS `is_admin()`) |
| `banners` | Dynamic hero carousel slides with CTA links | SELECT (Active) | FULL CRUD (RLS `is_admin()`) |
| `collections` | Thematic curations (New Arrivals, Bridal, Best Sellers) | SELECT (Active) | FULL CRUD (RLS `is_admin()`) |
| `collection_products` | Many-to-many product assignment to collections | SELECT | FULL CRUD (RLS `is_admin()`) |
| `store_settings` | Brand profile, top announcement banner, store contact | SELECT | FULL CRUD (RLS `is_admin()`) |

### Atomic Stock Adjustment RPC Function

Stock updates are executed atomically via the PostgreSQL RPC function `public.adjust_stock`:
```sql
SELECT public.adjust_stock(
    p_product_id := 'UUID',
    p_quantity_change := 5,
    p_movement_type := 'restock',
    p_notes := 'Verified loom delivery',
    p_reference_type := 'manual',
    p_reference_id := 'PO-8492'
);
```
- Row-level lock (`FOR UPDATE`) on the inventory row prevents race conditions.
- Strict constraint check prevents stock from dropping below 0.
- Automatically creates an immutable audit row in `inventory_movements`.

---

## 3. Storage Bucket Configuration

A dedicated Supabase Storage bucket named **`products`** is created and configured:
- **Bucket ID:** `products`
- **Public Access:** Yes (for optimized CDN delivery of customer saree imagery)
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`, `image/avif`
- **Maximum File Size:** 5MB (5,242,880 bytes)
- **RLS Policies:** Public `SELECT` allowed; `INSERT`, `UPDATE`, `DELETE` restricted to authenticated staff with `public.is_admin()`.

---

## 4. Super Admin Provisioning & Setup

1. **Initial Bootstrap Function:**
   The database contains a secure PL/pgSQL function `public.bootstrap_super_admin(p_user_id, p_full_name)`:
   - When 0 administrators exist, it allows provisioning the initial Super Admin.
   - Once bootstrapped, subsequent administrator provisioning requires `admin:manage_users` permission.
2. **Current Configured Super Admin:**
   - **Email:** `pranavp1560@gmail.com`
   - **Role:** Super Admin (`2df448a1-e40a-4d1f-b684-2b0a6e609e77`)
   - **Access:** Unrestricted access to products, categories, stock adjustment, banners, collections, and settings.

---

## 5. Environment Variables

Create `.env` in the root workspace directory:

```env
VITE_SUPABASE_URL=https://redrcbdmoxfamzkqamrg.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_TeCkt9yM_oOx6thMjsdmAA_SllAHRJl
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_TeCkt9yM_oOx6thMjsdmAA_SllAHRJl
```

---

## 6. How to Run the Applications

### Install Dependencies
```bash
npm install
```

### Run Customer Storefront (Port 5173)
```bash
npm run dev:customer
```
Visit in browser: `http://localhost:5173`

### Run Admin Management Panel (Port 5174)
```bash
npm run dev:admin
```
Visit in browser: `http://localhost:5174`

### Run Both Applications Simultaneously
```bash
npm run dev
```

### Production Build
```bash
npm run build
```
Creates production bundles in `apps/customer/dist/` and `apps/admin/dist/`.
