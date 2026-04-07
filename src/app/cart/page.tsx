import type { Metadata } from 'next';
import { CartPageContent } from './cart-content';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'Review your shopping cart and proceed to checkout.',
};

export default function CartPage() {
  return (
    <div className="container py-8 md:py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Shopping Cart</h1>
      <CartPageContent />
    </div>
  );
}
