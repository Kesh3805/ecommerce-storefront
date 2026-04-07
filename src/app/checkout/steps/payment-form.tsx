'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CreditCard, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  useCheckoutStore,
  useCheckoutActions,
  useShippingAddress,
  useShippingMethod,
  useCheckoutEmail,
} from '@/stores/checkout.store';
import { useCartActions } from '@/stores/cart.store';
import { formatMoney } from '@/lib/utils';
import { cn } from '@/lib/utils';

const paymentSchema = z.object({
  cardNumber: z.string().min(13, 'Invalid card number').max(19),
  cardName: z.string().min(1, 'Name on card is required'),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, 'Invalid expiry (MM/YY)'),
  cvc: z.string().min(3, 'Invalid CVC').max(4),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export function PaymentForm() {
  const email = useCheckoutEmail();
  const shippingAddress = useShippingAddress();
  const shippingMethod = useShippingMethod();
  const { setPaymentMethod, setOrderResult, nextStep, prevStep, setProcessing } = useCheckoutActions();
  const { clearCart } = useCartActions();
  
  const [isProcessing, setIsProcessingLocal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
  });

  // Mock order calculation
  const subtotal = 100; // Placeholder
  const shippingCost = parseFloat(shippingMethod?.price.amount || '0');
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shippingCost + tax;

  const onSubmit = async (data: PaymentFormData) => {
    setIsProcessingLocal(true);
    setProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Extract last 4 digits
      const last4 = data.cardNumber.replace(/\s/g, '').slice(-4);

      setPaymentMethod({
        type: 'card',
        last4,
        brand: 'Visa', // Would be detected from card number
      });

      // Generate mock order
      const orderId = `order_${Date.now()}`;
      const orderNumber = `#${Math.floor(10000 + Math.random() * 90000)}`;
      
      setOrderResult(orderId, orderNumber);
      
      // Clear the cart after successful order
      clearCart();
      
      nextStep();
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsProcessingLocal(false);
      setProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Payment</h2>
        
        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping ({shippingMethod?.title})</span>
              <span>
                {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Summary */}
        <div className="text-sm text-muted-foreground mb-6">
          <p>
            <span className="font-medium text-foreground">Ship to:</span>{' '}
            {shippingAddress?.firstName} {shippingAddress?.lastName},{' '}
            {shippingAddress?.address1}, {shippingAddress?.city},{' '}
            {shippingAddress?.province} {shippingAddress?.zip}
          </p>
          <p className="mt-1">
            <span className="font-medium text-foreground">Contact:</span> {email}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>Your payment information is secure and encrypted</span>
        </div>

        <div>
          <Label htmlFor="cardNumber">Card Number *</Label>
          <div className="relative mt-1">
            <Input
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              {...register('cardNumber')}
              onChange={(e) => {
                e.target.value = formatCardNumber(e.target.value);
              }}
              maxLength={19}
            />
            <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          {errors.cardNumber && (
            <p className="text-sm text-destructive mt-1">{errors.cardNumber.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="cardName">Name on Card *</Label>
          <Input
            id="cardName"
            placeholder="John Doe"
            {...register('cardName')}
            className="mt-1"
          />
          {errors.cardName && (
            <p className="text-sm text-destructive mt-1">{errors.cardName.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="expiry">Expiry Date *</Label>
            <Input
              id="expiry"
              placeholder="MM/YY"
              {...register('expiry')}
              className="mt-1"
              maxLength={5}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                  value = value.slice(0, 2) + '/' + value.slice(2, 4);
                }
                e.target.value = value;
              }}
            />
            {errors.expiry && (
              <p className="text-sm text-destructive mt-1">{errors.expiry.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="cvc">CVC *</Label>
            <Input
              id="cvc"
              placeholder="123"
              {...register('cvc')}
              className="mt-1"
              maxLength={4}
            />
            {errors.cvc && (
              <p className="text-sm text-destructive mt-1">{errors.cvc.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={prevStep}
          disabled={isProcessing}
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
        <Button
          type="submit"
          size="lg"
          className="flex-1"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="mr-2 h-5 w-5" />
              Pay ${total.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
