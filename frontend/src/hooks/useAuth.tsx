import React, { useState, useEffect, createContext, useContext } from 'react';

interface User {
  commitment?: string;
  reputation?: number;
  isAuthenticated: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (commitment: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Use React.useState to avoid destructuring issues
  const userState = useState<User | null>(null);
  const user = userState[0];
  const setUser = userState[1];
  
  const loadingState = useState(true);
  const isLoading = loadingState[0];
  const setIsLoading = loadingState[1];

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const commitment = localStorage.getItem('userCommitment');
    
    if (token && commitment) {
      setUser({ commitment, reputation: 100, isAuthenticated: true });
    }
    setIsLoading(false);
  }, []);

  const login = (commitment: string) => {
    setIsLoading(true);
    localStorage.setItem('authToken', 'mock-token');
    localStorage.setItem('userCommitment', commitment);
    setUser({ commitment, reputation: 100, isAuthenticated: true });
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userCommitment');
    setUser(null);
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { user, login, logout, isLoading } },
    children
  );
};
