import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User } from '../types';
import { apiService } from '../services/apiService';
import Spinner from '../components/Spinner';

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
      // Logic to extract initData from the URL hash provided by Telegram
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(hash);
      const tgWebAppData = params.get('tgWebAppData');
      
      if (tgWebAppData) {
          try {
              const { access_token, user: userData } = await apiService.loginWithTelegram(tgWebAppData);
              localStorage.setItem('authToken', access_token);
              setToken(access_token);
              setUser(userData);
          } catch (error) {
              console.error("Telegram authentication failed:", error);
              // Handle auth error, maybe show a message
          } finally {
              // Clean up the URL hash after processing
              window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
      }
      setIsLoading(false);
    };

    authenticate();
  }, []);


  const updateUser = (updates: Partial<User>) => {
      setUser(prevUser => prevUser ? {...prevUser, ...updates} : null);
  };

  if (isLoading) {
    return (
      <div className="bg-brand-background min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

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
  // This check ensures that components expecting a logged-in user don't break.
  // We throw an error because in a TWA, the user should always be authenticated.
  // If the user is null after loading, it means authentication failed.
  if (!context.isLoading && !context.user) {
     // You might want to render a specific "error" component here
     // For now, we'll throw to make it clear authentication is required.
     throw new Error("Authentication failed or user not found. The app cannot proceed.");
  }
  // We can now safely cast user to non-nullable for consuming components
  return { ...context, user: context.user as User };
};
