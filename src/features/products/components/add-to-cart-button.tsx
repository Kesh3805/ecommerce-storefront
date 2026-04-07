'use client';

import { useState } from 'react';
import { ShoppingCart, Minus, Plus, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAddToCart } from '@/hooks/use-cart';
import type { ProductVariant, Product } from '@/types';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/config';

interface AddToCartButtonProps {
  variant: ProductVariant | null;
  product: Pick<Product, 'id' | 'handle' | 'title' | 'featuredImage'>;
  disabled?: boolean;
  showQuantity?: boolean;
  className?: string;
}

export function AddToCartButton({
  variant,
  product,
  disabled = false,
  showQuantity = true,
  className,
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const { addToCart, isLoading } = useAddToCart();

  const isDisabled = disabled || !variant || !variant.availableForSale || isLoading;

  const handleAddToCart = () => {
    if (!variant) return;

    addToCart({
      variant,
      product,
      quantity,
    });

    // Show success state briefly
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
    
    // Reset quantity
    setQuantity(1);
  };

  const incrementQuantity = () => {
    if (variant && quantity < Math.min(variant.quantityAvailable, siteConfig.cart.maxQuantity)) {
      setQuantity((q) => q + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > siteConfig.cart.minQuantity) {
      setQuantity((q) => q - 1);
    }
  };

  // Determine button text
  let buttonText = 'Add to Cart';
  if (!variant) {
    buttonText = 'Select Options';
  } else if (!variant.availableForSale) {
    buttonText = 'Sold Out';
  } else if (justAdded) {
    buttonText = 'Added!';
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Quantity Selector */}
      {showQuantity && variant?.availableForSale && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Quantity</span>
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={decrementQuantity}
              disabled={quantity <= siteConfig.cart.minQuantity}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center text-sm font-medium">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={incrementQuantity}
              disabled={
                !variant ||
                quantity >= Math.min(variant.quantityAvailable, siteConfig.cart.maxQuantity)
              }
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {variant && variant.quantityAvailable < 10 && variant.quantityAvailable > 0 && (
            <span className="text-sm text-orange-600">
              Only {variant.quantityAvailable} left
            </span>
          )}
        </div>
      )}

      {/* Add to Cart Button */}
      <Button
        size="xl"
        className="w-full"
        onClick={handleAddToCart}
        disabled={isDisabled}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : justAdded ? (
          <Check className="mr-2 h-5 w-5" />
        ) : (
          <ShoppingCart className="mr-2 h-5 w-5" />
        )}
        {buttonText}
      </Button>
    </div>
  );
}
