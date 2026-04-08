import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { storefrontService } from '@/services/storefront.service';
import { collectionService } from '@/services/collection.service';
import { normalizeCountryCode } from '@/lib/countries';
import { normalizeMediaUrl, shouldUseUnoptimizedImage } from '@/lib/utils';

interface StorePageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ country?: string }>;
}

export const revalidate = 300;
const MAX_COLLECTION_SECTIONS = 4;
const COLLECTION_PREVIEW_PRODUCT_LIMIT = 6;

function getStoreTheme(storeName: string) {
  if (storeName.toLowerCase().includes('bob')) {
    return {
      wrapper: 'bg-slate-950 text-slate-100',
      heading: 'text-cyan-300',
      panel: 'border-cyan-500/30 bg-slate-900/70',
      accent: 'text-cyan-200',
    };
  }

  return {
    wrapper: 'bg-slate-950 text-slate-100',
    heading: 'text-cyan-300',
    panel: 'border-cyan-500/30 bg-slate-900/70',
    accent: 'text-cyan-200',
  };
}

function formatPrice(value?: string): string {
  if (!value) {
    return 'Price unavailable';
  }

  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return value;
  }

  return `$${numeric.toFixed(2)}`;
}

export default async function StorePage({ params, searchParams }: StorePageProps) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : undefined;
  const requestedCountry = normalizeCountryCode(query?.country);
  const store = await storefrontService.getPublicStoreBySlug(slug, 12, requestedCountry).catch(() => null);

  if (!store) {
    notFound();
  }

  const activeCountry = requestedCountry;
  const countryQuery = activeCountry ? `?country=${activeCountry}` : '';

  // Optimized: fetch all collections with their products in a single GraphQL request
  const collectionSections = await collectionService
    .getCollectionsWithProducts(store.store_id, COLLECTION_PREVIEW_PRODUCT_LIMIT, activeCountry, MAX_COLLECTION_SECTIONS)
    .catch(() => []);

  const theme = getStoreTheme(store.name);

  return (
    <div className={`min-h-screen ${theme.wrapper}`}>
      <div className="container py-12 md:py-16">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={`text-sm uppercase tracking-[0.2em] ${theme.accent}`}>Storefront</p>
            <h1 className={`mt-2 text-4xl font-bold md:text-5xl ${theme.heading}`}>{store.name}</h1>
            <p className="mt-3 max-w-2xl text-sm opacity-80 md:text-base">
              Dedicated visual experience for this store with a tailored palette and layout treatment.
            </p>
          </div>
          <Link href="/" className="rounded-full border px-5 py-2 text-sm hover:opacity-80">
            Back to all stores
          </Link>
        </div>

        <section className="mb-12 space-y-8">
          {collectionSections.length > 0 ? (
            collectionSections.map(({ collection, products }) => (
              <div key={collection.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight">{collection.title}</h2>
                  <Link href={`/stores/${slug}/collections/${collection.handle}${countryQuery}`} prefetch={false} className={`text-sm font-medium ${theme.accent} hover:underline`}>
                    View all
                  </Link>
                </div>

                {products.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                    {products.map((product) => {
                      const productImageUrl = normalizeMediaUrl(product.featuredImage?.url);

                      return (
                        <Link
                          key={product.id}
                          href={`/stores/${slug}/products/${product.handle}${countryQuery}`}
                          prefetch={false}
                          className={`rounded-xl border p-3 transition-transform hover:-translate-y-1 ${theme.panel}`}
                        >
                          <div className="relative aspect-square overflow-hidden rounded-lg bg-black/10">
                            {productImageUrl ? (
                              <Image
                                src={productImageUrl}
                                alt={product.featuredImage?.altText || product.title}
                                fill
                                className="object-cover"
                                sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
                                unoptimized={shouldUseUnoptimizedImage(productImageUrl)}
                              />
                            ) : (
                              <div className="absolute inset-0 bg-linear-to-br from-slate-800/20 to-slate-600/10" />
                            )}
                          </div>
                          <h3 className="mt-3 line-clamp-2 text-sm font-semibold">{product.title}</h3>
                          <p className={`mt-1 text-sm ${theme.accent}`}>{formatPrice(product.priceRange.minPrice.amount)}</p>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm opacity-80">No products available in this collection.</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm opacity-80">No visible collections for this store.</p>
          )}
        </section>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {store.products.map((product) => {
            const productImageUrl = normalizeMediaUrl(product.image_url);

            return (
              <Link key={product.product_id} href={`/stores/${slug}/products/${product.handle}${countryQuery}`} prefetch={false} className={`rounded-2xl border p-4 transition-transform hover:-translate-y-1 ${theme.panel}`}>
                <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-black/10">
                  {productImageUrl ? (
                    <Image
                      src={productImageUrl}
                      alt={product.title}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      unoptimized={shouldUseUnoptimizedImage(productImageUrl)}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-slate-800/30 to-slate-600/20" />
                  )}
                </div>
                <p className="mt-4 text-xs uppercase tracking-wide opacity-70">{product.brand || 'Brand'}</p>
                <h2 className="mt-1 line-clamp-2 text-lg font-semibold">{product.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm opacity-80">{product.description || 'No product description available.'}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <p className={theme.accent}>{formatPrice(product.price)}</p>
                  <p className="opacity-70">{product.variants?.length ?? 0} variants</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
