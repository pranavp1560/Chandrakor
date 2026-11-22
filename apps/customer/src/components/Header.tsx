import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, Sparkles, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { supabase } from '@chandrakor/supabase-client';

interface HeaderProps {
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const { summary, setIsCartOpen } = useCart();
  const { totalWishlistItems } = useWishlist();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<string>(
    'Complimentary Pan-India Express Shipping & Insured Heirloom Delivery on all orders'
  );
  const location = useLocation();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from('store_settings')
          .select('setting_value')
          .eq('setting_key', 'announcement_bar')
          .single();
        if (data?.setting_value?.message && data.setting_value.is_active) {
          setAnnouncement(data.setting_value.message);
        }
      } catch (e) {
        // Fallback default message already set
      }
    };
    fetchSettings();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-cream/60 transition-all">
      {/* Top Announcement Bar */}
      {announcement && (
        <div className="bg-brand-burgundy text-brand-ivory text-xs py-2 px-4 text-center font-medium tracking-wider flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-gold animate-pulse" />
          <span>{announcement}</span>
        </div>
      )}

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Mobile menu trigger */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-brand-charcoal hover:text-brand-burgundy transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex-1 lg:flex-none flex justify-center lg:justify-start">
            <Link to="/" className="flex flex-col items-center lg:items-start group">
              <div className="flex items-center gap-2">
                {/* Crescent Moon heritage emblem */}
                <div className="w-6 h-6 rounded-full border-2 border-brand-burgundy flex items-center justify-center bg-brand-cream/40 group-hover:bg-brand-burgundy transition-all">
                  <span className="text-brand-burgundy group-hover:text-brand-gold font-serif text-sm font-bold">☾</span>
                </div>
                <span className="font-serif text-2xl sm:text-3xl tracking-[0.22em] text-brand-burgundy font-bold uppercase transition-colors">
                  CHANDRAKOR
                </span>
              </div>
              <span className="text-[9px] tracking-[0.35em] text-brand-warm-grey uppercase font-medium mt-0.5 ml-8">
                Heirloom Sarees • 1984
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium tracking-wide">
            <Link
              to="/"
              className={`hover:text-brand-burgundy transition-colors ${
                location.pathname === '/' ? 'text-brand-burgundy font-semibold' : 'text-brand-charcoal'
              }`}
            >
              Home
            </Link>
            <Link
              to="/shop"
              className={`hover:text-brand-burgundy transition-colors ${
                location.pathname === '/shop' && !location.search ? 'text-brand-burgundy font-semibold' : 'text-brand-charcoal'
              }`}
            >
              All Sarees
            </Link>
            <Link
              to="/shop?category=silk-sarees"
              className="text-brand-charcoal hover:text-brand-burgundy transition-colors"
            >
              Silk Weaves
            </Link>
            <Link
              to="/shop?category=cotton-sarees"
              className="text-brand-charcoal hover:text-brand-burgundy transition-colors"
            >
              Pure Cottons
            </Link>
            <Link
              to="/shop?collection=wedding-collection"
              className="text-brand-charcoal hover:text-brand-burgundy transition-colors flex items-center gap-1.5"
            >
              <span>Bridal & Trousseau</span>
              <span className="text-[10px] bg-brand-cream text-brand-burgundy px-1.5 py-0.5 rounded uppercase font-semibold">Regal</span>
            </Link>
            <Link
              to="/about"
              className="text-brand-charcoal hover:text-brand-burgundy transition-colors"
            >
              Our Heritage
            </Link>
            <Link
              to="/track-order"
              className="text-brand-charcoal hover:text-brand-burgundy transition-colors flex items-center gap-1"
            >
              <span>Track Order</span>
            </Link>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            <button
              onClick={onOpenSearch}
              className="p-2 text-brand-charcoal hover:text-brand-burgundy transition-colors rounded-full hover:bg-brand-cream/50"
              aria-label="Search sarees"
            >
              <Search className="w-5 h-5" />
            </button>

            <Link
              to="/wishlist"
              className="relative p-2 text-brand-charcoal hover:text-brand-burgundy transition-colors rounded-full hover:bg-brand-cream/50 flex items-center"
              aria-label="View heirloom wishlist"
              title="My Wishlist"
            >
              <Heart className="w-5 h-5" />
              {totalWishlistItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-burgundy text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {totalWishlistItems}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-brand-charcoal hover:text-brand-burgundy transition-colors rounded-full hover:bg-brand-cream/50 flex items-center"
              aria-label="View shopping bag"
            >
              <ShoppingBag className="w-5 h-5" />
              {summary.totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-burgundy text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {summary.totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-brand-cream px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/"
            className="block py-2 text-base font-medium text-brand-charcoal border-b border-slate-100"
          >
            Home
          </Link>
          <Link
            to="/shop"
            className="block py-2 text-base font-medium text-brand-charcoal border-b border-slate-100"
          >
            All Sarees
          </Link>
          <Link
            to="/shop?category=banarasi-silk"
            className="block py-2 text-base font-medium text-brand-charcoal pl-3 border-b border-slate-100"
          >
            — Banarasi Silk Sarees
          </Link>
          <Link
            to="/shop?category=kanjivaram-silk"
            className="block py-2 text-base font-medium text-brand-charcoal pl-3 border-b border-slate-100"
          >
            — Kanjivaram Silk Sarees
          </Link>
          <Link
            to="/shop?category=paithani"
            className="block py-2 text-base font-medium text-brand-charcoal pl-3 border-b border-slate-100"
          >
            — Royal Paithani Sarees
          </Link>
          <Link
            to="/shop?category=cotton-sarees"
            className="block py-2 text-base font-medium text-brand-charcoal border-b border-slate-100"
          >
            Pure Cotton & Mulmul
          </Link>
          <Link
            to="/shop?collection=wedding-collection"
            className="block py-2 text-base font-medium text-brand-burgundy font-semibold border-b border-slate-100"
          >
            Bridal & Trousseau Collection
          </Link>
          <Link
            to="/about"
            className="block py-2 text-base font-medium text-brand-charcoal border-b border-slate-100"
          >
            About Chandrakor Heritage
          </Link>
          <Link
            to="/wishlist"
            className="flex items-center justify-between py-2 text-base font-medium text-brand-charcoal border-b border-slate-100"
          >
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-brand-burgundy" />
              <span>My Wishlist</span>
            </span>
            {totalWishlistItems > 0 && (
              <span className="bg-brand-burgundy text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {totalWishlistItems}
              </span>
            )}
          </Link>
          <Link
            to="/track-order"
            className="block py-2 text-base font-medium text-brand-burgundy font-semibold"
          >
            Track Your Order
          </Link>
        </div>
      )}
    </header>
  );
};
