'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpdateCartItem, useRemoveFromCart } from '@/hooks/use-cart';
import type { CartLine } from '@/types';
import { formatMoney, getProductUrl } from '@/lib/utils';
import { siteConfig } from '@/config';

interface CartItemProps {
  item: CartLine;
  compact?: boolean;
}

export function CartItem({ item, compact = false }: CartItemProps) {
  const { updateItem, isLoading: isUpdating } = useUpdateCartItem();
  const { removeItem, isLoading: isRemoving } = useRemoveFromCart();

  const { id, quantity, variant, product, cost } = item;
  const image = variant.image || product.featuredImage;
  
  const isLoading = isUpdating || isRemoving;
  const maxQuantity = Math.min(variant.quantityAvailable, siteConfig.cart.maxQuantity);

  const handleIncrement = () => {
    if (quantity < maxQuantity) {
      updateItem(id, quantity + 1, variant.id);
    }
  };

  const handleDecrement = () => {
    if (quantity > siteConfig.cart.minQuantity) {
      updateItem(id, quantity - 1, variant.id);
    }
  };

  const handleRemove = () => {
    removeItem(id, variant.id);
  };

  if (compact) {
    return (
      <div className="flex gap-3 py-3">
        {/* Image */}
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
          {image ? (
            <Image
              src={image.url}
              alt={image.altText || product.title}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-muted-foreground">No image</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-1 flex-col">
          <Link
            href={getProductUrl(product.handle)}
            className="text-sm font-medium hover:text-primary line-clamp-1"
          >
            {product.title}
          </Link>
          <p className="text-xs text-muted-foreground">{variant.title}</p>
          <div className="mt-auto flex items-center justify-between">
            <span className="text-sm">Qty: {quantity}</span>
            <span className="text-sm font-medium">
              {formatMoney(cost.totalAmount)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 py-4">
      {/* Image */}
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText || product.title}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-muted-foreground">No image</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <div>
            <Link
              href={getProductUrl(product.handle)}
              className="font-medium hover:text-primary line-clamp-2"
            >
              {product.title}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">{variant.title}</p>
          </div>
          <p className="font-medium">{formatMoney(cost.totalAmount)}</p>
        </div>

        <div className="mt-auto flex items-center justify-between">
          {/* Quantity Controls */}
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={handleDecrement}
              disabled={isLoading || quantity <= siteConfig.cart.minQuantity}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-10 text-center text-sm">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={handleIncrement}
              disabled={isLoading || quantity >= maxQuantity}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleRemove}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}
