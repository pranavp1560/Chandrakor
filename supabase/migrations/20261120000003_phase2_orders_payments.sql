-- Migration: 20261120000003_phase2_orders_payments.sql
-- Description: Phase 2 - Checkout, Orders, Payments, Inventory Reservations, Shipments, Invoices, Coupons, Returns, and Security

-- 1. CUSTOMERS & ADDRESSES
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_customers_mobile ON public.customers(mobile);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    landmark TEXT,
    address_type VARCHAR(20) DEFAULT 'home',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cust_addr_customer ON public.customer_addresses(customer_id);

-- 2. COUPONS & OFFERS
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
    min_order_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    max_discount_amount NUMERIC(10,2),
    usage_limit INT,
    usage_count INT NOT NULL DEFAULT 0,
    per_customer_limit INT NOT NULL DEFAULT 1,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);

-- 3. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(64) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_mobile TEXT NOT NULL,
    customer_email TEXT,
    shipping_address JSONB NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    shipping_charge NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (shipping_charge >= 0),
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('upi', 'card', 'netbanking', 'cod', 'razorpay')),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'authorized', 'paid', 'failed', 'partially_refunded', 'refunded')),
    order_status VARCHAR(30) NOT NULL DEFAULT 'pending_payment' CHECK (
        order_status IN (
            'pending_payment', 'pending_confirmation', 'confirmed',
            'processing', 'packed', 'shipped', 'delivered',
            'cancellation_requested', 'cancelled',
            'return_requested', 'returned', 'refund_initiated', 'refunded'
        )
    ),
    customer_notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_mobile ON public.orders(customer_mobile);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- 4. ORDER ITEMS (Immutable snapshots)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_sku TEXT NOT NULL,
    product_image TEXT,
    quantity INT NOT NULL CHECK (quantity > 0),
    mrp NUMERIC(12,2) NOT NULL CHECK (mrp >= 0),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(12,2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- 5. COUPON REDEMPTIONS
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_mobile TEXT NOT NULL,
    discount_amount NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON public.coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_mobile ON public.coupon_redemptions(customer_mobile);

-- 6. ORDER STATUS HISTORY
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by TEXT NOT NULL DEFAULT 'system',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_history_order ON public.order_status_history(order_id);

-- 7. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    gateway VARCHAR(30) NOT NULL, -- 'razorpay', 'cod'
    gateway_order_id TEXT,
    gateway_payment_id TEXT,
    payment_method VARCHAR(30),
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    gateway_response JSONB,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_payment ON public.payments(gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_order ON public.payments(gateway_order_id);

-- 8. REFUNDS
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    refund_amount NUMERIC(12,2) NOT NULL CHECK (refund_amount > 0),
    gateway_refund_id TEXT,
    reason TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'initiated',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_order ON public.refunds(order_id);

-- 9. SHIPMENTS (Manual Admin Shipping)
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    courier_name TEXT NOT NULL,
    tracking_number TEXT NOT NULL,
    tracking_url TEXT,
    dispatch_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expected_delivery TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    shipping_status VARCHAR(30) NOT NULL DEFAULT 'shipped' CHECK (
        shipping_status IN ('shipped', 'in_transit', 'out_for_delivery', 'delivered', 'returned')
    ),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_shipments_updated_at
BEFORE UPDATE ON public.shipments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_shipments_order ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON public.shipments(tracking_number);

-- 10. STOCK RESERVATIONS (Atomic concurrency protection)
CREATE TABLE IF NOT EXISTS public.stock_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'consumed', 'released', 'expired')
    ),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_stock_reservations_updated_at
BEFORE UPDATE ON public.stock_reservations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_reservations_order ON public.stock_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_reservations_product ON public.stock_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status_expires ON public.stock_reservations(status, expires_at);

-- 11. INVOICES (Immutable tax snapshots)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(64) UNIQUE NOT NULL,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    invoice_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    invoice_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_order ON public.invoices(order_id);

-- 12. RETURNS & REFUNDS WORKFLOW
CREATE TABLE IF NOT EXISTS public.returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'requested' CHECK (
        status IN ('requested', 'approved', 'rejected', 'item_received', 'refunded')
    ),
    admin_inspection_notes TEXT,
    item_condition VARCHAR(30) CHECK (item_condition IN ('sellable', 'damaged', 'unopened')),
    restocked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_returns_updated_at
BEFORE UPDATE ON public.returns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_returns_order ON public.returns(order_id);

