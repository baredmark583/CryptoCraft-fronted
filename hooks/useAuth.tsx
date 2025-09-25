
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
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(hash);
      const tgWebAppData = params.get('tgWebAppData');
      
      try {
        if (tgWebAppData) {
          // --- Production/TWA Logic ---
          console.log("TWA data found, authenticating with backend...");
          const { access_token, user: userData } = await apiService.loginWithTelegram(tgWebAppData);
          localStorage.setItem('authToken', access_token);
          setToken(access_token);
          setUser(userData);
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } else {
          // --- Local Development Logic ---
          // FIX: In a local environment (without Telegram's data), simulate a logged-in user for development purposes.
          // This prevents the app from crashing by ensuring a user object is always available.
          console.warn("TWA data not found. Running in local development mode with a mock user.");
          
          // Using a mock user that matches the structure and data from apiService.ts
          const mockUser: User = { 
            id: 'user-1', 
            name: 'Pottery Master', 
            avatarUrl: 'https://picsum.photos/seed/seller1/100/100', 
            headerImageUrl: 'https://picsum.photos/seed/header1/1000/300', 
            rating: 4.9, 
            reviews: [], 
            following: ['user-2', 'user-3'], 
            balance: 1250.75, 
            commissionOwed: 25.01, 
            verificationLevel: 'PRO', 
            affiliateId: 'POTTERYPRO', 
            tonWalletAddress: 'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA_______'
          };
          
          setUser(mockUser);
          setToken('mock-auth-token-for-local-dev');
        }
      } catch (error) {
        console.error("Authentication failed:", error);
        // In case of an error (real or mock), we don't set a user, which will trigger the error boundary as intended.
      } finally {
        setIsLoading(false);
      }
    };

    authenticate();
  }, []);


  const updateUser = (updates: Partial<User>) => {
      setUser(prevUser => prevUser ? {...prevUser, ...updates} : null);
  };

  if (isLoading) {
    return (
      <div className="bg-base-200 min-h-screen flex items-center justify-center">
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
