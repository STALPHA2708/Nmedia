import { useState, useCallback } from 'react';

/**
 * Hook for handling errors gracefully and preventing app crashes
 */
export function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const captureError = useCallback((error: Error | unknown) => {
    if (error instanceof Error) {
      setError(error);
    } else {
      setError(new Error(String(error)));
    }
    
    // Log error for debugging
    console.error('Error captured by error boundary:', error);
  }, []);

  const executeWithErrorBoundary = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    fallback?: T
  ): Promise<T | undefined> => {
    try {
      return await asyncFn();
    } catch (error) {
      captureError(error);
      return fallback;
    }
  }, [captureError]);

  return {
    error,
    resetError,
    captureError,
    executeWithErrorBoundary,
    hasError: error !== null,
  };
}
