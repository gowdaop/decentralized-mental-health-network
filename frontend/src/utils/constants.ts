// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  API_VERSION: '/api/v1',
  TIMEOUT: 10000,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    PROFILE: '/auth/user/profile',
    REFRESH: '/auth/refresh',
  },
  MOOD: {
    RECORD: '/mood/record',            // ✅ No /api/v1 prefix
    ANALYSIS: '/mood/analysis'
  },
  PEERS: {
    MATCHES: '/sessions/matches',
    CREATE_SESSION: '/sessions/create',
    UPDATE_PROFILE: '/sessions/update-profile'  // ✅ Added - from your backend
  },
  BLOCKCHAIN: {
    REGISTER_USER: '/blockchain/register',
    GET_REPUTATION: '/blockchain/reputation',
    USER_REPUTATION: '/auth/user/{commitment}/reputation'  // ✅ Added - matches your backend
  },
  HEALTH: '/health'  // ✅ Added - health check endpoint
} as const;

// Application Constants
export const APP_CONFIG = {
  APP_NAME: 'Mental Health Support Network',
  VERSION: '1.0.0',
  MAX_RETRY_ATTEMPTS: 3,
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
} as const;

// Age Ranges for Registration
export const AGE_RANGES = [
  { value: '18-25', label: '18-25 years' },
  { value: '26-35', label: '26-35 years' },
  { value: '36-45', label: '36-45 years' },
  { value: '46-55', label: '46-55 years' },
  { value: '55+', label: '55+ years' }
] as const;

// ✅ ADDED - Severity Levels for Registration (matches backend)
export const SEVERITY_LEVELS = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' }
] as const;

// ✅ ADDED - Preferred Times for Registration (matches backend)
export const PREFERRED_TIMES = [
  { value: 'morning', label: 'Morning (6AM-12PM)' },
  { value: 'afternoon', label: 'Afternoon (12PM-6PM)' },
  { value: 'evening', label: 'Evening (6PM-9PM)' },
  { value: 'night', label: 'Night (9PM-12AM)' }
] as const;

// ✅ ADDED - Common Mental Health Topics
export const COMMON_TOPICS = [
  'anxiety',
  'depression',
  'stress',
  'panic-attacks',
  'social-anxiety',
  'work-pressure',
  'relationships',
  'family-issues',
  'academic-pressure',
  'sleep-disorders',
  'self-esteem',
  'trauma',
  'grief',
  'addiction',
  'eating-disorders'
] as const;

// Crisis Resources (Indian)
export const CRISIS_RESOURCES = {
  AASRA: {
    name: 'AASRA',
    phone: '91-9820466726',
    description: '24/7 crisis helpline',
    website: 'http://www.aasra.info/'
  },
  iCALL: {
    name: 'iCall',
    phone: '9152987821',
    description: 'Psychosocial helpline',
    website: 'http://icallhelpline.org/'
  },
  VANDREVALA: {
    name: 'Vandrevala Foundation',
    phone: '9999666555',
    description: '24/7 mental health support',
    website: 'https://www.vandrevalafoundation.com/'
  },
  // ✅ ADDED - Additional Indian crisis resources
  SUMAITRI: {
    name: 'Sumaitri',
    phone: '011-23389090',
    description: 'Delhi crisis helpline',
    website: 'https://www.sumaitri.net/'
  },
  SNEHA: {
    name: 'Sneha Foundation',
    phone: '044-24640050',
    description: 'Chennai crisis helpline',
    website: 'http://snehaindia.org/'
  }
} as const;

// ✅ ADDED - Mood Tracking Constants
export const MOOD_LEVELS = [
  { value: 1, label: 'Very Low', color: '#dc2626' },
  { value: 2, label: 'Low', color: '#ea580c' },
  { value: 3, label: 'Moderate', color: '#eab308' },
  { value: 4, label: 'Good', color: '#65a30d' },
  { value: 5, label: 'Excellent', color: '#16a34a' }
] as const;

// ✅ ADDED - Crisis Risk Levels (matches your backend AI analysis)
export const RISK_LEVELS = {
  MINIMAL: { value: 'minimal', label: 'Minimal Risk', color: 'green' },
  LOW: { value: 'low', label: 'Low Risk', color: 'yellow' },
  MEDIUM: { value: 'medium', label: 'Medium Risk', color: 'orange' },
  HIGH: { value: 'high', label: 'High Risk', color: 'red' }
} as const;

// UI Constants
export const UI_CONFIG = {
  LOADING_TIMEOUT: 30000, // 30 seconds
  TOAST_DURATION: 5000, // 5 seconds
  DEBOUNCE_DELAY: 300, // 300ms
  ANIMATION_DURATION: 200, // 200ms
  MAX_CHART_POINTS: 30 // Maximum points in mood charts
} as const;

// ✅ ADDED - Secure Storage Keys (matches your auth service)
export const STORAGE_KEYS = {
  THEME: 'mh_theme',
  LANGUAGE: 'mh_language',
  ONBOARDING_COMPLETE: 'mh_onboarding_complete',
  AUTH_TOKEN: 'mh_auth_token',
  USER_DATA: 'mh_user_data',
  COMMITMENT_DATA: 'mh_commitment_data',
  ENCRYPTED_PROFILE: 'mh_encrypted_profile'
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  INVALID_COMMITMENT: 'Invalid commitment hash format.',
  REGISTRATION_FAILED: 'Registration failed. Please try again.',
  LOGIN_FAILED: 'Login failed. Please check your commitment hash.',
  UNAUTHORIZED: 'Session expired. Please login again.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
  VALIDATION_ERROR: 'Please fill in all required fields correctly.',
  BLOCKCHAIN_ERROR: 'Blockchain connection failed. Using offline mode.',
  TOKEN_EXPIRED: 'Your session has expired. Please login again.'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: 'Registration successful! Please save your commitment hash.',
  LOGIN_SUCCESS: 'Welcome back to your mental health dashboard.',
  LOGOUT_SUCCESS: 'You have been safely logged out.',
  PROFILE_UPDATED: 'Your profile has been updated successfully.',
  MOOD_RECORDED: 'Your mood has been recorded and analyzed.',
  SESSION_CREATED: 'Peer support session created successfully.'
} as const;

// ✅ ADDED - Validation Patterns
export const VALIDATION_PATTERNS = {
  COMMITMENT_HASH: /^[a-fA-F0-9]{64}$/, // SHA-256 hash pattern
  TOPICS: /^[a-zA-Z0-9,\s\-_]+$/, // Topics validation pattern
  AGE_RANGE: /^\d{2}-\d{2}$|^\d{2}\+$/ // Age range pattern
} as const;

// ✅ ADDED - Default Values
export const DEFAULT_VALUES = {
  REPUTATION_SCORE: 100,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  MAX_TOPICS: 10,
  MAX_PREFERRED_TIMES: 4
} as const;
