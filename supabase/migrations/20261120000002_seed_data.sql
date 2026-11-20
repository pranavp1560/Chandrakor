-- Migration: 20261120000002_seed_data.sql
-- Description: Initial Roles, Permissions, Categories, Collections, Store Settings, Banners, and Demo Products

-- 1. SEED ROLES
INSERT INTO public.roles (name, description) VALUES
('Super Admin', 'Full system access and administrator management'),
('Product Manager', 'Manage products, categories, inventory, and collections'),
('Order Manager', 'Manage customer orders and fulfillment (Phase 2)'),
('Marketing Manager', 'Manage homepage banners, collections, and promotions'),
('Viewer', 'Read-only access to catalog and inventory metrics')
ON CONFLICT (name) DO NOTHING;

-- 2. SEED PERMISSIONS
INSERT INTO public.permissions (permission_key, description) VALUES
('admin:all', 'Complete system administrative privileges'),
('admin:manage_users', 'Add, modify, and deactivate staff admin accounts'),
('products:read', 'View products list and details'),
('products:create', 'Create new saree products'),
('products:update', 'Edit product specifications and pricing'),
('products:delete', 'Archive or delete products'),
('categories:read', 'View product categories'),
('categories:create', 'Create categories and subcategories'),
('categories:update', 'Modify categories and hierarchy'),
('categories:delete', 'Archive categories'),
('inventory:read', 'View stock balances and inventory metrics'),
('inventory:adjust', 'Adjust physical stock levels and log movements'),
('collections:read', 'View collections'),
('collections:manage', 'Create and curate featured collections'),
('banners:read', 'View website hero and promo banners'),
('banners:manage', 'Upload and configure promotional banners'),
('settings:read', 'View store configurations'),
('settings:manage', 'Update brand metadata, shipping, and store settings')
ON CONFLICT (permission_key) DO NOTHING;

-- Assign permissions to roles
DO $$
DECLARE
    v_super_admin UUID;
    v_product_mgr UUID;
    v_order_mgr UUID;
    v_mktg_mgr UUID;
    v_viewer UUID;
BEGIN
    SELECT id INTO v_super_admin FROM public.roles WHERE name = 'Super Admin';
    SELECT id INTO v_product_mgr FROM public.roles WHERE name = 'Product Manager';
    SELECT id INTO v_order_mgr FROM public.roles WHERE name = 'Order Manager';
    SELECT id INTO v_mktg_mgr FROM public.roles WHERE name = 'Marketing Manager';
    SELECT id INTO v_viewer FROM public.roles WHERE name = 'Viewer';

    -- Super Admin: all permissions
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_super_admin, id FROM public.permissions
    ON CONFLICT DO NOTHING;

    -- Product Manager
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_product_mgr, id FROM public.permissions
    WHERE permission_key IN (
        'products:read', 'products:create', 'products:update', 'products:delete',
        'categories:read', 'categories:create', 'categories:update', 'categories:delete',
        'inventory:read', 'inventory:adjust',
        'collections:read', 'collections:manage'
    )
    ON CONFLICT DO NOTHING;

    -- Order Manager
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_order_mgr, id FROM public.permissions
    WHERE permission_key IN ('products:read', 'inventory:read')
    ON CONFLICT DO NOTHING;

    -- Marketing Manager
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_mktg_mgr, id FROM public.permissions
    WHERE permission_key IN (
        'products:read', 'collections:read', 'collections:manage',
        'banners:read', 'banners:manage'
    )
    ON CONFLICT DO NOTHING;

    -- Viewer
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_viewer, id FROM public.permissions
    WHERE permission_key IN ('products:read', 'categories:read', 'inventory:read', 'collections:read', 'banners:read')
    ON CONFLICT DO NOTHING;
END $$;

