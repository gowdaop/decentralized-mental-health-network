import { apiService } from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { SecureStorage, CommitmentUtils } from '../utils/storage';
import { User } from '../types/auth.types'; // Only keeping User interface

class AuthService {
  // Register new anonymous user
  async register(ageRange: string): Promise<{ success: boolean; commitment?: string; error?: string }> {
    try {
      // Generate commitment data on frontend
      const commitmentData = await CommitmentUtils.generateCommitmentData();
      
      const registerData = {
        ageRange,
        commitment: commitmentData.commitment
      };

      // ✅ Updated to handle your backend's actual response structure
      const response = await apiService.post<{
        message: string;
        commitment: string;
        access_token: string;
        token_type: string;
        blockchain: {
          tx_hash: string;
          block_number: number;
          status: string;
        };
      }>(API_ENDPOINTS.AUTH.REGISTER, registerData);

      // ✅ Check for successful response based on your backend format
      if (response.message === "User registered successfully" && response.access_token) {
        // Store commitment data locally
        SecureStorage.setCommitmentData(commitmentData);
        SecureStorage.setAuthToken(response.access_token);  // Use access_token from backend
        
        // Create user object from response data
        const userData: User = {
          id: response.commitment,
          commitment: response.commitment,
          reputation: 100, // Default reputation
          isAuthenticated: true,
          ageRange: ageRange,
          createdAt: new Date().toISOString()
        };
        
        SecureStorage.setUserData(userData);

        return {
          success: true,
          commitment: response.commitment
        };
      }

      return {
        success: false,
        error: response.message || 'Registration failed'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  // Login with commitment hash
  async login(commitment: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Validate commitment format
      if (!CommitmentUtils.isValidCommitment(commitment)) {
        return {
          success: false,
          error: 'Invalid commitment hash format'
        };
      }

      const loginData = { commitment };
      
      // ✅ Updated to handle your backend's actual login response structure
      const response = await apiService.post<{
        message: string;
        commitment: string;
        access_token: string;
        token_type: string;
        user?: any;
        blockchain?: {
          tx_hash: string;
          block_number: number;
          status: string;
        };
      }>(API_ENDPOINTS.AUTH.LOGIN, loginData);

      // ✅ Check for successful login based on your backend format
      if (response.access_token) {
        SecureStorage.setAuthToken(response.access_token);
        
        // Create or use user data from response
        const userData: User = response.user || {
          id: response.commitment,
          commitment: response.commitment,
          reputation: 100,
          isAuthenticated: true,
          createdAt: new Date().toISOString()
        };
        
        SecureStorage.setUserData(userData);

        return {
          success: true,
          user: userData
        };
      }

      return {
        success: false,
        error: response.message || 'Login failed'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  // Verify current token
  async verifyToken(): Promise<{ valid: boolean; user?: User }> {
    try {
      const token = SecureStorage.getAuthToken();
      if (!token) {
        return { valid: false };
      }

      // ✅ Updated to handle your backend's verify response structure
      const response = await apiService.get<{
        message?: string;
        user?: User;
        commitment?: string;
        valid?: boolean;
      }>(API_ENDPOINTS.AUTH.VERIFY);
      
      // Handle different possible response formats from your backend
      if (response.user || response.commitment) {
        const userData: User = response.user || {
          id: response.commitment!,
          commitment: response.commitment!,
          reputation: 100,
          isAuthenticated: true
        };

        return {
          valid: true,
          user: userData
        };
      }

      return { valid: false };
    } catch (error) {
      console.error('Token verification failed:', error);
      SecureStorage.clearAll();
      return { valid: false };
    }
  }

  // Logout
  logout(): void {
    SecureStorage.clearAll();
  }

  // Get stored user data
  getStoredUser(): User | null {
    const userData = SecureStorage.getUserData();
    const commitmentData = SecureStorage.getCommitmentData();
    
    if (userData && commitmentData) {
      return {
        ...userData,
        commitment: commitmentData.commitment,
        isAuthenticated: true
      };
    }
    
    return null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return SecureStorage.hasStoredCredentials();
  }

  // Get commitment hash for current user
  getCurrentCommitment(): string | null {
    const commitmentData = SecureStorage.getCommitmentData();
    return commitmentData?.commitment || null;
  }
}

export const authService = new AuthService();
export default authService;
