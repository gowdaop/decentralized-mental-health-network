import { API_CONFIG, API_ENDPOINTS, ERROR_MESSAGES } from '../utils/constants';
import { SecureStorage } from '../utils/storage';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}`;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Default headers - Fixed TypeScript issue
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add auth token if available
    const token = SecureStorage.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Request configuration
    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || ERROR_MESSAGES.SERVER_ERROR,
          response.status,
          errorData.code
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError(ERROR_MESSAGES.NETWORK_ERROR);
        }
        throw new ApiError(error.message);
      }

      throw new ApiError(ERROR_MESSAGES.UNKNOWN_ERROR);
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Auth specific methods
  async refreshToken(): Promise<void> {
    try {
      const response = await this.post<{ token: string }>(API_ENDPOINTS.AUTH.REFRESH);
      SecureStorage.setAuthToken(response.token);
    } catch (error) {
      SecureStorage.clearAll();
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService();
export default apiService;