-- 3. SEED STORE SETTINGS
INSERT INTO public.store_settings (setting_key, setting_value) VALUES
('store_profile', jsonb_build_object(
    'store_name', 'Chandrakor',
    'tagline', 'Heirloom Handcrafted Indian Sarees',
    'support_email', 'contact@chandrakor.com',
    'support_phone', '+91 98200 12345',
    'address', '108 Heritage Boulevard, Kala Ghoda, Mumbai 400001, Maharashtra, India',
    'currency', 'INR',
    'currency_symbol', '₹',
    'tax_percentage', 5
)),
('announcement_bar', jsonb_build_object(
    'is_active', true,
    'message', 'Complimentary Pan-India Express Shipping & Insured Heirloom Delivery on all orders',
    'link', '/shop'
)),
('brand_info', jsonb_build_object(
    'about', 'Rooted in the timeless grandeur of Indian textile traditions, Chandrakor curates mastercrafted sarees directly from revered weaving clusters across Varanasi, Kanchipuram, Yeola, and Bengal. Every drape is an immortal narrative of royal grace and artisanal purity.',
    'heritage_year', '1984',
    'craftsmanship_note', 'Silk Mark Certified Pure Silks & Handloom Verified Weaves'
))
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = EXCLUDED.setting_value;

-- 4. SEED CATEGORIES (Hierarchical)
DO $$
DECLARE
    v_silk_id UUID;
    v_cotton_id UUID;
    v_designer_id UUID;
