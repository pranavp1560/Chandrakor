import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import { supabase } from '@chandrakor/supabase-client';
import { Product } from '@chandrakor/shared-types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, images:product_images(*)')
          .eq('is_active', true)
          .or(`name.ilike.%${query}%,sku.ilike.%${query}%,fabric.ilike.%${query}%,colour.ilike.%${query}%`)
          .limit(8);

        if (!error && data) {
          setResults(data as Product[]);
        }
      } catch (e) {
        console.error('Search query error', e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="min-h-screen px-4 text-center flex items-start justify-center pt-20">
        <div className="inline-block w-full max-w-2xl bg-white text-left align-middle shadow-2xl transition-all transform rounded-sm border border-brand-cream overflow-hidden z-10">
          {/* Search Input Bar */}
          <div className="p-4 border-b border-brand-cream flex items-center gap-3 bg-brand-ivory/30">
            <Search className="w-5 h-5 text-brand-burgundy shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by saree weave, fabric (e.g. Banarasi, Paithani, Katan), shade, or SKU..."
              className="w-full bg-transparent text-sm sm:text-base text-brand-charcoal placeholder-brand-warm-grey focus:outline-none"
              autoFocus
            />
            {loading && <Loader2 className="w-5 h-5 text-brand-burgundy animate-spin shrink-0" />}
            <button
              onClick={onClose}
              className="p-1 text-brand-warm-grey hover:text-brand-burgundy rounded-full hover:bg-brand-cream/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results Area */}
          <div className="max-h-96 overflow-y-auto p-4">
            {query.trim() && !loading && results.length === 0 && (
              <div className="text-center py-8 text-brand-warm-grey text-sm">
                No sarees found matching "{query}". Try searching for "Paithani", "Banarasi", "Navvari", or "Party Wear".
              </div>
            )}

            {!query.trim() && (
              <div className="py-6 px-2">
                <p className="text-xs text-brand-warm-grey uppercase tracking-wider mb-3">Popular Searches</p>
                <div className="flex flex-wrap gap-2">
                  {['Paithani Sarees', 'Banarasi Silk', 'Navvari Sarees', 'Party Wear', 'Daily Cotton', 'Bridal Sarees'].map(
                    (tag) => (
                      <button
                        key={tag}
                        onClick={() => setQuery(tag)}
                        className="px-3 py-1 bg-brand-cream/40 hover:bg-brand-cream text-brand-charcoal text-xs rounded-sm transition-colors border border-brand-cream"
                      >
                        {tag}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {results.length > 0 && (
              <div className="divide-y divide-slate-100">
                {results.map((product) => {
                  const img =
                    product.images?.find((i) => i.is_primary)?.image_url ||
                    product.images?.[0]?.image_url ||
                    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=200';
                  return (
                    <Link
                      key={product.id}
                      to={`/product/${product.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-4 py-3 px-2 hover:bg-brand-ivory/60 transition-colors rounded-sm group"
                    >
                      <img
                        src={img}
                        alt={product.name}
                        className="w-14 h-16 object-cover rounded-sm bg-brand-cream/30 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-brand-warm-grey uppercase font-mono">{product.sku} • {product.fabric}</p>
                        <h4 className="font-serif text-sm font-semibold text-brand-charcoal group-hover:text-brand-burgundy transition-colors truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-semibold text-brand-burgundy font-serif">
                            ₹{Number(product.selling_price).toLocaleString('en-IN')}
                          </span>
                          {product.mrp > product.selling_price && (
                            <span className="text-[11px] text-brand-warm-grey line-through">
                              ₹{Number(product.mrp).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
