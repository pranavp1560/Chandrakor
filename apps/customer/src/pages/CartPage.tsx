import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, summary } = useCart();

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-brand-cream/40 flex items-center justify-center mx-auto text-brand-warm-grey">
          <ShoppingBag className="w-10 h-10 stroke-1" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-brand-charcoal">Your Shopping Bag is Empty</h1>
        <p className="text-xs sm:text-sm text-brand-warm-grey max-w-sm mx-auto">
          Explore our handloom collections of authentic Katan Banarasi, Kanjivaram, and Paithani sarees.
        </p>
        <div className="pt-4">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-burgundy text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-brand-burgundy-dark transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Discover Sarees</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Title */}
      <div className="border-b border-brand-cream/80 pb-4 mb-8 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest text-brand-burgundy font-semibold">
            Review Selection
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-charcoal mt-1">
            Your Heirloom Bag ({summary.totalItems} items)
          </h1>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-slate-400 hover:text-rose-700 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div
              key={item.productId}
              className="flex gap-4 sm:gap-6 p-4 sm:p-5 bg-white border border-brand-cream/80 rounded-sm shadow-sm"
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-24 sm:w-28 h-32 sm:h-36 object-cover rounded-sm bg-brand-cream/30 shrink-0"
              />

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono text-brand-warm-grey uppercase">SKU: {item.sku}</span>
                      <Link
                        to={`/product/${item.slug}`}
                        className="font-serif text-base sm:text-lg font-bold text-brand-charcoal hover:text-brand-burgundy block transition-colors"
                      >
                        {item.name}
                      </Link>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="p-1 text-slate-400 hover:text-rose-700 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {item.fabric && (
                    <p className="text-xs text-brand-warm-grey mt-0.5">Weave: {item.fabric}</p>
                  )}
                  {item.colour && (
                    <p className="text-xs text-brand-warm-grey">Shade: {item.colour}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                  <div className="flex items-center border border-brand-cream bg-white rounded-sm">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="p-1.5 text-brand-charcoal hover:text-brand-burgundy"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-brand-charcoal">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxAvailable}
                      className="p-1.5 text-brand-charcoal hover:text-brand-burgundy disabled:opacity-30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="font-serif text-lg font-bold text-brand-burgundy">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                    {item.mrp > item.price && (
                      <span className="text-xs text-brand-warm-grey line-through block">
                        ₹{(item.mrp * item.quantity).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-2">
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-burgundy hover:underline uppercase tracking-wider"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white border border-brand-cream/80 rounded-sm p-6 space-y-5 h-fit shadow-sm">
          <h2 className="font-serif text-xl font-bold text-brand-charcoal pb-3 border-b border-brand-cream">
            Order Summary
          </h2>

          <div className="space-y-3 text-xs text-brand-charcoal">
            <div className="flex justify-between">
              <span className="text-brand-warm-grey">Items Total MRP</span>
              <span>₹{summary.totalMrp.toLocaleString('en-IN')}</span>
            </div>
            {summary.totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-800 font-semibold">
                <span>Heirloom Discount</span>
                <span>-₹{summary.totalDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-brand-warm-grey">Insured Express Shipping</span>
              <span className="text-emerald-800 font-semibold uppercase text-[11px]">Complimentary</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-warm-grey">Estimated GST (5%)</span>
              <span className="text-brand-warm-grey font-mono">Included in price</span>
            </div>
            <div className="flex justify-between font-serif text-xl font-bold text-brand-charcoal pt-3 border-t border-brand-cream">
              <span>Total Payable</span>
              <span className="text-brand-burgundy">₹{summary.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <Link
              to="/checkout"
              className="w-full py-4 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold uppercase tracking-[0.2em] rounded-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>

            <div className="flex items-center justify-center gap-2 text-xs text-brand-warm-grey pt-2">
              <ShieldCheck className="w-4 h-4 text-brand-gold" />
              <span>Silk Mark Verified • Tamper-proof Heirloom Packaging</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
