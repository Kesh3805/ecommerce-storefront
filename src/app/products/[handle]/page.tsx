import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Store, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { storefrontService } from '@/services/storefront.service';

interface ProductPageProps {
  params: Promise<{ handle: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { handle } = await params;

  try {
    const product = await storefrontService.getPublicProductByHandle(handle);

    if (!product) {
      return {
        title: 'Product Not Found',
      };
    }

    return {
      title: product.title,
      description: product.description?.slice(0, 160) || `Explore ${product.title} from ${product.store_name}.`,
      openGraph: {
        title: product.title,
        description: product.description?.slice(0, 160) || `Explore ${product.title} from ${product.store_name}.`,
        images: product.image_url ? [product.image_url] : undefined,
        type: 'website',
      },
    };
  } catch {
    return {
      title: 'Product',
    };
  }
}

// Enable ISR
export const revalidate = 3600; // 1 hour

function sanitizeDescriptionHtml(html: string): string {
  // Keep rich-text formatting but strip obvious script injection vectors.
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params;

  const [product, stores] = await Promise.all([
    storefrontService.getPublicProductByHandle(handle).catch(() => null),
    storefrontService.getPublicStores(12, 12).catch(() => []),
  ]);

  if (!product) {
    notFound();
  }

  const relatedProducts = stores
    .find((store) => store.store_id === product.store_id)
    ?.products.filter((item) => item.handle !== product.handle)
    .slice(0, 4) ?? [];

  const canRenderImage = (() => {
    if (!product.image_url) {
      return false;
    }

    try {
      const parsed = new URL(product.image_url);
      return parsed.hostname !== 'example.com';
    } catch {
      return false;
    }
  })();

  const shouldUseNativeImage = (() => {
    if (!product.image_url) {
      return false;
    }

    try {
      const parsed = new URL(product.image_url);
      return parsed.hostname.endsWith('gstatic.com');
    } catch {
      return false;
    }
  })();

  const galleryMedia = Array.from(
    new Set([
      ...(product.media_urls ?? []),
      ...(product.image_url ? [product.image_url] : []),
    ].filter(Boolean)),
  );

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

  const productPrice = formatCurrency(product.price);
  const productCompareAtPrice = formatCurrency(product.compare_at_price);
  const productOptions = product.options ?? [];
  const productVariants = product.variants ?? [];

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Storefront
          </Link>
        </Button>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div className="relative min-h-85 overflow-hidden rounded-2xl border bg-muted">
          {canRenderImage ? (
            shouldUseNativeImage ? (
              // gstatic shopping URLs can fail through the Next optimizer.
              <img
                src={product.image_url}
                alt={product.title}
                className="h-full w-full object-cover"
                loading="eager"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Image
                src={product.image_url!}
                alt={product.title}
                fill
                className="object-cover"
                priority
              />
            )
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-gray-200 to-gray-300" />
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <Store className="h-3.5 w-3.5" />
              {product.store_name}
            </p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{product.title}</h1>
            {product.brand ? (
              <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="h-4 w-4" />
                {product.brand}
              </p>
            ) : null}
            {productPrice ? (
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-semibold tracking-tight">{productPrice}</p>
                {productCompareAtPrice ? (
                  <p className="text-base text-muted-foreground line-through">{productCompareAtPrice}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Product Details</h2>
            {product.description ? (
              <div
                className="text-sm leading-7 text-foreground/90 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                dangerouslySetInnerHTML={{ __html: sanitizeDescriptionHtml(product.description) }}
              />
            ) : (
              <p className="text-sm leading-7 text-foreground/90">
                No detailed description is available for this item yet.
              </p>
            )}
          </div>

          {productOptions.length > 0 ? (
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Options</h2>
              <div className="space-y-3">
                {productOptions.map((option) => (
                  <div key={option.name}>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{option.name}</p>
                    <p className="mt-1 text-sm text-foreground/90">{option.values.join(' | ')}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {productVariants.length > 0 ? (
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Variants</h2>
              <div className="space-y-2">
                {productVariants.map((variant) => {
                  const variantPrice = formatCurrency(variant.price);
                  const variantCompareAtPrice = formatCurrency(variant.compare_at_price);
                  const hasInventory = variant.inventory_available == null || variant.inventory_available > 0;

                  return (
                    <div key={variant.variant_id} className="rounded-md border bg-background px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{variant.title}</p>
                        <p className={`text-xs font-medium ${hasInventory ? 'text-green-700' : 'text-amber-700'}`}>
                          {hasInventory
                            ? variant.inventory_available != null
                              ? `${variant.inventory_available} in stock`
                              : 'In stock'
                            : 'Out of stock'}
                        </p>
                      </div>
                      {(variantPrice || variantCompareAtPrice) ? (
                        <p className="mt-1 text-sm text-foreground/80">
                          {variantPrice ?? 'Price unavailable'}
                          {variantCompareAtPrice ? <span className="ml-2 text-muted-foreground line-through">{variantCompareAtPrice}</span> : null}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/collections/all">Browse All Products</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/collections/all">
                View Collection
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {galleryMedia.length > 1 ? (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Media Gallery</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {galleryMedia.map((mediaUrl, index) => {
              let isValidImage = false;
              let useNativeImage = false;

              try {
                const parsed = new URL(mediaUrl);
                isValidImage = parsed.hostname !== 'example.com';
                useNativeImage = parsed.hostname.endsWith('gstatic.com');
              } catch {
                isValidImage = false;
              }

              return (
                <div key={`${mediaUrl}-${index}`} className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                  {isValidImage ? (
                    useNativeImage ? (
                      <img
                        src={mediaUrl}
                        alt={`${product.title} media ${index + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Image
                        src={mediaUrl}
                        alt={`${product.title} media ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                      />
                    )
                  ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-gray-200 to-gray-300" />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {relatedProducts.length > 0 ? (
        <section className="mt-16 md:mt-20">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">More from {product.store_name}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((item) => {
              const showRelatedImage = (() => {
                if (!item.image_url) {
                  return false;
                }

                try {
                  const parsed = new URL(item.image_url);
                  return parsed.hostname !== 'example.com';
                } catch {
                  return false;
                }
              })();

              return (
                <Link
                  key={item.product_id}
                  href={`/products/${item.handle}`}
                  className="group rounded-lg border bg-card p-3 transition-colors hover:border-primary/50"
                >
                  <div className="relative mb-3 aspect-4/3 overflow-hidden rounded-md bg-muted">
                    {showRelatedImage ? (
                      (() => {
                        try {
                          const parsed = new URL(item.image_url!);
                          const useNativeImage = parsed.hostname.endsWith('gstatic.com');
                          return useNativeImage ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Image
                              src={item.image_url!}
                              alt={item.title}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                            />
                          );
                        } catch {
                          return null;
                        }
                      })()
                    ) : (
                      <div className="absolute inset-0 bg-linear-to-br from-gray-200 to-gray-300" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.brand || 'Unbranded'}</p>
                  <h3 className="mt-1 line-clamp-2 font-medium leading-snug">{item.title}</h3>
                  {item.price ? (
                    <p className="mt-2 text-sm font-semibold">{formatCurrency(item.price) ?? item.price}</p>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
