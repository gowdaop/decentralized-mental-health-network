// Authentication Types

// ✅ Updated User interface to match backend schema and collected data
export interface User {
  id?: string;
  commitment: string;
  reputation: number;
  isAuthenticated: boolean;
  ageRange?: string;
  topics?: string;                    // ✅ Added - comma-separated topics from backend
  severityLevel?: string;             // ✅ Added - matches backend severity_level
  preferredTimes?: string[];          // ✅ Added - array of preferred times
  createdAt?: string;
  isActive?: boolean;                 // ✅ Added - matches backend is_active field
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ✅ Updated LoginRequest to match backend login schema
export interface LoginRequest {
  commitment: string;
  randomness: string;                 // ✅ Added - backend requires randomness for login
}

export interface LoginResponse {
  success: boolean;
  access_token: string;               // ✅ Changed from 'token' to 'access_token' (matches backend)
  token_type: string;                 // ✅ Added - backend returns token_type: "bearer"
  user?: User;
  message?: string;
}

// ✅ Updated RegisterRequest to match the complete registration data we collect
export interface RegisterRequest {
  ageRange: string;
  topics: string;                     // ✅ Added - comma-separated topics
  severityLevel: string;              // ✅ Added - severity level selection
  preferredTimes: string[];           // ✅ Added - array of preferred times
}

// ✅ Updated RegisterResponse to match backend response structure
export interface RegisterResponse {
  success: boolean;
  commitment: string;
  access_token: string;               // ✅ Changed to match backend response
  token_type: string;                 // ✅ Added - backend returns "bearer"
  message?: string;
  blockchain?: {                      // ✅ Added - optional blockchain transaction info
    tx_hash: string;
    block_number: number;
    status: string;
  };
}

export interface CommitmentData {
  commitment: string;
  privateKey: string;                 // For local storage only
  timestamp: number;
  randomness?: string;                // ✅ Added - needed for login process
}

// ✅ Updated AuthContextType to match implemented auth service methods
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (commitment: string, randomness: string) => Promise<{ success: boolean; user?: User; error?: string }>;  // ✅ Updated signature
  register: (userData: RegisterRequest) => Promise<{ success: boolean; commitment?: string; error?: string }>;    // ✅ Updated to accept full registration data
  logout: () => void;
  clearError: () => void;
  getCurrentCommitment: () => string | null;   // ✅ Added - useful utility method
  getUserProfile: () => Promise<{ success: boolean; user?: User; error?: string }>;  // ✅ Added - for profile fetching
}

// ✅ ADDED - Backend API response types for better type safety

export interface BackendUserProfileResponse {
  commitment: string;
  age_range: string;
  topics: string;
  severity_level: string;
  preferred_times: string;            // Backend stores as comma-separated string
  reputation_score: number;
  created_at: string;
  is_active: boolean;
}

export interface BackendRegistrationResponse {
  message: string;
  commitment: string;
  access_token: string;
  token_type: string;
  blockchain?: {
    tx_hash: string;
    block_number: number;
    status: string;
  };
}

export interface BackendLoginResponse {
  access_token: string;
  token_type: string;
  message: string;
}

// ✅ ADDED - Storage types for secure local storage
export interface StoredUserData {
  user: User;
  timestamp: number;
  version: string;                    // For data migration if needed
}

export interface StoredCommitmentData {
  commitment: string;
  privateKey: string;
  randomness: string;
  timestamp: number;
}

// ✅ ADDED - API Error types for better error handling
export interface ApiError {
  message: string;
  status?: number;
  detail?: string;
  validation_errors?: Array<{
    loc: string[];
    msg: string;
    type: string;
  }>;
}

// ✅ ADDED - Registration form data type (for component state)
export interface RegistrationFormData {
  ageRange: string;
  topics: string;
  severityLevel: string;
  preferredTimes: string[];
}

// ✅ ADDED - Login form data type
export interface LoginFormData {
  commitment: string;
  randomness?: string;
}

// ✅ ADDED - Authentication hook return type
export interface UseAuthReturn extends AuthContextType {
  refreshToken: () => Promise<boolean>;
  isTokenExpired: () => boolean;
  getStoredUser: () => User | null;
}

// ✅ ADDED - Reputation data type (for blockchain integration)
export interface ReputationData {
  commitment: string;
  reputation: number;
  exists_on_chain: boolean;
  database_reputation: number;
  last_updated?: string;
}
