'use client';

import Link from 'next/link';
import { ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { useCartStore, useCartOpen, useCartActions } from '@/stores/cart.store';
import { useCartSync } from '@/hooks/use-cart';
import { CartItem } from './cart-item';
import { formatMoney } from '@/lib/utils';
import type { CartLine, Cart } from '@/types';
import type { LocalCartItem } from '@/stores/cart.store';

export function CartDrawer() {
  const isOpen = useCartOpen();
  const { closeCart } = useCartActions();
  const cart = useCartStore((state) => state.cart);
  const localItems = useCartStore((state) => state.localItems);
  const isLoading = useCartStore((state) => state.isLoading);
  const isSyncing = useCartStore((state) => state.isSyncing);

  // Use cart sync hook
  useCartSync();

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

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Your Cart
            {itemCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Loading State */}
        {(isLoading || isSyncing) && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty Cart */}
        {isEmpty && !isLoading && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/50" />
            <div className="text-center">
              <h3 className="font-medium">Your cart is empty</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add items to your cart to checkout
              </p>
            </div>
            <Button onClick={closeCart} asChild>
              <Link href="/collections/all">
                Start Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}

        {/* Cart Items */}
        {!isEmpty && (
          <>
            <div className="flex-1 overflow-y-auto -mx-6 px-6">
              <div className="divide-y">
                {/* Server Cart Items */}
                {hasServerCart &&
                  cartLines.map((line) => (
                    <CartItem key={line.id} item={line} />
                  ))}

                {/* Local Items (when no server cart) */}
                {!hasServerCart &&
                  hasLocalItems &&
                  localItems.map((item) => (
                    <LocalCartItemDisplay key={item.id} item={item} />
                  ))}
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              {/* Subtotal */}
              <div className="flex items-center justify-between text-base font-medium">
                <span>Subtotal</span>
                <span>
                  {formatMoney({ amount: subtotal.toString(), currencyCode })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Shipping and taxes calculated at checkout
              </p>

              {/* Checkout Button */}
              <Button size="lg" className="w-full" asChild>
                <Link href="/checkout" onClick={closeCart}>
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              {/* Continue Shopping */}
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={closeCart}
                asChild
              >
                <Link href="/cart">View Cart</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Display component for local cart items (before sync)
function LocalCartItemDisplay({ item }: { item: LocalCartItem }) {
  const { removeLocalItem, updateLocalItemQuantity } = useCartActions();

  return (
    <div className="flex gap-4 py-4">
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
              amount: (
                parseFloat(item.variant.price.amount) * item.quantity
              ).toString(),
              currencyCode: item.variant.price.currencyCode,
            })}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center border rounded-md">
            <button
              className="h-8 w-8 flex items-center justify-center"
              onClick={() =>
                updateLocalItemQuantity(item.variantId, item.quantity - 1)
              }
              disabled={item.quantity <= 1}
            >
              -
            </button>
            <span className="w-10 text-center text-sm">{item.quantity}</span>
            <button
              className="h-8 w-8 flex items-center justify-center"
              onClick={() =>
                updateLocalItemQuantity(item.variantId, item.quantity + 1)
              }
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
