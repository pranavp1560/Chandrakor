import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowLeft,
  Lock,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '@chandrakor/supabase-client';
import { loadRazorpayScript, RazorpayOptions } from '../utils/razorpay';

interface ShippingForm {
  fullName: string;
  mobile: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  addressType: 'home' | 'office' | 'other';
  deliveryNotes: string;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab',
  'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, summary, clearCart } = useCart();

  const [formData, setFormData] = useState<ShippingForm>({
    fullName: '',
    mobile: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '',
    addressType: 'home',
    deliveryNotes: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'cod'>('upi');
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ShippingForm, string>>>({});

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showSimulatedModal, setShowSimulatedModal] = useState<{
    orderId: string;
    orderNumber: string;
    amount: number;
  } | null>(null);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  // Derived financial calculation
  const subtotal = summary.subtotal;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const shippingFee = 0; // Complimentary Pan-India
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  // Validate form fields
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ShippingForm, string>> = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
      errors.fullName = 'Please enter your full legal name';
    }

    const cleanMobile = formData.mobile.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length !== 10 || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      errors.mobile = 'Enter a valid 10-digit Indian mobile number';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.addressLine1.trim() || formData.addressLine1.trim().length < 5) {
      errors.addressLine1 = 'Please specify flat/house number and building name';
    }

    if (!formData.city.trim()) {
      errors.city = 'Please enter delivery city';
    }

    if (!formData.state.trim()) {
      errors.state = 'Please select delivery state';
    }

    const cleanPincode = formData.pincode.replace(/\D/g, '');
    if (!cleanPincode || cleanPincode.length !== 6) {
      errors.pincode = 'Enter a valid 6-digit postal pincode';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle coupon validation via RPC
  const handleApplyCoupon = async (codeToApply?: string) => {
    const targetCode = (codeToApply || couponCode).trim().toUpperCase();
    if (!targetCode) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError(null);

    try {
      const { data, error } = await supabase.rpc('validate_coupon', {
        p_code: targetCode,
        p_cart_subtotal: subtotal,
        p_customer_mobile: formData.mobile.trim() || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.valid) {
        setAppliedCoupon({
          code: data.code,
          discountType: data.discount_type,
          discountValue: Number(data.discount_value),
          discountAmount: Number(data.discount_amount),
        });
        setCouponCode(data.code);
        setCouponError(null);
      } else {
        setCouponError(data?.message || 'Invalid or inapplicable coupon code.');
        setAppliedCoupon(null);
      }
    } catch (err: any) {
      setCouponError(err.message || 'Unable to validate coupon code at this moment.');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  // Main order submission
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (!validateForm()) {
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    // COD eligibility check
    if (paymentMethod === 'cod' && grandTotal > 50000) {
      setSubmissionError('Cash on Delivery is limited to orders up to ₹50,000 for high-value silk security.');
      return;
    }

    setIsSubmitting(true);

    try {
      const shippingAddressPayload = {
        fullName: formData.fullName.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim(),
        landmark: formData.landmark.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        addressType: formData.addressType,
      };

      const itemsPayload = cart.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      }));

      // Call Atomic Order Creation RPC
      const { data: orderResult, error: orderError } = await supabase.rpc('create_order_atomic', {
        p_customer_name: formData.fullName.trim(),
        p_customer_mobile: formData.mobile.trim(),
        p_customer_email: formData.email.trim() || null,
        p_shipping_address: shippingAddressPayload,
        p_items: itemsPayload,
        p_payment_method: paymentMethod,
        p_customer_notes: formData.deliveryNotes.trim() || null,
        p_coupon_code: appliedCoupon ? appliedCoupon.code : null,
      });

      if (orderError) {
        throw new Error(orderError.message);
      }

      if (!orderResult || !orderResult.success) {
        throw new Error(orderResult?.message || 'Failed to place order.');
      }

      const createdOrderId = orderResult.order_id;
      const createdOrderNumber = orderResult.order_number;

      // Handle Payment Method
      if (paymentMethod === 'cod') {
        // COD order is immediately recorded as pending_confirmation
        clearCart();
        navigate(`/order-confirmation/${createdOrderNumber}`, {
          state: {
            orderNumber: createdOrderNumber,
            customerName: formData.fullName,
            customerMobile: formData.mobile,
            totalAmount: grandTotal,
            paymentMethod: 'cod',
            status: 'pending_confirmation',
          },
        });
        return;
      }

      // Online Payment flow (UPI / Card / Netbanking)
      const razorpayKey = (import.meta as any).env?.VITE_RAZORPAY_KEY_ID;
      const scriptLoaded = await loadRazorpayScript();

      // If Razorpay SDK loaded and real test/live key is present
      if (scriptLoaded && window.Razorpay && razorpayKey && !razorpayKey.includes('placeholder')) {
        const options: RazorpayOptions = {
          key: razorpayKey,
          amount: Math.round(grandTotal * 100),
          currency: 'INR',
          name: 'CHANDRAKOR',
          description: `Order ${createdOrderNumber} • Saree Elegance`,
          prefill: {
            name: formData.fullName,
            email: formData.email,
            contact: formData.mobile,
          },
          theme: {
            color: '#6E2638',
          },
          handler: async (response) => {
            try {
              const { error: confirmError } = await supabase.rpc('confirm_online_payment', {
                p_order_id: createdOrderId,
                p_gateway_payment_id: response.razorpay_payment_id,
                p_gateway_order_id: response.razorpay_order_id || null,
                p_gateway_signature: response.razorpay_signature || null,
                p_payment_method: paymentMethod,
              });

              if (confirmError) {
                console.error('Confirmation RPC error:', confirmError);
              }

              clearCart();
              navigate(`/order-confirmation/${createdOrderNumber}`, {
                state: {
                  orderNumber: createdOrderNumber,
                  customerName: formData.fullName,
                  customerMobile: formData.mobile,
                  totalAmount: grandTotal,
                  paymentMethod,
                  paymentId: response.razorpay_payment_id,
                  status: 'confirmed',
                },
              });
            } catch (err: any) {
              console.error('Error confirming payment:', err);
              navigate(`/order-confirmation/${createdOrderNumber}`);
            }
          },
          modal: {
            ondismiss: () => {
              setIsSubmitting(false);
              setSubmissionError('Payment was not completed. Your saree order is reserved for 30 minutes.');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Test / Sandbox Fallback Simulation Modal
        setShowSimulatedModal({
          orderId: createdOrderId,
          orderNumber: createdOrderNumber,
          amount: grandTotal,
        });
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setSubmissionError(err.message || 'An error occurred while creating your order. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Complete simulated payment for development/testing
  const handleCompleteSimulatedPayment = async (success: boolean) => {
    if (!showSimulatedModal) return;

    if (!success) {
      setShowSimulatedModal(null);
      setIsSubmitting(false);
      setSubmissionError('Test payment simulated cancellation. Order reserved pending payment.');
      return;
    }

    try {
      const simulatedPaymentId = 'pay_sim_' + Math.random().toString(36).substring(2, 12).toUpperCase();
      const { error: confirmError } = await supabase.rpc('confirm_online_payment', {
        p_order_id: showSimulatedModal.orderId,
        p_gateway_payment_id: simulatedPaymentId,
        p_gateway_order_id: 'order_sim_' + showSimulatedModal.orderNumber,
        p_gateway_signature: 'sig_sim_valid',
        p_payment_method: paymentMethod,
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      clearCart();
      const orderNum = showSimulatedModal.orderNumber;
      setShowSimulatedModal(null);
      navigate(`/order-confirmation/${orderNum}`, {
        state: {
          orderNumber: orderNum,
          customerName: formData.fullName,
          customerMobile: formData.mobile,
          totalAmount: grandTotal,
          paymentMethod,
          paymentId: simulatedPaymentId,
          status: 'confirmed',
        },
      });
    } catch (err: any) {
      console.error('Error in simulated confirmation:', err);
      setSubmissionError('Failed to confirm simulated payment: ' + err.message);
      setIsSubmitting(false);
      setShowSimulatedModal(null);
    }
  };

  return (
    <div className="bg-brand-ivory/40 min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-burgundy hover:text-brand-burgundy-dark"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Shopping Bag</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-brand-warm-grey">
            <Lock className="w-3.5 h-3.5 text-brand-gold" />
            <span>256-Bit SSL Encrypted Guest Checkout</span>
          </div>
        </div>

        {/* Global Error Banner */}
        {submissionError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Order Checkout Notice</span>
              <span>{submissionError}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* LEFT COLUMN: Shipping & Payment (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* 1. Customer & Shipping Details */}
            <div className="bg-white border border-brand-cream/80 rounded-sm p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-brand-cream">
                <span className="w-6 h-6 rounded-full bg-brand-burgundy text-white text-xs font-serif font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="font-serif text-2xl font-bold text-brand-charcoal">
                  Delivery Destination & Recipient
                </h2>
              </div>

              <div className="space-y-4">
                {/* Full Name & Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-brand-charcoal uppercase tracking-wider mb-1">
                      Full Legal Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Ananya Deshmukh"
                      className={`w-full px-3.5 py-2.5 text-sm border rounded-sm focus:outline-none focus:ring-1 focus:ring-brand-burgundy ${
                        formErrors.fullName ? 'border-rose-400 bg-rose-50/20' : 'border-brand-cream bg-white'
                      }`}
                    />
                    {formErrors.fullName && (
                      <p className="text-[11px] text-rose-600 mt-1">{formErrors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-charcoal uppercase tracking-wider mb-1">
                      10-Digit Mobile Number <span className="text-rose-600">*</span>
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 text-xs font-medium text-brand-warm-grey bg-brand-cream/30 border border-r-0 border-brand-cream rounded-l-sm">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                        placeholder="9876543210"
                        className={`w-full px-3.5 py-2.5 text-sm border rounded-r-sm focus:outline-none focus:ring-1 focus:ring-brand-burgundy ${
                          formErrors.mobile ? 'border-rose-400 bg-rose-50/20' : 'border-brand-cream bg-white'
                        }`}
                      />
                    </div>
                    {formErrors.mobile ? (
                      <p className="text-[11px] text-rose-600 mt-1">{formErrors.mobile}</p>
                    ) : (
                      <p className="text-[10px] text-brand-warm-grey mt-1">
                        Used for dispatch updates, SMS tracking & delivery verification.
                      </p>
                    )}
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-medium text-brand-charcoal uppercase tracking-wider mb-1">
                    Email Address (For Tax Invoice & Tracking)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ananya@example.com"
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-sm focus:outline-none focus:ring-1 focus:ring-brand-burgundy ${
                      formErrors.email ? 'border-rose-400 bg-rose-50/20' : 'border-brand-cream bg-white'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.email}</p>
                  )}
                </div>

                {/* Address Line 1 */}
                <div>
                  <label className="block text-xs font-medium text-brand-charcoal uppercase tracking-wider mb-1">
                    Flat / House No., Apartment, Building <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    placeholder="e.g. 402, Royal Palms Residency, 4th Floor"
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-sm focus:outline-none focus:ring-1 focus:ring-brand-burgundy ${
                      formErrors.addressLine1 ? 'border-rose-400 bg-rose-50/20' : 'border-brand-cream bg-white'
                    }`}
                  />
                  {formErrors.addressLine1 && (
                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.addressLine1}</p>
                  )}
                </div>

                {/* Address Line 2 & Landmark */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-brand-charcoal uppercase tracking-wider mb-1">
                      Street / Area / Colony
                    </label>
                    <input
                      type="text"
                      value={formData.addressLine2}
                      onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                      placeholder="e.g. Shivaji Park, Dadar West"
                      className="w-full px-3.5 py-2.5 text-sm border border-brand-cream rounded-sm focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-charcoal uppercase tracking-wider mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.landmark}
                      onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                      placeholder="e.g. Near Siddhivinayak Temple"
                      className="w-full px-3.5 py-2.5 text-sm border border-brand-cream rounded-sm focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                    />
                  </div>
                </div>

                {/* City, State & Pincode */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-brand-charcoal uppercase tracking-wider mb-1">
                      City <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Mumbai"
                      className={`w-full px-3.5 py-2.5 text-sm border rounded-sm focus:outline-none focus:ring-1 focus:ring-brand-burgundy ${
                        formErrors.city ? 'border-rose-400 bg-rose-50/20' : 'border-brand-cream bg-white'
                      }`}
                    />
                    {formErrors.city && (
                      <p className="text-[11px] text-rose-600 mt-1">{formErrors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-charcoal uppercase tracking-wider mb-1">
                      State <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm border border-brand-cream rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-charcoal uppercase tracking-wider mb-1">
                      6-Digit Pincode <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                      placeholder="400028"
                      className={`w-full px-3.5 py-2.5 text-sm border rounded-sm focus:outline-none focus:ring-1 focus:ring-brand-burgundy ${
                        formErrors.pincode ? 'border-rose-400 bg-rose-50/20' : 'border-brand-cream bg-white'
                      }`}
                    />
                    {formErrors.pincode && (
                      <p className="text-[11px] text-rose-600 mt-1">{formErrors.pincode}</p>
                    )}
                  </div>
                </div>

                {/* Address Type */}
                <div className="pt-2">
                  <label className="block text-xs font-medium text-brand-charcoal uppercase tracking-wider mb-2">
                    Address Label
                  </label>
                  <div className="flex gap-4">
                    {(['home', 'office', 'other'] as const).map((type) => (
                      <label
                        key={type}
                        className={`flex-1 flex items-center justify-center py-2 px-3 border rounded-sm text-xs uppercase tracking-wider cursor-pointer font-medium transition-all ${
                          formData.addressType === type
                            ? 'border-brand-burgundy bg-brand-burgundy/5 text-brand-burgundy font-semibold'
                            : 'border-brand-cream text-brand-charcoal hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="addressType"
                          value={type}
                          checked={formData.addressType === type}
                          onChange={() => setFormData({ ...formData, addressType: type })}
                          className="sr-only"
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Delivery Notes */}
                <div>
                  <label className="block text-xs font-medium text-brand-charcoal uppercase tracking-wider mb-1">
                    Special Delivery Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.deliveryNotes}
                    onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
                    placeholder="e.g. Ring doorbell twice, deliver between 10am - 6pm"
                    className="w-full px-3.5 py-2 text-sm border border-brand-cream rounded-sm focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                  />
                </div>
              </div>
            </div>

            {/* 2. Payment Method Selection */}
            <div className="bg-white border border-brand-cream/80 rounded-sm p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-brand-cream">
                <span className="w-6 h-6 rounded-full bg-brand-burgundy text-white text-xs font-serif font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="font-serif text-2xl font-bold text-brand-charcoal">
                  Payment Method
                </h2>
              </div>

              <div className="space-y-3">
                {/* UPI Option */}
                <label
                  className={`flex items-start gap-4 p-4 border rounded-sm cursor-pointer transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-brand-burgundy bg-brand-burgundy/5 shadow-xs'
                      : 'border-brand-cream hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="mt-1 text-brand-burgundy focus:ring-brand-burgundy"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-brand-burgundy" />
                        <span className="text-sm font-semibold text-brand-charcoal">
                          UPI (Instant & Recommended)
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Zero Fee
                      </span>
                    </div>
                    <p className="text-xs text-brand-warm-grey mt-1">
                      Pay directly via Google Pay, PhonePe, Paytm, CRED or any BHIM UPI app.
                    </p>
                  </div>
                </label>

                {/* Credit / Debit Card Option */}
                <label
                  className={`flex items-start gap-4 p-4 border rounded-sm cursor-pointer transition-all ${
                    paymentMethod === 'card'
                      ? 'border-brand-burgundy bg-brand-burgundy/5 shadow-xs'
                      : 'border-brand-cream hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="mt-1 text-brand-burgundy focus:ring-brand-burgundy"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-brand-burgundy" />
                        <span className="text-sm font-semibold text-brand-charcoal">
                          Credit / Debit Cards
                        </span>
                      </div>
                      <span className="text-[10px] text-brand-warm-grey">Visa, Mastercard, RuPay</span>
                    </div>
                    <p className="text-xs text-brand-warm-grey mt-1">
                      Domestic and International cards with 3D Secure OTP verification.
                    </p>
                  </div>
                </label>

                {/* Net Banking Option */}
                <label
                  className={`flex items-start gap-4 p-4 border rounded-sm cursor-pointer transition-all ${
                    paymentMethod === 'netbanking'
                      ? 'border-brand-burgundy bg-brand-burgundy/5 shadow-xs'
                      : 'border-brand-cream hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="netbanking"
                    checked={paymentMethod === 'netbanking'}
                    onChange={() => setPaymentMethod('netbanking')}
                    className="mt-1 text-brand-burgundy focus:ring-brand-burgundy"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-brand-burgundy" />
                        <span className="text-sm font-semibold text-brand-charcoal">
                          Net Banking
                        </span>
                      </div>
                      <span className="text-[10px] text-brand-warm-grey">50+ Indian Banks</span>
                    </div>
                    <p className="text-xs text-brand-warm-grey mt-1">
                      HDFC, ICICI, SBI, Axis, Kotak and other major financial institutions.
                    </p>
                  </div>
                </label>

                {/* Cash on Delivery Option */}
                <label
                  className={`flex items-start gap-4 p-4 border rounded-sm cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-brand-burgundy bg-brand-burgundy/5 shadow-xs'
                      : 'border-brand-cream hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 text-brand-burgundy focus:ring-brand-burgundy"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-brand-burgundy" />
                        <span className="text-sm font-semibold text-brand-charcoal">
                          Cash on Delivery (COD)
                        </span>
                      </div>
                      <span className="text-[10px] text-brand-warm-grey">Pay upon physical receipt</span>
                    </div>
                    <p className="text-xs text-brand-warm-grey mt-1">
                      Our customer team will call your mobile (+91) to confirm order authenticity prior to dispatch.
                    </p>
                  </div>
                </label>
              </div>

              {/* Security reassurance */}
              <div className="mt-6 pt-4 border-t border-brand-cream/80 flex items-center justify-between text-xs text-brand-warm-grey">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-gold" />
                  <span>Verified Razorpay Payment Gateway & RBI Guidelines Compliant</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary & Coupon (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-brand-cream/80 rounded-sm p-6 shadow-sm sticky top-28">
              <h3 className="font-serif text-xl font-bold text-brand-charcoal pb-3 border-b border-brand-cream flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-sans font-normal text-brand-warm-grey">
                  {summary.totalItems} {summary.totalItems === 1 ? 'Saree' : 'Sarees'}
                </span>
              </h3>

              {/* Items Mini List */}
              <div className="py-4 space-y-3 max-h-60 overflow-y-auto divide-y divide-slate-100">
                {cart.map((item) => (
                  <div key={item.productId} className="pt-3 first:pt-0 flex gap-3 items-center">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-14 h-16 object-cover rounded-sm bg-brand-cream/30 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-brand-charcoal truncate font-serif">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-brand-warm-grey font-mono mt-0.5">
                        Qty: {item.quantity} • SKU: {item.sku}
                      </p>
                      {item.fabric && (
                        <p className="text-[10px] text-brand-warm-grey truncate">{item.fabric}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-brand-charcoal">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Code Section */}
              <div className="pt-4 border-t border-brand-cream space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-brand-charcoal uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-brand-gold" />
                    <span>Promotional Coupon</span>
                  </span>
                  {appliedCoupon && (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[11px] text-rose-600 hover:underline font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. CHANDRAKOR10"
                      className="flex-1 px-3 py-2 text-xs border border-brand-cream rounded-sm uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon()}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2 bg-brand-burgundy text-white text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-brand-burgundy-dark disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-sm flex items-center justify-between text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold tracking-wider">{appliedCoupon.code}</span>
                        <span className="block text-[10px] text-emerald-700">
                          {appliedCoupon.discountType === 'percentage'
                            ? `${appliedCoupon.discountValue}% promotional discount applied`
                            : `₹${appliedCoupon.discountValue} flat savings applied`}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-800">
                      -₹{appliedCoupon.discountAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {/* Popular coupon pills */}
                {!appliedCoupon && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon('CHANDRAKOR10')}
                      className="text-[10px] font-mono bg-brand-cream/50 hover:bg-brand-cream px-2 py-1 rounded text-brand-charcoal transition-colors border border-brand-cream"
                    >
                      CHANDRAKOR10 (10% Off)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon('WELCOME500')}
                      className="text-[10px] font-mono bg-brand-cream/50 hover:bg-brand-cream px-2 py-1 rounded text-brand-charcoal transition-colors border border-brand-cream"
                    >
                      WELCOME500 (₹500 Off)
                    </button>
                  </div>
                )}

                {couponError && (
                  <p className="text-xs text-rose-600 flex items-center gap-1.5 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{couponError}</span>
                  </p>
                )}
              </div>

              {/* Price Calculation */}
              <div className="pt-4 border-t border-brand-cream space-y-2.5 text-xs text-brand-charcoal">
                <div className="flex justify-between">
                  <span className="text-brand-warm-grey">Bag Subtotal</span>
                  <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-semibold">
                    <span>Coupon Savings</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-brand-warm-grey">Pan-India Insured Express Shipping</span>
                  <span className="text-emerald-800 font-semibold uppercase text-[11px]">Complimentary</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-brand-warm-grey">Estimated GST (5%)</span>
                  <span className="text-brand-warm-grey font-mono">Included in price</span>
                </div>

                <div className="flex justify-between font-serif text-xl font-bold text-brand-charcoal pt-3 border-t border-brand-cream">
                  <span>Grand Total</span>
                  <span className="text-brand-burgundy">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Place Order CTA Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold uppercase tracking-[0.2em] rounded-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Secure Order...</span>
                    </>
                  ) : paymentMethod === 'cod' ? (
                    <>
                      <Sparkles className="w-4 h-4 text-brand-gold" />
                      <span>Confirm Cash on Delivery Order</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-brand-gold" />
                      <span>Pay ₹{grandTotal.toLocaleString('en-IN')} via Razorpay</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-[11px] text-brand-warm-grey">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Real-time atomic stock reservation guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>7-Day Return / Exchange Policy</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Tax Invoice generated immediately upon payment</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Test / Sandbox Simulated Payment Modal (When no live Razorpay merchant key in dev) */}
      {showSimulatedModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-brand-cream max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-brand-cream">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-brand-burgundy flex items-center justify-center bg-brand-cream/40">
                  <span className="text-brand-burgundy font-serif text-xs font-bold">☾</span>
                </div>
                <span className="font-serif font-bold tracking-wider text-brand-burgundy text-sm uppercase">
                  CHANDRAKOR RAZORPAY GATEWAY
                </span>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono font-semibold">
                TEST SANDBOX MODE
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-brand-ivory rounded-sm border border-brand-cream space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-brand-warm-grey">Order Reference:</span>
                  <span className="font-mono font-semibold">{showSimulatedModal.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-warm-grey">Customer Name:</span>
                  <span className="font-medium">{formData.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-warm-grey">Payment Method:</span>
                  <span className="uppercase font-semibold text-brand-burgundy">{paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-brand-cream">
                  <span>Authorized Amount:</span>
                  <span className="text-brand-burgundy">
                    ₹{showSimulatedModal.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <p className="text-xs text-brand-warm-grey leading-relaxed">
                This simulated gateway tests atomic database inventory deduction, customer record creation, invoice generation, and status transition in the live Supabase database.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleCompleteSimulatedPayment(true)}
                className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simulate Successful Payment</span>
              </button>
              <button
                type="button"
                onClick={() => handleCompleteSimulatedPayment(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors"
              >
                Cancel / Simulate Payment Failure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
