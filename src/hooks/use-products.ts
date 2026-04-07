import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import type { ProductSortKey } from '@/types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params: UseProductsParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (handle: string) => [...productKeys.details(), handle] as const,
  featured: () => [...productKeys.all, 'featured'] as const,
  related: (productId: string) => [...productKeys.all, 'related', productId] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

interface UseProductsParams {
  first?: number;
  after?: string;
  sortKey?: ProductSortKey;
  reverse?: boolean;
}

/**
 * Hook to fetch paginated products
 */
export function useProducts(params: UseProductsParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productService.getProducts(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch a single product by handle
 */
export function useProduct(handle: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(handle ?? ''),
    queryFn: () => productService.getProductByHandle(handle!),
    enabled: !!handle,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch featured products
 */
export function useFeaturedProducts(count: number = 8) {
  return useQuery({
    queryKey: productKeys.featured(),
    queryFn: () => productService.getFeaturedProducts(count),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch related products
 */
export function useRelatedProducts(productId: string | undefined, count: number = 4) {
  return useQuery({
    queryKey: productKeys.related(productId ?? ''),
    queryFn: () => productService.getRelatedProducts(productId!, count),
    enabled: !!productId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to prefetch a product (for hover preload)
 */
export function usePrefetchProduct() {
  const queryClient = useQueryClient();
  
  return (handle: string) => {
    queryClient.prefetchQuery({
      queryKey: productKeys.detail(handle),
      queryFn: () => productService.getProductByHandle(handle),
      staleTime: 1000 * 60 * 5,
    });
  };
}
