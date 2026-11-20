import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  Calendar,
  ChevronRight,
  Phone,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { supabase } from '@chandrakor/supabase-client';

export const OrderTrackingPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const [orderNumber, setOrderNumber] = useState(searchParams.get('orderNumber') || '');
  const [mobile, setMobile] = useState(searchParams.get('mobile') || '');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);

  // Return request modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('Color mismatch with photos');
  const [returnComments, setReturnComments] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState<string | null>(null);

  // Auto-search if parameters are present in URL
  useEffect(() => {
    const urlOrder = searchParams.get('orderNumber');
    const urlMobile = searchParams.get('mobile');
    if (urlOrder && urlMobile) {
      setOrderNumber(urlOrder);
      setMobile(urlMobile);
      handleTrackOrder(urlOrder, urlMobile);
    }
  }, [searchParams]);

  const handleTrackOrder = async (targetOrder?: string, targetMobile?: string) => {
    const oNum = (targetOrder || orderNumber).trim();
    const mNum = (targetMobile || mobile).trim().replace(/\D/g, '');

    if (!oNum) {
      setErrorMsg('Please enter your Order Reference Number (e.g. CHK-20261120-1499)');
      return;
    }
    if (!mNum || mNum.length !== 10) {
      setErrorMsg('Please enter the 10-digit mobile number used when placing the order');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setOrderData(null);
    setReturnSuccessMsg(null);

    try {
      const { data, error } = await supabase.rpc('track_order_secure', {
        p_order_number: oNum,
        p_mobile: mNum,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.found) {
        setOrderData(data);
      } else {
        setErrorMsg(
          data?.message || 'No matching order found. Please verify your order number and mobile number.'
        );
      }
    } catch (err: any) {
      console.error('Error tracking order:', err);
      setErrorMsg(err.message || 'Unable to track order. Please check your credentials or try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Return / Exchange Request
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderData) return;

    setReturnSubmitting(true);
    try {
      // Find order id
      const { data: ord } = await supabase
        .from('orders')
        .select('id, customer_id')
        .eq('order_number', orderData.order_number)
        .single();

      if (!ord) throw new Error('Order record not found');

      const { error: retError } = await supabase.from('returns').insert({
        order_id: ord.id,
        customer_id: ord.customer_id,
        reason: returnReason,
        customer_comments: returnComments.trim() || null,
        status: 'requested',
      });

      if (retError) throw retError;

      setReturnSuccessMsg(
        'Your return/exchange request has been lodged successfully. Our concierge will review and contact you within 24 hours.'
      );
      setIsReturnModalOpen(false);
      setReturnComments('');
    } catch (err: any) {
      alert('Failed to submit return request: ' + err.message);
    } finally {
      setReturnSubmitting(false);
    }
  };

  // Determine timeline step
  const getTimelineStepIndex = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'delivered') return 4;
    if (s === 'shipped') return 3;
    if (s === 'processing' || s === 'packed') return 2;
    if (s === 'confirmed') return 1;
    return 0; // pending / pending_confirmation
  };

  const currentStep = orderData ? getTimelineStepIndex(orderData.status) : 0;

  const steps = [
    { label: 'Order Placed', desc: 'Order received & recorded' },
    { label: 'Order Confirmed', desc: 'Authenticity & payment verified' },
    { label: 'Heirloom Packaging', desc: 'Handloom inspection & gift box' },
    { label: 'Dispatched & In Transit', desc: 'Handed over to insured courier' },
    { label: 'Delivered', desc: 'Safely delivered to doorstep' },
  ];

  return (
    <div className="bg-brand-ivory/40 min-h-screen py-8 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full border-2 border-brand-burgundy flex items-center justify-center bg-brand-cream/40 mx-auto">
            <span className="text-brand-burgundy font-serif text-lg font-bold">☾</span>
          </div>
          <span className="text-xs uppercase tracking-[0.25em] text-brand-burgundy font-semibold block">
            Chandrakor Courier Concierge
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-charcoal">
            Track Your Heirloom Saree
          </h1>
          <p className="text-xs sm:text-sm text-brand-warm-grey max-w-md mx-auto">
            Enter your order reference number and verified 10-digit mobile number for real-time dispatch milestones.
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-white border border-brand-cream/80 rounded-sm p-6 sm:p-8 shadow-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrackOrder();
            }}
            className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end"
          >
            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-brand-charcoal uppercase tracking-wider mb-1">
                Order Reference Number
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="CHK-20261120-1499"
                className="w-full px-3.5 py-2.5 text-sm font-mono border border-brand-cream rounded-sm uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-brand-charcoal uppercase tracking-wider mb-1">
                10-Digit Mobile Number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-2.5 text-xs font-medium text-brand-warm-grey bg-brand-cream/30 border border-r-0 border-brand-cream rounded-l-sm">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 text-sm border border-brand-cream rounded-r-sm focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 h-[42px]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Track Order</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {errorMsg && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {returnSuccessMsg && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{returnSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Search Results Snapshot */}
        {orderData && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* 1. Status Overview Header */}
            <div className="bg-white border border-brand-cream/80 rounded-sm p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-cream">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-brand-charcoal">
                      {orderData.order_number}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-sm ${
                        orderData.status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : orderData.status === 'shipped'
                          ? 'bg-sky-100 text-sky-900 border border-sky-200'
                          : orderData.status === 'cancelled'
                          ? 'bg-rose-100 text-rose-900 border border-rose-200'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}
                    >
                      {orderData.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-brand-warm-grey mt-1">
                    Booked on {new Date(orderData.order_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })} • Customer: <span className="font-medium text-brand-charcoal">{orderData.customer_name}</span>
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-brand-warm-grey block">Total Order Value</span>
                  <span className="font-serif text-xl font-bold text-brand-burgundy">
                    ₹{Number(orderData.total_amount).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-brand-warm-grey block uppercase tracking-wider mt-0.5">
                    Mode: {orderData.payment_method} ({orderData.payment_status})
                  </span>
                </div>
              </div>

              {/* 2. Visual Progress Stepper */}
              <div className="py-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal mb-6 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-gold" />
                  <span>Shipment Milestone Timeline</span>
                </h3>

                <div className="relative">
                  {/* Progress Line */}
                  <div className="hidden sm:block absolute top-5 left-8 right-8 h-0.5 bg-brand-cream">
                    <div
                      className="h-full bg-brand-burgundy transition-all duration-500"
                      style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    />
                  </div>

                  {/* Stepper items */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-2 relative">
                    {steps.map((st, idx) => {
                      const isCompleted = idx <= currentStep;
                      const isCurrent = idx === currentStep;
                      return (
                        <div key={idx} className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 text-left sm:text-center">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                              isCompleted
                                ? 'bg-brand-burgundy text-white font-bold shadow-xs'
                                : 'bg-white border-2 border-brand-cream text-brand-warm-grey'
                            } ${isCurrent ? 'ring-4 ring-brand-burgundy/20' : ''}`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <span className="text-xs font-semibold">{idx + 1}</span>
                            )}
                          </div>
                          <div>
                            <span
                              className={`text-xs block font-semibold ${
                                isCompleted ? 'text-brand-burgundy' : 'text-brand-warm-grey'
                              }`}
                            >
                              {st.label}
                            </span>
                            <span className="text-[10px] text-brand-warm-grey leading-tight block mt-0.5">
                              {st.desc}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. Courier & Dispatch Card (if shipped) */}
              {orderData.shipment ? (
                <div className="p-5 bg-sky-50/60 border border-sky-200/80 rounded-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-sky-950 text-sm">
                      <Truck className="w-4 h-4 text-sky-700" />
                      <span>Insured Express Courier Dispatch</span>
                    </div>
                    {orderData.shipment.tracking_url && (
                      <a
                        href={orderData.shipment.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-700 hover:bg-sky-800 text-white text-[11px] font-semibold uppercase tracking-wider rounded-sm transition-colors"
                      >
                        <span>Live Courier Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
                    <div>
                      <span className="text-sky-800 block text-[10px] uppercase tracking-wider">Courier Partner</span>
                      <span className="font-semibold text-sky-950 mt-0.5 block">
                        {orderData.shipment.courier_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-sky-800 block text-[10px] uppercase tracking-wider">AWB / Tracking Number</span>
                      <span className="font-mono font-bold text-sky-950 mt-0.5 block select-all">
                        {orderData.shipment.tracking_number}
                      </span>
                    </div>
                    <div>
                      <span className="text-sky-800 block text-[10px] uppercase tracking-wider">Estimated Delivery</span>
                      <span className="font-semibold text-sky-950 mt-0.5 block">
                        {orderData.shipment.expected_delivery_date
                          ? new Date(orderData.shipment.expected_delivery_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Within 3-5 business days'}
                      </span>
                    </div>
                  </div>

                  {orderData.shipment.notes && (
                    <p className="text-[11px] text-sky-800/90 pt-1 border-t border-sky-200/50">
                      Note from shipping desk: {orderData.shipment.notes}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-brand-ivory/80 border border-brand-cream rounded-sm flex items-center justify-between text-xs text-brand-charcoal">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-brand-gold" />
                    <span>Your saree is being carefully hand-inspected in our heritage boutique before dispatch.</span>
                  </div>
                  <span className="text-[10px] text-brand-warm-grey">Pan-India Express</span>
                </div>
              )}

              {/* 4. Delivery Address Snapshot */}
              {orderData.shipping_address && (
                <div className="pt-4 border-t border-brand-cream text-xs text-brand-charcoal flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-brand-burgundy shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block uppercase tracking-wider text-[11px] text-brand-burgundy">
                      Delivery Destination ({orderData.shipping_address.addressType || 'Home'})
                    </span>
                    <p className="text-brand-warm-grey mt-0.5 leading-relaxed">
                      {orderData.shipping_address.fullName} • {orderData.shipping_address.addressLine1}
                      {orderData.shipping_address.addressLine2 ? `, ${orderData.shipping_address.addressLine2}` : ''}
                      {orderData.shipping_address.landmark ? ` (Near ${orderData.shipping_address.landmark})` : ''}
                      , {orderData.shipping_address.city}, {orderData.shipping_address.state} — {orderData.shipping_address.pincode}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Ordered Sarees List */}
            <div className="bg-white border border-brand-cream/80 rounded-sm p-6 shadow-sm space-y-4">
              <h3 className="font-serif text-lg font-bold text-brand-charcoal pb-2 border-b border-brand-cream flex items-center justify-between">
                <span>Items in this Order ({orderData.items?.length || 0})</span>
                {orderData.status === 'delivered' && (
                  <button
                    type="button"
                    onClick={() => setIsReturnModalOpen(true)}
                    className="text-xs font-sans font-semibold text-brand-burgundy hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Request Return / Exchange</span>
                  </button>
                )}
              </h3>

              <div className="space-y-4 divide-y divide-slate-100">
                {orderData.items?.map((it: any, idx: number) => (
                  <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {it.product_image ? (
                        <img
                          src={it.product_image}
                          alt={it.product_name}
                          className="w-14 h-18 object-cover rounded-sm bg-brand-cream/30 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-18 bg-brand-cream/30 rounded-sm flex items-center justify-center text-brand-warm-grey">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-serif text-sm font-semibold text-brand-charcoal">
                          {it.product_name}
                        </h4>
                        <p className="text-[11px] font-mono text-brand-warm-grey mt-0.5">
                          SKU: {it.product_sku} • Qty: {it.quantity}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-serif text-sm font-bold text-brand-charcoal">
                        ₹{(Number(it.unit_price) * it.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Concierge & Support Footer */}
            <div className="p-5 bg-brand-cream/20 border border-brand-cream rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3 text-brand-charcoal">
                <HelpCircle className="w-5 h-5 text-brand-gold shrink-0" />
                <div>
                  <span className="font-semibold block">Need assistance with your saree order?</span>
                  <span className="text-[11px] text-brand-warm-grey">
                    Our master concierge team is available Monday to Saturday, 10am to 7pm IST.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="https://wa.me/919820012345"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white border border-brand-cream text-brand-charcoal hover:text-brand-burgundy text-[11px] font-semibold uppercase tracking-wider rounded-sm transition-colors flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-brand-burgundy" />
                  <span>WhatsApp Concierge</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Return / Exchange Request Modal */}
        {isReturnModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-sm border border-brand-cream max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-brand-cream">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-brand-burgundy" />
                  <h3 className="font-serif text-lg font-bold text-brand-charcoal">
                    Request Return or Exchange
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-brand-warm-grey leading-relaxed">
                Chandrakor offers a 7-day hassle-free return or exchange for unworn sarees with original tags and Silk Mark authenticity seals intact.
              </p>

              <form onSubmit={handleSubmitReturn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal uppercase tracking-wider mb-1">
                    Reason for Return / Exchange <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-brand-cream rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                  >
                    <option value="Color mismatch with photos">Shade / Color looks different in natural light</option>
                    <option value="Fabric texture or feel not as expected">Fabric texture / softness not as expected</option>
                    <option value="Zari or weave flaw detected">Weave flaw or zari thread imperfection</option>
                    <option value="Received wrong product SKU">Received incorrect saree SKU</option>
                    <option value="Ordered by mistake / changed mind">Change of mind / Ordered by mistake</option>
                    <option value="Other">Other / Custom query</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal uppercase tracking-wider mb-1">
                    Additional Comments or Clarifications
                  </label>
                  <textarea
                    rows={3}
                    value={returnComments}
                    onChange={(e) => setReturnComments(e.target.value)}
                    placeholder="Describe any specifics to assist our inspection team..."
                    className="w-full px-3 py-2 text-xs border border-brand-cream rounded-sm focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={returnSubmitting}
                    className="flex-1 py-2.5 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {returnSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Submit Request</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReturnModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
