import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';

interface WishlistContextType {
  wishlist: string[]; // Array of product IDs
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const getInitialWishlist = (): string[] => {
    try {
        const item = window.localStorage.getItem('cryptoCraftWishlist');
        return item ? JSON.parse(item) : [];
    } catch (error) {
        console.error("Error reading wishlist from localStorage", error);
        return [];
    }
};

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<string[]>(getInitialWishlist);

  useEffect(() => {
    try {
      window.localStorage.setItem('cryptoCraftWishlist', JSON.stringify(wishlist));
    } catch (error) {
      console.error("Error saving wishlist to localStorage", error);
    }
  }, [wishlist]);

  const addToWishlist = useCallback((productId: string) => {
    setWishlist(prev => [...new Set([...prev, productId])]);
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlist(prev => prev.filter(id => id !== productId));
  }, []);

  const isWishlisted = useCallback((productId: string): boolean => {
    return wishlist.includes(productId);
  }, [wishlist]);

  const value = useMemo(() => ({
    wishlist,
    addToWishlist,
    removeFromWishlist,
    isWishlisted,
  }), [wishlist, addToWishlist, removeFromWishlist, isWishlisted]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};