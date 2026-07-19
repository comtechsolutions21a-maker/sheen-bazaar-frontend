import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const EMPTY_CART = { items: [], itemsTotal: 0, count: 0, deliveryFee: 0, total: 0 };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);
  const [toast, setToastMsg] = useState('');

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 1800);
  }, []);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(EMPTY_CART);
      return;
    }
    try {
      const data = await api.getCart();
      setCart(data);
    } catch {
      setCart(EMPTY_CART);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(
    async (productId, delta = 1, resellerId) => {
      if (!user) {
        showToast('Please log in to add items to your cart');
        return false;
      }
      const data = await api.updateCart(productId, delta, resellerId);
      setCart(data);
      return true;
    },
    [user, showToast]
  );

  const removeFromCart = useCallback(
    async (productId, resellerId) => {
      const data = await api.removeFromCart(productId, resellerId);
      setCart(data);
      showToast('Removed from cart');
    },
    [showToast]
  );

  const clearCart = useCallback(async () => {
    const data = await api.clearCart();
    setCart(data);
  }, []);

  return (
    <CartContext.Provider
      value={{ cart, refreshCart, addToCart, removeFromCart, clearCart, toast, showToast }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
