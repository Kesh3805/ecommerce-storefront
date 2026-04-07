'use client';

import { useState } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SearchFilter, FilterInput, ProductSortKey } from '@/types';
import { siteConfig } from '@/config';
import { cn } from '@/lib/utils';

interface ProductFiltersProps {
  filters: SearchFilter[];
  activeFilters: FilterInput[];
  sortKey: ProductSortKey;
  reverse: boolean;
  onFilterChange: (filters: FilterInput[]) => void;
  onSortChange: (sortKey: ProductSortKey, reverse: boolean) => void;
  totalCount: number;
}

export function ProductFilters({
  filters,
  activeFilters,
  sortKey,
  reverse,
  onFilterChange,
  onSortChange,
  totalCount,
}: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const sortValue = `${sortKey}${reverse ? '_DESC' : '_ASC'}`;

  const handleSortChange = (value: string) => {
    const [key, direction] = value.split('_') as [ProductSortKey, 'ASC' | 'DESC'];
    onSortChange(key, direction === 'DESC');
  };

  const toggleFilter = (filterType: string, value: string) => {
    const existingFilter = activeFilters.find((f) => {
      if (filterType === 'productType') return f.productType === value;
      if (filterType === 'vendor') return f.vendor === value;
      if (filterType === 'category') return f.category === value;
      if (filterType === 'tag') return f.tag === value;
      return false;
    });

    if (existingFilter) {
      onFilterChange(activeFilters.filter((f) => f !== existingFilter));
    } else {
      const newFilter: FilterInput = {};
      if (filterType === 'productType') newFilter.productType = value;
      if (filterType === 'vendor') newFilter.vendor = value;
      if (filterType === 'category') newFilter.category = value;
      if (filterType === 'tag') newFilter.tag = value;
      onFilterChange([...activeFilters, newFilter]);
    }
  };

  const applyPriceFilter = () => {
    const min = priceRange.min ? parseFloat(priceRange.min) : undefined;
    const max = priceRange.max ? parseFloat(priceRange.max) : undefined;

    if (min !== undefined || max !== undefined) {
      // Remove existing price filter
      const withoutPrice = activeFilters.filter((f) => !f.price);
      onFilterChange([...withoutPrice, { price: { min, max } }]);
    }
  };

  const clearAllFilters = () => {
    onFilterChange([]);
    setPriceRange({ min: '', max: '' });
  };

  const activeFilterCount = activeFilters.length;

  // Desktop Filters Sidebar Content
  const renderFilterContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <h3 className="font-medium mb-3">Price Range</h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => setPriceRange((p) => ({ ...p, min: e.target.value }))}
            className="w-20"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => setPriceRange((p) => ({ ...p, max: e.target.value }))}
            className="w-20"
          />
          <Button variant="outline" size="sm" onClick={applyPriceFilter}>
            Go
          </Button>
        </div>
      </div>

      <Separator />

      {/* Dynamic Filters */}
      {filters.map((filter) => (
        <div key={filter.id}>
          <h3 className="font-medium mb-3">{filter.label}</h3>
          <div className="space-y-2">
            {filter.values.map((value) => {
              const isActive = activeFilters.some((f) => {
                if (filter.id === 'productType') return f.productType === value.input;
                if (filter.id === 'vendor') return f.vendor === value.input;
                if (filter.id === 'category') return f.category === value.input;
                if (filter.id === 'tag') return f.tag === value.input;
                return false;
              });

              return (
                <button
                  key={value.id}
                  onClick={() => toggleFilter(filter.id, value.input)}
                  className={cn(
                    'flex items-center justify-between w-full px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors',
                    isActive && 'bg-accent font-medium'
                  )}
                >
                  <span>{value.label}</span>
                  <span className="text-muted-foreground">({value.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? 'product' : 'products'}
        </p>

        <div className="flex items-center gap-2">
          {/* Mobile Filter Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-75 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                {renderFilterContent()}
              </div>
              {activeFilterCount > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={clearAllFilters}
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* Sort Dropdown */}
          <Select value={sortValue} onValueChange={handleSortChange}>
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {siteConfig.products.sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilters.map((filter, index) => {
            const label =
              filter.productType ||
              filter.vendor ||
              filter.category ||
              filter.tag ||
              (filter.price
                ? `$${filter.price.min || 0} - $${filter.price.max || '∞'}`
                : '');

            return (
              <Button
                key={index}
                variant="secondary"
                size="sm"
                className="h-7"
                onClick={() =>
                  onFilterChange(activeFilters.filter((_, i) => i !== index))
                }
              >
                {label}
                <X className="ml-1 h-3 w-3" />
              </Button>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            className="h-7"
            onClick={clearAllFilters}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Desktop Sidebar - Render separately in layout */}
    </div>
  );
}

// Export sidebar component for desktop layout
export function ProductFiltersSidebar({
  filters,
  activeFilters,
  onFilterChange,
}: Pick<ProductFiltersProps, 'filters' | 'activeFilters' | 'onFilterChange'>) {
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const toggleFilter = (filterType: string, value: string) => {
    const existingFilter = activeFilters.find((f) => {
      if (filterType === 'productType') return f.productType === value;
      if (filterType === 'vendor') return f.vendor === value;
      if (filterType === 'category') return f.category === value;
      if (filterType === 'tag') return f.tag === value;
      return false;
    });

    if (existingFilter) {
      onFilterChange(activeFilters.filter((f) => f !== existingFilter));
    } else {
      const newFilter: FilterInput = {};
      if (filterType === 'productType') newFilter.productType = value;
      if (filterType === 'vendor') newFilter.vendor = value;
      if (filterType === 'category') newFilter.category = value;
      if (filterType === 'tag') newFilter.tag = value;
      onFilterChange([...activeFilters, newFilter]);
    }
  };

  const applyPriceFilter = () => {
    const min = priceRange.min ? parseFloat(priceRange.min) : undefined;
    const max = priceRange.max ? parseFloat(priceRange.max) : undefined;

    if (min !== undefined || max !== undefined) {
      const withoutPrice = activeFilters.filter((f) => !f.price);
      onFilterChange([...withoutPrice, { price: { min, max } }]);
    }
  };

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-20 space-y-6">
        <h2 className="font-semibold text-lg">Filters</h2>

        {/* Price Range */}
        <div>
          <h3 className="font-medium mb-3">Price Range</h3>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={priceRange.min}
              onChange={(e) => setPriceRange((p) => ({ ...p, min: e.target.value }))}
              className="w-20"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={priceRange.max}
              onChange={(e) => setPriceRange((p) => ({ ...p, max: e.target.value }))}
              className="w-20"
            />
            <Button variant="outline" size="sm" onClick={applyPriceFilter}>
              Go
            </Button>
          </div>
        </div>

        <Separator />

        {/* Dynamic Filters */}
        {filters.map((filter) => (
          <div key={filter.id}>
            <h3 className="font-medium mb-3">{filter.label}</h3>
            <div className="space-y-2">
              {filter.values.slice(0, 10).map((value) => {
                const isActive = activeFilters.some((f) => {
                  if (filter.id === 'productType') return f.productType === value.input;
                  if (filter.id === 'vendor') return f.vendor === value.input;
                  if (filter.id === 'category') return f.category === value.input;
                  if (filter.id === 'tag') return f.tag === value.input;
                  return false;
                });

                return (
                  <button
                    key={value.id}
                    onClick={() => toggleFilter(filter.id, value.input)}
                    className={cn(
                      'flex items-center justify-between w-full px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors text-left',
                      isActive && 'bg-accent font-medium'
                    )}
                  >
                    <span className="truncate">{value.label}</span>
                    <span className="text-muted-foreground ml-2">({value.count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
