import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Truck, Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { storefrontService } from '@/services/storefront.service';

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;

export default async function HomePage() {
  const publicStores = await storefrontService.getPublicStores(6, 8).catch(() => []);

  const formatCurrency = (value?: string): string | null => {
    if (!value) {
      return null;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return value;
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(parsed);
  };

  const shouldUseNativeImage = (imageUrl?: string): boolean => {
    if (!imageUrl) {
      return false;
    }

    try {
      const parsed = new URL(imageUrl);
      return parsed.hostname.endsWith('gstatic.com');
    } catch {
      return false;
    }
  };

  const shouldRenderProductImage = (imageUrl?: string): boolean => {
    if (!imageUrl) {
      return false;
    }

    try {
      const parsed = new URL(imageUrl);
      // Seed data often points to example.com placeholders that break UX.
      return parsed.hostname !== 'example.com';
    } catch {
      return false;
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white">
        <div className="absolute inset-0 overflow-hidden bg-linear-to-br from-gray-900 via-slate-800 to-gray-950">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        </div>
        <div className="relative container py-24 md:py-32 lg:py-40">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              New Season Arrivals
            </h1>
            <p className="mt-6 text-lg text-gray-300 max-w-xl">
              Discover our latest collection of premium products. Quality craftsmanship
              meets modern design.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="xl" asChild>
                <Link href="/collections/new-arrivals">
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-gray-900" asChild>
                <Link href="/collections/all">Browse All</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="border-b bg-gray-50">
        <div className="container py-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex items-center justify-center gap-3 text-center sm:text-left">
              <Truck className="h-8 w-8 shrink-0 text-primary" />
              <div>
                <h3 className="font-medium">Free Shipping</h3>
                <p className="text-sm text-muted-foreground">On orders over $50</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 text-center sm:text-left">
              <Shield className="h-8 w-8 shrink-0 text-primary" />
              <div>
                <h3 className="font-medium">Secure Payment</h3>
                <p className="text-sm text-muted-foreground">100% secure checkout</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 text-center sm:text-left">
              <RefreshCw className="h-8 w-8 shrink-0 text-primary" />
              <div>
                <h3 className="font-medium">Easy Returns</h3>
                <p className="text-sm text-muted-foreground">30-day return policy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Storefront Stores + Products */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Stores & Products</h2>
            <p className="mt-2 text-muted-foreground">
              Explore active products grouped by store.
            </p>
          </div>

          {publicStores.length > 0 ? (
            <div className="space-y-10">
              {publicStores.map((store) => (
                <div key={store.store_id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold tracking-tight">{store.name}</h3>
                    <span className="text-sm text-muted-foreground">{store.products.length} products</span>
                  </div>

                  {store.products.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {store.products.map((product) => (
                        <Link
                          key={product.product_id}
                          href={`/products/${product.handle}`}
                          className="group rounded-lg border bg-card p-3 transition-colors hover:border-primary/50"
                        >
                          <div className="relative mb-3 aspect-4/3 overflow-hidden rounded-md bg-muted">
                            {shouldRenderProductImage(product.image_url) ? (
                              shouldUseNativeImage(product.image_url) ? (
                                // gstatic shopping URLs are often blocked by the Next image optimizer.
                                <img
                                  src={product.image_url}
                                  alt={product.title}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <Image
                                  src={product.image_url!}
                                  alt={product.title}
                                  fill
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                                />
                              )
                            ) : (
                              <div className="absolute inset-0 bg-linear-to-br from-gray-200 to-gray-300" />
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground">{product.brand || 'Unbranded'}</p>
                          <h4 className="mt-1 line-clamp-2 font-medium leading-snug">{product.title}</h4>
                          {product.price ? (
                            <p className="mt-2 text-sm font-semibold">{formatCurrency(product.price) ?? product.price}</p>
                          ) : null}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No active products available for this store.</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No stores or products available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Promotion Banner */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-primary to-primary/80 px-8 py-16 md:px-16 md:py-24">
            <div className="relative z-10 max-w-xl">
              <p className="text-sm font-semibold text-primary-foreground/80 uppercase tracking-wide">
                Limited Time Offer
              </p>
              <h2 className="mt-2 text-3xl font-bold text-white md:text-4xl">
                Get 20% Off Your First Order
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/90">
                Sign up for our newsletter and receive an exclusive discount code
                for your first purchase.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="h-12 w-full rounded-md bg-white px-4 text-gray-900 placeholder:text-gray-500 sm:w-auto sm:min-w-70"
                />
                <Button size="lg" variant="secondary">
                  Subscribe
                </Button>
              </div>
            </div>
            {/* Decorative circles */}
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10" />
            <div className="absolute -right-10 -bottom-10 h-60 w-60 rounded-full bg-white/10" />
          </div>
        </div>
      </section>
    </div>
  );
}
