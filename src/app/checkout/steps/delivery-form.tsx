'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Truck, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  useCheckoutActions,
  useShippingAddress,
  useShippingMethod,
} from '@/stores/checkout.store';
import { cn } from '@/lib/utils';
import type { ShippingMethod } from '@/types';

const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'standard',
    title: 'Standard Shipping',
    description: 'Delivered in 5-7 business days',
    price: { amount: '4.99', currencyCode: 'USD' },
    estimatedDelivery: '5-7 business days',
  },
  {
    id: 'express',
    title: 'Express Shipping',
    description: 'Delivered in 2-3 business days',
    price: { amount: '12.99', currencyCode: 'USD' },
    estimatedDelivery: '2-3 business days',
  },
  {
    id: 'overnight',
    title: 'Overnight Shipping',
    description: 'Delivered next business day',
    price: { amount: '24.99', currencyCode: 'USD' },
    estimatedDelivery: 'Next business day',
  },
];

const FREE_SHIPPING_THRESHOLD = 50;

export function DeliveryForm() {
  const shippingAddress = useShippingAddress();
  const currentMethod = useShippingMethod();
  const { setShippingMethod, nextStep, prevStep, setAvailableShippingMethods } = useCheckoutActions();
  
  const [selectedMethodId, setSelectedMethodId] = useState(
    currentMethod?.id || SHIPPING_METHODS[0].id
  );

  // In a real app, you'd calculate this from the cart
  const subtotal = 100; // Placeholder
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  const handleContinue = () => {
    const method = SHIPPING_METHODS.find((m) => m.id === selectedMethodId);
    if (method) {
      // Apply free shipping if applicable
      const finalMethod = isFreeShipping && method.id === 'standard'
        ? { ...method, price: { amount: '0', currencyCode: 'USD' } }
        : method;
      
      setShippingMethod(finalMethod);
      setAvailableShippingMethods(SHIPPING_METHODS);
      nextStep();
    }
  };

  const getIcon = (id: string) => {
    switch (id) {
      case 'standard':
        return <Truck className="h-5 w-5" />;
      case 'express':
        return <Clock className="h-5 w-5" />;
      case 'overnight':
        return <Zap className="h-5 w-5" />;
      default:
        return <Truck className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Delivery Method</h2>
        {shippingAddress && (
          <p className="text-sm text-muted-foreground">
            Shipping to {shippingAddress.city}, {shippingAddress.province} {shippingAddress.zip}
          </p>
        )}
      </div>

      {isFreeShipping && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800 font-medium">
            🎉 You qualify for free standard shipping!
          </p>
        </div>
      )}

      <div className="space-y-3">
        {SHIPPING_METHODS.map((method) => {
          const isSelected = selectedMethodId === method.id;
          const isFree = isFreeShipping && method.id === 'standard';
          const displayPrice = isFree ? 'FREE' : `$${method.price.amount}`;

          return (
            <label
              key={method.id}
              className={cn(
                'flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <input
                type="radio"
                name="shippingMethod"
                value={method.id}
                checked={isSelected}
                onChange={() => setSelectedMethodId(method.id)}
                className="sr-only"
              />
              <div
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full border-2',
                  isSelected ? 'border-primary' : 'border-gray-300'
                )}
              >
                {isSelected && (
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                )}
              </div>
              <div className="flex-shrink-0 text-muted-foreground">
                {getIcon(method.id)}
              </div>
              <div className="flex-1">
                <p className="font-medium">{method.title}</p>
                <p className="text-sm text-muted-foreground">
                  {method.description}
                </p>
              </div>
              <div className="text-right">
                <p className={cn(
                  'font-medium',
                  isFree && 'text-green-600'
                )}>
                  {displayPrice}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={prevStep}
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1"
          onClick={handleContinue}
        >
          Continue to Payment
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
