-- Migration: 20261120000001_initial_schema.sql
-- Description: Core schema, functions, triggers, RLS, and storage for Chandrakor Saree E-Commerce

-- 1. EXTENSIONS & UTILITIES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Updated At Trigger Function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_key TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_admin_profiles_updated_at
BEFORE UPDATE ON public.admin_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function to check if current authenticated user is an active admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_profiles
        WHERE id = auth.uid() AND is_active = true
    );
$$;

-- Helper function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(p_permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_profiles ap
        JOIN public.roles r ON ap.role_id = r.id
        JOIN public.role_permissions rp ON r.id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ap.id = auth.uid()
          AND ap.is_active = true
          AND (r.name = 'Super Admin' OR p.permission_key = p_permission_key)
    );
$$;

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);

-- 4. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
    mrp NUMERIC(10,2) NOT NULL CHECK (mrp >= 0),
    selling_price NUMERIC(10,2) NOT NULL CHECK (selling_price >= 0 AND selling_price <= mrp),
    fabric TEXT,
    colour TEXT,
    pattern TEXT,
    occasion TEXT,
    saree_length TEXT,
    blouse_piece TEXT,
    weight_grams INT CHECK (weight_grams IS NULL OR weight_grams >= 0),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_best_seller BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_best_seller ON public.products(is_best_seller);
CREATE INDEX IF NOT EXISTS idx_products_fabric ON public.products(fabric);
CREATE INDEX IF NOT EXISTS idx_products_colour ON public.products(colour);
CREATE INDEX IF NOT EXISTS idx_products_occasion ON public.products(occasion);

-- 5. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON public.product_images(is_primary);

-- 6. INVENTORY & MOVEMENTS
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
    quantity_available INT NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
    quantity_reserved INT NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_inventory_updated_at
BEFORE UPDATE ON public.inventory
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL,
    quantity_change INT NOT NULL,
    reference_type TEXT,
    reference_id TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON public.inventory_movements(created_at);

-- 7. ATOMIC STOCK ADJUSTMENT RPC
CREATE OR REPLACE FUNCTION public.adjust_stock(
    p_product_id UUID,
    p_quantity_change INT,
    p_movement_type TEXT,
    p_notes TEXT DEFAULT NULL,
    p_reference_type TEXT DEFAULT 'manual',
    p_reference_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inv RECORD;
    v_new_available INT;
    v_admin_id UUID := auth.uid();
BEGIN
    IF NOT (public.is_admin() OR current_user = 'postgres') THEN
        RAISE EXCEPTION 'Unauthorized: only active administrators can adjust stock';
    END IF;

    -- Lock row for update
    SELECT * INTO v_inv
    FROM public.inventory
    WHERE product_id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        -- Insert initial inventory record if not present
        IF p_quantity_change < 0 THEN
            RAISE EXCEPTION 'Cannot reduce stock for product without inventory';
        END IF;
        
        INSERT INTO public.inventory (product_id, quantity_available, quantity_reserved, low_stock_threshold)
        VALUES (p_product_id, p_quantity_change, 0, 5)
        RETURNING * INTO v_inv;
        
        v_new_available := p_quantity_change;
    ELSE
        v_new_available := v_inv.quantity_available + p_quantity_change;
        IF v_new_available < 0 THEN
            RAISE EXCEPTION 'Insufficient stock. Current available: %, requested change: %', v_inv.quantity_available, p_quantity_change;
        END IF;

        UPDATE public.inventory
        SET quantity_available = v_new_available,
            updated_at = NOW()
        WHERE product_id = p_product_id
        RETURNING * INTO v_inv;
    END IF;

    -- Record movement audit
    INSERT INTO public.inventory_movements (
        product_id,
        movement_type,
        quantity_change,
        reference_type,
        reference_id,
        notes,
        created_by
    ) VALUES (
        p_product_id,
        p_movement_type,
        p_quantity_change,
        p_reference_type,
        p_reference_id,
        p_notes,
        v_admin_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'product_id', p_product_id,
        'quantity_available', v_new_available,
        'quantity_reserved', v_inv.quantity_reserved,
        'movement_type', p_movement_type
    );
END;
$$;

-- 8. WEBSITE CONTENT: BANNERS & COLLECTIONS
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    button_text TEXT,
    button_link TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_is_active ON public.banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_display_order ON public.banners(display_order);

CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_is_active ON public.collections(is_active);

CREATE TABLE IF NOT EXISTS public.collection_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    display_order INT NOT NULL DEFAULT 0,
    UNIQUE(collection_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_coll_prod_collection ON public.collection_products(collection_id);
CREATE INDEX IF NOT EXISTS idx_coll_prod_product ON public.collection_products(product_id);

-- 9. STORE SETTINGS & ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_store_settings_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_activity_logs(created_at);

-- 10. SUPER ADMIN BOOTSTRAP FUNCTION
-- Allows bootstrapping the very first Super Admin securely if no admin exists
CREATE OR REPLACE FUNCTION public.bootstrap_super_admin(
    p_user_id UUID,
    p_full_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_count INT;
    v_super_admin_role_id UUID;
    v_user_email TEXT;
BEGIN
    -- Check if any admin already exists
    SELECT COUNT(*) INTO v_admin_count FROM public.admin_profiles;
    IF v_admin_count > 0 THEN
        -- Only existing Super Admin can add more admins once bootstrapped
        IF NOT public.has_permission('admin:manage_users') THEN
            RAISE EXCEPTION 'Super admin already bootstrapped. Action forbidden.';
        END IF;
    END IF;

    -- Get user email from auth.users
    SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
    IF v_user_email IS NULL THEN
        RAISE EXCEPTION 'Target user not found in auth.users';
    END IF;

    -- Get Super Admin role ID
    SELECT id INTO v_super_admin_role_id FROM public.roles WHERE name = 'Super Admin';
    IF v_super_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Super Admin role not configured';
    END IF;

    -- Insert or update admin profile
    INSERT INTO public.admin_profiles (id, full_name, email, role_id, is_active)
    VALUES (p_user_id, p_full_name, v_user_email, v_super_admin_role_id, true)
    ON CONFLICT (id) DO UPDATE
    SET role_id = v_super_admin_role_id,
        is_active = true,
        full_name = p_full_name;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'email', v_user_email,
        'role', 'Super Admin'
    );
END;
$$;

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Categories RLS
CREATE POLICY "Public read active categories"
ON public.categories FOR SELECT
USING (is_active = true OR public.is_admin());

CREATE POLICY "Admin manage categories"
ON public.categories FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Products RLS
CREATE POLICY "Public read active products"
ON public.products FOR SELECT
USING (is_active = true OR public.is_admin());

CREATE POLICY "Admin manage products"
ON public.products FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Product Images RLS
CREATE POLICY "Public read product images"
ON public.product_images FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = product_images.product_id
          AND (p.is_active = true OR public.is_admin())
    )
);

