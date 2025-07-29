import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { User, AuthContextType } from '../types/auth.types';
// Ensure the correct path and file exist for authService
import { authService } from '../services/auth';
 // Update path if necessary, e.g. './services/auth' or create the file if missing
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

  // Register function
  const register = useCallback(async (ageRange: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.register(ageRange);
      
      if (result.success && result.commitment) {
        // Get updated user data
        const userData = authService.getStoredUser();
        if (userData) {
          setUser(userData);
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

  // Login function
  const login = useCallback(async (commitment: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.login(commitment);
      
      if (result.success && result.user) {
        setUser({ ...result.user, isAuthenticated: true });
        setIsLoading(false);
        return true;
      } else {
        setError(result.error || ERROR_MESSAGES.LOGIN_FAILED);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.LOGIN_FAILED;
      setError(errorMessage);
      setIsLoading(false);
      return false;
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

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
