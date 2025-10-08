import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User } from '../types';
import { apiService } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const authenticate = async () => {
      const tgWebAppData = (window as any).Telegram?.WebApp?.initData;
      
      try {
        if (tgWebAppData) {
          // --- Production/TWA Logic ---
          console.log("TWA data found, authenticating with backend...");
          const { access_token, user: userData } = await apiService.loginWithTelegram(tgWebAppData);
          localStorage.setItem('authToken', access_token);
          setToken(access_token);
          setUser(userData);
          if (window.location.hash.includes('tgWebAppData')) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        } else if ((import.meta as any).env.DEV) {
          // --- Development/Browser Logic ---
          console.warn("TWA data not found. Running in dev mode with mock user.");
          const mockUser: User = {
            id: 'dev-user-1',
            name: 'Dev User',
            avatarUrl: 'https://picsum.photos/seed/dev-user/100/100',
            balance: 1000,
            commissionOwed: 50,
            following: [],
            rating: 4.8,
            reviews: [],
            verificationLevel: 'PRO',
            role: 'USER',
            email: 'dev@example.com'
          };
          setUser(mockUser);
          setToken('mock-dev-token');
        } else {
          // --- Production/Browser Logic ---
          // User is not authenticated. The app will show a landing/login page.
          console.log("Not in TWA context. User is unauthenticated.");
        }
      } catch (error) {
        console.error("Authentication failed:", error);
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    authenticate();
  }, []);

  const updateUser = (updates: Partial<User>) => {
      setUser(prevUser => prevUser ? {...prevUser, ...updates} : null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // The app now handles the case where a user might be null.
  return context;
};

// A new hook for components inside the authenticated part of the app
// that absolutely require a user to function.
export const useRequiredAuth = () => {
    const context = useAuth();
    if (!context.isLoading && !context.user) {
       throw new Error("This component requires an authenticated user and should not be rendered for unauthenticated users.");
    }
    return { ...context, user: context.user as User };
}
