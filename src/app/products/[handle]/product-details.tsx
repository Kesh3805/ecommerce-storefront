'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Share2, Heart, Check, Truck } from 'lucide-react';
import { ProductGallery, VariantSelector, AddToCartButton } from '@/features/products/components';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useVariantSelection } from '@/hooks/use-variant-selection';
import type { Product } from '@/types';
import { formatMoney, isOnSale, calculateDiscount } from '@/lib/utils';

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const {
    selectedOptions,
    selectedVariant,
    selectOption,
    isOptionAvailable,
    isOptionSelected,
  } = useVariantSelection({
    variants: product.variants,
    options: product.options,
  });

  const [isWishlisted, setIsWishlisted] = useState(false);

  // Price display
  const displayPrice = selectedVariant?.price || product.priceRange.minPrice;
  const compareAtPrice = selectedVariant?.compareAtPrice || product.compareAtPriceRange?.minPrice;
  const onSale = isOnSale(displayPrice, compareAtPrice);
  const discount = onSale && compareAtPrice ? calculateDiscount(displayPrice, compareAtPrice) : 0;

  // Availability
  const isAvailable = selectedVariant?.availableForSale ?? 
    product.variants.some((v) => v.availableForSale);
  const quantityAvailable = selectedVariant?.quantityAvailable ?? 0;

  return (
    <div className="lg:grid lg:grid-cols-2 lg:gap-12">
      {/* Left Column - Gallery */}
      <div>
        <ProductGallery images={product.images} productTitle={product.title} />
      </div>

      {/* Right Column - Product Info */}
      <div className="mt-8 lg:mt-0">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-4 w-4 mx-1" />
          <Link href="/collections/all" className="hover:text-foreground">Products</Link>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span className="text-foreground truncate">{product.title}</span>
        </nav>

        {/* Vendor */}
        {product.vendor && (
          <p className="text-sm text-muted-foreground uppercase tracking-wide">
            {product.vendor}
          </p>
        )}

        {/* Title */}
        <h1 className="mt-2 text-3xl font-bold tracking-tight lg:text-4xl">
          {product.title}
        </h1>

        {/* Price */}
        <div className="mt-4 flex items-center gap-4">
          <span className="text-2xl font-bold">
            {formatMoney(displayPrice)}
          </span>
          {onSale && compareAtPrice && (
            <>
              <span className="text-lg text-muted-foreground line-through">
                {formatMoney(compareAtPrice)}
              </span>
              <Badge variant="destructive">-{discount}% OFF</Badge>
            </>
          )}
        </div>

        {/* Availability */}
        <div className="mt-4 flex items-center gap-2">
          {isAvailable ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">In Stock</span>
              {quantityAvailable > 0 && quantityAvailable < 10 && (
                <span className="text-sm text-orange-600">
                  - Only {quantityAvailable} left
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-red-600 font-medium">Out of Stock</span>
          )}
        </div>

        <Separator className="my-6" />

        {/* Variant Selector */}
        {product.options.length > 0 && product.options[0].values.length > 1 && (
          <div className="mb-6">
            <VariantSelector
              options={product.options}
              selectedOptions={selectedOptions}
              onSelectOption={selectOption}
              isOptionAvailable={isOptionAvailable}
              isOptionSelected={isOptionSelected}
            />
          </div>
        )}

        {/* Add to Cart */}
        <AddToCartButton
          variant={selectedVariant}
          product={{
            id: product.id,
            handle: product.handle,
            title: product.title,
            featuredImage: product.featuredImage,
          }}
          className="mb-6"
        />

        {/* Secondary Actions */}
        <div className="flex gap-4 mb-8">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setIsWishlisted(!isWishlisted)}
          >
            <Heart
              className={`h-4 w-4 mr-2 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`}
            />
            {isWishlisted ? 'Saved' : 'Save for Later'}
          </Button>
          <Button variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Shipping Info */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <Truck className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Free Shipping</p>
            <p className="text-xs text-muted-foreground">
              On orders over $50. Estimated delivery in 3-5 business days.
            </p>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Description */}
        {product.description && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Description</h2>
            <div 
              className="prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* SKU */}
        {selectedVariant?.sku && (
          <p className="mt-6 text-sm text-muted-foreground">
            SKU: {selectedVariant.sku}
          </p>
        )}
      </div>
    </div>
  );
}
