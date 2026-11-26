import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Package,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Phone,
  FileText,
  MapPin,
  Calendar,
} from 'lucide-react';
import { supabase } from '@chandrakor/supabase-client';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();

  const stateData = location.state as {
    orderNumber?: string;
    customerName?: string;
    customerMobile?: string;
    totalAmount?: number;
    paymentMethod?: string;
    paymentId?: string;
    status?: string;
  } | undefined;

  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // If order details were passed via router state or we fetch securely via RPC
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderNumber) {
        setLoading(false);
        return;
      }

      // If we have customerMobile from state, we can use track_order_secure RPC
      const mobile = stateData?.customerMobile;
      if (mobile) {
        try {
          const { data } = await supabase.rpc('track_order_secure', {
            p_order_number: orderNumber,
            p_mobile: mobile,
          });
          if (data && data.found) {
            setOrderDetails(data);
          }
        } catch (e) {
          console.error('Error fetching order snapshot:', e);
        }
      }
      setLoading(false);
    };

    fetchOrder();
  }, [orderNumber, stateData]);

  const displayOrderNum = orderNumber || stateData?.orderNumber || 'CHK-ORDER';
  const customerName = orderDetails?.customer_name || stateData?.customerName || 'Valued Patron';
  const customerMobile = orderDetails?.customer_mobile || stateData?.customerMobile || '';
  const totalAmount = orderDetails?.total_amount ?? stateData?.totalAmount ?? 0;
  const paymentMethod = orderDetails?.payment_method || stateData?.paymentMethod || 'online';
  const isCod = paymentMethod.toLowerCase() === 'cod';

  return (
    <div className="bg-brand-ivory/30 min-h-screen py-10 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Success Card */}
        <div className="bg-white border border-brand-cream/80 rounded-sm p-6 sm:p-10 shadow-sm text-center space-y-6">
          {/* Royal emblem & confirmation icon */}
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-700">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-burgundy border-2 border-white flex items-center justify-center text-brand-gold text-xs font-serif font-bold">
              ☾
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-brand-burgundy font-semibold">
              Order Confirmed & Secured
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-charcoal">
              Dhanyavaad, {customerName}
            </h1>
            <p className="text-sm text-brand-warm-grey max-w-lg mx-auto leading-relaxed">
              Your saree order has been confirmed with care. A confirmation SMS and digital invoice have been dispatched.
            </p>
          </div>

          {/* Reference Info Card */}
          <div className="bg-brand-ivory/60 border border-brand-cream rounded-sm p-4 sm:p-6 text-left grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-brand-warm-grey block uppercase tracking-wider text-[10px]">
                Order Reference Number
              </span>
              <span className="font-mono text-base font-bold text-brand-charcoal mt-0.5 block">
                {displayOrderNum}
              </span>
            </div>

            <div>
              <span className="text-brand-warm-grey block uppercase tracking-wider text-[10px]">
                Payment Mode & Status
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-brand-charcoal uppercase">
                  {paymentMethod}
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                    isCod
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                  }`}
                >
                  {isCod ? 'Pay on Delivery' : 'Paid in Full'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-brand-warm-grey block uppercase tracking-wider text-[10px]">
                Estimated Delivery Window
              </span>
              <span className="font-medium text-brand-charcoal mt-0.5 block flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-burgundy" />
                <span>5 – 7 Business Days (Pan-India Express)</span>
              </span>
            </div>

            <div>
              <span className="text-brand-warm-grey block uppercase tracking-wider text-[10px]">
                Total Amount Payable
              </span>
              <span className="font-serif text-base font-bold text-brand-burgundy mt-0.5 block">
                ₹{Number(totalAmount).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Detailed snapshot if loaded */}
          {orderDetails && orderDetails.items && (
            <div className="border border-brand-cream/80 rounded-sm p-4 text-left space-y-3">
              <h3 className="font-serif text-sm font-bold text-brand-charcoal border-b border-brand-cream pb-2">
                Sarees in this Order
              </h3>
              <div className="space-y-3 divide-y divide-slate-100">
                {orderDetails.items.map((it: any, idx: number) => (
                  <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {it.product_image && (
                        <img
                          src={it.product_image}
                          alt={it.product_name}
                          className="w-12 h-14 object-cover rounded-sm bg-brand-cream/30"
                        />
                      )}
                      <div>
                        <span className="font-serif font-semibold text-brand-charcoal block">
                          {it.product_name}
                        </span>
                        <span className="text-[11px] font-mono text-brand-warm-grey">
                          SKU: {it.product_sku} • Qty: {it.quantity}
                        </span>
                      </div>
                    </div>
                    <span className="font-semibold text-brand-charcoal">
                      ₹{(Number(it.unit_price) * it.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COD Notice if applicable */}
          {isCod && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-sm p-4 text-xs text-amber-900 text-left flex items-start gap-3">
              <Phone className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Cash on Delivery Verification</span>
                <span>
                  Our executive will place a quick phone call to +91 {customerMobile || 'your mobile'} to verify your delivery address before dispatch.
                </span>
              </div>
            </div>
          )}

          {/* Saree Care Heritage Tip */}
          <div className="bg-brand-cream/20 border border-brand-cream rounded-sm p-4 text-xs text-brand-charcoal text-left space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-brand-burgundy">
              <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
              <span>Preserving Your Chandrakor Saree</span>
            </div>
            <p className="text-[11px] text-brand-warm-grey leading-relaxed">
              We recommend dry cleaning only for pure silk and zari weaves. Store your saree wrapped in a soft unbleached muslin cloth and air it out periodically to preserve the heritage luster.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={`/track-order?orderNumber=${displayOrderNum}&mobile=${customerMobile}`}
              className="w-full sm:w-auto px-8 py-3.5 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold uppercase tracking-[0.2em] rounded-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Package className="w-4 h-4" />
              <span>Track Parcel Live</span>
            </Link>

            <Link
              to="/shop"
              className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-brand-cream/40 text-brand-charcoal border border-brand-cream text-xs font-semibold uppercase tracking-[0.2em] rounded-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>Explore More Weaves</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
