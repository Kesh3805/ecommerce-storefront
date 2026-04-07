'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProductCard, ProductFilters, ProductFiltersSidebar, Pagination } from '@/features/products/components';
import type { Collection, ProductConnection, FilterInput, ProductSortKey, SearchFilter } from '@/types';
import { siteConfig } from '@/config';

interface CollectionContentProps {
  collection: Collection & {
    products: ProductConnection & {
      filters?: SearchFilter[];
    };
  };
  initialSort: string;
}

export function CollectionContent({ collection, initialSort }: CollectionContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeFilters, setActiveFilters] = useState<FilterInput[]>([]);
  
  const products = collection.products.edges.map((edge) => edge.node);
  const totalCount = collection.products.totalCount;
  const filters = collection.products.filters || [];
  
  // Parse sort value
  const [sortKey, direction] = initialSort.includes('_')
    ? initialSort.split('_')
    : [initialSort, 'ASC'];
  
  const handleSortChange = useCallback(
    (newSortKey: ProductSortKey, reverse: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('sort', `${newSortKey}${reverse ? '_DESC' : '_ASC'}`);
      params.delete('page'); // Reset to page 1
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );
  
  const handleFilterChange = useCallback((newFilters: FilterInput[]) => {
    setActiveFilters(newFilters);
    // In a real implementation, this would update URL params and refetch
  }, []);
  
  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', page.toString());
      router.push(`?${params.toString()}`, { scroll: true });
    },
    [router, searchParams]
  );
  
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const totalPages = Math.ceil(totalCount / siteConfig.products.perPage);

  return (
    <div className="flex gap-8">
      {/* Desktop Filters Sidebar */}
      <ProductFiltersSidebar
        filters={filters}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
      />

      {/* Main Content */}
      <div className="flex-1">
        {/* Filters Bar */}
        <ProductFilters
          filters={filters}
          activeFilters={activeFilters}
          sortKey={sortKey as ProductSortKey}
          reverse={direction === 'DESC'}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          totalCount={totalCount}
        />

        {/* Products Grid */}
        {products.length > 0 ? (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 8}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  hasNextPage={collection.products.pageInfo.hasNextPage}
                  hasPreviousPage={collection.products.pageInfo.hasPreviousPage}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-lg font-medium">No products found</h3>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your filters or search criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
