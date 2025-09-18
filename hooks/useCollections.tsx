import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { useAuth } from './useAuth';
import type { Collection } from '../types';

interface CollectionsContextType {
  collections: Collection[];
  createCollection: (name: string) => Promise<Collection | null>;
  toggleProductInCollection: (collectionId: string, productId: string) => Promise<void>;
  isSavedInAnyCollection: (productId: string) => boolean;
  getCollectionsForProduct: (productId: string) => Collection[];
}

const CollectionsContext = createContext<CollectionsContextType | undefined>(undefined);

export const CollectionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCollections = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      const userCollections = await apiService.getCollectionsByUserId(user.id);
      setCollections(userCollections);
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const createCollection = useCallback(async (name: string): Promise<Collection | null> => {
    if (!user) return null;
    try {
        const newCollection = await apiService.createCollection(user.id, name);
        setCollections(prev => [...prev, newCollection]);
        return newCollection;
    } catch (error) {
        console.error("Failed to create collection", error);
        return null;
    }
  }, [user]);

  const toggleProductInCollection = useCallback(async (collectionId: string, productId: string) => {
    if (!user || isLoading) return;

    const collection = collections.find(c => c.id === collectionId);
    if (!collection) return;

    const isProductInCollection = collection.productIds.includes(productId);

    // Optimistic update
    setCollections(prev => prev.map(c => {
        if (c.id === collectionId) {
            return {
                ...c,
                productIds: isProductInCollection
                    ? c.productIds.filter(id => id !== productId)
                    : [...c.productIds, productId]
            };
        }
        return c;
    }));

    try {
        if (isProductInCollection) {
            await apiService.removeProductFromCollection(collectionId, productId);
        } else {
            await apiService.addProductToCollection(collectionId, productId);
        }
    } catch (error) {
        console.error("Failed to toggle product in collection", error);
        // Revert optimistic update on failure
        fetchCollections();
    }
  }, [user, isLoading, collections, fetchCollections]);

  const isSavedInAnyCollection = (productId: string) => {
    return collections.some(c => c.productIds.includes(productId));
  };
  
  const getCollectionsForProduct = (productId: string) => {
      return collections.filter(c => c.productIds.includes(productId));
  };

  return (
    <CollectionsContext.Provider value={{ collections, createCollection, toggleProductInCollection, isSavedInAnyCollection, getCollectionsForProduct }}>
      {children}
    </CollectionsContext.Provider>
  );
};

export const useCollections = () => {
  const context = useContext(CollectionsContext);
  if (context === undefined) {
    throw new Error('useCollections must be used within a CollectionsProvider');
  }
  return context;
};
