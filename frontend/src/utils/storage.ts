import { CommitmentData } from '../types/auth.types';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'mh_auth_token',
  USER_COMMITMENT: 'mh_user_commitment',
  COMMITMENT_DATA: 'mh_commitment_data',
  USER_DATA: 'mh_user_data'
} as const;

export class SecureStorage {
  // Token Management
  static setAuthToken(token: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('Failed to store auth token:', error);
    }
  }

  static getAuthToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Failed to retrieve auth token:', error);
      return null;
    }
  }

  static removeAuthToken(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Failed to remove auth token:', error);
    }
  }

  // Commitment Data Management
  static setCommitmentData(data: CommitmentData): void {
    try {
      const encrypted = btoa(JSON.stringify(data)); // Basic encoding
      localStorage.setItem(STORAGE_KEYS.COMMITMENT_DATA, encrypted);
    } catch (error) {
      console.error('Failed to store commitment data:', error);
    }
  }

  static getCommitmentData(): CommitmentData | null {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEYS.COMMITMENT_DATA);
      if (!encrypted) return null;
      
      const decoded = atob(encrypted);
      return JSON.parse(decoded) as CommitmentData;
    } catch (error) {
      console.error('Failed to retrieve commitment data:', error);
      return null;
    }
  }

  static removeCommitmentData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.COMMITMENT_DATA);
    } catch (error) {
      console.error('Failed to remove commitment data:', error);
    }
  }

  // User Data Management
  static setUserData(user: any): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user data:', error);
    }
  }

  static getUserData(): any | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  }

  static removeUserData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Failed to remove user data:', error);
    }
  }

  // Clear All Data
  static clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to remove ${key}:`, error);
      }
    });
  }

  // Check if user has stored credentials
  static hasStoredCredentials(): boolean {
    return !!(this.getAuthToken() && this.getCommitmentData());
  }
}

// Commitment Hash Generation Utilities
export class CommitmentUtils {
  // Generate a random private key
  static generatePrivateKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Generate commitment hash from private key
  static async generateCommitment(privateKey: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(privateKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Generate complete commitment data
  static async generateCommitmentData(): Promise<CommitmentData> {
    const privateKey = this.generatePrivateKey();
    const commitment = await this.generateCommitment(privateKey);
    
    return {
      commitment,
      privateKey,
      timestamp: Date.now()
    };
  }

  // Validate commitment format
  static isValidCommitment(commitment: string): boolean {
    return /^[a-f0-9]{64}$/i.test(commitment);
  }
}
