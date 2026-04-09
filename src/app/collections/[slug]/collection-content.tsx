'use client';

import { useCallback, useMemo } from 'react';
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
  storeSlug?: string;
  initialCountryCode?: string;
}

export function CollectionContent({ collection, initialSort, storeSlug, initialCountryCode }: CollectionContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeFilters = useMemo(() => {
    const parsed: FilterInput[] = [];
    const vendor = searchParams.get('vendor');
    const category = searchParams.get('category');
    const min = searchParams.get('minPrice');
    const max = searchParams.get('maxPrice');

    if (vendor) {
      parsed.push({ vendor });
    }

    if (category) {
      parsed.push({ category });
    }

    if (min || max) {
      parsed.push({
        price: {
          min: min ? Number(min) : undefined,
          max: max ? Number(max) : undefined,
        },
      });
    }

    return parsed;
  }, [searchParams]);
  
  const products = collection.products.edges.map((edge) => edge.node);
  const totalCount = collection.products.totalCount;
  const filters = collection.products.filters || [];
  
  // Parse sort value
  const hasDirection = initialSort.endsWith('_ASC') || initialSort.endsWith('_DESC');
  const sortKey = hasDirection ? initialSort.replace(/_(ASC|DESC)$/, '') : initialSort;
  const direction = hasDirection ? (initialSort.endsWith('_DESC') ? 'DESC' : 'ASC') : 'ASC';
  
  const handleSortChange = useCallback(
    (newSortKey: ProductSortKey, reverse: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('sort', `${newSortKey}${reverse ? '_DESC' : '_ASC'}`);
      params.delete('page'); // Reset to page 1
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );
  
  const handleFilterChange = useCallback(
    (newFilters: FilterInput[]) => {
      const params = new URLSearchParams(searchParams.toString());
      const vendor = newFilters.find((filter) => filter.vendor)?.vendor;
      const category = newFilters.find((filter) => filter.category)?.category;
      const price = newFilters.find((filter) => filter.price)?.price;

      if (vendor) {
        params.set('vendor', vendor);
      } else {
        params.delete('vendor');
      }

      if (category) {
        params.set('category', category);
      } else {
        params.delete('category');
      }

      if (price?.min != null) {
        params.set('minPrice', String(price.min));
      } else {
        params.delete('minPrice');
      }

      if (price?.max != null) {
        params.set('maxPrice', String(price.max));
      } else {
        params.delete('maxPrice');
      }

      params.delete('page');
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );
  
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
  const shownStart = totalCount > 0 ? (currentPage - 1) * siteConfig.products.perPage + 1 : 0;
  const shownEnd = totalCount > 0 ? shownStart + products.length - 1 : 0;
  const storeSlugFromQuery = searchParams.get('storeSlug');
  const effectiveStoreSlug = storeSlug || storeSlugFromQuery;
  const countryFromQuery = searchParams.get('country') || undefined;
  const effectiveCountryCode = countryFromQuery || initialCountryCode;

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

        {products.length > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Showing {shownStart}-{shownEnd} of {totalCount} products.
          </p>
        )}

        {/* Products Grid */}
        {products.length > 0 ? (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 8}
                  productHref={effectiveStoreSlug
                    ? `/stores/${effectiveStoreSlug}/products/${product.handle}${effectiveCountryCode ? `?country=${effectiveCountryCode}` : ''}`
                    : undefined}
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
