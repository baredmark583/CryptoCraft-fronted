import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User;
  // A mock function to simulate updating the user's verification level
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In a Telegram Web App, the user is always authenticated.
// We simulate this by having a non-nullable mock user.
// This user now matches one of the sellers in `apiService` to demonstrate "My Listings".
const mockUser: User = {
  id: 'user-1', // Simulating a Telegram User ID that is also a seller
  name: 'Pottery Master', // This could be user's first/last name
  avatarUrl: 'https://picsum.photos/seed/seller1/100/100', // Placeholder avatar
  rating: 4.9,
  reviews: [], // Will be populated by apiService
  following: ['user-2'],
  balance: 1250.75,
  commissionOwed: 25.01,
  verificationLevel: 'PRO', // CORRECTED: Set to PRO to match apiService and enable pro features by default
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(mockUser);
  
  const updateUser = (updates: Partial<User>) => {
      setUser(prevUser => ({...prevUser, ...updates}));
  };

  return (
    <AuthContext.Provider value={{ user, updateUser }}>
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