CREATE POLICY "Admin manage product images"
ON public.product_images FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Inventory RLS
-- Public can read inventory to check available stock status for items
CREATE POLICY "Public read inventory stock"
ON public.inventory FOR SELECT
USING (true);

CREATE POLICY "Admin manage inventory"
ON public.inventory FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Inventory Movements RLS
CREATE POLICY "Admin read inventory movements"
ON public.inventory_movements FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admin insert inventory movements"
ON public.inventory_movements FOR INSERT
WITH CHECK (public.is_admin());

-- Roles & Permissions RLS
CREATE POLICY "Admin read roles"
ON public.roles FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admin read permissions"
ON public.permissions FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admin read role_permissions"
ON public.role_permissions FOR SELECT
USING (public.is_admin());

-- Admin Profiles RLS
CREATE POLICY "Admins read profiles"
ON public.admin_profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Super admin manage admin profiles"
ON public.admin_profiles FOR ALL
USING (public.has_permission('admin:manage_users'))
WITH CHECK (public.has_permission('admin:manage_users'));

-- Admin Activity Logs RLS
CREATE POLICY "Admin read activity logs"
ON public.admin_activity_logs FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admin insert activity logs"
ON public.admin_activity_logs FOR INSERT
WITH CHECK (public.is_admin());

-- Banners RLS
CREATE POLICY "Public read active banners"
ON public.banners FOR SELECT
USING (
    is_active = true
    AND (start_at IS NULL OR start_at <= NOW())
    AND (end_at IS NULL OR end_at >= NOW())
    OR public.is_admin()
);

CREATE POLICY "Admin manage banners"
ON public.banners FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Collections RLS
CREATE POLICY "Public read active collections"
ON public.collections FOR SELECT
USING (is_active = true OR public.is_admin());

CREATE POLICY "Admin manage collections"
ON public.collections FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Collection Products RLS
CREATE POLICY "Public read collection products"
ON public.collection_products FOR SELECT
USING (true);

CREATE POLICY "Admin manage collection products"
ON public.collection_products FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Store Settings RLS
CREATE POLICY "Public read store settings"
ON public.store_settings FOR SELECT
USING (true);

CREATE POLICY "Admin manage store settings"
ON public.store_settings FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 12. STORAGE BUCKET CONFIGURATION
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'products',
    'products',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

-- Storage RLS Policies
CREATE POLICY "Public Access Products Bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Admin Upload Products Bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'products' AND (public.is_admin() OR auth.role() = 'authenticated'));

CREATE POLICY "Admin Update Products Bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'products' AND (public.is_admin() OR auth.role() = 'authenticated'))
WITH CHECK (bucket_id = 'products' AND (public.is_admin() OR auth.role() = 'authenticated'));

CREATE POLICY "Admin Delete Products Bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'products' AND (public.is_admin() OR auth.role() = 'authenticated'));
