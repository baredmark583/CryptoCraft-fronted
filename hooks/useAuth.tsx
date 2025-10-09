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
      // Source 1: The official Telegram WebApp object
      let tgWebAppData = (window as any).Telegram?.WebApp?.initData;

      // Source 2: The URL hash parameter (fallback for some web clients)
      if (!tgWebAppData) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1)); // Remove '#'
        if (hashParams.has('tgWebAppData')) {
          tgWebAppData = hashParams.get('tgWebAppData');
          console.log("TWA data found in URL hash.");
        }
      }
      
      try {
        if (tgWebAppData) {
          // --- TWA Logic ---
          console.log("TWA data found, authenticating with backend...");
          const { access_token, user: userData } = await apiService.loginWithTelegram(tgWebAppData);
          localStorage.setItem('authToken', access_token);
          setToken(access_token);
          setUser(userData);
          // Clean up the URL hash
          if (window.location.hash.includes('tgWebAppData')) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        } else {
          // --- Browser Logic with persistent session ---
          const existingToken = localStorage.getItem('authToken');
          if (existingToken) {
            setToken(existingToken);
            console.log("Found existing token, validating with /me endpoint...");
            const userData = await apiService.getMe(); // apiFetch will use the token from localStorage
            setUser(userData);
            console.log("Token validation successful. User is logged in.");
          } else {
            console.log("No TWA or token found. User is unauthenticated.");
          }
        }
      } catch (error) {
        console.error("Authentication failed during initial load:", error);
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