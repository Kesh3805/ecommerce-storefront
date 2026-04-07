import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Truck, Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/features/products/components';
import { productService } from '@/services/product.service';
import { collectionService } from '@/services/collection.service';

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;

export default async function HomePage() {
  // Fetch data in parallel
  const [featuredProducts, collections] = await Promise.all([
    productService.getFeaturedProducts(8).catch(() => []),
    collectionService.getCollections(6).catch(() => []),
  ]);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/hero-bg.jpg"
            alt="Hero background"
            fill
            className="object-cover opacity-50"
            priority
          />
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
              <Truck className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-medium">Free Shipping</h3>
                <p className="text-sm text-muted-foreground">On orders over $50</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 text-center sm:text-left">
              <Shield className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-medium">Secure Payment</h3>
                <p className="text-sm text-muted-foreground">100% secure checkout</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 text-center sm:text-left">
              <RefreshCw className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-medium">Easy Returns</h3>
                <p className="text-sm text-muted-foreground">30-day return policy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Best Sellers</h2>
              <p className="mt-2 text-muted-foreground">
                Our most popular products based on sales
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/collections/best-sellers">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {featuredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 4}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No products available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Collections Grid */}
      {collections.length > 0 && (
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight">Shop by Category</h2>
              <p className="mt-2 text-muted-foreground">
                Browse our curated collections
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {collections.slice(0, 6).map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.handle}`}
                  className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-200"
                >
                  {collection.image ? (
                    <Image
                      src={collection.image.url}
                      alt={collection.image.altText || collection.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400" />
                  )}
                  <div className="absolute inset-0 bg-black/30 transition-opacity group-hover:bg-black/40" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h3 className="text-xl font-semibold text-white">
                      {collection.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Promotion Banner */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-8 py-16 md:px-16 md:py-24">
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
                  className="h-12 px-4 rounded-md bg-white text-gray-900 placeholder:text-gray-500 w-full sm:w-auto sm:min-w-[280px]"
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
