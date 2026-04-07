'use client';

import Link from 'next/link';
import { ArrowRight, ShoppingBag, Loader2, Tag } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { CartItem } from '@/features/cart/components';
import { useCartStore, useCartActions } from '@/stores/cart.store';
import { useCartSync, useApplyDiscount } from '@/hooks/use-cart';
import { formatMoney } from '@/lib/utils';
import type { CartLine } from '@/types';
import type { LocalCartItem } from '@/stores/cart.store';

export function CartPageContent() {
  const cart = useCartStore((state) => state.cart);
  const localItems = useCartStore((state) => state.localItems);
  const isLoading = useCartStore((state) => state.isLoading);
  const [discountCode, setDiscountCode] = useState('');
  
  const { syncLocalItems } = useCartSync();
  const { applyDiscount, isLoading: applyingDiscount } = useApplyDiscount();

  // Determine what items to show
  const cartLines = cart?.lines ?? [];
  const hasServerCart = cartLines.length > 0;
  const hasLocalItems = localItems.length > 0;
  const isEmpty = !hasServerCart && !hasLocalItems;

  // Calculate totals
  const subtotal = cart
    ? parseFloat(cart.cost.subtotalAmount.amount)
    : localItems.reduce((sum, item) => {
        return sum + parseFloat(item.variant.price.amount) * item.quantity;
      }, 0);

  const itemCount = cart
    ? cart.totalQuantity
    : localItems.reduce((sum, item) => sum + item.quantity, 0);

  const currencyCode = cart?.cost.subtotalAmount.currencyCode ?? 'USD';

  const handleApplyDiscount = () => {
    if (discountCode.trim()) {
      applyDiscount(discountCode.trim());
      setDiscountCode('');
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Empty Cart
  if (isEmpty) {
    return (
      <div className="text-center py-16">
        <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground/30" />
        <h2 className="mt-6 text-2xl font-semibold">Your cart is empty</h2>
        <p className="mt-2 text-muted-foreground">
          Looks like you haven&apos;t added any items to your cart yet.
        </p>
        <Button size="lg" className="mt-8" asChild>
          <Link href="/collections/all">
            Start Shopping
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-12">
      {/* Cart Items */}
      <div className="lg:col-span-7">
        <div className="border rounded-lg divide-y">
          {/* Server Cart Items */}
          {hasServerCart &&
            cartLines.map((line: CartLine) => (
              <div key={line.id} className="p-4">
                <CartItem item={line} />
              </div>
            ))}

          {/* Local Items (when no server cart) */}
          {!hasServerCart &&
            hasLocalItems &&
            localItems.map((item: LocalCartItem) => (
              <div key={item.id} className="p-4">
                <LocalCartItemCard item={item} />
              </div>
            ))}
        </div>

        {/* Sync Button for local items */}
        {hasLocalItems && !hasServerCart && (
          <div className="mt-4">
            <Button variant="outline" onClick={syncLocalItems}>
              Sync Cart to Account
            </Button>
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="mt-8 lg:mt-0 lg:col-span-5">
        <div className="bg-gray-50 rounded-lg p-6 sticky top-24">
          <h2 className="text-lg font-semibold">Order Summary</h2>

          <div className="mt-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </span>
              <span>{formatMoney({ amount: subtotal.toString(), currencyCode })}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-green-600">Calculated at checkout</span>
            </div>

            {/* Applied Discounts */}
            {cart?.discountCodes?.filter((d) => d.applicable).map((discount) => (
              <div key={discount.code} className="flex justify-between text-sm text-green-600">
                <span className="flex items-center">
                  <Tag className="h-4 w-4 mr-1" />
                  {discount.code}
                </span>
                <span>Applied</span>
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          {/* Discount Code Input */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">
              Discount Code
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={handleApplyDiscount}
                disabled={!discountCode.trim() || applyingDiscount}
              >
                {applyingDiscount ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Apply'
                )}
              </Button>
            </div>
          </div>

          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>
              {formatMoney({
                amount: (cart?.cost.totalAmount.amount ?? subtotal.toString()),
                currencyCode,
              })}
            </span>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Taxes and shipping calculated at checkout
          </p>

          <Button size="lg" className="w-full mt-6" asChild>
            <Link href="/checkout">
              Proceed to Checkout
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            or{' '}
            <Link href="/collections/all" className="underline hover:text-foreground">
              Continue Shopping
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Simple display for local cart items (matching CartItem interface)
function LocalCartItemCard({ item }: { item: LocalCartItem }) {
  const { removeLocalItem, updateLocalItemQuantity } = useCartActions();

  return (
    <div className="flex gap-4">
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {item.product.featuredImage ? (
          <img
            src={item.product.featuredImage.url}
            alt={item.product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-muted-foreground">No image</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <div>
            <Link
              href={`/products/${item.product.handle}`}
              className="font-medium hover:text-primary line-clamp-2"
            >
              {item.product.title}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              {item.variant.title}
            </p>
          </div>
          <p className="font-medium">
            {formatMoney({
              amount: (parseFloat(item.variant.price.amount) * item.quantity).toString(),
              currencyCode: item.variant.price.currencyCode,
            })}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center border rounded-md">
            <button
              className="h-8 w-8 flex items-center justify-center hover:bg-gray-100"
              onClick={() => updateLocalItemQuantity(item.variantId, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              -
            </button>
            <span className="w-10 text-center text-sm">{item.quantity}</span>
            <button
              className="h-8 w-8 flex items-center justify-center hover:bg-gray-100"
              onClick={() => updateLocalItemQuantity(item.variantId, item.quantity + 1)}
            >
              +
            </button>
          </div>

          <button
            className="text-sm text-destructive hover:underline"
            onClick={() => removeLocalItem(item.variantId)}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