-- 13. NOTIFICATION LOGS
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    recipient_email TEXT,
    recipient_mobile TEXT,
    notification_type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'email',
    subject TEXT,
    body TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'sent',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_order ON public.notification_logs(order_id);

-- 14. ROW-LEVEL SECURITY POLICIES
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Admin Full Access Policies
CREATE POLICY "Admin manage customers" ON public.customers FOR ALL USING (public.is_admin() OR current_user = 'postgres');
CREATE POLICY "Admin manage addresses" ON public.customer_addresses FOR ALL USING (public.is_admin() OR current_user = 'postgres');
CREATE POLICY "Admin manage coupons" ON public.coupons FOR ALL USING (public.is_admin() OR current_user = 'postgres');
CREATE POLICY "Public read active coupons" ON public.coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Admin manage coupon_redemptions" ON public.coupon_redemptions FOR ALL USING (public.is_admin() OR current_user = 'postgres');
CREATE POLICY "Admin manage orders" ON public.orders FOR ALL USING (public.is_admin() OR current_user = 'postgres');
CREATE POLICY "Admin manage order_items" ON public.order_items FOR ALL USING (public.is_admin() OR current_user = 'postgres');
CREATE POLICY "Admin manage status_history" ON public.order_status_history FOR ALL USING (public.is_admin() OR current_user = 'postgres');
CREATE POLICY "Admin manage payments" ON public.payments FOR ALL USING (public.is_admin() OR current_user = 'postgres');
CREATE POLICY "Admin manage refunds" ON public.refunds FOR ALL USING (public.is_admin() OR current_user = 'postgres');
CREATE POLICY "Admin manage shipments" ON public.shipments FOR ALL USING (public.is_admin() OR current_user = 'postgres');
CREATE POLICY "Admin manage stock_reservations" ON public.stock_reservations FOR ALL USING (public.is_admin() OR current_user = 'postgres');
CREATE POLICY "Admin manage invoices" ON public.invoices FOR ALL USING (public.is_admin() OR current_user = 'postgres');
CREATE POLICY "Admin manage returns" ON public.returns FOR ALL USING (public.is_admin() OR current_user = 'postgres');
CREATE POLICY "Admin manage notification_logs" ON public.notification_logs FOR ALL USING (public.is_admin() OR current_user = 'postgres');

-- Add new RBAC permissions for Phase 2
INSERT INTO public.permissions (permission_key, description) VALUES
('orders:read', 'View customer orders and order status'),
('orders:manage', 'Confirm, process, pack, and cancel orders'),
('shipments:manage', 'Add courier tracking details and update shipment status'),
('refunds:manage', 'Authorize and process customer refunds and returns'),
('coupons:manage', 'Create and manage promotional discount coupons')
ON CONFLICT (permission_key) DO NOTHING;

-- Grant permissions to Super Admin and Order Manager
DO $$
DECLARE
    v_super_admin UUID;
    v_order_mgr UUID;
BEGIN
    SELECT id INTO v_super_admin FROM public.roles WHERE name = 'Super Admin';
    SELECT id INTO v_order_mgr FROM public.roles WHERE name = 'Order Manager';

    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_super_admin, id FROM public.permissions
    ON CONFLICT DO NOTHING;

    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_order_mgr, id FROM public.permissions
    WHERE permission_key IN ('orders:read', 'orders:manage', 'shipments:manage', 'refunds:manage', 'inventory:read')
    ON CONFLICT DO NOTHING;
END $$;

