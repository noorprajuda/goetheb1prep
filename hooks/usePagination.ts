import { useState, useMemo } from 'react';

interface UsePaginationProps {
  itemsPerPage: number;
  totalItems: number;
  initialPage?: number;
}

interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  startIndex: number;
  endIndex: number;
  paginatedItems: <T>(items: T[]) => T[];
}

export function usePagination({
  itemsPerPage,
  totalItems,
  initialPage = 1
}: UsePaginationProps): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  const canGoNext = currentPage < totalPages;
  const canGoPrevious = currentPage > 1;
  
  const goToNextPage = () => {
    if (canGoNext) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (canGoPrevious) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const goToFirstPage = () => {
    setCurrentPage(1);
  };
  
  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };
  
  const paginatedItems = <T>(items: T[]): T[] => {
    return items.slice(startIndex, endIndex);
  };
  
  return {
    currentPage,
    totalPages,
    setCurrentPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
    paginatedItems
  };
}
