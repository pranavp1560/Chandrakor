import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '@chandrakor/shared-types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

interface ProductCardProps {
  product: Product;
}

// Consistent deterministic social proof rating & reviews helper
const getProductRating = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  const rating = (4.6 + (positiveHash % 4) * 0.1).toFixed(1); // 4.6, 4.7, 4.8, 4.9
  const reviews = 25 + (positiveHash % 450); // between 25 and 475 reviews
  return { rating, reviews };
};

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);

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
  const isLowStock = availableStock > 0 && availableStock <= 3;

  const { rating, reviews } = getProductRating(product.id);

  // Badge priority: Best seller / featured -> TRENDING, otherwise alternate with SAME DAY DISPATCH
  const isTrending = product.is_best_seller || product.is_featured;
  const isSameDayDispatch = !isTrending && product.id.charCodeAt(0) % 2 === 0;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    await addToCart(product, 1);
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(product);
  };

  return (
    <div className="group relative flex flex-col h-full bg-transparent">
      {/* 1. Saree Image Container with Rounded Corners (matching reference) */}
      <Link
        to={`/product/${product.slug}`}
        className="block relative aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden bg-stone-100 shadow-sm"
      >
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Top-Left Pill Badge: TRENDING (Terracotta) or SAME DAY DISPATCH (Forest Green) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {isTrending ? (
            <span className="bg-[#693922] text-white text-[10px] sm:text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md shadow-sm">
              TRENDING
            </span>
          ) : isSameDayDispatch ? (
            <span className="bg-[#245f3b] text-white text-[10px] sm:text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md shadow-sm">
              SAME DAY DISPATCH
            </span>
          ) : (
            <span className="bg-[#693922] text-white text-[10px] sm:text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md shadow-sm">
              TRENDING
            </span>
          )}
        </div>

        {/* Top-Right Wishlist Heart Button (Clean outline with drop-shadow or filled rose) */}
        <div className="absolute top-2.5 right-2.5 z-20">
          <button
            onClick={handleWishlistToggle}
            className="p-1.5 sm:p-2 rounded-full transition-transform hover:scale-110 active:scale-95 focus:outline-none"
            aria-label={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
            title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart
              className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                inWishlist
                  ? 'text-rose-500 fill-rose-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]'
                  : 'text-white stroke-[2.2] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] hover:text-rose-200'
              }`}
            />
          </button>
        </div>

        {/* Stock status indicator badge */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-[#261711] text-white font-medium text-xs px-3.5 py-1.5 uppercase tracking-widest rounded-md shadow-md">
              Sold Out
            </span>
          </div>
        ) : isLowStock ? (
          <div className="absolute bottom-2.5 left-2.5 bg-amber-950/85 text-amber-100 text-[10px] px-2 py-0.5 rounded font-medium backdrop-blur-sm shadow-sm">
            Only {availableStock} left
          </div>
        ) : null}

        {/* Quick Add Button overlay on hover */}
        {!isOutOfStock && (
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex justify-center">
            <button
              onClick={handleQuickAdd}
              className="w-full py-2 px-3 bg-white/95 hover:bg-brand-burgundy text-[#261711] hover:text-white text-xs font-semibold tracking-wider uppercase rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-md backdrop-blur-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Quick Add</span>
            </button>
          </div>
        )}
      </Link>

      {/* 2. Product Details (Clean spacing, typography matching reference) */}
      <div className="pt-3 pb-1 flex flex-col justify-between flex-1 space-y-1">
        {/* Saree Title (Rich warm earthy brown, line-clamp-2) */}
        <Link
          to={`/product/${product.slug}`}
          className="block group-hover:text-brand-burgundy transition-colors"
        >
          <h3 className="text-sm sm:text-[15px] font-medium text-[#382218] line-clamp-2 leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Fabric & Occasion Line (e.g. Silk Blend · Traditional) */}
        <p className="text-xs text-[#8c7467] font-normal line-clamp-1">
          {product.fabric || 'Silk Blend'} · {product.occasion || 'Traditional'}
        </p>

        {/* Star Rating & Reviews Line (★★★★★ 4.7 | 445) */}
        <div className="flex items-center gap-1.5 text-xs text-[#523325] pt-0.5">
          <span className="text-[#523325] tracking-tighter text-xs select-none">
            ★★★★★
          </span>
          <span className="font-semibold text-[#523325] text-[11px] sm:text-xs">
            {rating} <span className="text-[#8c7467] font-normal">| {reviews}</span>
          </span>
        </div>

        {/* Pricing Line: ₹ 1,150  MRP ₹ 3,545  67% off */}
        <div className="flex items-baseline gap-2 pt-1 flex-wrap">
          <span className="text-base sm:text-lg font-bold text-[#261711]">
            ₹ {Number(product.selling_price).toLocaleString('en-IN')}
          </span>

          {product.mrp > product.selling_price && (
            <>
              <span className="text-xs text-[#9a8579] line-through font-normal">
                MRP ₹ {Number(product.mrp).toLocaleString('en-IN')}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[#276e43]">
                {discountPercent}% off
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
