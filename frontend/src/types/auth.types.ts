// Authentication Types
export interface User {
  id?: string;
  commitment: string;
  reputation: number;
  isAuthenticated: boolean;
  ageRange?: string;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginRequest {
  commitment: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface RegisterRequest {
  ageRange: string;
  commitment?: string; // Generated on frontend
}

export interface RegisterResponse {
  success: boolean;
  commitment: string;
  token: string;
  user: User;
  message?: string;
}

export interface CommitmentData {
  commitment: string;
  privateKey: string; // For local storage only
  timestamp: number;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (commitment: string) => Promise<boolean>;
  register: (ageRange: string) => Promise<{ success: boolean; commitment?: string; error?: string }>;
  logout: () => void;
  clearError: () => void;
}
