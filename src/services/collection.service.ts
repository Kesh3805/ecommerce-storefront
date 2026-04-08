import { getGraphQLClient } from '@/lib/graphql/client';
import { gql } from 'graphql-request';
import type { Collection, ProductConnection, ProductSortKey, FilterInput, SearchFilter, Product } from '@/types';
import { normalizeMediaUrl } from '@/lib/utils';
import { storefrontService } from './storefront.service';

const COLLECTION_CACHE_TTL_MS = 60_000;

type TimedCollectionCacheEntry = {
  expiresAt: number;
  value: CollectionWithProducts | null;
};

const collectionByHandleCache = new Map<string, TimedCollectionCacheEntry>();
const collectionStoreResolutionCache = new Map<string, { expiresAt: number; storeId: number | null }>();
let supportsCollectionProductsCountryCodeArgument: boolean | null = null;

// Queries for our custom backend
const GET_COLLECTION_BY_SLUG = gql`
  query GetCollectionBySlug($slug: String!, $storeId: Int!, $productLimit: Int!, $countryCode: String) {
    collectionBySlug(slug: $slug, storeId: $storeId) {
      collection_id
      name
      slug
      description
      image_url
      collection_type
      is_visible
      meta_title
      meta_description
      products(limit: $productLimit, countryCode: $countryCode) {
        product_id
        title
        status
        description
        brand
        created_at
        updated_at
        categories {
          category_id
          name
          slug
        }
        variants {
          variant_id
          sku
          option1_value
          option2_value
          option3_value
          price
          compare_at_price
        }
        options {
          option_id
          name
          values {
            value_id
            value
            position
          }
        }
        seo {
          handle
          og_image
        }
      }
    }
  }
`;

const GET_COLLECTION_BY_SLUG_LEGACY = gql`
  query GetCollectionBySlugLegacy($slug: String!, $storeId: Int!, $productLimit: Int!) {
    collectionBySlug(slug: $slug, storeId: $storeId) {
      collection_id
      name
      slug
      description
      image_url
      collection_type
      is_visible
      meta_title
      meta_description
      products(limit: $productLimit) {
        product_id
        title
        status
        description
        brand
        created_at
        updated_at
        categories {
          category_id
          name
          slug
        }
        variants {
          variant_id
          sku
          option1_value
          option2_value
          option3_value
          price
          compare_at_price
        }
        options {
          option_id
          name
          values {
            value_id
            value
            position
          }
        }
        seo {
          handle
          og_image
        }
      }
    }
  }
`;
const GET_ALL_COLLECTIONS = gql`
  query GetCollections($filter: CollectionFilterInput) {
    collections(filter: $filter) {
      collection_id
      store_id
      name
      slug
      description
      image_url
      collection_type
      is_visible
    }
  }
`;

// Optimized query that fetches collections with products in a single request
const GET_COLLECTIONS_WITH_PRODUCTS = gql`
  query GetCollectionsWithProducts($filter: CollectionFilterInput, $productLimit: Int!, $countryCode: String) {
    collections(filter: $filter) {
      collection_id
      store_id
      name
      slug
      description
      image_url
      collection_type
      is_visible
      products(limit: $productLimit, countryCode: $countryCode) {
        product_id
        title
        status
        brand
        variants {
          variant_id
          price
          compare_at_price
        }
        seo {
          handle
          og_image
        }
      }
    }
  }
`;

interface GetCollectionParams {
  handle: string;
  storeId?: number;
  countryCode?: string;
  first?: number;
  page?: number;
  sortKey?: ProductSortKey;
  reverse?: boolean;
  filters?: FilterInput[];
}

interface BackendCategory {
  category_id: number;
  name: string;
  slug: string;
}

interface BackendVariant {
  variant_id: number;
  sku?: string;
  option1_value?: string;
  option2_value?: string;
  option3_value?: string;
  price?: number;
  compare_at_price?: number;
}

interface BackendOptionValue {
  value_id: number;
  value: string;
  position: number;
}

interface BackendOption {
  option_id: number;
  name: string;
  values?: BackendOptionValue[];
}

interface BackendSeo {
  handle?: string;
  og_image?: string;
}

interface BackendProduct {
  product_id: number;
  title: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  description?: string;
  brand?: string;
  created_at?: string;
  updated_at?: string;
  categories?: BackendCategory[];
  variants?: BackendVariant[];
  options?: BackendOption[];
  seo?: BackendSeo;
}

interface BackendCollection {
  collection_id: number;
  store_id?: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  product_count?: number;
  meta_title?: string;
  meta_description?: string;
  products?: BackendProduct[];
}

