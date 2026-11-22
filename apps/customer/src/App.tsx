import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { SearchModal } from './components/SearchModal';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { WishlistPage } from './pages/WishlistPage';
import { AboutPage } from './pages/AboutPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';

export function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <CartProvider>
      <WishlistProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-brand-ivory text-brand-charcoal selection:bg-brand-burgundy selection:text-white w-full max-w-full overflow-x-hidden">
            <Header onOpenSearch={() => setIsSearchOpen(true)} />
            <CartDrawer />
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/product/:slug" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
                <Route path="/track-order" element={<OrderTrackingPage />} />
              </Routes>
            </main>

            <Footer />
          </div>
        </BrowserRouter>
      </WishlistProvider>
    </CartProvider>
  );
}

export default App;
