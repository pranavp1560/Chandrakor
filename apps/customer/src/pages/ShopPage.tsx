import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, SlidersHorizontal, ArrowUpDown, RefreshCw } from 'lucide-react';
import { Product, Category } from '@chandrakor/shared-types';
import { supabase } from '@chandrakor/supabase-client';
import { ProductCard } from '../components/ProductCard';
import { CategoryCircularSelector } from '../components/CategoryCircularSelector';

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || '';
  const collectionParam = searchParams.get('collection') || '';
  const searchParam = searchParams.get('search') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedFabric, setSelectedFabric] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price-asc' | 'price-desc'>('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sync state with URL params
  useEffect(() => {
    if (categoryParam) setSelectedCategory(categoryParam);
  }, [categoryParam]);

  // Fetch Categories for sidebar
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        if (data) setCategories(data);
      } catch (e) {
        console.error('Failed to load categories', e);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Products with filters
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('products')
          .select('*, images:product_images(*), inventory(*), category:categories(*)')
          .eq('is_active', true);

        // Filter by category slug
        if (selectedCategory) {
          // If category has subcategories or is subcategory
          const { data: cat } = await supabase
            .from('categories')
            .select('id, parent_id')
            .eq('slug', selectedCategory)
            .single();

          if (cat) {
            if (!cat.parent_id) {
              // It's a top-level category: get subcategories IDs
              const { data: subcats } = await supabase
                .from('categories')
                .select('id')
                .eq('parent_id', cat.id);
              const allCatIds = [cat.id, ...(subcats?.map((s) => s.id) || [])];
              query = query.in('category_id', allCatIds);
            } else {
              query = query.eq('category_id', cat.id);
            }
          }
        }

        // Filter by collection
        if (collectionParam) {
          const { data: collData } = await supabase
            .from('collections')
            .select('id')
            .eq('slug', collectionParam)
            .single();
          if (collData) {
            const { data: collProds } = await supabase
              .from('collection_products')
              .select('product_id')
              .eq('collection_id', collData.id);
            if (collProds && collProds.length > 0) {
              query = query.in('id', collProds.map((cp) => cp.product_id));
            }
          }
        }

        // Search text
        if (searchParam) {
          query = query.or(
            `name.ilike.%${searchParam}%,sku.ilike.%${searchParam}%,fabric.ilike.%${searchParam}%`
          );
        }

        // Fabric filter
        if (selectedFabric) {
          query = query.ilike('fabric', `%${selectedFabric}%`);
        }

        // Occasion filter
        if (selectedOccasion) {
          query = query.ilike('occasion', `%${selectedOccasion}%`);
        }

        // Sorting
        if (sortBy === 'newest') {
          query = query.order('created_at', { ascending: false });
        } else if (sortBy === 'price-asc') {
          query = query.order('selling_price', { ascending: true });
        } else if (sortBy === 'price-desc') {
          query = query.order('selling_price', { ascending: false });
        } else {
          query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
        }

        const { data, error } = await query;
        if (!error && data) {
          let list = data as Product[];
          if (inStockOnly) {
            list = list.filter((p) => (p.inventory?.quantity_available ?? 0) > 0);
          }
          setProducts(list);
        }
      } catch (e) {
        console.error('Failed to load products', e);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredProducts();
  }, [selectedCategory, collectionParam, searchParam, selectedFabric, selectedOccasion, inStockOnly, sortBy]);

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSelectedFabric('');
    setSelectedOccasion('');
    setInStockOnly(false);
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(
    selectedCategory || selectedFabric || selectedOccasion || inStockOnly || searchParam || collectionParam
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header and Breadcrumbs */}
      <div className="border-b border-brand-cream/80 pb-6 mb-8">
        <span className="text-xs uppercase tracking-widest text-brand-burgundy font-semibold">
          Curated Catalog
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-charcoal mt-1 capitalize">
          {collectionParam
            ? `${collectionParam.replace('-', ' ')} Sarees`
            : selectedCategory
            ? `${selectedCategory.replace('-', ' ')} Sarees`
            : 'All Sarees'}
        </h1>
        <p className="text-xs sm:text-sm text-brand-warm-grey mt-1">
          Showing {products.length} beautiful traditional & designer sarees
        </p>
      </div>

      {/* Visual Category Selector Strip */}
      <div className="mb-8 bg-brand-ivory/50 rounded-xl border border-brand-cream/80 p-3 sm:p-4 shadow-sm">
        <CategoryCircularSelector
          showAllOption={true}
          selectedCategory={selectedCategory}
          onSelectCategory={(slug) => {
            if (selectedCategory === slug) {
              setSelectedCategory('');
              setSearchParams({});
            } else {
              setSelectedCategory(slug);
              if (slug) {
                setSearchParams({ category: slug });
              } else {
                setSearchParams({});
              }
            }
          }}
          className="!py-0"
        />
      </div>

      {/* Control Bar: Sort & Mobile Filter Toggle */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <button
          onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white border border-brand-cream text-xs font-semibold text-brand-charcoal rounded-sm"
        >
          <SlidersHorizontal className="w-4 h-4 text-brand-burgundy" />
          <span>Filters {hasActiveFilters && '• Active'}</span>
        </button>

        {/* Active Filter Chips */}
        <div className="hidden lg:flex items-center gap-2 flex-wrap">
          {selectedCategory && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-cream/40 border border-brand-cream text-xs text-brand-charcoal rounded-sm">
              <span>Category: {selectedCategory.replace('-', ' ')}</span>
              <button onClick={() => setSelectedCategory('')}><X className="w-3 h-3 text-brand-warm-grey hover:text-brand-burgundy" /></button>
            </span>
          )}
          {selectedFabric && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-cream/40 border border-brand-cream text-xs text-brand-charcoal rounded-sm">
              <span>Fabric: {selectedFabric}</span>
              <button onClick={() => setSelectedFabric('')}><X className="w-3 h-3 text-brand-warm-grey hover:text-brand-burgundy" /></button>
            </span>
          )}
          {selectedOccasion && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-cream/40 border border-brand-cream text-xs text-brand-charcoal rounded-sm">
              <span>Occasion: {selectedOccasion}</span>
              <button onClick={() => setSelectedOccasion('')}><X className="w-3 h-3 text-brand-warm-grey hover:text-brand-burgundy" /></button>
            </span>
          )}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-brand-burgundy font-medium hover:underline ml-2"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 ml-auto">
          <label htmlFor="sort-select" className="text-xs text-brand-warm-grey hidden sm:inline">Sort By:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="text-xs bg-white border border-brand-cream text-brand-charcoal px-3 py-2 rounded-sm focus:outline-none focus:border-brand-burgundy"
          >
            <option value="featured">Featured Curations</option>
            <option value="newest">Fresh Arrivals (Newest)</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Main Grid & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className={`lg:block ${isMobileFilterOpen ? 'block' : 'hidden'} space-y-6 bg-white p-5 lg:p-0 border lg:border-none border-brand-cream rounded-sm`}>
          {/* Categories */}
          <div>
            <h3 className="font-serif text-base font-semibold text-brand-charcoal mb-3 pb-1 border-b border-brand-cream">
              Weave Category
            </h3>
            <ul className="space-y-1.5 text-xs text-brand-charcoal">
              <li>
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left py-1 hover:text-brand-burgundy ${
                    !selectedCategory ? 'text-brand-burgundy font-bold' : ''
                  }`}
                >
                  All Weaves
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full text-left py-1 hover:text-brand-burgundy flex items-center justify-between ${
                      selectedCategory === cat.slug ? 'text-brand-burgundy font-bold' : ''
                    }`}
                  >
                    <span>{cat.parent_id ? `— ${cat.name}` : cat.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Fabric */}
          <div>
            <h3 className="font-serif text-base font-semibold text-brand-charcoal mb-3 pb-1 border-b border-brand-cream">
              Fabric Pureness
            </h3>
            <div className="space-y-1.5 text-xs">
              {['Katan Silk', 'Kanchipuram Silk', 'Pure Silk', 'Mulmul Cotton', 'Pure Cotton', 'Georgette'].map(
                (fabric) => (
                  <label key={fabric} className="flex items-center gap-2 cursor-pointer text-brand-charcoal">
                    <input
                      type="radio"
                      name="fabric"
                      checked={selectedFabric === fabric}
                      onChange={() => setSelectedFabric(selectedFabric === fabric ? '' : fabric)}
                      className="text-brand-burgundy focus:ring-brand-burgundy h-3.5 w-3.5"
                    />
                    <span>{fabric}</span>
                  </label>
                )
              )}
            </div>
          </div>

          {/* Occasion */}
          <div>
            <h3 className="font-serif text-base font-semibold text-brand-charcoal mb-3 pb-1 border-b border-brand-cream">
              Occasion & Celebration
            </h3>
            <div className="space-y-1.5 text-xs">
              {['Bridal', 'Wedding', 'Festive', 'Daytime', 'Party', 'Puja'].map((occ) => (
                <label key={occ} className="flex items-center gap-2 cursor-pointer text-brand-charcoal">
                  <input
                    type="radio"
                    name="occasion"
                    checked={selectedOccasion === occ}
                    onChange={() => setSelectedOccasion(selectedOccasion === occ ? '' : occ)}
                    className="text-brand-burgundy focus:ring-brand-burgundy h-3.5 w-3.5"
                  />
                  <span>{occ}</span>
                </label>
              ))}
            </div>
          </div>

          {/* In Stock Only Checkbox */}
          <div className="pt-2 border-t border-brand-cream">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-brand-charcoal">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-brand-cream text-brand-burgundy focus:ring-brand-burgundy h-4 w-4"
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white border border-brand-cream/50 h-80 rounded-sm" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white border border-brand-cream rounded-sm p-8">
              <h3 className="font-serif text-2xl font-semibold text-brand-charcoal">No Sarees Found</h3>
              <p className="text-xs sm:text-sm text-brand-warm-grey mt-2 max-w-md mx-auto">
                No sarees match your currently selected filters. Clear your filters or explore other categories.
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-6 px-6 py-2.5 bg-brand-burgundy text-white text-xs font-semibold uppercase tracking-wider rounded-sm shadow-sm hover:bg-brand-burgundy-dark transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
