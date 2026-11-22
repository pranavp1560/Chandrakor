import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '@chandrakor/shared-types';
import { supabase } from '@chandrakor/supabase-client';
import { useCart } from './CartContext';

interface WishlistContextType {
  wishlist: Product[];
  totalWishlistItems: number;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (product: Product) => Promise<boolean>; // returns true if added, false if removed
  moveToCart: (product: Product) => Promise<boolean>;
  moveAllToCart: () => Promise<{ added: number; failed: number }>;
  clearWishlist: () => Promise<void>;
  isLoading: boolean;
}

const WISHLIST_STORAGE_KEY = 'chandrakor_guest_wishlist_v1';
const SESSION_ID_KEY = 'chandrakor_device_session_id';

const getOrCreateSessionId = (): string => {
  try {
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = 'guest_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
      localStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return 'temp_session_' + Date.now();
  }
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (e) {
      console.error('Failed to save wishlist to localStorage', e);
    }
  }, [wishlist]);

  // Synchronize remote database on mount
  useEffect(() => {
    const syncRemoteWishlist = async () => {
      try {
        const sessionId = getOrCreateSessionId();
        const { data, error } = await supabase
          .from('customer_wishlists')
          .select('product:products(*, images:product_images(*), inventory:inventory(*), category:categories(*))')
          .eq('session_id', sessionId);

        if (!error && data && data.length > 0) {
          const remoteProducts = data
            .map((item: any) => item.product)
            .filter((p: any): p is Product => Boolean(p && p.id));

          if (remoteProducts.length > 0) {
            setWishlist((prev) => {
              const combinedMap = new Map<string, Product>();
              prev.forEach((p) => combinedMap.set(p.id, p));
              remoteProducts.forEach((p) => combinedMap.set(p.id, p));
              return Array.from(combinedMap.values());
            });
          }
        }
      } catch (err) {
        console.warn('Wishlist remote sync failed, using local offline storage', err);
      }
    };

    syncRemoteWishlist();
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => {
      return wishlist.some((item) => item.id === productId);
    },
    [wishlist]
  );

  const addToWishlist = async (product: Product) => {
    if (isInWishlist(product.id)) return;

    setWishlist((prev) => [product, ...prev]);

    try {
      const sessionId = getOrCreateSessionId();
      await supabase.from('customer_wishlists').upsert(
        {
          session_id: sessionId,
          product_id: product.id,
        },
        { onConflict: 'session_id,product_id' }
      );
    } catch (e) {
      console.warn('Failed to persist wishlist item to Supabase', e);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== productId));

    try {
      const sessionId = getOrCreateSessionId();
      await supabase
        .from('customer_wishlists')
        .delete()
        .eq('session_id', sessionId)
        .eq('product_id', productId);
    } catch (e) {
      console.warn('Failed to remove wishlist item from Supabase', e);
    }
  };

  const toggleWishlist = async (product: Product): Promise<boolean> => {
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
      return false;
    } else {
      await addToWishlist(product);
      return true;
    }
  };

  const moveToCart = async (product: Product): Promise<boolean> => {
    const success = await addToCart(product, 1);
    if (success) {
      await removeFromWishlist(product.id);
    }
    return success;
  };

  const moveAllToCart = async (): Promise<{ added: number; failed: number }> => {
    setIsLoading(true);
    let added = 0;
    let failed = 0;

    const itemsToMove = [...wishlist];
    for (const item of itemsToMove) {
      const stock = item.inventory?.quantity_available ?? 10;
      if (stock > 0) {
        const ok = await addToCart(item, 1);
        if (ok) {
          await removeFromWishlist(item.id);
          added++;
        } else {
          failed++;
        }
      } else {
        failed++;
      }
    }

    setIsLoading(false);
    return { added, failed };
  };

  const clearWishlist = async () => {
    setWishlist([]);
    try {
      const sessionId = getOrCreateSessionId();
      await supabase.from('customer_wishlists').delete().eq('session_id', sessionId);
    } catch (e) {
      console.warn('Failed to clear remote wishlist', e);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        totalWishlistItems: wishlist.length,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        moveToCart,
        moveAllToCart,
        clearWishlist,
        isLoading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
