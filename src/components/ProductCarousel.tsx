/**
 * Product Carousel Component
 * Displays a horizontal scrollable carousel of products
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CarouselProduct } from '@/services/merchandising.service';

interface ProductCarouselProps {
  title?: string;
  products: CarouselProduct[];
  viewAllLink?: string;
}

export function ProductCarousel({ title, products, viewAllLink }: ProductCarouselProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
            {viewAllLink && (
              <Link
                href={viewAllLink}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View All →
              </Link>
            )}
          </div>
        )}

        {/* Carousel */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-6 pb-4">
            {products.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

interface ProductCardProps {
  product: CarouselProduct;
}

function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  
  const productUrl = product.handle 
    ? `/products/${product.handle}`
    : `/products/${product.product_id}`;

  const hasDiscount = product.compare_at_price && product.compare_at_price > (product.price || 0);
  const discountPercentage = hasDiscount
    ? Math.round(((product.compare_at_price! - (product.price || 0)) / product.compare_at_price!) * 100)
    : 0;

  return (
    <Link
      href={productUrl}
      className="group flex-shrink-0 w-64 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
        {product.thumbnail_url && !imageError ? (
          <Image
            src={product.thumbnail_url}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {!product.in_stock && (
            <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
              Out of Stock
            </span>
          )}
          {hasDiscount && (
            <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
              -{discountPercentage}%
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
          {product.title}
        </h3>
        
        {/* Price */}
        <div className="flex items-baseline gap-2">
          {product.price !== undefined && (
            <span className="text-lg font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
          )}
          {hasDiscount && (
            <span className="text-sm text-gray-500 line-through">
              ${product.compare_at_price!.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        {product.in_stock ? (
          <p className="text-xs text-green-600 mt-2">In Stock</p>
        ) : (
          <p className="text-xs text-red-600 mt-2">Out of Stock</p>
        )}
      </div>
    </Link>
  );
}
