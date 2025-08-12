import { apiService } from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { SecureStorage, CommitmentUtils } from '../utils/storage';
import { User } from '../types/auth.types';

interface RegistrationData {
  ageRange: string;
  topics: string;
  severityLevel: string;
  preferredTimes: string[];
}

class AuthService {
  // Register new anonymous user - Updated to match backend schema
  async register(userData: RegistrationData): Promise<{ success: boolean; commitment?: string; error?: string }> {
    try {
      // Generate commitment data on frontend
      const commitmentData = await CommitmentUtils.generateCommitmentData();
      
      // ✅ Match your backend's UserRegistration model exactly
      const registerData = {
        age_range: userData.ageRange,           // Backend expects age_range
        topics: userData.topics,                // Backend expects topics string
        severity_level: userData.severityLevel, // Backend expects severity_level
        preferred_times: userData.preferredTimes // Backend expects preferred_times array
      };

      console.log('Sending registration data:', registerData);

      const response = await apiService.post<{
        message: string;
        commitment: string;
        access_token: string;
        token_type: string;
        blockchain?: {
          tx_hash: string;
          block_number: number;
          status: string;
        };
      }>(API_ENDPOINTS.AUTH.REGISTER, registerData);

      // ✅ Check for successful response based on your backend format
      if (response.message === "User registered successfully" && response.access_token) {
        // Store commitment data locally
        SecureStorage.setCommitmentData({
          ...commitmentData,
          commitment: response.commitment // Use commitment from backend
        });
        SecureStorage.setAuthToken(response.access_token);
        
        // Create user object from response data
        const newUserData: User = {
          id: response.commitment,
          commitment: response.commitment,
          reputation: 100, // Default reputation
          isAuthenticated: true,
          ageRange: userData.ageRange,
          topics: userData.topics,
          severityLevel: userData.severityLevel,
          preferredTimes: userData.preferredTimes,
          createdAt: new Date().toISOString()
        };
        
        SecureStorage.setUserData(newUserData);

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

  // Login with commitment hash and randomness - Updated to match backend
  async login(commitment: string, randomness: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Validate commitment format
      if (!CommitmentUtils.isValidCommitment(commitment)) {
        return {
          success: false,
          error: 'Invalid commitment hash format'
        };
      }

      // ✅ Match your backend's login data structure
      const loginData = { 
        commitment: commitment,
        randomness: randomness 
      };
      
      console.log('Sending login data:', loginData);

      const response = await apiService.post<{
        message: string;
        access_token: string;
        token_type: string;
      }>(API_ENDPOINTS.AUTH.LOGIN, loginData);

      // ✅ Check for successful login based on your backend format
      if (response.access_token) {
        SecureStorage.setAuthToken(response.access_token);
        
        // Fetch user profile after successful login
        const profileResponse = await this.getUserProfile();
        
        if (profileResponse.success && profileResponse.user) {
          SecureStorage.setUserData(profileResponse.user);
          
          return {
            success: true,
            user: profileResponse.user
          };
        }

        // Fallback user data if profile fetch fails
        const fallbackUserData: User = {
          id: commitment,
          commitment: commitment,
          reputation: 100,
          isAuthenticated: true,
          createdAt: new Date().toISOString()
        };
        
        SecureStorage.setUserData(fallbackUserData);

        return {
          success: true,
          user: fallbackUserData
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

  // Get user profile - New method to fetch profile from backend
  async getUserProfile(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await apiService.get<{
        commitment: string;
        age_range: string;
        topics: string;
        severity_level: string;
        preferred_times: string;
        reputation_score: number;
        created_at: string;
        is_active: boolean;
      }>(API_ENDPOINTS.AUTH.PROFILE);

      const userData: User = {
        id: response.commitment,
        commitment: response.commitment,
        reputation: response.reputation_score,
        isAuthenticated: true,
        ageRange: response.age_range,
        topics: response.topics,
        severityLevel: response.severity_level,
        preferredTimes: response.preferred_times ? response.preferred_times.split(',') : [],
        createdAt: response.created_at,
        isActive: response.is_active
      };

      return {
        success: true,
        user: userData
      };
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get profile'
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

      // Try to get user profile to verify token
      const profileResponse = await this.getUserProfile();
      
      if (profileResponse.success && profileResponse.user) {
        return {
          valid: true,
          user: profileResponse.user
        };
      }

      return { valid: false };
    } catch (error) {
      console.error('Token verification failed:', error);
      SecureStorage.clearAll();
      return { valid: false };
    }
  }

  // ✅ NEW METHOD - Get stored JWT token for API calls
  getStoredToken(): string | null {
    return SecureStorage.getAuthToken();
  }

  // ✅ NEW METHOD - Get auth headers for API calls
  getAuthHeaders(): { [key: string]: string } {
    const token = this.getStoredToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'accept': 'application/json'
    };
  }

  // ✅ NEW METHOD - Check if token exists and is potentially valid
  hasValidToken(): boolean {
    const token = this.getStoredToken();
    if (!token) return false;
    
    try {
      // Basic JWT structure check (has 3 parts separated by dots)
      const parts = token.split('.');
      return parts.length === 3;
    } catch {
      return false;
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
    return SecureStorage.hasStoredCredentials() && this.hasValidToken();
  }

  // Get commitment hash for current user
  getCurrentCommitment(): string | null {
    const commitmentData = SecureStorage.getCommitmentData();
    return commitmentData?.commitment || null;
  }

  // ✅ NEW METHOD - Refresh token if needed (placeholder for future implementation)
  async refreshToken(): Promise<boolean> {
    try {
      // For now, just verify current token
      const verification = await this.verifyToken();
      return verification.valid;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // ✅ NEW METHOD - Safe API call wrapper with automatic token handling
  async makeAuthenticatedRequest<T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const headers = this.getAuthHeaders();
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token might be expired, clear auth data
          this.logout();
          throw new Error('Authentication expired. Please log in again.');
        }
        throw new Error(`Request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Authenticated request failed:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
export default authService;
