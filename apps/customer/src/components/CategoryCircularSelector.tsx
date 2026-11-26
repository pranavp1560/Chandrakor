import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Category } from '@chandrakor/shared-types';
import { supabase } from '@chandrakor/supabase-client';

interface CategoryCircularSelectorProps {
  title?: string;
  subtitle?: string;
  categories?: Category[];
  selectedCategory?: string;
  onSelectCategory?: (slug: string) => void;
  showAllOption?: boolean;
  className?: string;
}

// Curated high-res portraits matching traditional Indian drape aesthetics
const FALLBACK_CATEGORY_IMAGES: Record<string, string> = {
  'silk-sarees': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600',
  'cotton-sarees': 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=600',
  'tussar-sarees': 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600',
  'designer-sarees': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600',
  'banarasi-silk': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600',
  'kanjivaram-silk': 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=600',
  'paithani': 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600',
  'pure-cotton': 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=600',
  'mul-cotton': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600',
  'party-wear': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600',
  'embroidered': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600',
};

export const CategoryCircularSelector: React.FC<CategoryCircularSelectorProps> = ({
  title = 'TRADITION',
  subtitle,
  categories: propCategories,
  selectedCategory = '',
  onSelectCategory,
  showAllOption = false,
  className = '',
}) => {
  const [internalCategories, setInternalCategories] = useState<Category[]>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load categories if not provided as props
  useEffect(() => {
    if (propCategories && propCategories.length > 0) {
      setInternalCategories(propCategories);
      return;
    }

    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!error && data) {
          // Sort to prioritize top-level categories first, followed by subcategories
          const topLevel = data.filter((c) => !c.parent_id);
          const subCats = data.filter((c) => c.parent_id);
          setInternalCategories([...topLevel, ...subCats]);
        }
      } catch (err) {
        console.error('Error fetching categories for circular selector:', err);
      }
    };

    fetchCategories();
  }, [propCategories]);

  // Check scroll capability for navigation buttons
  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [internalCategories]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = Math.max(el.clientWidth * 0.75, 240);
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const getCategoryImage = (cat: Category) => {
    if (cat.image_url) return cat.image_url;
    if (FALLBACK_CATEGORY_IMAGES[cat.slug]) return FALLBACK_CATEGORY_IMAGES[cat.slug];
    return 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600';
  };

  return (
    <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 ${className}`}>
      {/* Title Header (Matching the exact 'TRADITION' style in reference screenshot) */}
      {title && (
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-normal tracking-[0.25em] text-brand-charcoal uppercase">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-brand-warm-grey mt-1 tracking-wide font-light">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Slider Container with Left & Right Arrows */}
      <div className="relative group/carousel">
        {/* Left Arrow Button */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll('left')}
            className="hidden sm:flex absolute -left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-white/95 text-brand-charcoal shadow-md border border-brand-cream/80 hover:bg-brand-ivory hover:text-brand-burgundy transition-all opacity-0 group-hover/carousel:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Right Arrow Button */}
        {canScrollRight && (
          <button
            onClick={() => handleScroll('right')}
            className="hidden sm:flex absolute -right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-white/95 text-brand-charcoal shadow-md border border-brand-cream/80 hover:bg-brand-ivory hover:text-brand-burgundy transition-all opacity-0 group-hover/carousel:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Horizontal Scroll Area */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex items-start gap-5 sm:gap-8 md:gap-10 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1 justify-start md:justify-center"
        >
          {/* Optional "All Sarees" Circle for Shop filtering */}
          {showAllOption && (
            <button
              onClick={() => onSelectCategory && onSelectCategory('')}
              className="flex flex-col items-center group shrink-0 focus:outline-none"
            >
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden flex items-center justify-center transition-all duration-300 ${
                  !selectedCategory
                    ? 'ring-2 ring-brand-burgundy ring-offset-2 ring-offset-white shadow-md scale-105 bg-brand-burgundy text-white'
                    : 'bg-stone-100 text-brand-charcoal border border-brand-cream hover:border-brand-burgundy/40 hover:shadow-sm'
                }`}
              >
                <div className="flex flex-col items-center justify-center p-2 text-center">
                  <Sparkles className="w-5 h-5 mb-1 text-brand-gold" />
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">
                    All
                  </span>
                </div>
              </div>
              <span
                className={`mt-2.5 text-xs sm:text-sm text-center font-medium transition-colors whitespace-nowrap ${
                  !selectedCategory ? 'text-brand-burgundy font-semibold' : 'text-brand-charcoal group-hover:text-brand-burgundy'
                }`}
              >
                All Sarees
              </span>
            </button>
          )}

          {/* Category Circle Items */}
          {internalCategories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            const imageUrl = getCategoryImage(cat);

            const content = (
              <>
                {/* Circular Image Container */}
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden relative shadow-sm transition-all duration-300 ${
                    isSelected
                      ? 'ring-2 ring-brand-burgundy ring-offset-2 ring-offset-white shadow-md scale-105'
                      : 'border border-stone-200/80 group-hover:border-brand-burgundy/40 group-hover:shadow-md'
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={cat.name}
                    loading="lazy"
                    className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
                  />
                  {/* Subtle inner shadow overlay */}
                  <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/5 pointer-events-none" />
                </div>

                {/* Category Label Below Circle */}
                <span
                  className={`mt-2 sm:mt-2.5 text-xs sm:text-sm text-center font-medium transition-colors whitespace-nowrap block ${
                    isSelected
                      ? 'text-brand-burgundy font-semibold'
                      : 'text-brand-charcoal group-hover:text-brand-burgundy'
                  }`}
                >
                  {cat.name}
                </span>
              </>
            );

            // If an onSelectCategory callback is passed (e.g. on ShopPage filter mode), render as interactive button
            if (onSelectCategory) {
              return (
                <button
                  key={cat.id || cat.slug}
                  onClick={() => onSelectCategory(cat.slug)}
                  className="flex flex-col items-center group shrink-0 focus:outline-none"
                >
                  {content}
                </button>
              );
            }

            // Otherwise, render as router link (e.g. on HomePage)
            return (
              <Link
                key={cat.id || cat.slug}
                to={`/shop?category=${cat.slug}`}
                className="flex flex-col items-center group shrink-0 focus:outline-none"
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
