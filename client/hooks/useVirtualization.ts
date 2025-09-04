import { useState, useEffect, useMemo } from 'react';

interface UseVirtualizationProps {
  items: any[];
  itemsPerPage?: number;
  enablePagination?: boolean;
}

/**
 * Custom hook for virtualizing large lists to improve performance
 */
export function useVirtualization<T>({ 
  items, 
  itemsPerPage = 20, 
  enablePagination = true 
}: UseVirtualizationProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when items change
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  const paginatedItems = useMemo(() => {
    if (!enablePagination) return items;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage, enablePagination]);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return {
    items: paginatedItems,
    currentPage,
    totalPages,
    totalItems: items.length,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    goToPage,
    goToNextPage,
    goToPreviousPage,
  };
}
