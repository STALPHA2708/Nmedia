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

  // Ensure items is always an array to prevent crashes
  const safeItems = items || [];

  // Reset to page 1 when items change
  useEffect(() => {
    setCurrentPage(1);
  }, [safeItems.length]);

  const paginatedItems = useMemo(() => {
    if (!enablePagination) return safeItems;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return safeItems.slice(startIndex, endIndex);
  }, [safeItems, currentPage, itemsPerPage, enablePagination]);

  const totalPages = itemsPerPage > 0 ? Math.ceil(safeItems.length / itemsPerPage) : 0;

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
    totalItems: safeItems.length,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    goToPage,
    goToNextPage,
    goToPreviousPage,
  };
}
