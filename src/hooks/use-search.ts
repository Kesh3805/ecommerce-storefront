import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services/search.service';
import { useState, useEffect, useMemo } from 'react';
import { debounce } from '@/lib/utils';
import { siteConfig } from '@/config';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const searchKeys = {
  all: ['search'] as const,
  results: (query: string, params?: Record<string, unknown>) =>
    [...searchKeys.all, 'results', query, params] as const,
  suggestions: (query: string) => [...searchKeys.all, 'suggestions', query] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

interface UseSearchParams {
  query: string;
  first?: number;
  after?: string;
}

/**
 * Hook to search products
 */
export function useSearch(params: UseSearchParams) {
  const { query, first = 24, after } = params;
  
  return useQuery({
    queryKey: searchKeys.results(query, { first, after }),
    queryFn: () => searchService.searchProducts({ query, first, after }),
    enabled: query.length >= siteConfig.search.minQueryLength,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get search suggestions with debouncing
 */
export function useSearchSuggestions(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  
  // Debounce query updates
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, siteConfig.search.debounceMs);
    
    return () => clearTimeout(handler);
  }, [query]);
  
  return useQuery({
    queryKey: searchKeys.suggestions(debouncedQuery),
    queryFn: () => searchService.getSearchSuggestions(debouncedQuery, siteConfig.search.maxSuggestions),
    enabled: debouncedQuery.length >= siteConfig.search.minQueryLength,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook for search input with debouncing and suggestions
 */
export function useSearchInput() {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: suggestions, isLoading: suggestionsLoading } = useSearchSuggestions(inputValue);
  
  const handleInputChange = useMemo(
    () =>
      debounce((value: string) => {
        setInputValue(value);
        setIsOpen(value.length >= siteConfig.search.minQueryLength);
      }, siteConfig.search.debounceMs),
    []
  );
  
  const handleSelect = (suggestion: string) => {
    setInputValue(suggestion);
    setIsOpen(false);
  };
  
  const handleClear = () => {
    setInputValue('');
    setIsOpen(false);
  };
  
  return {
    inputValue,
    setInputValue: handleInputChange,
    suggestions: suggestions ?? [],
    suggestionsLoading,
    isOpen,
    setIsOpen,
    handleSelect,
    handleClear,
  };
}
