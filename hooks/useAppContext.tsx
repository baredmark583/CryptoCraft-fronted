import React, { createContext, useContext, useMemo, ReactNode } from 'react';

interface AppContextType {
  isTwa: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // By setting `isTwa` to true, we ensure the application always runs in full TWA mode,
  // simplifying development and removing the "showcase" version.
  const value = useMemo(() => ({
    isTwa: true,
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