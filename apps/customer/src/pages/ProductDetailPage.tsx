import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, Truck, Award, Check, Sparkles, ArrowRight } from 'lucide-react';
import { Product } from '@chandrakor/shared-types';
import { supabase } from '@chandrakor/supabase-client';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      setLoading(true);
      window.scrollTo(0, 0);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, images:product_images(*), inventory(*), category:categories(*)')
          .eq('slug', slug)
          .single();

        if (!error && data) {
          const prod = data as Product;
          setProduct(prod);
          const primary =
            prod.images?.find((img) => img.is_primary)?.image_url ||
            prod.images?.[0]?.image_url ||
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1000';
          setSelectedImage(primary);
          setQuantity(1);

          // Fetch related products in the same category
          if (prod.category_id) {
            const { data: related } = await supabase
              .from('products')
              .select('*, images:product_images(*), inventory(*)')
              .eq('category_id', prod.category_id)
              .neq('id', prod.id)
              .eq('is_active', true)
              .limit(4);
            if (related) setRelatedProducts(related as Product[]);
          }
        }
      } catch (e) {
        console.error('Failed to load product', e);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center font-serif text-xl text-brand-warm-grey">
        Unveiling Chandrakor Heirloom Drape...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-3xl font-bold text-brand-charcoal">Saree Not Found</h2>
        <p className="text-xs text-brand-warm-grey">The requested saree drape might have been moved or archived.</p>
        <Link
          to="/shop"
          className="inline-block px-6 py-2.5 bg-brand-burgundy text-white text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm"
        >
          Return to All Sarees
        </Link>
      </div>
    );
  }

  const availableStock = product.inventory?.quantity_available ?? 0;
  const isOutOfStock = availableStock <= 0;
  const isLowStock = availableStock > 0 && availableStock <= 3;
  const discountPercent =
    product.mrp > product.selling_price
      ? Math.round(((product.mrp - product.selling_price) / product.mrp) * 100)
      : 0;

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    setIsAdding(true);
    await addToCart(product, quantity);
    setIsAdding(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-brand-warm-grey flex items-center gap-2">
        <Link to="/" className="hover:text-brand-burgundy">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-brand-burgundy">Sarees</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link to={`/shop?category=${product.category.slug}`} className="hover:text-brand-burgundy">
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-brand-charcoal font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Saree Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
        {/* Left: Gallery & Zoom Preview */}
        <div className="space-y-4">
          <div className="relative aspect-[3/4] bg-stone-100 rounded-sm overflow-hidden border border-brand-cream/80">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {product.is_best_seller && (
              <span className="absolute top-4 left-4 bg-brand-burgundy text-white text-xs tracking-widest uppercase font-semibold px-3 py-1 rounded-sm shadow-md">
                Best Seller
              </span>
            )}
            {product.is_featured && !product.is_best_seller && (
              <span className="absolute top-4 left-4 bg-brand-gold text-brand-charcoal text-xs tracking-widest uppercase font-bold px-3 py-1 rounded-sm shadow-md">
                Heirloom Weave
              </span>
            )}
          </div>

          {/* Thumbnails row */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.image_url)}
                  className={`w-20 h-24 rounded-sm overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === img.image_url
                      ? 'border-brand-burgundy shadow-sm'
                      : 'border-brand-cream opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.image_url} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Saree Specifications & Add to Bag */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            {/* SKU & Category */}
            <div className="flex items-center justify-between text-xs text-brand-warm-grey">
              <span className="uppercase tracking-widest font-semibold text-brand-burgundy">
                {product.category?.name || 'Pure Handloom'}
              </span>
              <span className="font-mono">SKU: {product.sku}</span>
            </div>

            {/* Saree Name */}
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-charcoal leading-tight">
              {product.name}
            </h1>

            {/* Pricing Strip */}
            <div className="flex items-baseline gap-3 pt-1 border-b border-brand-cream/80 pb-4">
              <span className="font-serif text-3xl font-bold text-brand-burgundy">
                ₹{Number(product.selling_price).toLocaleString('en-IN')}
              </span>
              {product.mrp > product.selling_price && (
                <>
                  <span className="text-base text-brand-warm-grey line-through">
                    ₹{Number(product.mrp).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs bg-emerald-800 text-white font-semibold px-2 py-0.5 rounded-sm">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
              <span className="text-xs text-brand-warm-grey ml-auto">Inclusive of all taxes</span>
            </div>

            {/* Live Stock Notification */}
            <div>
              {isOutOfStock ? (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-sm font-semibold">
                  Currently Sold Out. Crafting additional pieces on our looms.
                </div>
              ) : isLowStock ? (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-sm font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                  <span>High Demand: Only {availableStock} pieces remain in physical vault</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Verified In Stock ({availableStock} available for immediate dispatch)</span>
                </div>
              )}
            </div>

            {/* Saree Attributes Specification Table */}
            <div className="bg-brand-cream/20 border border-brand-cream/80 rounded-sm p-4 text-xs space-y-2.5">
              <h3 className="font-serif text-sm font-bold text-brand-charcoal uppercase tracking-wider mb-2">
                Weave & Fabric Attributes
              </h3>
              <div className="grid grid-cols-2 gap-2 text-brand-charcoal">
                <div>
                  <span className="text-brand-warm-grey block">Fabric Pureness:</span>
                  <span className="font-semibold">{product.fabric || 'Pure Silk Handloom'}</span>
                </div>
                <div>
                  <span className="text-brand-warm-grey block">Shade & Hue:</span>
                  <span className="font-semibold">{product.colour || 'Classic Weave'}</span>
                </div>
                <div>
                  <span className="text-brand-warm-grey block">Craft / Pattern:</span>
                  <span className="font-semibold">{product.pattern || 'Traditional Zari Motifs'}</span>
                </div>
                <div>
                  <span className="text-brand-warm-grey block">Occasion:</span>
                  <span className="font-semibold">{product.occasion || 'Bridal & Festive'}</span>
                </div>
                <div>
                  <span className="text-brand-warm-grey block">Drape Length:</span>
                  <span className="font-semibold">{product.saree_length || '5.5 Meters'}</span>
                </div>
                <div>
                  <span className="text-brand-warm-grey block">Blouse Piece:</span>
                  <span className="font-semibold">{product.blouse_piece || 'Included (0.8m)'}</span>
                </div>
                {product.weight_grams && (
                  <div>
                    <span className="text-brand-warm-grey block">Physical Weight:</span>
                    <span className="font-semibold">{product.weight_grams} grams</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="text-xs sm:text-sm text-brand-charcoal/80 leading-relaxed space-y-2">
                <h4 className="font-serif text-sm font-bold text-brand-charcoal uppercase tracking-wider">
                  Artisanal Narrative
                </h4>
                <p>{product.description}</p>
              </div>
            )}
          </div>

          {/* Action Row: Quantity & Add to Cart */}
          <div className="pt-4 border-t border-brand-cream/80 space-y-4">
            {!isOutOfStock && (
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-brand-cream bg-white rounded-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-brand-charcoal hover:text-brand-burgundy"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 text-xs font-bold text-brand-charcoal">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                    disabled={quantity >= availableStock}
                    className="px-3 py-2 text-brand-charcoal hover:text-brand-burgundy disabled:opacity-30"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || isOutOfStock}
                  className="flex-1 py-3.5 px-6 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold uppercase tracking-[0.2em] transition-all rounded-sm shadow-md flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isAdding ? 'Adding Heirloom...' : 'Add to Bag'}</span>
                </button>
              </div>
            )}

            {/* Trust Assurances */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px] text-brand-warm-grey text-center">
              <div className="flex flex-col items-center gap-1 p-2 bg-white rounded border border-brand-cream/40">
                <Award className="w-4 h-4 text-brand-gold" />
                <span>Silk Mark Certified</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 bg-white rounded border border-brand-cream/40">
                <Truck className="w-4 h-4 text-brand-gold" />
                <span>Complimentary Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 bg-white rounded border border-brand-cream/40">
                <ShieldCheck className="w-4 h-4 text-brand-gold" />
                <span>Direct Handloom Weave</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Sarees */}
      {relatedProducts.length > 0 && (
        <section className="pt-12 border-t border-brand-cream/80">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-charcoal">
              Complementary Heirloom Sarees
            </h2>
            <Link
              to="/shop"
              className="text-xs font-semibold uppercase tracking-wider text-brand-burgundy hover:underline flex items-center gap-1"
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
