import { useQuery } from '@tanstack/react-query';
import { collectionService } from '@/services/collection.service';
import type { ProductSortKey, FilterInput } from '@/types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const collectionKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionKeys.all, 'list'] as const,
  list: () => [...collectionKeys.lists()] as const,
  details: () => [...collectionKeys.all, 'detail'] as const,
  detail: (handle: string, params?: Record<string, unknown>) =>
    [...collectionKeys.details(), handle, params] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch all collections
 */
export function useCollections(count: number = 20) {
  return useQuery({
    queryKey: collectionKeys.list(),
    queryFn: () => collectionService.getCollections(count),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

interface UseCollectionParams {
  handle: string;
  first?: number;
  after?: string;
  sortKey?: ProductSortKey;
  reverse?: boolean;
  filters?: FilterInput[];
}

/**
 * Hook to fetch a collection by handle with products
 */
export function useCollection(params: UseCollectionParams) {
  const { handle, ...rest } = params;
  
  return useQuery({
    queryKey: collectionKeys.detail(handle, rest),
    queryFn: () => collectionService.getCollectionByHandle(params),
    enabled: !!handle,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
