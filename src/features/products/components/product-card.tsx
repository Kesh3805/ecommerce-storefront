'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import type { Product } from '@/types';
import { formatMoney, isOnSale, calculateDiscount, getProductUrl } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  className?: string;
  productHref?: string;
}

export function ProductCard({ product, priority = false, className, productHref }: ProductCardProps) {
  const { handle, title, vendor, featuredImage, priceRange, compareAtPriceRange, variants } = product;

  const canRenderImage = (() => {
    if (!featuredImage?.url) {
      return false;
    }

    try {
      const parsed = new URL(featuredImage.url);
      return parsed.hostname !== 'example.com';
    } catch {
      return false;
    }
  })();

  const useUnoptimizedImage = (() => {
    if (!featuredImage?.url) {
      return false;
    }

    try {
      const parsed = new URL(featuredImage.url);
      return parsed.hostname.endsWith('gstatic.com');
    } catch {
      return false;
    }
  })();

  const [imageVisible, setImageVisible] = useState(canRenderImage);
  
  const minPrice = priceRange.minPrice;
  const compareAtPrice = compareAtPriceRange?.minPrice;
  const onSale = isOnSale(minPrice, compareAtPrice);
  const discount = onSale && compareAtPrice ? calculateDiscount(minPrice, compareAtPrice) : 0;
  
  const isAvailable = variants.some((v) => v.availableForSale);
  const hasMultiplePrices = priceRange.minPrice.amount !== priceRange.maxPrice.amount;
  const href = productHref || getProductUrl(handle);

  return (
    <article className={cn('group relative', className)}>
      {/* Image Container */}
      <Link href={href} className="block">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
          {imageVisible && featuredImage ? (
            <Image
              src={featuredImage.url}
              alt={featuredImage.altText || title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority={priority}
              unoptimized={useUnoptimizedImage}
              onError={() => setImageVisible(false)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <span className="text-gray-400">No image</span>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {onSale && discount > 0 && (
              <Badge variant="destructive">-{discount}%</Badge>
            )}
            {!isAvailable && (
              <Badge variant="secondary">Sold Out</Badge>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Add to wishlist
              }}
            >
              <Heart className="h-4 w-4" />
              <span className="sr-only">Add to wishlist</span>
            </Button>
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="mt-4 space-y-1">
        {vendor && (
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {vendor}
          </p>
        )}
        
        <Link href={href}>
          <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>
        
        {/* Price */}
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm font-medium',
            onSale && 'text-destructive'
          )}>
            {hasMultiplePrices ? 'From ' : ''}
            {formatMoney(minPrice)}
          </span>
          
          {onSale && compareAtPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatMoney(compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
