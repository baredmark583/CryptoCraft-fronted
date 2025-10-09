import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User } from '../types';
import { apiService } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  updateUser: (updates: Partial<User>) => void;
  loginWithTelegramWidget: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const authenticate = async () => {
      const tgWebAppData = (window as any).Telegram?.WebApp?.initData;
      
      try {
        if (tgWebAppData) {
          // --- TWA Logic ---
          console.log("TWA data found, authenticating with backend...");
          const { access_token, user: userData } = await apiService.loginWithTelegram(tgWebAppData);
          localStorage.setItem('authToken', access_token);
          setToken(access_token);
          setUser(userData);
          if (window.location.hash.includes('tgWebAppData')) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        } else {
          // --- Browser Logic ---
          // No TWA, no auto-login. The user must use the login widget.
          // For simplicity, we clear any previous session on page refresh.
          // A real-world app might use a /me endpoint to validate an existing token.
          localStorage.removeItem('authToken');
          setToken(null);
          setUser(null);
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

  const loginWithTelegramWidget = async (data: any) => {
    try {
      const { access_token, user: userData } = await apiService.loginWithTelegramWidget(data);
      localStorage.setItem('authToken', access_token);
      setToken(access_token);
      setUser(userData);
    } catch (error) {
      console.error("Telegram web login failed:", error);
      throw error;
    }
  };

  const updateUser = (updates: Partial<User>) => {
      setUser(prevUser => prevUser ? {...prevUser, ...updates} : null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, updateUser, loginWithTelegramWidget }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
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