BEGIN
    -- Top-level categories
    INSERT INTO public.categories (name, slug, description, image_url, display_order, is_active)
    VALUES ('Silk Sarees', 'silk-sarees', 'Pure silk handloom sarees from historic Indian weaving clusters', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800', 1, true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, image_url = EXCLUDED.image_url
    RETURNING id INTO v_silk_id;

    INSERT INTO public.categories (name, slug, description, image_url, display_order, is_active)
    VALUES ('Cotton Sarees', 'cotton-sarees', 'Breathable hand-spun pure cottons and ethereal mul fabrics', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800', 2, true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, image_url = EXCLUDED.image_url
    RETURNING id INTO v_cotton_id;

    INSERT INTO public.categories (name, slug, description, image_url, display_order, is_active)
    VALUES ('Designer Sarees', 'designer-sarees', 'Contemporary silhouettes with rich zardozi, sequins, and heritage artistry', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800', 3, true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, image_url = EXCLUDED.image_url
    RETURNING id INTO v_designer_id;

    -- Silk subcategories
    INSERT INTO public.categories (name, slug, description, image_url, parent_id, display_order, is_active) VALUES
    ('Banarasi Silk', 'banarasi-silk', 'Opulent katan silk weaves with intricate gold & silver zari work', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800', v_silk_id, 1, true),
    ('Kanjivaram Silk', 'kanjivaram-silk', 'Heavy temple border silks handwoven with authentic mulberry threads', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800', v_silk_id, 2, true),
    ('Paithani', 'paithani', 'Maharashtra royal heirloom drapes adorned with peacock pallu motifs', 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=800', v_silk_id, 3, true)
    ON CONFLICT (slug) DO NOTHING;

    -- Cotton subcategories
    INSERT INTO public.categories (name, slug, description, image_url, parent_id, display_order, is_active) VALUES
    ('Pure Cotton', 'pure-cotton', 'Crisp handloom cottons featuring classic temple and geometric borders', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800', v_cotton_id, 1, true),
    ('Mul Cotton', 'mul-cotton', 'Featherlight mulmul drapes suited for serene daytime occasions', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800', v_cotton_id, 2, true)
    ON CONFLICT (slug) DO NOTHING;

    -- Designer subcategories
    INSERT INTO public.categories (name, slug, description, image_url, parent_id, display_order, is_active) VALUES
    ('Party Wear', 'party-wear', 'Dazzling evening drapes with metallic borders and modern motifs', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800', v_designer_id, 1, true),
    ('Embroidered', 'embroidered', 'Delicate thread and zardozi hand embroidery over georgette and organza', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800', v_designer_id, 2, true)
    ON CONFLICT (slug) DO NOTHING;
END $$;

-- 5. SEED COLLECTIONS
INSERT INTO public.collections (name, slug, description, image_url, display_order, is_active) VALUES
('New Arrivals', 'new-arrivals', 'Freshly unveiled seasonal weaves from master artisans', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200', 1, true),
('Best Sellers', 'best-sellers', 'Our most cherished and timeless drape selections', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=1200', 2, true),
('Wedding Collection', 'wedding-collection', 'Regal bridal silks and resplendent trousseau heirlooms', 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=1200', 3, true),
('Festive Collection', 'festive-collection', 'Vibrant celebratory hues woven for Diwali and grand occasions', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1200', 4, true),
('Featured Sarees', 'featured-sarees', 'Handpicked curation celebrating premier Indian craftsmanship', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200', 5, true)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description, image_url = EXCLUDED.image_url;

-- 6. SEED BANNERS
INSERT INTO public.banners (title, subtitle, image_url, mobile_image_url, button_text, button_link, display_order, is_active) VALUES
(
    'The Royal Weaves of Banaras',
    'Handcrafted in pure katan silk with authentic gold zari kadwa craftsmanship.',
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=85&w=1920',
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=85&w=800',
    'Explore Silk Sarees',
    '/shop?category=banarasi-silk',
    1,
    true
),
(
    'Timeless Paithani Elegance',
    'Maharashtra’s heirloom drape woven with peacock pallu motifs and pure silk threads.',
    'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=85&w=1920',
    'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=85&w=800',
    'View Paithani Collection',
    '/shop?category=paithani',
    2,
    true
),
(
    'Bridal Kanjivaram Masterpieces',
    'Intricate korvai temple borders and heavy silver-gilt zari for your unforgettable milestone.',
    'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=85&w=1920',
    'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=85&w=800',
    'Discover Bridal Heritage',
    '/shop?collection=wedding-collection',
    3,
    true
);

-- 7. SEED DEMO PRODUCTS & INVENTORY
DO $$
DECLARE
    v_banarasi UUID;
    v_kanjivaram UUID;
    v_paithani UUID;
    v_cotton UUID;
    v_mul UUID;
    v_party UUID;

    v_prod_id UUID;
    v_coll_new UUID;
    v_coll_best UUID;
    v_coll_wedding UUID;
    v_coll_festive UUID;
    v_coll_featured UUID;
BEGIN
    SELECT id INTO v_banarasi FROM public.categories WHERE slug = 'banarasi-silk';
    SELECT id INTO v_kanjivaram FROM public.categories WHERE slug = 'kanjivaram-silk';
    SELECT id INTO v_paithani FROM public.categories WHERE slug = 'paithani';
    SELECT id INTO v_cotton FROM public.categories WHERE slug = 'pure-cotton';
    SELECT id INTO v_mul FROM public.categories WHERE slug = 'mul-cotton';
    SELECT id INTO v_party FROM public.categories WHERE slug = 'party-wear';

    SELECT id INTO v_coll_new FROM public.collections WHERE slug = 'new-arrivals';
    SELECT id INTO v_coll_best FROM public.collections WHERE slug = 'best-sellers';
    SELECT id INTO v_coll_wedding FROM public.collections WHERE slug = 'wedding-collection';
    SELECT id INTO v_coll_festive FROM public.collections WHERE slug = 'festive-collection';
    SELECT id INTO v_coll_featured FROM public.collections WHERE slug = 'featured-sarees';

    -- PRODUCT 1: Crimson Banarasi Katan Silk Saree
    INSERT INTO public.products (
        sku, name, slug, description, category_id,
        mrp, selling_price, fabric, colour, pattern, occasion,
        saree_length, blouse_piece, weight_grams,
        is_featured, is_best_seller, is_active,
        seo_title, seo_description
    ) VALUES (
        'CHK-BNR-001',
        'Crimson Heirloom Banarasi Katan Silk Saree',
        'crimson-heirloom-banarasi-katan-silk-saree',
        'Handcrafted in Varanasi on traditional pit looms, this magnificent Crimson Banarasi saree features rich Kadwa jangla motifs woven with pure antique gold zari. The royal floral jaal flows gracefully across the body, completed with a grand regal pallu.',
        v_banarasi,
        28500.00, 24500.00, 'Pure Katan Silk', 'Crimson Red', 'Floral Jangla', 'Bridal & Grand Wedding',
        '5.5 Meters', 'Unstitched 0.8m matching silk piece included', 820,
        true, true, true,
        'Crimson Heirloom Banarasi Katan Silk Saree | Chandrakor',
        'Pure Katan Silk Banarasi Saree with antique gold zari kadwa weave.'
    ) ON CONFLICT (sku) DO UPDATE SET mrp = EXCLUDED.mrp, selling_price = EXCLUDED.selling_price
    RETURNING id INTO v_prod_id;

    INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
    (v_prod_id, 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1000', 'Crimson Banarasi Saree Front Drape', 1, true),
    (v_prod_id, 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=1000', 'Crimson Banarasi Saree Pallu Detail', 2, false)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.inventory (product_id, quantity_available, quantity_reserved, low_stock_threshold)
    VALUES (v_prod_id, 8, 0, 3)
    ON CONFLICT (product_id) DO UPDATE SET quantity_available = 8;

    INSERT INTO public.inventory_movements (product_id, movement_type, quantity_change, notes)
    VALUES (v_prod_id, 'opening_stock', 8, 'Initial verified catalog stock');

    INSERT INTO public.collection_products (collection_id, product_id, display_order)
    VALUES (v_coll_featured, v_prod_id, 1), (v_coll_wedding, v_prod_id, 1), (v_coll_best, v_prod_id, 1)
    ON CONFLICT DO NOTHING;

    -- PRODUCT 2: Royal Peacock Blue Paithani Saree
    INSERT INTO public.products (
        sku, name, slug, description, category_id,
        mrp, selling_price, fabric, colour, pattern, occasion,
        saree_length, blouse_piece, weight_grams,
        is_featured, is_best_seller, is_active,
        seo_title, seo_description
    ) VALUES (
        'CHK-PTH-002',
        'Royal Peacock Blue Handwoven Paithani Saree',
        'royal-peacock-blue-handwoven-paithani-saree',
        'An authentic Yeola Paithani woven with fine mulberry silk. Highlighted by the iconic Mor-Popat (Peacock and Parrot) tapestry pallu and traditional Narali (coconut) zari borders.',
        v_paithani,
        32000.00, 27500.00, 'Pure Silk', 'Peacock Blue', 'Mor-Bangadi & Butti', 'Festive & Wedding',
        '5.5 Meters', 'Unstitched 0.8m running silk blouse', 780,
        true, true, true,
        'Royal Peacock Blue Paithani Saree | Chandrakor',
        'Authentic Yeola Paithani Saree with tapestry peacock pallu in pure silk.'
    ) ON CONFLICT (sku) DO UPDATE SET mrp = EXCLUDED.mrp, selling_price = EXCLUDED.selling_price
    RETURNING id INTO v_prod_id;

    INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
    (v_prod_id, 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=1000', 'Peacock Blue Paithani Saree Main', 1, true),
    (v_prod_id, 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1000', 'Peacock Blue Paithani Border Detail', 2, false)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.inventory (product_id, quantity_available, quantity_reserved, low_stock_threshold)
    VALUES (v_prod_id, 5, 0, 2)
    ON CONFLICT (product_id) DO UPDATE SET quantity_available = 5;

    INSERT INTO public.inventory_movements (product_id, movement_type, quantity_change, notes)
    VALUES (v_prod_id, 'opening_stock', 5, 'Initial verified catalog stock');

    INSERT INTO public.collection_products (collection_id, product_id, display_order)
    VALUES (v_coll_featured, v_prod_id, 2), (v_coll_festive, v_prod_id, 1), (v_coll_new, v_prod_id, 1)
    ON CONFLICT DO NOTHING;

    -- PRODUCT 3: Temple Border Emerald Green Kanjivaram Silk Saree
    INSERT INTO public.products (
        sku, name, slug, description, category_id,
        mrp, selling_price, fabric, colour, pattern, occasion,
        saree_length, blouse_piece, weight_grams,
        is_featured, is_best_seller, is_active,
        seo_title, seo_description
    ) VALUES (
        'CHK-KNJ-003',
        'Temple Border Emerald Green Kanjivaram Silk Saree',
        'temple-border-emerald-green-kanjivaram-silk-saree',
        'Woven in the ancient temple town of Kanchipuram using heavyweight mulberry silk and pure gold thread korvai technique. Features interlocking temple spires alongside a contrasting ruby-red border and brocade pallu.',
        v_kanjivaram,
        36500.00, 31000.00, 'Pure Kanchipuram Silk', 'Emerald Green with Ruby Red', 'Korvai Temple Motifs', 'Bridal & Traditional Ceremony',
        '5.5 Meters', 'Contrast Ruby Red 0.85m unstitched blouse', 910,
        true, false, true,
        'Emerald Green Kanjivaram Silk Saree | Chandrakor',
        'Original Kanchipuram Korvai Silk Saree with Temple Border.'
    ) ON CONFLICT (sku) DO UPDATE SET mrp = EXCLUDED.mrp, selling_price = EXCLUDED.selling_price
    RETURNING id INTO v_prod_id;

    INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
    (v_prod_id, 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=1000', 'Emerald Green Kanjivaram Full View', 1, true),
    (v_prod_id, 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1000', 'Kanjivaram Temple Border Weave', 2, false)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.inventory (product_id, quantity_available, quantity_reserved, low_stock_threshold)
    VALUES (v_prod_id, 4, 0, 2)
    ON CONFLICT (product_id) DO UPDATE SET quantity_available = 4;

    INSERT INTO public.inventory_movements (product_id, movement_type, quantity_change, notes)
    VALUES (v_prod_id, 'opening_stock', 4, 'Initial verified catalog stock');

    INSERT INTO public.collection_products (collection_id, product_id, display_order)
    VALUES (v_coll_wedding, v_prod_id, 2), (v_coll_featured, v_prod_id, 3)
    ON CONFLICT DO NOTHING;

    -- PRODUCT 4: Ivory & Antique Gold Chanderi Mul Cotton Saree
    INSERT INTO public.products (
        sku, name, slug, description, category_id,
        mrp, selling_price, fabric, colour, pattern, occasion,
        saree_length, blouse_piece, weight_grams,
        is_featured, is_best_seller, is_active,
        seo_title, seo_description
    ) VALUES (
        'CHK-COT-004',
        'Ivory & Antique Gold Handspun Mul Cotton Saree',
        'ivory-antique-gold-handspun-mul-cotton-saree',
        'An ethereal featherweight drape spun from premier mulmul cotton threads with subtle antique gold zari lines along the selvedge. Breathable, serene, and exquisitely poised for day celebrations.',
        v_mul,
        6500.00, 5200.00, 'Handspun Mulmul Cotton', 'Ivory Cream', 'Subtle Zari Stripes', 'Daytime Festive & Puja',
        '5.5 Meters', 'Matching ivory tone 0.8m blouse piece', 360,
        false, true, true,
        'Ivory Mul Cotton Saree | Chandrakor',
        'Handcrafted fine Mulmul Cotton saree with subtle antique zari.'
    ) ON CONFLICT (sku) DO UPDATE SET mrp = EXCLUDED.mrp, selling_price = EXCLUDED.selling_price
    RETURNING id INTO v_prod_id;

    INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
    (v_prod_id, 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1000', 'Ivory Cotton Saree Drape', 1, true)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.inventory (product_id, quantity_available, quantity_reserved, low_stock_threshold)
    VALUES (v_prod_id, 15, 0, 4)
    ON CONFLICT (product_id) DO UPDATE SET quantity_available = 15;

    INSERT INTO public.inventory_movements (product_id, movement_type, quantity_change, notes)
    VALUES (v_prod_id, 'opening_stock', 15, 'Initial verified catalog stock');

    INSERT INTO public.collection_products (collection_id, product_id, display_order)
    VALUES (v_coll_best, v_prod_id, 2), (v_coll_new, v_prod_id, 2)
    ON CONFLICT DO NOTHING;

    -- PRODUCT 5: Midnight Plum Zardozi Hand-Embroidered Saree
    INSERT INTO public.products (
        sku, name, slug, description, category_id,
        mrp, selling_price, fabric, colour, pattern, occasion,
        saree_length, blouse_piece, weight_grams,
        is_featured, is_best_seller, is_active,
        seo_title, seo_description
    ) VALUES (
        'CHK-DSG-005',
        'Midnight Plum Hand-Embroidered Zardozi Saree',
        'midnight-plum-hand-embroidered-zardozi-saree',
        'Rich fluid satin georgette drape rendered in deep midnight plum, embellished with hand-sewn dabka, sequins, and fine metallic wirework by our master karigars.',
        v_party,
        21000.00, 18500.00, 'Pure Satin Georgette', 'Midnight Plum', 'Scalloped Zardozi Border', 'Cocktail & Evening Reception',
        '5.5 Meters', 'Heavy embroidered designer blouse fabric 1m', 680,
        true, false, true,
        'Midnight Plum Zardozi Saree | Chandrakor',
        'Hand embroidered evening drape with exquisite zardozi scalloped border.'
    ) ON CONFLICT (sku) DO UPDATE SET mrp = EXCLUDED.mrp, selling_price = EXCLUDED.selling_price
    RETURNING id INTO v_prod_id;

    INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
    (v_prod_id, 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1000', 'Midnight Plum Saree Front', 1, true)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.inventory (product_id, quantity_available, quantity_reserved, low_stock_threshold)
    VALUES (v_prod_id, 6, 0, 2)
    ON CONFLICT (product_id) DO UPDATE SET quantity_available = 6;

    INSERT INTO public.inventory_movements (product_id, movement_type, quantity_change, notes)
    VALUES (v_prod_id, 'opening_stock', 6, 'Initial verified catalog stock');

    INSERT INTO public.collection_products (collection_id, product_id, display_order)
    VALUES (v_coll_festive, v_prod_id, 2), (v_coll_featured, v_prod_id, 4)
    ON CONFLICT DO NOTHING;

    -- PRODUCT 6: Mustard Ochre Traditional Pure Cotton Saree
    INSERT INTO public.products (
        sku, name, slug, description, category_id,
        mrp, selling_price, fabric, colour, pattern, occasion,
        saree_length, blouse_piece, weight_grams,
        is_featured, is_best_seller, is_active,
        seo_title, seo_description
    ) VALUES (
        'CHK-COT-006',
        'Mustard Ochre Jamdani Weave Pure Cotton Saree',
        'mustard-ochre-jamdani-weave-pure-cotton-saree',
        'Woven in fine Bengal handloom cotton, this mustard saree is speckled with delicate Jamdani floral motifs. Finished with a rust red border and contrast pallu tassels.',
        v_cotton,
        7800.00, 6400.00, 'Handloom Pure Cotton', 'Mustard Ochre', 'Jamdani Geometric Motifs', 'Festive Morning & Formal Wear',
        '5.5 Meters', 'Unstitched 0.8m contrast blouse included', 420,
        false, false, true,
        'Mustard Ochre Jamdani Cotton Saree | Chandrakor',
        'Pure handloom cotton saree with authentic floral Jamdani craftsmanship.'
    ) ON CONFLICT (sku) DO UPDATE SET mrp = EXCLUDED.mrp, selling_price = EXCLUDED.selling_price
    RETURNING id INTO v_prod_id;

    INSERT INTO public.product_images (product_id, image_url, alt_text, display_order, is_primary) VALUES
    (v_prod_id, 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=1000', 'Mustard Jamdani Saree Drape', 1, true)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.inventory (product_id, quantity_available, quantity_reserved, low_stock_threshold)
    VALUES (v_prod_id, 11, 0, 3)
    ON CONFLICT (product_id) DO UPDATE SET quantity_available = 11;

    INSERT INTO public.inventory_movements (product_id, movement_type, quantity_change, notes)
    VALUES (v_prod_id, 'opening_stock', 11, 'Initial verified catalog stock');

    INSERT INTO public.collection_products (collection_id, product_id, display_order)
    VALUES (v_coll_new, v_prod_id, 3)
    ON CONFLICT DO NOTHING;

END $$;
