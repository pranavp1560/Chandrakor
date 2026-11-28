import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Award, Compass, Feather, Sparkles } from 'lucide-react';
import { Banner, Category, Product } from '@chandrakor/shared-types';
import { supabase } from '@chandrakor/supabase-client';
import { ProductCard } from '../components/ProductCard';

export const HomePage: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch Banners
        const { data: bannerData } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        if (bannerData) setBanners(bannerData);

        // 2. Fetch Top Categories
        const { data: catData } = await supabase
          .from('categories')
          .select('*')
          .is('parent_id', null)
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        if (catData) setCategories(catData);

        // 3. Fetch New Arrivals
        const { data: newProdData } = await supabase
          .from('products')
          .select('*, images:product_images(*), inventory(*), category:categories(*)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(4);
        if (newProdData) setNewArrivals(newProdData as Product[]);

        // 4. Fetch Best Sellers
        const { data: bestProdData } = await supabase
          .from('products')
          .select('*, images:product_images(*), inventory(*), category:categories(*)')
          .eq('is_active', true)
          .eq('is_best_seller', true)
          .limit(4);
        if (bestProdData) setBestSellers(bestProdData as Product[]);
      } catch (e) {
        console.error('Failed to load home data', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Banner auto-rotation
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const currentBanner = banners[activeBannerIndex];

  return (
    <div className="space-y-12 sm:space-y-24 pb-16 w-full max-w-full overflow-hidden">
      {/* 1. HERO BANNER SLIDER */}
      <section className="relative w-full h-[480px] sm:h-[620px] lg:h-[700px] bg-brand-charcoal overflow-hidden max-w-full">
        {banners.length > 0 && currentBanner ? (
          <div className="relative w-full h-full">
            {/* Background Image with subtle zoom */}
            <img
              src={currentBanner.image_url}
              alt={currentBanner.title}
              className="w-full h-full object-cover object-center transition-all duration-1000 ease-in-out scale-100"
            />
            {/* Gradient Overlays for contrast & warmth */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

            {/* Banner Editorial Content */}
            <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
              <div className="max-w-xl text-white space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-brand-burgundy/80 backdrop-blur-sm border border-brand-gold/40 text-brand-gold text-[10px] sm:text-[11px] uppercase tracking-widest font-semibold rounded-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Traditional & Festive Sarees</span>
                </div>

                <h1 className="font-serif text-2xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] text-white break-words">
                  {currentBanner.title}
                </h1>

                {currentBanner.subtitle && (
                  <p className="text-xs sm:text-base text-stone-200 font-light leading-relaxed max-w-lg line-clamp-3 sm:line-clamp-none">
                    {currentBanner.subtitle}
                  </p>
                )}

                <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                  <Link
                    to={currentBanner.button_link || '/shop'}
                    className="px-5 py-3 sm:px-7 sm:py-3.5 bg-brand-burgundy hover:bg-brand-burgundy-light text-white text-[11px] sm:text-xs font-semibold uppercase tracking-wider sm:tracking-[0.2em] transition-all rounded-sm shadow-lg hover:shadow-brand-burgundy/40 flex items-center gap-2 border border-brand-burgundy-light"
                  >
                    <span>{currentBanner.button_text || 'Explore Sarees'}</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Link>
                  <Link
                    to="/about"
                    className="px-4 py-3 sm:px-6 sm:py-3.5 bg-white/10 hover:bg-white/20 text-white text-[11px] sm:text-xs font-medium uppercase tracking-wider sm:tracking-[0.15em] transition-all backdrop-blur-sm rounded-sm border border-white/20"
                  >
                    Our Heritage
                  </Link>
                </div>
              </div>
            </div>

            {/* Slider Controls */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setActiveBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm transition-all"
                  aria-label="Previous banner"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setActiveBannerIndex((prev) => (prev + 1) % banners.length)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm transition-all"
                  aria-label="Next banner"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Dot Indicators */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveBannerIndex(idx)}
                      className={`h-1.5 transition-all rounded-full ${
                        idx === activeBannerIndex ? 'w-8 bg-brand-gold' : 'w-2 bg-white/50'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-serif text-2xl">
            Loading Chandrakor Curations...
          </div>
        )}
      </section>

      {/* 2. SHOP BY WEAVE CATEGORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 !mt-6 sm:!mt-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-brand-cream/80">
          <div>
            <span className="text-xs uppercase tracking-widest text-brand-burgundy font-semibold">
              Explore By Style
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-charcoal mt-1">
              Shop by Category
            </h2>
          </div>
          <Link
            to="/shop"
            className="mt-2 sm:mt-0 text-xs font-semibold uppercase tracking-wider text-brand-burgundy hover:text-brand-burgundy-dark flex items-center gap-1"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="group relative h-96 rounded-sm overflow-hidden border border-brand-cream bg-stone-100 flex flex-col justify-end p-6"
            >
              {/* Category Image */}
              <img
                src={cat.image_url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800'}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent group-hover:from-black/90 transition-all" />

              {/* Text */}
              <div className="relative z-10 text-white space-y-2">
                <span className="text-[10px] tracking-[0.25em] text-brand-gold uppercase font-bold">
                  Popular Choice
                </span>
                <h3 className="font-serif text-2xl font-bold tracking-wide group-hover:text-brand-gold-light transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-stone-200 line-clamp-2 leading-relaxed font-light">
                  {cat.description}
                </p>
                <div className="pt-2 flex items-center text-xs font-medium text-brand-gold uppercase tracking-wider gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Explore Collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. NEW ARRIVALS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-brand-cream/80">
          <div>
            <span className="text-xs uppercase tracking-widest text-brand-burgundy font-semibold">
              Trending Collections
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-charcoal mt-1">
              New Seasonal Arrivals
            </h2>
          </div>
          <Link
            to="/shop?collection=new-arrivals"
            className="mt-2 sm:mt-0 text-xs font-semibold uppercase tracking-wider text-brand-burgundy hover:text-brand-burgundy-dark flex items-center gap-1"
          >
            <span>View All New Arrivals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {newArrivals.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-brand-warm-grey">Loading fresh arrivals...</div>
        )}
      </section>

      {/* 5. EDITORIAL BRIDAL & WEDDING BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full overflow-hidden">
        <div className="relative rounded-sm overflow-hidden bg-brand-charcoal min-h-[380px] sm:min-h-[420px] flex items-center">
          <img
            src="https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=85&w=1600"
            alt="Chandrakor Royal Bridal Trousseau"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-40 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-charcoal via-brand-burgundy/90 to-transparent" />

          <div className="relative z-10 p-5 sm:p-14 max-w-xl text-white space-y-3 sm:space-y-4">
            <span className="text-[10px] sm:text-xs tracking-wider sm:tracking-[0.3em] uppercase text-brand-gold font-bold">
              Royal Wedding & Festive Sarees
            </span>
            <h2 className="font-serif text-2xl sm:text-5xl font-bold leading-tight break-words">
              Grand Sarees for Weddings & Celebrations
            </h2>
            <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-light">
              Explore rich bridal Banarasis, royal Paithanis, and exquisite festive sarees designed to make your special moments truly unforgettable.
            </p>
            <div className="pt-2 sm:pt-3">
              <Link
                to="/shop?collection=wedding-collection"
                className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-brand-gold hover:bg-brand-gold-light text-brand-charcoal text-[11px] sm:text-xs font-semibold uppercase tracking-wider sm:tracking-[0.2em] transition-all rounded-sm shadow-md"
              >
                <span>Explore Wedding Collection</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BEST SELLERS CURATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-brand-cream/80">
          <div>
            <span className="text-xs uppercase tracking-widest text-brand-burgundy font-semibold">
              Customer Favorites
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-charcoal mt-1">
              Trending Best Sellers
            </h2>
          </div>
          <Link
            to="/shop?collection=best-sellers"
            className="mt-2 sm:mt-0 text-xs font-semibold uppercase tracking-wider text-brand-burgundy hover:text-brand-burgundy-dark flex items-center gap-1"
          >
            <span>View All Best Sellers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {bestSellers.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-brand-warm-grey">Loading best sellers...</div>
        )}
      </section>
    </div>
  );
};
