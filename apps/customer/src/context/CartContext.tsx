import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, CartSummary, Product } from '@chandrakor/shared-types';
import { supabase } from '@chandrakor/supabase-client';

interface CartContextType {
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  summary: CartSummary;
  refreshStock: () => Promise<void>;
  isLoading: boolean;
}

const CART_STORAGE_KEY = 'chandrakor_guest_cart_v1';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Persist cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cart]);

  // Refresh cart stock availability from live Supabase database
  const refreshStock = async () => {
    if (cart.length === 0) return;
    setIsLoading(true);
    try {
      const productIds = cart.map((item) => item.productId);
      const { data, error } = await supabase
        .from('inventory')
        .select('product_id, quantity_available')
        .in('product_id', productIds);

      if (!error && data) {
        const stockMap = new Map(data.map((inv) => [inv.product_id, inv.quantity_available]));
        setCart((prev) =>
          prev.map((item) => {
            const liveStock = stockMap.get(item.productId) ?? item.maxAvailable;
            return {
              ...item,
              maxAvailable: liveStock,
              quantity: Math.min(item.quantity, Math.max(liveStock, 0)),
            };
          }).filter((item) => item.maxAvailable > 0 || item.quantity > 0)
        );
      }
    } catch (e) {
      console.error('Failed to refresh stock', e);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (product: Product, quantity = 1): Promise<boolean> => {
    try {
      // Check live stock
      const { data: invData } = await supabase
        .from('inventory')
        .select('quantity_available')
        .eq('product_id', product.id)
        .single();

      const availableStock = invData ? invData.quantity_available : 10;
      if (availableStock <= 0) {
        alert('This heirloom saree is currently sold out.');
        return false;
      }

      setCart((prev) => {
        const existingIndex = prev.findIndex((item) => item.productId === product.id);
        const primaryImg =
          product.images?.find((img) => img.is_primary)?.image_url ||
          product.images?.[0]?.image_url ||
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600';

        if (existingIndex > -1) {
          const newQty = Math.min(prev[existingIndex].quantity + quantity, availableStock);
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: newQty,
            maxAvailable: availableStock,
            price: Number(product.selling_price),
            mrp: Number(product.mrp),
          };
          return updated;
        } else {
          const newItem: CartItem = {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            sku: product.sku,
            price: Number(product.selling_price),
            mrp: Number(product.mrp),
            imageUrl: primaryImg,
            fabric: product.fabric,
            colour: product.colour,
            quantity: Math.min(quantity, availableStock),
            maxAvailable: availableStock,
          };
          return [...prev, newItem];
        }
      });

      setIsCartOpen(true);
      return true;
    } catch (e) {
      console.error('Error adding to cart:', e);
      return false;
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const finalQty = Math.min(quantity, item.maxAvailable);
          return { ...item, quantity: finalQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Compute cart summary
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalMrp = cart.reduce((sum, item) => sum + item.mrp * item.quantity, 0);
  const totalDiscount = Math.max(0, totalMrp - subtotal);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  // Free insured shipping on all orders over ₹2000 (or complimentary)
  const shipping = subtotal > 0 ? 0 : 0;
  // Estimated 5% GST included or added
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal;

  const summary: CartSummary = {
    items: cart,
    totalItems,
    subtotal,
    totalMrp,
    totalDiscount,
    shipping,
    tax,
    total,
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        summary,
        refreshStock,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
