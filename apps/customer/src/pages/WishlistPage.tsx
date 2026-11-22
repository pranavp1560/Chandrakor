import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight, Sparkles, Check, AlertCircle } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

export const WishlistPage: React.FC = () => {
  const { wishlist, removeFromWishlist, moveToCart, moveAllToCart, clearWishlist } = useWishlist();
  const { setIsCartOpen } = useCart();
  const [movingId, setMovingId] = useState<string | null>(null);
  const [isMovingAll, setIsMovingAll] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleMoveToCart = async (product: any) => {
    setMovingId(product.id);
    const success = await moveToCart(product);
    setMovingId(null);
    if (success) {
      setFeedbackMsg(`"${product.name}" moved to your shopping bag.`);
      setIsCartOpen(true);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleMoveAll = async () => {
    setIsMovingAll(true);
    const result = await moveAllToCart();
    setIsMovingAll(false);
    if (result.added > 0) {
      setFeedbackMsg(`Successfully transferred ${result.added} heirloom piece(s) to your bag.`);
      setIsCartOpen(true);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-brand-warm-grey flex items-center gap-2 mb-6">
        <Link to="/" className="hover:text-brand-burgundy transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-brand-charcoal font-medium">Heirloom Wishlist</span>
      </nav>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-brand-cream/80 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-burgundy text-xs font-semibold uppercase tracking-widest mb-1.5">
            <Sparkles className="w-4 h-4 text-brand-gold" />
            <span>Personal Vault</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-charcoal tracking-tight">
            My Heirloom Wishlist
          </h1>
          <p className="text-sm text-brand-warm-grey mt-1">
            Carefully curated sarees and handcrafted weaves saved for your celebrations.
          </p>
        </div>

        {wishlist.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleMoveAll}
              disabled={isMovingAll}
              className="py-2.5 px-4 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isMovingAll ? 'Transferring...' : 'Move All to Bag'}</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your saved wishlist?')) {
                  clearWishlist();
                }
              }}
              className="py-2.5 px-3 border border-brand-cream hover:border-red-300 text-brand-warm-grey hover:text-red-700 text-xs font-medium uppercase tracking-wider rounded-sm transition-colors"
              title="Clear all wishlisted items"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Toast / Notification feedback */}
      {feedbackMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-sm text-sm flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs uppercase font-bold text-emerald-800 hover:text-emerald-950 underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Content Area */}
      {wishlist.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 sm:py-24 bg-white border border-brand-cream/60 rounded-sm px-4 max-w-2xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-full bg-brand-cream/50 border border-brand-cream flex items-center justify-center mx-auto mb-5 text-brand-burgundy">
            <Heart className="w-8 h-8 stroke-1 text-brand-burgundy/80" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-brand-charcoal mb-2">
            Your Wishlist is Empty
          </h2>
          <p className="text-sm text-brand-warm-grey max-w-md mx-auto mb-8 leading-relaxed">
            You haven't saved any sarees yet. Explore our royal Banarasi silks, Kanjivaram heirlooms,
            and Paithani weaves to find your match.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/shop"
              className="w-full sm:w-auto py-3 px-8 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold uppercase tracking-[0.2em] rounded-sm transition-all shadow-md inline-flex items-center justify-center gap-2"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/shop?category=silk-sarees"
              className="w-full sm:w-auto py-3 px-6 border border-brand-cream hover:border-brand-burgundy text-brand-charcoal hover:text-brand-burgundy text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors"
            >
              Silk Weaves
            </Link>
          </div>
        </div>
      ) : (
        /* Wishlist Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((product) => {
            const primaryImage =
              product.images?.find((img) => img.is_primary)?.image_url ||
              product.images?.[0]?.image_url ||
              'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800';

            const discountPercent =
              product.mrp > product.selling_price
                ? Math.round(((product.mrp - product.selling_price) / product.mrp) * 100)
                : 0;

            const availableStock = product.inventory?.quantity_available ?? 10;
            const isOutOfStock = availableStock <= 0;

            return (
              <div
                key={product.id}
                className="group bg-white border border-brand-cream/80 rounded-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300 relative"
              >
                {/* Remove button */}
                <button
                  onClick={() => removeFromWishlist(product.id)}
                  className="absolute top-2.5 right-2.5 z-20 p-2 bg-white/90 hover:bg-red-50 text-brand-warm-grey hover:text-red-700 rounded-full shadow-sm backdrop-blur-sm transition-colors"
                  aria-label="Remove item"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Saree Image Container */}
                <Link
                  to={`/product/${product.slug}`}
                  className="block relative aspect-[3/4] bg-stone-100 overflow-hidden"
                >
                  <img
                    src={primaryImage}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />

                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
                    {product.is_best_seller && (
                      <span className="bg-brand-burgundy text-white text-[10px] tracking-widest font-semibold uppercase px-2 py-0.5 rounded-sm shadow-sm">
                        Best Seller
                      </span>
                    )}
                    {discountPercent > 0 && (
                      <span className="bg-emerald-800 text-white text-[10px] tracking-wider font-semibold px-2 py-0.5 rounded-sm shadow-sm">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Sold out overlay */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-brand-charcoal text-white font-serif text-xs px-3 py-1 uppercase tracking-widest font-semibold shadow-md">
                        Sold Out
                      </span>
                    </div>
                  )}
                </Link>

                {/* Info & Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-brand-warm-grey mb-1 uppercase tracking-wider">
                      <span>{product.fabric || product.category?.name || 'Pure Handloom'}</span>
                      <span className="font-mono text-[10px] text-slate-400">{product.sku}</span>
                    </div>

                    <Link
                      to={`/product/${product.slug}`}
                      className="block group-hover:text-brand-burgundy transition-colors"
                    >
                      <h3 className="font-serif text-base font-semibold text-brand-charcoal line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>

                    {product.colour && (
                      <p className="text-xs text-brand-warm-grey mt-0.5 line-clamp-1">
                        Shade: <span className="text-brand-charcoal font-medium">{product.colour}</span>
                      </p>
                    )}

                    {/* Price */}
                    <div className="mt-2.5 flex items-baseline gap-2">
                      <span className="text-base font-semibold text-brand-burgundy font-serif">
                        ₹{Number(product.selling_price).toLocaleString('en-IN')}
                      </span>
                      {product.mrp > product.selling_price && (
                        <span className="text-xs text-brand-warm-grey line-through">
                          ₹{Number(product.mrp).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-brand-cream/60 flex items-center gap-2">
                    {!isOutOfStock ? (
                      <button
                        onClick={() => handleMoveToCart(product)}
                        disabled={movingId === product.id}
                        className="w-full py-2.5 px-3 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{movingId === product.id ? 'Moving...' : 'Move to Bag'}</span>
                      </button>
                    ) : (
                      <div className="w-full text-center py-2 text-xs font-medium text-amber-900 bg-amber-50 rounded border border-amber-200">
                        Temporarily Out of Stock
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
