'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  useCheckoutStore,
  useCheckoutStep,
  useCheckoutActions,
} from '@/stores/checkout.store';
import { useCartStore } from '@/stores/cart.store';
import { formatMoney } from '@/lib/utils';
import { ShippingForm } from './steps/shipping-form';
import { DeliveryForm } from './steps/delivery-form';
import { PaymentForm } from './steps/payment-form';
import { OrderConfirmation } from './steps/order-confirmation';
import type { CheckoutStep } from '@/types';

const STEPS: { id: CheckoutStep; label: string }[] = [
  { id: 'shipping', label: 'Shipping' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'payment', label: 'Payment' },
  { id: 'confirmation', label: 'Confirmation' },
];

export function CheckoutContent() {
  const router = useRouter();
  const currentStep = useCheckoutStep();
  const cart = useCartStore((state) => state.cart);
  const localItems = useCartStore((state) => state.localItems);

  // Cart summary
  const hasServerCart = cart && cart.lines.length > 0;
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

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  // Redirect to cart if empty (except on confirmation)
  if (isEmpty && currentStep !== 'confirmation') {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8">
          Add some items to your cart before checking out.
        </p>
        <Button asChild>
          <Link href="/collections/all">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container flex items-center justify-between py-4">
          <Link href="/cart" className="flex items-center text-sm hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to cart
          </Link>
          <Link href="/" className="text-xl font-bold">
            Storefront
          </Link>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>

      <div className="container py-8">
        {/* Progress Steps */}
        {currentStep !== 'confirmation' && (
          <nav className="mb-8">
            <ol className="flex items-center justify-center">
              {STEPS.slice(0, 3).map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isCurrent = step.id === currentStep;

                return (
                  <li
                    key={step.id}
                    className="flex items-center"
                  >
                    <div className="flex items-center">
                      <span
                        className={`
                          flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium
                          ${isCompleted ? 'bg-primary text-primary-foreground' : ''}
                          ${isCurrent ? 'border-2 border-primary text-primary' : ''}
                          ${!isCompleted && !isCurrent ? 'border-2 border-gray-300 text-gray-500' : ''}
                        `}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span
                        className={`
                          ml-2 text-sm font-medium hidden sm:inline
                          ${isCurrent ? 'text-primary' : 'text-muted-foreground'}
                        `}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < STEPS.length - 2 && (
                      <div
                        className={`
                          mx-4 h-0.5 w-12 sm:w-24
                          ${index < currentStepIndex ? 'bg-primary' : 'bg-gray-300'}
                        `}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}

        <div className="lg:grid lg:grid-cols-12 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {currentStep === 'shipping' && <ShippingForm />}
              {currentStep === 'delivery' && <DeliveryForm />}
              {currentStep === 'payment' && <PaymentForm />}
              {currentStep === 'confirmation' && <OrderConfirmation />}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          {currentStep !== 'confirmation' && (
            <div className="mt-8 lg:mt-0 lg:col-span-5">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

                {/* Items */}
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {hasServerCart &&
                    cart.lines.map((line) => (
                      <div key={line.id} className="flex gap-3">
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                          {(line.variant.image || line.product.featuredImage) && (
                            <img
                              src={(line.variant.image || line.product.featuredImage)!.url}
                              alt={line.product.title}
                              className="h-full w-full object-cover"
                            />
                          )}
                          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gray-600 text-white text-xs flex items-center justify-center">
                            {line.quantity}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium line-clamp-1">
                            {line.product.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {line.variant.title}
                          </p>
                          <p className="text-sm font-medium mt-1">
                            {formatMoney(line.cost.totalAmount)}
                          </p>
                        </div>
                      </div>
                    ))}

                  {!hasServerCart &&
                    localItems.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                          {item.product.featuredImage && (
                            <img
                              src={item.product.featuredImage.url}
                              alt={item.product.title}
                              className="h-full w-full object-cover"
                            />
                          )}
                          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gray-600 text-white text-xs flex items-center justify-center">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium line-clamp-1">
                            {item.product.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.variant.title}
                          </p>
                          <p className="text-sm font-medium mt-1">
                            {formatMoney({
                              amount: (
                                parseFloat(item.variant.price.amount) * item.quantity
                              ).toString(),
                              currencyCode: item.variant.price.currencyCode,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>

                <Separator className="my-4" />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>
                      {formatMoney({ amount: subtotal.toString(), currencyCode })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-muted-foreground">Calculated next</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="text-muted-foreground">Calculated next</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>
                    {formatMoney({ amount: subtotal.toString(), currencyCode })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
