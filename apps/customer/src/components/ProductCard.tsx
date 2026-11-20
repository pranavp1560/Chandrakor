import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Eye, Sparkles } from 'lucide-react';
import { Product } from '@chandrakor/shared-types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();

  const primaryImage =
    product.images?.find((img) => img.is_primary)?.image_url ||
    product.images?.[0]?.image_url ||
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800';

  const secondaryImage =
    product.images?.find((img) => !img.is_primary)?.image_url || primaryImage;

  const discountPercent =
    product.mrp > product.selling_price
      ? Math.round(((product.mrp - product.selling_price) / product.mrp) * 100)
      : 0;

  const availableStock = product.inventory?.quantity_available ?? 10;
  const isOutOfStock = availableStock <= 0;
  const isLowStock = availableStock > 0 && availableStock <= 3;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    await addToCart(product, 1);
  };

  return (
    <div className="group relative bg-white border border-brand-cream/60 rounded-sm overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full">
      {/* Saree Image Container */}
      <Link to={`/product/${product.slug}`} className="block relative aspect-[3/4] bg-brand-cream/20 overflow-hidden">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.is_best_seller && (
            <span className="bg-brand-burgundy text-white text-[10px] tracking-widest font-semibold uppercase px-2 py-0.5 rounded-sm shadow-sm">
              Best Seller
            </span>
          )}
          {product.is_featured && !product.is_best_seller && (
            <span className="bg-brand-gold text-brand-charcoal text-[10px] tracking-widest font-bold uppercase px-2 py-0.5 rounded-sm shadow-sm">
              Heirloom
            </span>
          )}
          {discountPercent > 0 && (
            <span className="bg-emerald-800 text-white text-[10px] tracking-wider font-semibold px-2 py-0.5 rounded-sm shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Stock status indicator badge */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-brand-charcoal text-white font-serif text-sm px-4 py-1.5 uppercase tracking-widest font-semibold shadow-md">
              Sold Out
            </span>
          </div>
        ) : isLowStock ? (
          <div className="absolute bottom-2.5 left-2.5 bg-amber-900/90 text-amber-100 text-[10px] px-2 py-0.5 rounded font-medium backdrop-blur-sm">
            Only {availableStock} left
          </div>
        ) : null}

        {/* Quick Add Button overlay on hover */}
        {!isOutOfStock && (
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
            <button
              onClick={handleQuickAdd}
              className="w-full py-2 px-3 bg-white hover:bg-brand-burgundy text-brand-charcoal hover:text-white text-xs font-medium tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Quick Add</span>
            </button>
          </div>
        )}
      </Link>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Fabric & Category Line */}
          <div className="flex items-center justify-between text-[11px] text-brand-warm-grey mb-1 uppercase tracking-wider">
            <span>{product.fabric || product.category?.name || 'Pure Handloom'}</span>
            <span className="font-mono text-[10px] text-slate-400">{product.sku}</span>
          </div>

          {/* Saree Title */}
          <Link to={`/product/${product.slug}`} className="block group-hover:text-brand-burgundy transition-colors">
            <h3 className="font-serif text-base sm:text-lg font-semibold text-brand-charcoal line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Color & Occasion */}
          {product.colour && (
            <p className="text-xs text-brand-warm-grey mt-0.5 line-clamp-1">
              Shade: <span className="text-brand-charcoal font-medium">{product.colour}</span>
              {product.occasion && ` • ${product.occasion}`}
            </p>
          )}
        </div>

        {/* Pricing Line */}
        <div className="mt-3 pt-2.5 border-t border-brand-cream/60 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-semibold text-brand-burgundy font-serif">
              ₹{Number(product.selling_price).toLocaleString('en-IN')}
            </span>
            {product.mrp > product.selling_price && (
              <span className="text-xs text-brand-warm-grey line-through">
                ₹{Number(product.mrp).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <Link
            to={`/product/${product.slug}`}
            className="text-[11px] text-brand-warm-grey hover:text-brand-burgundy font-medium uppercase tracking-wider flex items-center gap-0.5"
          >
            <span>View</span>
            <span className="text-xs">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