-- 15. SEED INITIAL COUPONS & PAYMENT SETTINGS
INSERT INTO public.coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, per_customer_limit, is_active)
VALUES
('CHANDRAKOR10', '10% Heirloom Welcome Discount (up to ₹3,000)', 'percentage', 10.00, 5000.00, 3000.00, 500, 1, true),
('FESTIVE2500', 'Flat ₹2,500 Off on Grand Bridal & Wedding Weaves', 'fixed', 2500.00, 20000.00, NULL, 200, 1, true),
('WELCOME500', 'Flat ₹500 Off on your First Handloom Saree', 'fixed', 500.00, 3000.00, NULL, 1000, 1, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.store_settings (setting_key, setting_value)
VALUES
('payment_settings', jsonb_build_object(
    'cod_enabled', true,
    'cod_min_amount', 500.00,
    'cod_max_amount', 50000.00,
    'online_payment_enabled', true,
    'free_shipping_threshold', 0.00,
    'standard_shipping_fee', 0.00,
    'gst_percentage', 5.00
))
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = EXCLUDED.setting_value;

-- ====================================================================
-- 16. ATOMIC TRANSACTIONAL FUNCTIONS (CORE E-COMMERCE ENGINE)
-- ====================================================================

-- A. COUPON VALIDATION RPC
CREATE OR REPLACE FUNCTION public.validate_coupon(
    p_code TEXT,
    p_cart_subtotal NUMERIC,
    p_customer_mobile TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_coupon RECORD;
    v_discount NUMERIC := 0;
    v_usage_by_customer INT := 0;
BEGIN
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE UPPER(code) = UPPER(TRIM(p_code)) AND is_active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'message', 'Invalid or expired promotional coupon code.');
    END IF;

    IF v_coupon.start_date IS NOT NULL AND v_coupon.start_date > NOW() THEN
        RETURN jsonb_build_object('valid', false, 'message', 'Coupon offer has not commenced yet.');
    END IF;

    IF v_coupon.end_date IS NOT NULL AND v_coupon.end_date < NOW() THEN
        RETURN jsonb_build_object('valid', false, 'message', 'This promotional coupon code has expired.');
    END IF;

    IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN
        RETURN jsonb_build_object('valid', false, 'message', 'Coupon redemption quota has been fully exhausted.');
    END IF;

    IF p_cart_subtotal < v_coupon.min_order_amount THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message', format('Minimum cart value of ₹%s required to apply this coupon.', v_coupon.min_order_amount)
        );
    END IF;

    IF p_customer_mobile IS NOT NULL AND TRIM(p_customer_mobile) <> '' THEN
        SELECT COUNT(*) INTO v_usage_by_customer
        FROM public.coupon_redemptions
        WHERE coupon_id = v_coupon.id AND customer_mobile = TRIM(p_customer_mobile);

        IF v_usage_by_customer >= v_coupon.per_customer_limit THEN
            RETURN jsonb_build_object('valid', false, 'message', 'You have already utilized this promotional coupon code.');
        END IF;
    END IF;

    -- Calculate Discount
    IF v_coupon.discount_type = 'percentage' THEN
        v_discount := ROUND((p_cart_subtotal * (v_coupon.discount_value / 100.0)), 2);
        IF v_coupon.max_discount_amount IS NOT NULL AND v_discount > v_coupon.max_discount_amount THEN
            v_discount := v_coupon.max_discount_amount;
        END IF;
    ELSE
        v_discount := v_coupon.discount_value;
        IF v_discount > p_cart_subtotal THEN
            v_discount := p_cart_subtotal;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'valid', true,
        'coupon_id', v_coupon.id,
        'code', v_coupon.code,
        'discount_type', v_coupon.discount_type,
        'discount_value', v_coupon.discount_value,
        'discount_amount', v_discount,
        'message', format('₹%s discount applied successfully!', v_discount)
    );
END;
$$;

-- B. ATOMIC ORDER CREATION RPC
CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_customer_name TEXT,
    p_customer_mobile TEXT,
    p_customer_email TEXT,
    p_shipping_address JSONB,
    p_items JSONB, -- Array of {product_id, quantity}
    p_payment_method TEXT, -- 'upi', 'card', 'netbanking', 'cod'
    p_customer_notes TEXT DEFAULT NULL,
    p_coupon_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_customer_id UUID;
    v_item JSONB;
    v_prod RECORD;
    v_inv RECORD;
    v_subtotal NUMERIC := 0.00;
    v_discount NUMERIC := 0.00;
    v_coupon_id UUID := NULL;
    v_tax_amount NUMERIC := 0.00;
    v_shipping_charge NUMERIC := 0.00;
    v_total_amount NUMERIC := 0.00;
    v_order_status VARCHAR(30);
    v_payment_status VARCHAR(30) := 'pending';
    v_coupon_res JSONB;
    v_item_line_total NUMERIC;
    v_item_tax NUMERIC;
    v_seq_suffix INT;
