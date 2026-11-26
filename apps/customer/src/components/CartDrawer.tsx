import React from 'react';
import { Link } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer: React.FC = () => {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, summary } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-brand-cream/80 flex items-center justify-between bg-brand-ivory/50">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-brand-burgundy" />
              <h2 className="font-serif text-xl font-bold text-brand-charcoal">
                Your Curated Bag ({summary.totalItems})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-brand-charcoal hover:text-brand-burgundy rounded-full hover:bg-brand-cream/50 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-brand-cream/40 flex items-center justify-center text-brand-warm-grey mb-4">
                  <ShoppingBag className="w-8 h-8 stroke-1" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-brand-charcoal">Your Bag is Empty</h3>
                <p className="text-xs text-brand-warm-grey max-w-xs mt-1.5 leading-relaxed">
                  Explore our popular collection of Paithani, Banarasi, Navvari, and Party Wear sarees.
                </p>
                <Link
                  to="/shop"
                  onClick={() => setIsCartOpen(false)}
                  className="mt-6 px-6 py-2.5 bg-brand-burgundy text-white text-xs font-semibold uppercase tracking-wider hover:bg-brand-burgundy-dark transition-colors shadow-sm"
                >
                  Explore Sarees
                </Link>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4 p-3 border border-brand-cream/70 bg-brand-ivory/20 rounded-sm"
                >
                  {/* Thumbnail */}
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-24 object-cover object-center rounded-sm bg-brand-cream/30 shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <Link
                          to={`/product/${item.slug}`}
                          onClick={() => setIsCartOpen(false)}
                          className="font-serif text-sm font-semibold text-brand-charcoal hover:text-brand-burgundy line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-slate-400 hover:text-rose-700 transition-colors ml-2"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-brand-warm-grey font-mono mt-0.5">SKU: {item.sku}</p>
                      {item.fabric && (
                        <p className="text-[11px] text-brand-warm-grey">Fabric: {item.fabric}</p>
                      )}
                    </div>

                    {/* Price and Quantity row */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center border border-brand-cream bg-white rounded-sm">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1 text-slate-600 hover:text-brand-burgundy"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold text-brand-charcoal">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxAvailable}
                          className="p-1 text-slate-600 hover:text-brand-burgundy disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="font-serif text-sm font-semibold text-brand-burgundy">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                        {item.mrp > item.price && (
                          <span className="text-[10px] text-brand-warm-grey line-through block">
                            ₹{(item.mrp * item.quantity).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-brand-cream/80 bg-brand-ivory/40 space-y-3">
              <div className="space-y-1.5 text-xs text-brand-charcoal">
                <div className="flex justify-between">
                  <span className="text-brand-warm-grey">Subtotal</span>
                  <span className="font-medium">₹{summary.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {summary.totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-800">
                    <span>Special Savings</span>
                    <span>-₹{summary.totalDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-brand-warm-grey">Shipping & Insurance</span>
                  <span className="text-emerald-800 font-semibold uppercase text-[11px]">Complimentary</span>
                </div>
                <div className="flex justify-between font-serif text-base font-bold text-brand-charcoal pt-2 border-t border-brand-cream">
                  <span>Grand Total</span>
                  <span className="text-brand-burgundy">₹{summary.total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-3.5 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold uppercase tracking-[0.2em] text-center transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-2 bg-transparent hover:bg-brand-cream/40 text-brand-charcoal text-xs font-medium uppercase tracking-wider text-center transition-colors border border-brand-cream"
                >
                  <span>View Full Bag & Summary</span>
                </Link>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-brand-warm-grey mt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-gold" />
                  <span>Pan-India Insured Express Delivery • Real-time Stock Reservation</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
