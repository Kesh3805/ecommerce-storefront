'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Heart, User, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StorefrontPublicProduct, StorefrontPublicVariant } from '@/services/storefront.service';

interface StoreProductViewProps {
  slug: string;
  product: StorefrontPublicProduct;
  countryCode?: string;
}

function isValidImage(url?: string): boolean {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.hostname !== 'example.com';
  } catch {
    return false;
  }
}

function isUnoptimizedImage(url?: string): boolean {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith('gstatic.com');
  } catch {
    return false;
  }
}

function formatCurrency(value?: string): string {
  if (!value) {
    return '$0.00';
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : `$${parsed.toFixed(2)}`;
}

function buildVariantTitle(variant: StorefrontPublicVariant): string {
  const parts = [variant.option1_value, variant.option2_value, variant.option3_value].filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : variant.title || 'Default';
}

function sanitizeDescriptionHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');
}

export function StoreProductView({ slug, product, countryCode }: StoreProductViewProps) {
  const media = useMemo(
    () => Array.from(new Set([...(product.media_urls || []), ...(product.image_url ? [product.image_url] : [])].filter(Boolean))),
    [product.media_urls, product.image_url],
  );

  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  const initialSelectedByOption = useMemo(() => {
    const firstVariant = product.variants?.[0];
    const selected: Record<string, string> = {};
    if (firstVariant && product.options) {
      product.options.forEach((option, idx) => {
        const variantValue = idx === 0 ? firstVariant.option1_value : idx === 1 ? firstVariant.option2_value : firstVariant.option3_value;
        if (variantValue) {
          selected[option.name] = variantValue;
        }
      });
    }
    return selected;
  }, [product.options, product.variants]);

  const [selectedByOption, setSelectedByOption] = useState<Record<string, string>>(initialSelectedByOption);

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return null;
    }

    const options = product.options || [];
    const hasAnySelection = options.some((option) => Boolean(selectedByOption[option.name]));
    const isSelectionComplete = options.length === 0 || options.every((option) => Boolean(selectedByOption[option.name]));

    const byOptions = product.variants.find((variant) => {
      if (options.length === 0) {
        return false;
      }

      return options.every((option, idx) => {
        const selected = selectedByOption[option.name];
        if (!selected) {
          return true;
        }
        const value = idx === 0 ? variant.option1_value : idx === 1 ? variant.option2_value : variant.option3_value;
        return value === selected;
      });
    });

    if (!isSelectionComplete && !hasAnySelection) {
      return product.variants[0];
    }

    if (isSelectionComplete && !byOptions) {
      return null;
    }

    return byOptions || product.variants[0];
  }, [product.options, product.variants, selectedByOption]);

  const hasUnavailableSelection = useMemo(() => {
    const options = product.options || [];
    if (options.length === 0) {
      return false;
    }

    const isSelectionComplete = options.every((option) => Boolean(selectedByOption[option.name]));
    return isSelectionComplete && !selectedVariant;
  }, [product.options, selectedByOption, selectedVariant]);

  const selectedImage = media[selectedMediaIndex] || product.image_url;
  const canRenderSelectedImage = isValidImage(selectedImage);
  const countryQuery = countryCode ? `?country=${countryCode}` : '';

  return (
    <div className="mx-auto max-w-[1180px] p-6">
      <div className="mb-6 flex items-center justify-between rounded-xl border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/stores/${slug}${countryQuery}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="text-sm font-medium">Storefront Preview</span>
          <span className="rounded-full border px-2 py-0.5 text-xs">ACTIVE</span>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <Search className="h-4 w-4" />
          <Heart className="h-4 w-4" />
          <User className="h-4 w-4" />
          <ShoppingBag className="h-4 w-4" />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[96px_1fr_360px]">
        <div className="space-y-2">
          {media.length > 0 ? (
            media.map((item, index) => (
              <button
                type="button"
                key={`${item}-${index}`}
                className={`h-20 w-20 overflow-hidden rounded-md border ${index === selectedMediaIndex ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedMediaIndex(index)}
              >
                {isValidImage(item) ? (
                  <Image src={item} alt={product.title} width={80} height={80} className="h-full w-full object-cover" unoptimized={isUnoptimizedImage(item)} />
                ) : (
                  <div className="h-full w-full bg-muted" />
                )}
              </button>
            ))
          ) : (
            <div className="h-20 w-20 rounded-md border bg-muted" />
          )}
        </div>

        <div className="overflow-hidden rounded-lg border bg-card">
          {canRenderSelectedImage ? (
            <Image
              src={selectedImage!}
              alt={product.title}
              width={900}
              height={900}
              className="h-full max-h-[720px] w-full object-cover"
              unoptimized={isUnoptimizedImage(selectedImage)}
              priority
            />
          ) : (
            <div className="h-full min-h-[520px] w-full bg-muted" />
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.store_name}</p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight">{product.title}</h1>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-5xl font-bold">{formatCurrency(selectedVariant?.price || product.price)}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">SKU: {selectedVariant?.sku || 'N/A'}</p>
            {hasUnavailableSelection ? (
              <p className="mt-2 text-sm font-medium text-amber-500">Selected option combination is not available.</p>
            ) : null}
          </div>

          <div className="space-y-4">
            {(product.options || []).map((option) => (
              <div key={option.name} className="space-y-2">
                <p className="text-sm font-medium">{option.name}</p>
                <div className="flex flex-wrap gap-2">
                  {option.values.map((value) => {
                    const selected = selectedByOption[option.name] === value;
                    return (
                      <Button
                        key={value}
                        type="button"
                        variant={selected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedByOption((prev) => ({ ...prev, [option.name]: value }))}
                      >
                        {value}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              Available: {hasUnavailableSelection ? 0 : (selectedVariant?.inventory_available ?? 0)}
            </div>
            <Button className="w-full" disabled={hasUnavailableSelection || (selectedVariant?.inventory_available ?? 0) <= 0}>
              {hasUnavailableSelection ? 'Unavailable combination' : (selectedVariant?.inventory_available ?? 0) > 0 ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Description</h2>
            {product.description ? (
              <div
                className="text-sm leading-7 text-foreground/90 [&_p]:mb-2 [&_em]:italic [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                dangerouslySetInnerHTML={{ __html: sanitizeDescriptionHtml(product.description) }}
              />
            ) : (
              <p className="text-sm leading-7 text-foreground/90">No description available.</p>
            )}
          </div>

          {product.variants && product.variants.length > 0 ? (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Variants</h2>
              <div className="space-y-2">
                {product.variants.map((variant) => (
                  <div key={variant.variant_id} className="rounded-md border bg-background px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span>{buildVariantTitle(variant)}</span>
                      <span className="text-muted-foreground">{formatCurrency(variant.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
