'use client';

import Link from 'next/link';
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  useCheckoutStore,
  useCheckoutActions,
  useShippingAddress,
  useShippingMethod,
  useCheckoutEmail,
} from '@/stores/checkout.store';
import { useEffect } from 'react';

export function OrderConfirmation() {
  const email = useCheckoutEmail();
  const shippingAddress = useShippingAddress();
  const shippingMethod = useShippingMethod();
  const orderId = useCheckoutStore((state) => state.orderId);
  const orderNumber = useCheckoutStore((state) => state.orderNumber);
  const { reset } = useCheckoutActions();

  // Cleanup checkout state when leaving confirmation
  useEffect(() => {
    return () => {
      // Reset checkout state when component unmounts
      // reset();
    };
  }, []);

  return (
    <div className="text-center py-8">
      <div className="flex justify-center mb-6">
        <div className="rounded-full bg-green-100 p-4">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-2">Thank you for your order!</h1>
      <p className="text-muted-foreground mb-6">
        Your order {orderNumber} has been placed successfully.
      </p>

      <div className="bg-gray-50 rounded-lg p-6 text-left max-w-md mx-auto mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Confirmation sent to</p>
            <p className="font-medium">{email}</p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex items-start gap-3">
          <Package className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">Shipping to</p>
            <p className="font-medium">
              {shippingAddress?.firstName} {shippingAddress?.lastName}
            </p>
            <p className="text-sm text-muted-foreground">
              {shippingAddress?.address1}
              {shippingAddress?.address2 && `, ${shippingAddress.address2}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {shippingAddress?.city}, {shippingAddress?.province} {shippingAddress?.zip}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <span className="font-medium text-foreground">{shippingMethod?.title}</span>
              {' - '}
              {shippingMethod?.estimatedDelivery}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Button size="lg" className="w-full max-w-md" asChild>
          <Link href="/collections/all">
            Continue Shopping
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>

        <p className="text-sm text-muted-foreground">
          Have questions?{' '}
          <Link href="/contact" className="underline hover:text-foreground">
            Contact our support team
          </Link>
        </p>
      </div>
    </div>
  );
}