BEGIN
    -- Input sanitization
    IF TRIM(COALESCE(p_customer_name, '')) = '' THEN
        RAISE EXCEPTION 'Customer full name is required.';
    END IF;
    IF TRIM(COALESCE(p_customer_mobile, '')) = '' OR LENGTH(REGEXP_REPLACE(p_customer_mobile, '[^0-9]', '', 'g')) < 10 THEN
        RAISE EXCEPTION 'Valid 10-digit mobile number is required.';
    END IF;
    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Cannot create an order with zero items.';
    END IF;

    -- Validate payment method
    IF p_payment_method NOT IN ('upi', 'card', 'netbanking', 'cod') THEN
        RAISE EXCEPTION 'Unsupported payment method: %', p_payment_method;
    END IF;

    -- 1. Create or Find Customer
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE mobile = TRIM(p_customer_mobile)
    LIMIT 1;

    IF v_customer_id IS NULL THEN
        INSERT INTO public.customers (full_name, mobile, email)
        VALUES (TRIM(p_customer_name), TRIM(p_customer_mobile), NULLIF(TRIM(p_customer_email), ''))
        RETURNING id INTO v_customer_id;
    ELSE
        UPDATE public.customers
        SET full_name = TRIM(p_customer_name),
            email = COALESCE(NULLIF(TRIM(p_customer_email), ''), email),
            updated_at = NOW()
        WHERE id = v_customer_id;
    END IF;

    -- Save customer address history
    INSERT INTO public.customer_addresses (
        customer_id, full_name, mobile, address_line_1, address_line_2,
        city, state, pincode, landmark, address_type
    ) VALUES (
        v_customer_id,
        TRIM(p_customer_name),
        TRIM(p_customer_mobile),
        COALESCE(p_shipping_address->>'address_line_1', ''),
        p_shipping_address->>'address_line_2',
        COALESCE(p_shipping_address->>'city', ''),
        COALESCE(p_shipping_address->>'state', ''),
        COALESCE(p_shipping_address->>'pincode', ''),
        p_shipping_address->>'landmark',
        COALESCE(p_shipping_address->>'address_type', 'home')
    );

    -- 2. Verify Products and Inventory Availability (Row Locking)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Lock product
        SELECT * INTO v_prod
        FROM public.products
        WHERE id = (v_item->>'product_id')::UUID AND is_active = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % is unavailable or deactivated.', v_item->>'product_id';
        END IF;

        -- Lock inventory row FOR UPDATE
        SELECT * INTO v_inv
        FROM public.inventory
        WHERE product_id = v_prod.id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Inventory record missing for % (%)', v_prod.name, v_prod.sku;
        END IF;

        -- Concurrency check: physical stock minus existing active reservations
        IF (v_inv.quantity_available - v_inv.quantity_reserved) < (v_item->>'quantity')::INT THEN
            RAISE EXCEPTION 'Insufficient stock for "%" (SKU: %). Only % pieces available.',
                v_prod.name, v_prod.sku, (v_inv.quantity_available - v_inv.quantity_reserved);
        END IF;

        -- Accumulate subtotal using official database selling_price (never trust client!)
        v_subtotal := v_subtotal + (v_prod.selling_price * (v_item->>'quantity')::INT);
    END LOOP;

    -- 3. Validate Coupon if provided
    IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) <> '' THEN
        v_coupon_res := public.validate_coupon(p_coupon_code, v_subtotal, p_customer_mobile);
        IF (v_coupon_res->>'valid')::BOOLEAN THEN
            v_coupon_id := (v_coupon_res->>'coupon_id')::UUID;
            v_discount := (v_coupon_res->>'discount_amount')::NUMERIC;
        END IF;
    END IF;

    -- 4. Shipping & Tax Calculation (GST 5% included in luxury handloom retail)
    v_shipping_charge := 0.00; -- Complimentary Pan-India shipping
    v_total_amount := GREATEST(0.00, v_subtotal - v_discount + v_shipping_charge);
    v_tax_amount := ROUND((v_total_amount * 5.0) / 105.0, 2); -- 5% inclusive GST

    -- Status logic
    IF p_payment_method = 'cod' THEN
        v_order_status := 'pending_confirmation';
        v_payment_status := 'pending';
    ELSE
        v_order_status := 'pending_payment';
        v_payment_status := 'pending';
    END IF;

    -- Generate Unique Human-Readable Order Number (e.g. CHK-202611-8492)
    v_seq_suffix := FLOOR(1000 + RANDOM() * 9000)::INT;
    v_order_number := 'CHK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || v_seq_suffix::TEXT;

    -- 5. Insert Order Header
    INSERT INTO public.orders (
        order_number, customer_id, customer_name, customer_mobile, customer_email,
        shipping_address, subtotal, discount_amount, shipping_charge, tax_amount,
        total_amount, coupon_id, payment_method, payment_status, order_status,
        customer_notes
    ) VALUES (
        v_order_number, v_customer_id, TRIM(p_customer_name), TRIM(p_customer_mobile),
        NULLIF(TRIM(p_customer_email), ''), p_shipping_address, v_subtotal, v_discount,
        v_shipping_charge, v_tax_amount, v_total_amount, v_coupon_id, p_payment_method,
        v_payment_status, v_order_status, p_customer_notes
    ) RETURNING id INTO v_order_id;

    -- 6. Insert Order Items & Reserve Stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT * INTO v_prod FROM public.products WHERE id = (v_item->>'product_id')::UUID;

        v_item_line_total := v_prod.selling_price * (v_item->>'quantity')::INT;
        v_item_tax := ROUND((v_item_line_total * 5.0) / 105.0, 2);

        -- Insert snapshot item
        INSERT INTO public.order_items (
            order_id, product_id, product_name, product_sku,
            product_image, quantity, mrp, unit_price,
            discount_amount, tax_rate, tax_amount, line_total
        ) VALUES (
            v_order_id,
            v_prod.id,
            v_prod.name,
            v_prod.sku,
            COALESCE(v_item->>'product_image', (SELECT image_url FROM public.product_images WHERE product_id = v_prod.id AND is_primary = true LIMIT 1)),
            (v_item->>'quantity')::INT,
            v_prod.mrp,
            v_prod.selling_price,
            0.00,
            5.00,
            v_item_tax,
            v_item_line_total
        );

        -- Create Stock Reservation
        INSERT INTO public.stock_reservations (
            order_id, product_id, quantity, status, expires_at
        ) VALUES (
            v_order_id,
            v_prod.id,
            (v_item->>'quantity')::INT,
            'active',
            NOW() + INTERVAL '30 minutes'
        );

        -- Atomically increment quantity_reserved on physical inventory
        UPDATE public.inventory
        SET quantity_reserved = quantity_reserved + (v_item->>'quantity')::INT,
            updated_at = NOW()
        WHERE product_id = v_prod.id;
    END LOOP;

    -- Record initial order status history
    INSERT INTO public.order_status_history (
        order_id, old_status, new_status, changed_by, notes
    ) VALUES (
        v_order_id,
        NULL,
        v_order_status,
        'customer',
        format('Order placed via %s (%s)', UPPER(p_payment_method), v_order_status)
    );

    -- Record coupon redemption if applied
    IF v_coupon_id IS NOT NULL THEN
        INSERT INTO public.coupon_redemptions (
            coupon_id, order_id, customer_id, customer_mobile, discount_amount
        ) VALUES (
            v_coupon_id, v_order_id, v_customer_id, TRIM(p_customer_mobile), v_discount
        );

        UPDATE public.coupons
        SET usage_count = usage_count + 1,
            updated_at = NOW()
        WHERE id = v_coupon_id;
    END IF;

    -- If COD, initialize payment row and log notification
    IF p_payment_method = 'cod' THEN
        INSERT INTO public.payments (
            order_id, gateway, payment_method, amount, currency, status
        ) VALUES (
            v_order_id, 'cod', 'cod', v_total_amount, 'INR', 'pending'
        );

        INSERT INTO public.notification_logs (
            order_id, recipient_email, recipient_mobile, notification_type, channel,
            subject, body
        ) VALUES (
            v_order_id,
            NULLIF(TRIM(p_customer_email), ''),
            TRIM(p_customer_mobile),
            'cod_order_received',
            'email',
            format('Chandrakor Heirloom Order Received: %s', v_order_number),
            format('Thank you for choosing Chandrakor. Your Cash on Delivery order %s for ₹%s has been received and awaits boutique verification.', v_order_number, v_total_amount)
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'customer_id', v_customer_id,
        'subtotal', v_subtotal,
        'discount_amount', v_discount,
        'tax_amount', v_tax_amount,
        'shipping_charge', v_shipping_charge,
        'total_amount', v_total_amount,
        'payment_method', p_payment_method,
        'payment_status', v_payment_status,
        'order_status', v_order_status
    );
