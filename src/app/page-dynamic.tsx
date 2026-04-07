/**
 * Dynamic Homepage using Merchandising API
 * This page fetches the homepage configuration from the backend
 * and renders sections dynamically based on the configuration
 */

import { merchandisingService, storefrontService } from '@/services';
import { HeroBanner } from '@/components/HeroBanner';
import { ProductCarousel } from '@/components/ProductCarousel';
import { ArrowRight, Truck, Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;

export default async function DynamicHomePage() {
  // Get homepage configuration (try store ID 1, fallback to old approach)
  const homepage = await merchandisingService.getHomepage(1).catch(() => null);
  
  // Fallback: get stores if homepage not configured
  const publicStores = !homepage 
    ? await storefrontService.getPublicStores(6, 8).catch(() => [])
    : [];

  return (
    <div className="flex flex-col">
      {/* Render homepage sections dynamically if configured */}
      {homepage ? (
        <>
          {homepage.sections
            .filter((section) => section.is_visible)
            .sort((a, b) => a.position - b.position)
            .map((section) => {
              switch (section.section_type) {
                case 'HERO_BANNER':
                  return section.banners && section.banners.length > 0 ? (
                    <HeroBanner key={section.section_id} banners={section.banners} />
                  ) : null;

                case 'PRODUCT_CAROUSEL':
                  return section.products && section.products.length > 0 ? (
                    <ProductCarousel
                      key={section.section_id}
                      title={section.title}
                      products={section.products}
                    />
                  ) : null;

                case 'COLLECTION_CAROUSEL':
                  return section.collections && section.collections.length > 0 ? (
                    <CollectionCarouselSection
                      key={section.section_id}
                      title={section.title}
                      collections={section.collections}
                    />
                  ) : null;

                case 'CATEGORY_GRID':
                  return section.categories && section.categories.length > 0 ? (
                    <CategoryGridSection
                      key={section.section_id}
                      title={section.title}
                      categories={section.categories}
                    />
                  ) : null;

                default:
                  return null;
              }
            })}
        </>
      ) : (
        /* Fallback: Static Hero if homepage not configured */
        <>
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

          {/* Stores Section (Fallback) */}
          {publicStores.length > 0 && (
            <section className="py-16 md:py-24">
              <div className="container">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold tracking-tight">Stores & Products</h2>
                  <p className="mt-2 text-muted-foreground">
                    Explore active products grouped by store.
                  </p>
                </div>
                {/* Store products rendering would go here */}
              </div>
            </section>
          )}
        </>
      )}

      {/* Features Bar (Always visible) */}
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
    </div>
  );
}

// Collection Carousel Section Component
function CollectionCarouselSection({ title, collections }: any) {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        {title && <h2 className="text-3xl font-bold text-gray-900 mb-8">{title}</h2>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection: any) => (
            <Link
              key={collection.collection_id}
              href={`/collections/${collection.slug}`}
              className="group relative aspect-square rounded-lg overflow-hidden"
            >
              {collection.image_url ? (
                <img
                  src={collection.image_url}
                  alt={collection.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600" />
              )}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                <h3 className="text-2xl font-bold mb-2">{collection.name}</h3>
                {collection.description && (
                  <p className="text-sm text-center line-clamp-2">{collection.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Category Grid Section Component
function CategoryGridSection({ title, categories }: any) {
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        {title && <h2 className="text-3xl font-bold text-gray-900 mb-8">{title}</h2>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category: any) => (
            <Link
              key={category.category_id}
              href={`/categories/${category.slug}`}
              className="group relative aspect-square rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {category.image_url ? (
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="font-semibold">{category.name}</h3>
                <p className="text-sm text-gray-200">{category.product_count} products</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
