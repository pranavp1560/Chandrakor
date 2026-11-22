-- Migration: 20261121000004_wishlist.sql
-- Description: Customer Wishlist schema, constraints, indexes, triggers, and RLS policies

BEGIN;

CREATE TABLE IF NOT EXISTS public.customer_wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    session_id TEXT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_wishlists_customer_id ON public.customer_wishlists(customer_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_session_id ON public.customer_wishlists(session_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON public.customer_wishlists(product_id);

-- Enforce uniqueness per customer or per session
CREATE UNIQUE INDEX IF NOT EXISTS uq_wishlist_customer_product 
ON public.customer_wishlists (customer_id, product_id) 
WHERE customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_wishlist_session_product 
ON public.customer_wishlists (session_id, product_id) 
WHERE session_id IS NOT NULL;

-- Updated at trigger
DROP TRIGGER IF EXISTS trg_customer_wishlists_updated_at ON public.customer_wishlists;
CREATE TRIGGER trg_customer_wishlists_updated_at
BEFORE UPDATE ON public.customer_wishlists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.customer_wishlists ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to ensure idempotency
DROP POLICY IF EXISTS "Public read wishlists" ON public.customer_wishlists;
DROP POLICY IF EXISTS "Public insert wishlists" ON public.customer_wishlists;
DROP POLICY IF EXISTS "Public update wishlists" ON public.customer_wishlists;
DROP POLICY IF EXISTS "Public delete wishlists" ON public.customer_wishlists;
DROP POLICY IF EXISTS "Admin manage wishlists" ON public.customer_wishlists;

-- Public policies for guest & customer browsing
CREATE POLICY "Public read wishlists" ON public.customer_wishlists
FOR SELECT
USING (true);

CREATE POLICY "Public insert wishlists" ON public.customer_wishlists
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update wishlists" ON public.customer_wishlists
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public delete wishlists" ON public.customer_wishlists
FOR DELETE
USING (true);

CREATE POLICY "Admin manage wishlists" ON public.customer_wishlists
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

COMMIT;