END;
$$;

-- C. ATOMIC ONLINE PAYMENT CONFIRMATION RPC
CREATE OR REPLACE FUNCTION public.confirm_online_payment(
    p_order_id UUID,
    p_gateway_payment_id TEXT,
    p_gateway_order_id TEXT DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'upi',
    p_gateway_signature TEXT DEFAULT NULL,
    p_gateway_response JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_res RECORD;
    v_invoice_number TEXT;
    v_inv_data JSONB;
    v_seq_num INT;
BEGIN
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found: %', p_order_id;
    END IF;

    -- Idempotency check: if already confirmed/paid, return success
    IF v_order.payment_status = 'paid' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Order already paid.', 'order_number', v_order.order_number);
    END IF;

    -- Update Order Payment & Status
    UPDATE public.orders
    SET payment_status = 'paid',
        order_status = 'confirmed',
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Finalize Stock Deduction & Release Reservation
    FOR v_res IN
        SELECT * FROM public.stock_reservations
        WHERE order_id = p_order_id AND status = 'active'
    LOOP
        -- Deduct from physical available stock and release reserved
        UPDATE public.inventory
        SET quantity_available = quantity_available - v_res.quantity,
            quantity_reserved = GREATEST(0, quantity_reserved - v_res.quantity),
            updated_at = NOW()
        WHERE product_id = v_res.product_id;

        -- Mark reservation consumed
        UPDATE public.stock_reservations
        SET status = 'consumed',
            updated_at = NOW()
        WHERE id = v_res.id;

        -- Record immutable inventory movement audit
        INSERT INTO public.inventory_movements (
            product_id, movement_type, quantity_change, reference_type,
            reference_id, notes
        ) VALUES (
            v_res.product_id,
            'order_fulfilled',
            -v_res.quantity,
            'order',
            v_order.order_number,
            format('Order fulfilled via Razorpay (%s)', p_gateway_payment_id)
        );
    END LOOP;

    -- Record Payment Row
    INSERT INTO public.payments (
        order_id, gateway, gateway_order_id, gateway_payment_id,
        payment_method, amount, currency, status, gateway_response, paid_at
    ) VALUES (
        p_order_id,
        'razorpay',
        p_gateway_order_id,
        p_gateway_payment_id,
        COALESCE(p_payment_method, 'online'),
        v_order.total_amount,
        'INR',
        'captured',
        p_gateway_response,
        NOW()
    );

    -- Record Status History
    INSERT INTO public.order_status_history (
        order_id, old_status, new_status, changed_by, notes
    ) VALUES (
        p_order_id,
        v_order.order_status,
        'confirmed',
        'razorpay',
        format('Payment captured successfully (Payment ID: %s)', p_gateway_payment_id)
    );

    -- Generate Immutable Tax Invoice
    v_seq_num := FLOOR(1000 + RANDOM() * 9000)::INT;
    v_invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || v_seq_num::TEXT;

    v_inv_data := jsonb_build_object(
        'invoice_number', v_invoice_number,
        'order_number', v_order.order_number,
        'invoice_date', NOW(),
        'customer_name', v_order.customer_name,
        'customer_mobile', v_order.customer_mobile,
        'customer_email', v_order.customer_email,
        'shipping_address', v_order.shipping_address,
        'subtotal', v_order.subtotal,
        'discount_amount', v_order.discount_amount,
        'shipping_charge', v_order.shipping_charge,
        'tax_amount', v_order.tax_amount,
        'total_amount', v_order.total_amount,
        'payment_method', COALESCE(p_payment_method, 'online'),
        'payment_id', p_gateway_payment_id,
        'store_name', 'Chandrakor',
        'store_address', '108 Heritage Boulevard, Kala Ghoda, Mumbai 400001, Maharashtra, India',
        'gstin', '27AABCC1234D1Z5'
    );

    INSERT INTO public.invoices (invoice_number, order_id, invoice_data)
    VALUES (v_invoice_number, p_order_id, v_inv_data)
    ON CONFLICT (invoice_number) DO NOTHING;

    -- Log Customer Notification
    INSERT INTO public.notification_logs (
        order_id, recipient_email, recipient_mobile, notification_type, channel,
        subject, body
    ) VALUES (
        p_order_id,
        v_order.customer_email,
        v_order.customer_mobile,
        'payment_success',
        'email',
        format('Payment Confirmed: Chandrakor Order %s', v_order.order_number),
        format('We have confirmed your payment of ₹%s for order %s. Your heirloom weave is being prepared for dispatch.', v_order.total_amount, v_order.order_number)
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_number', v_order.order_number,
        'invoice_number', v_invoice_number,
        'status', 'confirmed'
    );
END;
$$;

-- D. ORDER CANCELLATION RPC (With stock reversal / reservation release)
CREATE OR REPLACE FUNCTION public.cancel_order_atomic(
    p_order_id UUID,
    p_reason TEXT DEFAULT NULL,
    p_cancelled_by TEXT DEFAULT 'admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_res RECORD;
    v_item RECORD;
BEGIN
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found: %', p_order_id;
    END IF;

    IF v_order.order_status IN ('cancelled', 'delivered', 'returned') THEN
        RAISE EXCEPTION 'Cannot cancel order in "%" status.', v_order.order_status;
    END IF;

    -- 1. Handle Active Reservations (not yet deducted from physical stock)
    FOR v_res IN
        SELECT * FROM public.stock_reservations
        WHERE order_id = p_order_id AND status = 'active'
    LOOP
        UPDATE public.inventory
        SET quantity_reserved = GREATEST(0, quantity_reserved - v_res.quantity),
            updated_at = NOW()
        WHERE product_id = v_res.product_id;

        UPDATE public.stock_reservations
        SET status = 'released',
            updated_at = NOW()
        WHERE id = v_res.id;
    END LOOP;

    -- 2. Handle Consumed Stock (order was confirmed and physically deducted)
    IF v_order.order_status IN ('confirmed', 'processing', 'packed') THEN
        FOR v_item IN
            SELECT * FROM public.order_items WHERE order_id = p_order_id
        LOOP
            IF v_item.product_id IS NOT NULL THEN
                UPDATE public.inventory
                SET quantity_available = quantity_available + v_item.quantity,
                    updated_at = NOW()
                WHERE product_id = v_item.product_id;

                INSERT INTO public.inventory_movements (
                    product_id, movement_type, quantity_change, reference_type,
                    reference_id, notes
                ) VALUES (
                    v_item.product_id,
                    'order_cancelled',
                    v_item.quantity,
                    'order',
                    v_order.order_number,
                    format('Stock restored due to cancellation: %s', COALESCE(p_reason, ''))
                );
            END IF;
        END LOOP;
    END IF;

    -- Update Order Status
    UPDATE public.orders
    SET order_status = 'cancelled',
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Record Status History
    INSERT INTO public.order_status_history (
        order_id, old_status, new_status, changed_by, notes
    ) VALUES (
        p_order_id,
        v_order.order_status,
        'cancelled',
        p_cancelled_by,
        COALESCE(p_reason, 'Order cancelled by administrator')
    );

    -- Log Notification
    INSERT INTO public.notification_logs (
        order_id, recipient_email, recipient_mobile, notification_type, channel,
        subject, body
    ) VALUES (
        p_order_id,
        v_order.customer_email,
        v_order.customer_mobile,
        'order_cancelled',
        'email',
        format('Chandrakor Order Cancelled: %s', v_order.order_number),
        format('Your order %s has been cancelled. Reason: %s', v_order.order_number, COALESCE(p_reason, 'As requested'))
    );

    RETURN jsonb_build_object('success', true, 'order_number', v_order.order_number);
END;
$$;

-- E. SAVE MANUAL SHIPMENT DETAILS RPC
CREATE OR REPLACE FUNCTION public.save_shipment_details(
    p_order_id UUID,
    p_courier_name TEXT,
    p_tracking_number TEXT,
    p_tracking_url TEXT DEFAULT NULL,
    p_dispatch_date TIMESTAMPTZ DEFAULT NOW(),
    p_expected_delivery TIMESTAMPTZ DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_shipment_id UUID;
BEGIN
    IF NOT (public.is_admin() OR current_user = 'postgres') THEN
        RAISE EXCEPTION 'Unauthorized: only staff can record shipments.';
    END IF;

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found: %', p_order_id;
    END IF;

    -- Insert or Update Shipment on unique order_id
    INSERT INTO public.shipments (
        order_id, courier_name, tracking_number, tracking_url,
        dispatch_date, expected_delivery, shipping_status, notes
    ) VALUES (
        p_order_id,
        TRIM(p_courier_name),
        TRIM(p_tracking_number),
        NULLIF(TRIM(p_tracking_url), ''),
        COALESCE(p_dispatch_date, NOW()),
        p_expected_delivery,
        'shipped',
        p_notes
    )
    ON CONFLICT (order_id) DO UPDATE
    SET courier_name = EXCLUDED.courier_name,
        tracking_number = EXCLUDED.tracking_number,
        tracking_url = EXCLUDED.tracking_url,
        dispatch_date = EXCLUDED.dispatch_date,
        expected_delivery = EXCLUDED.expected_delivery,
        shipping_status = 'shipped',
        notes = EXCLUDED.notes,
        updated_at = NOW()
    RETURNING id INTO v_shipment_id;

    -- Update Order status to shipped
    UPDATE public.orders
    SET order_status = 'shipped',
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Record Status History
    INSERT INTO public.order_status_history (
        order_id, old_status, new_status, changed_by, notes
    ) VALUES (
        p_order_id,
        v_order.order_status,
        'shipped',
        'admin',
        format('Dispatched via %s (AWB: %s)', p_courier_name, p_tracking_number)
    );

    -- Log Notification
    INSERT INTO public.notification_logs (
        order_id, recipient_email, recipient_mobile, notification_type, channel,
        subject, body
    ) VALUES (
        p_order_id,
        v_order.customer_email,
        v_order.customer_mobile,
        'order_shipped',
        'email',
        format('Chandrakor Heirloom Saree Shipped: %s', v_order.order_number),
        format('Your saree has been dispatched via %s with tracking number %s. Track your shipment at %s', p_courier_name, p_tracking_number, COALESCE(p_tracking_url, 'your tracking page'))
    );

    RETURN jsonb_build_object('success', true, 'order_id', p_order_id, 'shipping_status', 'shipped');
END;
$$;

-- F. SECURE PUBLIC ORDER TRACKING RPC (Zero unauthorized data leak)
CREATE OR REPLACE FUNCTION public.track_order_secure(
    p_order_number TEXT,
    p_mobile TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_items JSONB;
    v_shipment JSONB;
    v_history JSONB;
    v_clean_mobile TEXT;
BEGIN
    v_clean_mobile := REGEXP_REPLACE(p_mobile, '[^0-9]', '', 'g');

    SELECT * INTO v_order
    FROM public.orders
    WHERE UPPER(TRIM(order_number)) = UPPER(TRIM(p_order_number))
      AND REGEXP_REPLACE(customer_mobile, '[^0-9]', '', 'g') = v_clean_mobile;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('found', false, 'message', 'No matching order found for provided order number and mobile.');
    END IF;

    -- Fetch Items
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'product_name', product_name,
            'product_sku', product_sku,
            'product_image', product_image,
            'quantity', quantity,
            'unit_price', unit_price,
            'line_total', line_total
        )
    ), '[]'::jsonb) INTO v_items
    FROM public.order_items
    WHERE order_id = v_order.id;

    -- Fetch Shipment
    SELECT row_to_json(s)::jsonb INTO v_shipment
    FROM (
        SELECT courier_name, tracking_number, tracking_url, dispatch_date, expected_delivery, delivered_at, shipping_status
        FROM public.shipments
        WHERE order_id = v_order.id
        ORDER BY created_at DESC
        LIMIT 1
    ) s;

    -- Fetch Public History timeline
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'status', new_status,
            'notes', notes,
            'created_at', created_at
        ) ORDER BY created_at ASC
    ), '[]'::jsonb) INTO v_history
    FROM public.order_status_history
    WHERE order_id = v_order.id;

    RETURN jsonb_build_object(
        'found', true,
        'order_number', v_order.order_number,
        'order_date', v_order.created_at,
        'customer_name', v_order.customer_name,
        'shipping_address', v_order.shipping_address,
        'subtotal', v_order.subtotal,
        'discount_amount', v_order.discount_amount,
        'shipping_charge', v_order.shipping_charge,
        'total_amount', v_order.total_amount,
        'payment_method', v_order.payment_method,
        'payment_status', v_order.payment_status,
        'order_status', v_order.order_status,
        'items', v_items,
        'shipment', v_shipment,
        'timeline', v_history
    );
