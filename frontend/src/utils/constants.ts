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
    REFRESH: '/auth/refresh',
    VERIFY: '/auth/verify'
  },
  MOOD: {
    RECORD: '/mood/record',
    ANALYSIS: '/mood/analysis',
    COMMUNITY_INSIGHTS: '/mood/community-insights'
  },
  PEERS: {
    MATCHES: '/sessions/matches',
    CREATE_SESSION: '/sessions/create'
  },
  BLOCKCHAIN: {
    REGISTER_USER: '/blockchain/register',
    GET_REPUTATION: '/blockchain/reputation'
  }
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
  }
} as const;

// UI Constants
export const UI_CONFIG = {
  LOADING_TIMEOUT: 30000, // 30 seconds
  TOAST_DURATION: 5000, // 5 seconds
  DEBOUNCE_DELAY: 300, // 300ms
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'mh_theme',
  LANGUAGE: 'mh_language',
  ONBOARDING_COMPLETE: 'mh_onboarding_complete'
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  INVALID_COMMITMENT: 'Invalid commitment hash format.',
  REGISTRATION_FAILED: 'Registration failed. Please try again.',
  LOGIN_FAILED: 'Login failed. Please check your commitment hash.',
  UNAUTHORIZED: 'Session expired. Please login again.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred.'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: 'Registration successful! Please save your commitment hash.',
  LOGIN_SUCCESS: 'Welcome back to your mental health dashboard.',
  LOGOUT_SUCCESS: 'You have been safely logged out.'
} as const;
