import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to cleanup states when navigating away from a page
 * Prevents stuck states from blocking navigation
 */
export function useNavigationCleanup(cleanup: () => void) {
  const location = useLocation();

  useEffect(() => {
    // Cleanup when component unmounts or route changes
    return () => {
      cleanup();
    };
  }, [location.pathname, cleanup]);
}
