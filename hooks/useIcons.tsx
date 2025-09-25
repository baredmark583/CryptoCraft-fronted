import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { apiService } from '../services/apiService';
import type { Icon } from '../types';

interface IconContextType {
  getIcon: (name: string) => string | null;
  isLoading: boolean;
}

const IconContext = createContext<IconContextType | undefined>(undefined);

export const IconProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [icons, setIcons] = useState<Icon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchIcons = async () => {
      try {
        const publicIcons = await apiService.getPublicIcons();
        setIcons(publicIcons);
      } catch (error) {
        console.error("Failed to fetch public icons:", error);
        // It's okay to fail, the app will use fallback icons
      } finally {
        setIsLoading(false);
      }
    };
    fetchIcons();
  }, []);

  const getIcon = useCallback((name: string): string | null => {
    const icon = icons.find(i => i.name === name);
    return icon ? icon.svgContent : null;
  }, [icons]);
  
  const value = useMemo(() => ({
      getIcon,
      isLoading
  }), [getIcon, isLoading]);


  return (
    <IconContext.Provider value={value}>
      {children}
    </IconContext.Provider>
  );
};

export const useIcons = () => {
  const context = useContext(IconContext);
  if (context === undefined) {
    throw new Error('useIcons must be used within an IconProvider');
  }
  return context;
};
