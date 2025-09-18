

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import type { CartItem, Product, ProductVariant } from '../types';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number, variant: ProductVariant | undefined, price: number, purchaseType: 'RETAIL' | 'WHOLESALE') => void;
  removeFromCart: (productId: string, variantId: string | undefined, purchaseType: 'RETAIL' | 'WHOLESALE') => void;
  updateQuantity: (productId: string, quantity: number, variantId: string | undefined, purchaseType: 'RETAIL' | 'WHOLESALE') => void;
  removeItemsIfSoldOut: (soldItems: { productId: string, variantId?: string }[]) => void;
  clearCart: () => void;
  itemCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getInitialCart = (): CartItem[] => {
    try {
        const item = window.localStorage.getItem('cryptoCraftCart');
        return item ? JSON.parse(item) : [];
    } catch (error) {
        console.error("Error reading cart from localStorage", error);
        return [];
    }
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(getInitialCart);

  useEffect(() => {
    try {
      window.localStorage.setItem('cryptoCraftCart', JSON.stringify(cartItems));
    } catch (error) {
      console.error("Error saving cart to localStorage", error);
    }
  }, [cartItems]);

  const addToCart = useCallback((product: Product, quantity: number, variant: ProductVariant | undefined, price: number, purchaseType: 'RETAIL' | 'WHOLESALE') => {
    setCartItems(prevItems => {
      const cartItemId = product.id + (variant ? `-${variant.id}` : '') + `-${purchaseType}`;
      
      const existingItem = prevItems.find(item => {
        const currentItemId = item.product.id + (item.variant ? `-${item.variant.id}` : '') + `-${item.purchaseType}`;
        return currentItemId === cartItemId;
      });

      if (existingItem) {
        return prevItems.map(item => {
           const currentItemId = item.product.id + (item.variant ? `-${item.variant.id}` : '') + `-${item.purchaseType}`;
           return currentItemId === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item;
        });
      }
      return [...prevItems, { product, quantity, variant, priceAtTimeOfAddition: price, purchaseType }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string, variantId: string | undefined, purchaseType: 'RETAIL' | 'WHOLESALE') => {
    setCartItems(prevItems => prevItems.filter(item => {
        const cartItemId = item.product.id + (item.variant ? `-${item.variant.id}` : '') + `-${item.purchaseType}`;
        const targetId = productId + (variantId ? `-${variantId}` : '') + `-${purchaseType}`;
        return cartItemId !== targetId;
    }));
  }, []);
  
  const removeItemsIfSoldOut = useCallback((soldItems: { productId: string, variantId?: string }[]) => {
      setCartItems(prevItems => prevItems.filter(cartItem => {
          return !soldItems.some(soldItem => 
              cartItem.product.id === soldItem.productId &&
              (cartItem.variant?.id || undefined) === soldItem.variantId
          );
      }));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, variantId: string | undefined, purchaseType: 'RETAIL' | 'WHOLESALE') => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId, purchaseType);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item => {
            const cartItemId = item.product.id + (item.variant ? `-${item.variant.id}` : '') + `-${item.purchaseType}`;
            const targetId = productId + (variantId ? `-${variantId}` : '') + `-${purchaseType}`;
            return cartItemId === targetId ? { ...item, quantity } : item;
        })
      );
    }
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const itemCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      return total + item.priceAtTimeOfAddition * item.quantity;
    }, 0);
  }, [cartItems]);

  const value = useMemo(() => ({
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    removeItemsIfSoldOut,
    clearCart,
    itemCount,
    cartTotal,
  }), [cartItems, addToCart, removeFromCart, updateQuantity, removeItemsIfSoldOut, clearCart, itemCount, cartTotal]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};