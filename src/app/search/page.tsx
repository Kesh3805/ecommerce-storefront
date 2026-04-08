import { ProductCard } from '@/features/products/components/product-card';
import { normalizeCountryCode } from '@/lib/countries';
import { storefrontService, type StorefrontPublicProduct, type StorefrontPublicVariant } from '@/services/storefront.service';
import type { Product, ProductVariant } from '@/types';

type SearchPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function slugifyStoreName(name: string): string {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toMoneyAmount(value?: string): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '0.00';
  }

  return numeric.toFixed(2);
}

function toProductVariant(variant: StorefrontPublicVariant): ProductVariant {
  const selectedOptions = [
    variant.option1_value ? { name: 'Option 1', value: variant.option1_value } : null,
    variant.option2_value ? { name: 'Option 2', value: variant.option2_value } : null,
    variant.option3_value ? { name: 'Option 3', value: variant.option3_value } : null,
  ].filter((option): option is { name: string; value: string } => Boolean(option));

  return {
    id: String(variant.variant_id),
    sku: variant.sku || '',
    title: variant.title || 'Default',
    price: {
      amount: toMoneyAmount(variant.price),
      currencyCode: 'USD',
    },
    compareAtPrice: variant.compare_at_price
      ? {
          amount: toMoneyAmount(variant.compare_at_price),
          currencyCode: 'USD',
        }
      : undefined,
    availableForSale: variant.inventory_available == null ? true : variant.inventory_available > 0,
    quantityAvailable: variant.inventory_available ?? 999,
    selectedOptions,
  };
}

function toProductCardModel(product: StorefrontPublicProduct): Product {
  const imageUrls = [...new Set([product.image_url, ...(product.media_urls || [])].filter((url): url is string => Boolean(url)))];
  const variants = (product.variants || []).map((variant) => toProductVariant(variant));

  if (variants.length === 0) {
    variants.push({
      id: `variant-${product.product_id}`,
      sku: '',
      title: 'Default',
      price: {
        amount: toMoneyAmount(product.price),
        currencyCode: 'USD',
      },
      compareAtPrice: product.compare_at_price
        ? {
            amount: toMoneyAmount(product.compare_at_price),
            currencyCode: 'USD',
          }
        : undefined,
      availableForSale: true,
      quantityAvailable: 999,
      selectedOptions: [],
    });
  }

  const priceValues = variants.map((variant) => Number(variant.price.amount || 0));
  const compareValues = variants
    .map((variant) => Number(variant.compareAtPrice?.amount || 0))
    .filter((value) => Number.isFinite(value) && value > 0);

  return {
    id: String(product.product_id),
    handle: product.handle,
    title: product.title,
    description: product.description || '',
    shortDescription: product.description || '',
    status: 'ACTIVE',
    vendor: product.brand || product.store_name,
    productType: 'Search',
    tags: [],
    featuredImage: imageUrls[0]
      ? {
          id: `image-${product.product_id}`,
          url: imageUrls[0],
          altText: product.title,
        }
      : undefined,
    images: imageUrls.map((url, index) => ({
      id: `image-${product.product_id}-${index}`,
      url,
      altText: product.title,
    })),
    variants,
    options: (product.options || []).map((option, index) => ({
      id: `option-${product.product_id}-${index}`,
      name: option.name,
      values: option.values || [],
    })),
    priceRange: {
      minPrice: {
        amount: toMoneyAmount(String(Math.min(...priceValues))),
        currencyCode: 'USD',
      },
      maxPrice: {
        amount: toMoneyAmount(String(Math.max(...priceValues))),
        currencyCode: 'USD',
      },
    },
    compareAtPriceRange:
      compareValues.length > 0
        ? {
            minPrice: {
              amount: toMoneyAmount(String(Math.min(...compareValues))),
              currencyCode: 'USD',
            },
            maxPrice: {
              amount: toMoneyAmount(String(Math.max(...compareValues))),
              currencyCode: 'USD',
            },
          }
        : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function buildStoreScopedProductHref(product: StorefrontPublicProduct, countryCode?: string): string {
  const storeSlug = slugifyStoreName(product.store_name);
  const basePath = storeSlug
    ? `/stores/${encodeURIComponent(storeSlug)}/products/${encodeURIComponent(product.handle)}`
    : `/products/${encodeURIComponent(product.handle)}`;

  if (!countryCode) {
    return basePath;
  }

  const params = new URLSearchParams();
  params.set('country', countryCode);
  return `${basePath}?${params.toString()}`;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = (firstParam(resolvedSearchParams.q) || '').trim();
  const countryCode = normalizeCountryCode(firstParam(resolvedSearchParams.country));
  const storeSlug = firstParam(resolvedSearchParams.storeSlug);
  const storeIdRaw = firstParam(resolvedSearchParams.storeId);
  const storeId = storeIdRaw && Number.isInteger(Number(storeIdRaw)) ? Number(storeIdRaw) : undefined;

  const products = query.length >= 2
    ? await storefrontService.searchPublicProducts(query, {
        limit: 48,
        countryCode: countryCode || undefined,
        storeSlug: storeSlug || undefined,
        storeId,
      })
    : [];

  const cards = products.map((product) => toProductCardModel(product));

  return (
    <div className="container py-10 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Search Products</h1>
        {query.length >= 2 ? (
          <p className="text-muted-foreground">
            {cards.length} result{cards.length === 1 ? '' : 's'} for &quot;{query}&quot;.
          </p>
        ) : (
          <p className="text-muted-foreground">Enter at least 2 characters in the header search box to find products.</p>
        )}
      </div>

      {query.length >= 2 && cards.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No products matched &quot;{query}&quot;.
        </div>
      )}

      {cards.length > 0 && (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {cards.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 4}
              productHref={buildStoreScopedProductHref(products[index], countryCode || undefined)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
