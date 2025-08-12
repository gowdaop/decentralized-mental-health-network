import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { User, AuthContextType, RegisterRequest } from '../types/auth.types';
import { authService } from '../services/auth';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user?.isAuthenticated;

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        // Check if user has stored credentials
        if (authService.isAuthenticated()) {
          // Verify token with backend
          const { valid, user: verifiedUser } = await authService.verifyToken();
          
          if (valid && verifiedUser) {
            setUser({ ...verifiedUser, isAuthenticated: true });
          } else {
            // Token invalid, clear stored data
            authService.logout();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.logout();
        setUser(null);
        setError(ERROR_MESSAGES.UNKNOWN_ERROR);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ✅ Updated register function to match AuthContextType interface
  const register = useCallback(async (userData: RegisterRequest): Promise<{ success: boolean; commitment?: string; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('useAuth register called with:', userData);
      
      const result = await authService.register(userData);
      
      if (result.success && result.commitment) {
        // Get updated user data from auth service
        const storedUserData = authService.getStoredUser();
        if (storedUserData) {
          setUser(storedUserData);
        }
        
        setIsLoading(false);
        return { success: true, commitment: result.commitment };
      } else {
        setError(result.error || ERROR_MESSAGES.REGISTRATION_FAILED);
        setIsLoading(false);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.REGISTRATION_FAILED;
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  // ✅ Updated login function to match AuthContextType interface
  const login = useCallback(async (commitment: string, randomness: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('useAuth login called with:', { commitment, randomness });
      
      const result = await authService.login(commitment, randomness);
      
      if (result.success && result.user) {
        setUser({ ...result.user, isAuthenticated: true });
        setIsLoading(false);
        return { success: true, user: result.user };
      } else {
        setError(result.error || ERROR_MESSAGES.LOGIN_FAILED);
        setIsLoading(false);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.LOGIN_FAILED;
      setError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setError(null);
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ✅ Added missing methods from AuthContextType interface
  const getCurrentCommitment = useCallback((): string | null => {
    return authService.getCurrentCommitment();
  }, []);

  const getUserProfile = useCallback(async (): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const result = await authService.getUserProfile();
      
      if (result.success && result.user) {
        setUser({ ...result.user, isAuthenticated: true });
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      return { success: false, error: errorMessage };
    }
  }, []);

  // ✅ Complete AuthContextType implementation
  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,                    // Now matches: (commitment: string, randomness: string) => Promise<{success: boolean; user?: User; error?: string}>
    register,                 // Now matches: (userData: RegisterRequest) => Promise<{success: boolean; commitment?: string; error?: string}>
    logout,
    clearError,
    getCurrentCommitment,     // Added missing method
    getUserProfile           // Added missing method
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
