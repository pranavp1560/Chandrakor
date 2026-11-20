// ==========================================
// CHANDRAKOR SHARED TYPES DEFINITION
// Matches live Supabase Schema (redrcbdmoxfamzkqamrg)
// ==========================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Nested relation
  subcategories?: Category[];
  parent?: Category;
  product_count?: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  quantity_available: number;
  quantity_reserved: number;
  low_stock_threshold: number;
  updated_at: string;
}

export type MovementType =
  | 'opening_stock'
  | 'manual_adjustment'
  | 'restock'
  | 'damaged'
  | 'audit'
  | 'order_reserved'
  | 'order_fulfilled'
  | 'order_cancelled';

export interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type: MovementType;
  quantity_change: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string;
  mrp: number;
  selling_price: number;
  fabric: string | null;
  colour: string | null;
  pattern: string | null;
  occasion: string | null;
  saree_length: string | null;
  blouse_piece: string | null;
  weight_grams: number | null;
  is_featured: boolean;
  is_best_seller: boolean;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;

  // Joined relationships
  category?: Category;
  images?: ProductImage[];
  inventory?: Inventory;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  mobile_image_url: string | null;
  button_text: string | null;
  button_link: string | null;
  display_order: number;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  product_count?: number;
  products?: Product[];
}

export interface CollectionProduct {
  id: string;
  collection_id: string;
  product_id: string;
  display_order: number;
}

export interface StoreProfileSettings {
  store_name: string;
  tagline: string;
  support_email: string;
  support_phone: string;
  address: string;
  currency: string;
  currency_symbol: string;
  tax_percentage: number;
}

export interface AnnouncementSettings {
  is_active: boolean;
  message: string;
  link?: string;
}

export interface BrandInfoSettings {
  about: string;
  heritage_year: string;
  craftsmanship_note: string;
}

export interface PaymentSettings {
  cod_enabled: boolean;
  cod_min_amount: number;
  cod_max_amount: number;
  online_payment_enabled: boolean;
  free_shipping_threshold: number;
  standard_shipping_fee: number;
  gst_percentage: number;
}

export interface StoreSetting<T = any> {
  id: string;
  setting_key: string;
  setting_value: T;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Permission {
  id: string;
  permission_key: string;
  description: string | null;
}

export interface AdminProfile {
  id: string;
  full_name: string;
  email: string;
  role_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role?: Role;
}

export interface AdminActivityLog {
  id: string;
  admin_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  created_at: string;
}

// Shopping Cart Types
export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  price: number;
  mrp: number;
  imageUrl: string;
  fabric?: string | null;
  colour?: string | null;
  quantity: number;
  maxAvailable: number;
}

export interface CartSummary {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  totalMrp: number;
  totalDiscount: number;
  shipping: number;
  tax: number;
  total: number;
}

// ==========================================
// PHASE 2: CUSTOMERS, ORDERS & CHECKOUT TYPES
// ==========================================

export interface Customer {
  id: string;
  full_name: string;
  mobile: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  full_name: string;
  mobile: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark?: string | null;
  address_type: 'home' | 'office';
  created_at: string;
}

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'cod' | 'razorpay';

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'paid'
  | 'failed'
  | 'partially_refunded'
  | 'refunded';

export type OrderStatus =
  | 'pending_payment'
  | 'pending_confirmation'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancellation_requested'
  | 'cancelled'
  | 'return_requested'
  | 'returned'
  | 'refund_initiated'
  | 'refunded';

export interface ShippingAddressData {
  full_name?: string;
  fullName?: string;
  mobile?: string;
  address_line_1?: string;
  addressLine1?: string;
  address_line_2?: string | null;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark?: string | null;
  address_type?: string;
  addressType?: string;
  deliveryNotes?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string;
  product_image: string | null;
  quantity: number;
  mrp: number;
  unit_price: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_by: string;
  notes: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  gateway: 'razorpay' | 'cod';
  gateway_order_id?: string | null;
  gateway_payment_id?: string | null;
  payment_method?: string | null;
  amount: number;
  currency: string;
  status: string;
  gateway_response?: Record<string, any> | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  courier_name: string;
  tracking_number: string;
  tracking_url?: string | null;
  dispatch_date: string;
  expected_delivery?: string | null;
  delivered_at?: string | null;
  shipping_status: 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  invoice_date: string;
  invoice_data: {
    invoice_number: string;
    order_number: string;
    invoice_date: string;
    customer_name: string;
    customer_mobile: string;
    customer_email?: string | null;
    shipping_address: ShippingAddressData;
    subtotal: number;
    discount_amount: number;
    shipping_charge: number;
    tax_amount: number;
    total_amount: number;
    payment_method: string;
    payment_id?: string | null;
    store_name: string;
    store_address: string;
    gstin?: string;
  };
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number | null;
  usage_limit?: number | null;
  usage_count: number;
  per_customer_limit: number;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponRedemption {
  id: string;
  coupon_id: string;
  order_id: string;
  customer_id?: string | null;
  customer_mobile: string;
  discount_amount: number;
  created_at: string;
}

export interface StockReservation {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  status: 'active' | 'consumed' | 'released' | 'expired';
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string | null;
  customer_name: string;
  customer_mobile: string;
  customer_email?: string | null;
  shipping_address: ShippingAddressData;
  subtotal: number;
  discount_amount: number;
  shipping_charge: number;
  tax_amount: number;
  total_amount: number;
  coupon_id?: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  status?: OrderStatus;
  shipping_fee?: number;
  customer_notes?: string | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;

  // Joined relations
  items?: OrderItem[];
  customer?: Customer;
  shipments?: Shipment[];
  payments?: Payment[];
  status_history?: OrderStatusHistory[];
  invoice?: Invoice;
  coupon?: Coupon;
}

export interface ReturnRequest {
  id: string;
  order_id: string;
  customer_id?: string | null;
  reason: string;
  description?: string | null;
  status: 'requested' | 'approved' | 'rejected' | 'item_received' | 'refunded';
  admin_inspection_notes?: string | null;
  item_condition?: 'sellable' | 'damaged' | 'unopened' | null;
  restocked: boolean;
  created_at: string;
  updated_at: string;
  order?: Order;
}

export interface NotificationLog {
  id: string;
  order_id?: string | null;
  recipient_email?: string | null;
  recipient_mobile?: string | null;
  notification_type: string;
  channel: 'email' | 'sms' | 'whatsapp';
  subject?: string | null;
  body?: string | null;
  status: 'sent' | 'failed';
  error_message?: string | null;
  created_at: string;
}

// Filters & Query Parameters
export interface ProductFilterParams {
  categorySlug?: string;
  collectionSlug?: string;
  fabric?: string;
  colour?: string;
  occasion?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  search?: string;
  sortBy?: 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name-asc';
  page?: number;
  limit?: number;
}
