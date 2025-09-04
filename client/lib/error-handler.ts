// Global error handling utilities for production

export interface APIError {
  success: false;
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
}

export interface APISuccess<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export type APIResponse<T = any> = APISuccess<T> | APIError;

// Custom error classes
export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Global error handler for async operations
export function handleAsyncError<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return ((...args: any[]) =>
    fn(...args).catch((error: Error) => {
      console.error('Async operation failed:', error);
      
      // Report to monitoring service in production
      if (process.env.NODE_ENV === 'production') {
        reportError(error, { type: 'async_operation', args });
      }
      
      throw error;
    })) as T;
}

// API error handler
export async function handleAPIResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const errorData: APIError = await response.json();
        
        switch (response.status) {
          case 401:
            throw new AuthenticationError(errorData.message || 'Authentication required');
          case 403:
            throw new AuthorizationError(errorData.message || 'Insufficient permissions');
          case 422:
            throw new ValidationError(errorData.message || 'Validation failed', errorData.details);
          default:
            throw new NetworkError(errorData.message || 'Network request failed', response.status);
        }
      } catch (parseError) {
        if (parseError instanceof NetworkError || 
            parseError instanceof AuthenticationError || 
            parseError instanceof AuthorizationError || 
            parseError instanceof ValidationError) {
          throw parseError;
        }
        
        // If JSON parsing fails, throw generic network error
        throw new NetworkError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }
    } else {
      // Non-JSON error response
      const textError = await response.text();
      throw new NetworkError(
        textError || `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }
  }

  const data: APIResponse<T> = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'API request failed');
  }

  return data.data;
}

// Enhanced fetch with error handling
export async function safeFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return await handleAPIResponse<T>(response);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new NetworkError('Request timeout');
    }
    
    if (error instanceof NetworkError || 
        error instanceof AuthenticationError || 
        error instanceof AuthorizationError || 
        error instanceof ValidationError) {
      throw error;
    }
    
    // Unknown error
    console.error('Fetch error:', error);
    throw new NetworkError('Network request failed');
  }
}

// Error reporting utility
export function reportError(error: Error, context?: any) {
  const errorReport = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  console.error('Error report:', errorReport);
  
  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with error monitoring service (Sentry, LogRocket, etc.)
    // Example:
    // Sentry.captureException(error, { extra: context });
  }
}

// Retry utility for failed operations
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  reportError(lastError!, { type: 'retry_exhausted', maxRetries });
  throw lastError!;
}

// User-friendly error messages
export function getUserFriendlyErrorMessage(error: Error): string {
  if (error instanceof AuthenticationError) {
    return 'Veuillez vous connecter pour continuer.';
  }
  
  if (error instanceof AuthorizationError) {
    return 'Vous n\'avez pas les permissions nécessaires pour cette action.';
  }
  
  if (error instanceof ValidationError) {
    return error.message || 'Les données saisies sont invalides.';
  }
  
  if (error instanceof NetworkError) {
    if (error.statusCode === 404) {
      return 'La ressource demandée n\'existe pas.';
    }
    if (error.statusCode === 500) {
      return 'Erreur serveur temporaire. Veuillez réessayer.';
    }
    if (error.message.includes('timeout')) {
      return 'La connexion a expiré. Vérifiez votre connexion internet.';
    }
    return 'Erreur de connexion. Veuillez vérifier votre connexion internet.';
  }
  
  return 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
}
