import React, { createContext, useContext, useMemo, ReactNode } from 'react';

interface AppContextType {
  isTwa: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value = useMemo(() => ({
    // The presence of the Telegram WebApp object is a reliable indicator.
    isTwa: !!(window as any).Telegram?.WebApp?.initData,
  }), []);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