type TransformedProduct = NonNullable<ProductConnection['edges'][number]>['node'] & {
  _categorySlugs: string[];
  _brand: string;
};

function normalizeSortValue(value?: ProductSortKey): ProductSortKey {
  if (!value) {
    return 'BEST_SELLING';
  }

  const supported: ProductSortKey[] = ['BEST_SELLING', 'CREATED_AT', 'PRICE', 'TITLE', 'RELEVANCE'];
  if (supported.includes(value)) {
    return value;
  }

  return 'BEST_SELLING';
}

function extractCategorySlug(filter: FilterInput): string | undefined {
  const candidate = (filter as FilterInput & { category?: string }).category;
  return typeof candidate === 'string' ? candidate : undefined;
}

function buildVariantTitle(variant: BackendVariant): string {
  const parts = [variant.option1_value, variant.option2_value, variant.option3_value].filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : 'Default';
}


function hasUnknownCollectionProductsCountryCodeArgumentError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes('Unknown argument "countryCode" on field "Collection.products"')
    || error.message.includes("Unknown argument 'countryCode' on field 'Collection.products'");
}
function buildSearchFilters(products: BackendProduct[]): SearchFilter[] {
  const brandCounts = new Map<string, number>();
  const categoryCounts = new Map<string, { count: number; label: string }>();

  for (const product of products) {
    if (product.brand) {
      brandCounts.set(product.brand, (brandCounts.get(product.brand) || 0) + 1);
    }

    for (const category of product.categories || []) {
      const current = categoryCounts.get(category.slug) || { count: 0, label: category.name };
      current.count += 1;
      categoryCounts.set(category.slug, current);
    }
  }

  const filters: SearchFilter[] = [];

  if (brandCounts.size > 0) {
    filters.push({
      id: 'vendor',
      label: 'Brand',
      type: 'list',
      values: Array.from(brandCounts.entries())
        .map(([brand, count]) => ({
          id: `brand-${brand}`,
          label: brand,
          count,
          input: brand,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    });
  }

  if (categoryCounts.size > 0) {
    filters.push({
      id: 'category',
      label: 'Category',
      type: 'list',
      values: Array.from(categoryCounts.entries())
        .map(([slug, value]) => ({
          id: `category-${slug}`,
          label: value.label,
          count: value.count,
          input: slug,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    });
  }

  return filters;
}

function transformCollection(
  backendCollection: BackendCollection,
  params: GetCollectionParams,
  imageByHandle: Map<string, string>,
): Collection & { products: ProductConnection; filters: SearchFilter[] } {
  const first = params.first || 24;
  const page = params.page || 1;
  const sortKey = normalizeSortValue(params.sortKey);
  const reverse = Boolean(params.reverse);

  const rawProducts: TransformedProduct[] = (backendCollection.products || []).map((p) => {
    const variants = (p.variants || []).map((variant) => ({
      id: String(variant.variant_id),
      sku: variant.sku || '',
      title: buildVariantTitle(variant),
      price: {
        amount: String(variant.price ?? '0'),
        currencyCode: 'USD',
      },
      compareAtPrice: variant.compare_at_price != null
        ? { amount: String(variant.compare_at_price), currencyCode: 'USD' }
        : undefined,
      availableForSale: p.status === 'ACTIVE',
      quantityAvailable: p.status === 'ACTIVE' ? 999 : 0,
      selectedOptions: [
        variant.option1_value ? { name: p.options?.[0]?.name || 'Option 1', value: variant.option1_value } : null,
        variant.option2_value ? { name: p.options?.[1]?.name || 'Option 2', value: variant.option2_value } : null,
        variant.option3_value ? { name: p.options?.[2]?.name || 'Option 3', value: variant.option3_value } : null,
      ].filter((option): option is { name: string; value: string } => Boolean(option)),
    }));

    const fallbackVariant = {
      id: `variant-${p.product_id}`, 
      sku: '',
      title: 'Default',
      price: {
        amount: '0',
        currencyCode: 'USD',
      },
      compareAtPrice: undefined,
      availableForSale: p.status === 'ACTIVE',
      quantityAvailable: p.status === 'ACTIVE' ? 999 : 0,
      selectedOptions: [],
    };

    const finalVariants = variants.length > 0 ? variants : [fallbackVariant];
    const amounts = finalVariants.map((variant) => Number(variant.price.amount || 0));
    const compareAmounts = finalVariants
      .map((variant) => Number(variant.compareAtPrice?.amount || 0))
      .filter((amount: number) => amount > 0);

    const imageLookupKey = p.seo?.handle || String(p.product_id);
    const fallbackMediaUrl = imageByHandle.get(imageLookupKey) || undefined;
    const primarySeoImage = normalizeMediaUrl(p.seo?.og_image);
    const fallbackImage = normalizeMediaUrl(fallbackMediaUrl);
    const imageUrl = primarySeoImage || fallbackImage;

    return {
      id: String(p.product_id),
      handle: p.seo?.handle || String(p.product_id),
      title: p.title,
      description: p.description || '',
      shortDescription: p.description || '',
      status: p.status,
      vendor: p.brand || '',
      productType: p.categories?.[0]?.name || '',
      tags: (p.categories || []).map((category) => category.slug),
      featuredImage: imageUrl
        ? {
            id: `image-${p.product_id}`,
            url: imageUrl,
            altText: p.title,
          }
        : undefined,
      images: imageUrl
        ? [
            {
              id: `image-${p.product_id}`,
              url: imageUrl,
              altText: p.title,
            },
          ]
        : [],
      variants: finalVariants,
      options: (p.options || []).map((option) => ({
        id: String(option.option_id),
        name: option.name,
        values: (option.values || []).sort((a, b) => a.position - b.position).map((value) => value.value),
      })),
      priceRange: {
        minPrice: {
          amount: String(amounts.length > 0 ? Math.min(...amounts) : 0),
          currencyCode: 'USD',
        },
        maxPrice: {
          amount: String(amounts.length > 0 ? Math.max(...amounts) : 0),
          currencyCode: 'USD',
        },
      },
      compareAtPriceRange:
        compareAmounts.length > 0
          ? {
              minPrice: {
                amount: String(Math.min(...compareAmounts)),
                currencyCode: 'USD',
              },
              maxPrice: {
                amount: String(Math.max(...compareAmounts)),
                currencyCode: 'USD',
              },
            }
          : undefined,
      createdAt: p.created_at || new Date().toISOString(),
      updatedAt: p.updated_at || new Date().toISOString(),
      seo: {
        title: p.title,
        description: p.description || '',
      },
      _categorySlugs: (p.categories || []).map((category) => category.slug),
      _brand: p.brand || '',
    };
  });

  const filteredProducts = rawProducts.filter((product) => {
    if (!params.filters || params.filters.length === 0) {
      return true;
    }

    return params.filters.every((filter) => {
      const category = extractCategorySlug(filter);
      if (category && !product._categorySlugs.includes(category)) {
        return false;
      }

      if (filter.vendor && product._brand !== filter.vendor) {
        return false;
      }

      if (filter.price) {
        const price = Number(product.priceRange.minPrice.amount || 0);
        if (filter.price.min != null && price < filter.price.min) {
          return false;
        }
        if (filter.price.max != null && price > filter.price.max) {
          return false;
        }
      }

      return true;
    });
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let result = 0;

    if (sortKey === 'TITLE') {
      result = a.title.localeCompare(b.title);
    } else if (sortKey === 'PRICE') {
      result = Number(a.priceRange.minPrice.amount || 0) - Number(b.priceRange.minPrice.amount || 0);
    } else if (sortKey === 'CREATED_AT') {
      result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else {
      result = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }

    return reverse ? -result : result;
  });

  const offset = Math.max(0, (page - 1) * first);
  const pagedProducts = sortedProducts.slice(offset, offset + first);
  const filters = buildSearchFilters(backendCollection.products || []);

  return {
    id: String(backendCollection.collection_id),
    handle: backendCollection.slug,
    title: backendCollection.name,
    description: backendCollection.description || '',
    image: normalizeMediaUrl(backendCollection.image_url)
      ? {
          id: String(backendCollection.collection_id),
          url: normalizeMediaUrl(backendCollection.image_url)!,
          altText: backendCollection.name,
          width: 1200,
          height: 600,
        }
      : undefined,
    seo: {
      title: backendCollection.meta_title || backendCollection.name,
      description: backendCollection.meta_description || backendCollection.description || '',
    },
    filters,
    products: {
      edges: pagedProducts.map((product, i: number) => ({
        cursor: `cursor-${offset + i}`,
        node: product,
      })),
      pageInfo: {
        hasNextPage: offset + first < sortedProducts.length,
        hasPreviousPage: offset > 0,
        startCursor: pagedProducts.length > 0 ? `cursor-${offset}` : undefined,
        endCursor: pagedProducts.length > 0 ? `cursor-${offset + pagedProducts.length - 1}` : undefined,
      },
      totalCount: sortedProducts.length,
    },
  };
}

type CollectionWithProducts = Collection & {
  storeId?: number;
  products: ProductConnection & {
    filters?: SearchFilter[];
  };
};

type CollectionListItem = Pick<Collection, 'id' | 'handle' | 'title' | 'description' | 'image' | 'seo'> & {
  storeId?: number;
};

interface GetCollectionResponse {
  collectionBySlug: BackendCollection | null;
}

interface GetCollectionsResponse {
  collections: BackendCollection[];
}

export const collectionService = {
  async resolveStoreIdByCollectionHandle(handle: string): Promise<number | null> {
    const cached = collectionStoreResolutionCache.get(handle);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.storeId;
    }

    const client = getGraphQLClient();
    const response = await client.request<GetCollectionsResponse>(GET_ALL_COLLECTIONS, {
      filter: { is_visible: true },
    });

    const matches = (response.collections || []).filter((collection) => collection.slug === handle);
    if (matches.length !== 1) {
      collectionStoreResolutionCache.set(handle, {
        storeId: null,
        expiresAt: Date.now() + COLLECTION_CACHE_TTL_MS,
      });
      return null;
    }

    const resolved = typeof matches[0]?.store_id === 'number' ? matches[0].store_id : null;
    collectionStoreResolutionCache.set(handle, {
      storeId: resolved,
      expiresAt: Date.now() + COLLECTION_CACHE_TTL_MS,
    });

    return resolved;
  },

  /**
   * Get a collection by handle with its products
   */
  async getCollectionByHandle(params: GetCollectionParams): Promise<CollectionWithProducts | null> {
    const { handle, storeId, countryCode } = params;
    const requestedCount = Math.max(1, Math.min((params.first || 24) * Math.max(1, params.page || 1), 80));
    const normalizedCountryCode = countryCode?.trim().toUpperCase();

    const cacheKey = JSON.stringify({
      handle,
      storeId,
      first: params.first,
      page: params.page,
      sortKey: params.sortKey,
      reverse: params.reverse,
      filters: params.filters,
      countryCode: normalizedCountryCode,
    });
    const cached = collectionByHandleCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }
    
    try {
      const resolvedStoreId = storeId ?? (await this.resolveStoreIdByCollectionHandle(handle));
      if (!resolvedStoreId) {
        return null;
      }

      const client = getGraphQLClient();
      let response: GetCollectionResponse | null = null;
      const shouldTryCountryAwareQuery = Boolean(normalizedCountryCode) && supportsCollectionProductsCountryCodeArgument !== false;

      if (shouldTryCountryAwareQuery) {
        try {
          response = await client.request<GetCollectionResponse>(GET_COLLECTION_BY_SLUG, {
            slug: handle,
            storeId: resolvedStoreId,
            productLimit: requestedCount,
            countryCode: normalizedCountryCode || undefined,
          });
          supportsCollectionProductsCountryCodeArgument = true;
        } catch (error) {
          if (!hasUnknownCollectionProductsCountryCodeArgumentError(error)) {
            throw error;
          }

          supportsCollectionProductsCountryCodeArgument = false;
        }
      }

      if (!response) {
        response = await client.request<GetCollectionResponse>(GET_COLLECTION_BY_SLUG_LEGACY, {
          slug: handle,
          storeId: resolvedStoreId,
          productLimit: requestedCount,
        });

        if (normalizedCountryCode && response.collectionBySlug?.products?.length) {
          const products = response.collectionBySlug.products;
          const availabilityChecks = await Promise.all(
            products.map((product) => {
              const lookupKey = product.seo?.handle || String(product.product_id);
              return storefrontService
                .getPublicProductByHandle(lookupKey, normalizedCountryCode)
                .then((resolved) => Boolean(resolved))
                .catch(() => false);
            }),
          );

          response.collectionBySlug.products = products.filter((_, index) => availabilityChecks[index]);
        }
      }

      if (!response.collectionBySlug) {
        return null;
      }


      const imageByHandle = new Map<string, string>();

      const transformed = transformCollection(response.collectionBySlug, params, imageByHandle);

      const result = {
        ...(transformed as CollectionWithProducts),
        storeId: resolvedStoreId,
        products: {
          ...transformed.products,
          filters: transformed.filters,
        },
      };

      collectionByHandleCache.set(cacheKey, {
        value: result,
        expiresAt: Date.now() + COLLECTION_CACHE_TTL_MS,
      });

      return result;
    } catch (error) {
      console.error('Error fetching collection:', error);
      collectionByHandleCache.set(cacheKey, {
        value: null,
        expiresAt: Date.now() + 5_000,
      });
      return null;
    }
  },

  /**
   * Get all collections
   */
  async getCollections(first: number = 20, storeId?: number): Promise<CollectionListItem[]> {
    try {
      const client = getGraphQLClient();
      const response = await client.request<GetCollectionsResponse>(GET_ALL_COLLECTIONS, {
        filter: {
          is_visible: true,
          ...(typeof storeId === 'number' ? { store_id: storeId } : {}),
        },
      });

      return (response.collections || []).slice(0, first).map((c) => ({
        id: String(c.collection_id),
        handle: c.slug,
        title: c.name,
        description: c.description || '',
        image: normalizeMediaUrl(c.image_url) ? {
          id: String(c.collection_id),
          url: normalizeMediaUrl(c.image_url)!,
          altText: c.name,
          width: 1200,
          height: 600,
        } : undefined,
        seo: {
          title: c.name,
          description: c.description || '',
        },
        storeId: c.store_id,
      }));
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
  },

  /**
   * Optimized method to fetch collections with their products in a single GraphQL request.
   * Use this instead of getCollections + getCollectionByHandle for each collection.
   */
  async getCollectionsWithProducts(
    storeId: number,
    productLimit: number = 8,
    countryCode?: string,
    maxCollections: number = 10,
  ): Promise<Array<{ collection: CollectionListItem; products: Product[] }>> {
    try {
      const client = getGraphQLClient();
      const response = await client.request<{
        collections: Array<{
          collection_id: number;
          store_id: number;
          name: string;
          slug: string;
          description?: string;
          image_url?: string;
          collection_type: string;
          is_visible: boolean;
          products?: Array<{
            product_id: number;
            title: string;
            status: string;
            brand?: string;
            variants?: BackendVariant[];
            seo?: BackendSeo;
          }>;
        }>;
      }>(GET_COLLECTIONS_WITH_PRODUCTS, {
        filter: {
          is_visible: true,
          store_id: storeId,
        },
        productLimit,
        countryCode: countryCode || null,
      });

      return (response.collections || []).slice(0, maxCollections).map((c) => ({
        collection: {
          id: String(c.collection_id),
          handle: c.slug,
          title: c.name,
          description: c.description || '',
          image: normalizeMediaUrl(c.image_url) ? {
            id: String(c.collection_id),
            url: normalizeMediaUrl(c.image_url)!,
            altText: c.name,
            width: 1200,
            height: 600,
          } : undefined,
          seo: {
            title: c.name,
            description: c.description || '',
          },
          storeId: c.store_id,
        },
        products: (c.products || []).map((p) => ({
          id: String(p.product_id),
          handle: p.seo?.handle || String(p.product_id),
          title: p.title,
          description: '',
          status: (p.status || 'ACTIVE') as 'ACTIVE' | 'DRAFT' | 'ARCHIVED',
          vendor: p.brand || '',
          tags: [],
          featuredImage: normalizeMediaUrl(p.seo?.og_image) ? {
            id: String(p.product_id),
            url: normalizeMediaUrl(p.seo?.og_image)!,
            altText: p.title,
            width: 800,
            height: 800,
          } : undefined,
          images: [],
          options: [],
          priceRange: {
            minPrice: {
              amount: String(p.variants?.[0]?.price || '0'),
              currencyCode: 'USD',
            },
            maxPrice: {
              amount: String(p.variants?.[0]?.price || '0'),
              currencyCode: 'USD',
            },
          },
          compareAtPriceRange: p.variants?.[0]?.compare_at_price ? {
            minPrice: {
              amount: String(p.variants[0].compare_at_price),
              currencyCode: 'USD',
            },
            maxPrice: {
              amount: String(p.variants[0].compare_at_price),
              currencyCode: 'USD',
            },
          } : undefined,
          variants: (p.variants || []).map((v) => ({
            id: String(v.variant_id),
            sku: '',
            title: '',
            price: { amount: String(v.price || 0), currencyCode: 'USD' },
            compareAtPrice: v.compare_at_price
              ? { amount: String(v.compare_at_price), currencyCode: 'USD' }
              : undefined,
            availableForSale: true,
            quantityAvailable: 100,
            selectedOptions: [],
          })),
          seo: {
            title: p.title,
            description: '',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
      }));
    } catch (error) {
      console.error('Error fetching collections with products:', error);
      return [];
    }
  },
};