END;
$$;

-- G. RELEASE EXPIRED RESERVATIONS CRON HELPER
CREATE OR REPLACE FUNCTION public.release_expired_reservations()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_res RECORD;
    v_count INT := 0;
BEGIN
    FOR v_res IN
        SELECT sr.*
        FROM public.stock_reservations sr
        JOIN public.orders o ON sr.order_id = o.id
        WHERE sr.status = 'active'
          AND sr.expires_at < NOW()
          AND o.payment_status = 'pending'
          AND o.order_status = 'pending_payment'
    LOOP
        -- Release reserved stock
        UPDATE public.inventory
        SET quantity_reserved = GREATEST(0, quantity_reserved - v_res.quantity),
            updated_at = NOW()
        WHERE product_id = v_res.product_id;

        UPDATE public.stock_reservations
        SET status = 'expired',
            updated_at = NOW()
        WHERE id = v_res.id;

        UPDATE public.orders
        SET order_status = 'cancelled',
            updated_at = NOW()
        WHERE id = v_res.order_id;

        INSERT INTO public.order_status_history (
            order_id, old_status, new_status, changed_by, notes
        ) VALUES (
            v_res.order_id,
            'pending_payment',
            'cancelled',
            'system',
            'Checkout session expired (30 minute reservation window elapsed)'
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;
