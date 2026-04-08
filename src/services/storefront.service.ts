import { gql } from 'graphql-request';
import { getGraphQLClient } from '@/lib/graphql/client';

export interface StorefrontPublicProduct {
  product_id: number;
  store_id: number;
  store_name: string;
  title: string;
  brand?: string;
  description?: string;
  handle: string;
  image_url?: string;
  media_urls?: string[];
  price?: string;
  compare_at_price?: string;
  options?: StorefrontPublicOption[];
  variants?: StorefrontPublicVariant[];
}

export interface StorefrontPublicOption {
  name: string;
  values: string[];
}

export interface StorefrontPublicVariant {
  variant_id: number;
  title: string;
  sku?: string;
  option1_value?: string;
  option2_value?: string;
  option3_value?: string;
  price?: string;
  compare_at_price?: string;
  inventory_available?: number;
}

export interface StorefrontPublicStore {
  store_id: number;
  name: string;
  products: StorefrontPublicProduct[];
}

export interface CarouselProduct {
  product_id: number;
  title: string;
  handle?: string;
  price?: number;
  compare_at_price?: number;
  thumbnail_url?: string;
  rating?: number;
  review_count?: number;
  in_stock: boolean;
}

interface GetPublicStoresResponse {
  publicStores: StorefrontPublicStore[];
}

interface GetPublicStoreBySlugResponse {
  publicStoreBySlug: StorefrontPublicStore | null;
}

interface GetAvailableCountriesResponse {
  availableCountries: string[];
}

interface GetPublicProductByHandleResponse {
  publicProductByHandle: StorefrontPublicProduct | null;
}

interface CarouselResponse {
  newArrivals?: CarouselProduct[];
  bestSelling?: CarouselProduct[];
  trending?: CarouselProduct[];
}

const STOREFRONT_CACHE_TTL_MS = 60_000;

type TimedCacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const publicStoresCache = new Map<string, TimedCacheEntry<StorefrontPublicStore[]>>();
const publicStoreBySlugCache = new Map<string, TimedCacheEntry<StorefrontPublicStore | null>>();
const publicProductCache = new Map<string, TimedCacheEntry<StorefrontPublicProduct | null>>();
const availableCountriesCache = new Map<string, TimedCacheEntry<string[]>>();

function slugifyStoreName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function readCache<T>(cache: Map<string, TimedCacheEntry<T>>, key: string): T | null {
  const existing = cache.get(key);
  if (!existing) {
    return null;
  }

  if (Date.now() > existing.expiresAt) {
    cache.delete(key);
    return null;
  }

  return existing.value;
}

function writeCache<T>(cache: Map<string, TimedCacheEntry<T>>, key: string, value: T): void {
  cache.set(key, {
    value,
    expiresAt: Date.now() + STOREFRONT_CACHE_TTL_MS,
  });
}

const GET_PUBLIC_STORES = gql`
  query GetPublicStores($storeLimit: Int, $productLimit: Int, $countryCode: String) {
    publicStores(storeLimit: $storeLimit, productLimit: $productLimit, countryCode: $countryCode) {
      store_id
      name
      products {
        product_id
        store_id
        store_name
        title
        brand
        description
        handle
        image_url
        media_urls
        price
        compare_at_price
        variants {
          variant_id
          price
          compare_at_price
          inventory_available
        }
      }
    }
  }
`;

const GET_PUBLIC_STORES_WITH_COUNTRY_NO_MEDIA = gql`
  query GetPublicStoresWithCountryNoMedia($storeLimit: Int, $productLimit: Int, $countryCode: String) {
    publicStores(storeLimit: $storeLimit, productLimit: $productLimit, countryCode: $countryCode) {
      store_id
      name
      products {
        product_id
        store_id
        store_name
        title
        brand
        description
        handle
        image_url
        price
        compare_at_price
        variants {
          variant_id
          price
          compare_at_price
          inventory_available
        }
      }
    }
  }
`;

const GET_PUBLIC_STORES_NO_COUNTRY = gql`
  query GetPublicStoresNoCountry($storeLimit: Int, $productLimit: Int) {
    publicStores(storeLimit: $storeLimit, productLimit: $productLimit) {
      store_id
      name
      products {
        product_id
        store_id
        store_name
        title
        brand
        description
        handle
        image_url
        media_urls
        price
        compare_at_price
        variants {
          variant_id
          price
          compare_at_price
          inventory_available
        }
      }
    }
  }
`;

const GET_PUBLIC_STORES_LEGACY = gql`
  query GetPublicStoresLegacy($storeLimit: Int, $productLimit: Int) {
    publicStores(storeLimit: $storeLimit, productLimit: $productLimit) {
      store_id
      name
      products {
        product_id
        store_id
        store_name
        title
        brand
        description
        handle
        image_url
        price
        compare_at_price
        variants {
          variant_id
          price
          compare_at_price
          inventory_available
        }
      }
    }
  }
`;

const GET_PUBLIC_STORE_BY_SLUG = gql`
  query GetPublicStoreBySlug($slug: String!, $productLimit: Int, $countryCode: String) {
    publicStoreBySlug(slug: $slug, productLimit: $productLimit, countryCode: $countryCode) {
      store_id
      name
      products {
        product_id
        store_id
        store_name
        title
        brand
        description
        handle
        image_url
        media_urls
        price
        compare_at_price
        variants {
          variant_id
          price
          compare_at_price
          inventory_available
        }
      }
    }
  }
`;

const GET_PUBLIC_PRODUCT_BY_HANDLE = gql`
  query GetPublicProductByHandle($handle: String!, $countryCode: String) {
    publicProductByHandle(handle: $handle, countryCode: $countryCode) {
      product_id
      store_id
      store_name
      title
      brand
      description
      handle
      image_url
      media_urls
      price
      compare_at_price
      options {
        name
        values
      }
      variants {
        variant_id
        title
        sku
        option1_value
        option2_value
        option3_value
        price
        compare_at_price
        inventory_available
      }
    }
  }
`;

const GET_PUBLIC_PRODUCT_BY_HANDLE_WITH_COUNTRY_NO_MEDIA = gql`
  query GetPublicProductByHandleWithCountryNoMedia($handle: String!, $countryCode: String) {
    publicProductByHandle(handle: $handle, countryCode: $countryCode) {
      product_id
      store_id
      store_name
      title
      brand
      description
      handle
      image_url
      price
      compare_at_price
      options {
        name
        values
      }
      variants {
        variant_id
        title
        sku
        option1_value
        option2_value
        option3_value
        price
        compare_at_price
        inventory_available
      }
    }
  }
`;

const GET_PUBLIC_PRODUCT_BY_HANDLE_NO_COUNTRY = gql`
  query GetPublicProductByHandleNoCountry($handle: String!) {
    publicProductByHandle(handle: $handle) {
      product_id
      store_id
      store_name
      title
      brand
      description
      handle
      image_url
      media_urls
      price
      compare_at_price
      options {
        name
        values
      }
      variants {
        variant_id
        title
        sku
        option1_value
        option2_value
        option3_value
        price
        compare_at_price
        inventory_available
      }
    }
  }
`;

const GET_PUBLIC_PRODUCT_BY_HANDLE_LEGACY = gql`
  query GetPublicProductByHandleLegacy($handle: String!) {
    publicProductByHandle(handle: $handle) {
      product_id
      store_id
      store_name
      title
      brand
      description
      handle
      image_url
      price
      compare_at_price
      options {
        name
        values
      }
      variants {
        variant_id
        title
        sku
        option1_value
        option2_value
        option3_value
        price
        compare_at_price
        inventory_available
      }
    }
  }
`;

const GET_NEW_ARRIVALS = gql`
  query GetNewArrivals($limit: Int, $storeId: Int) {
    newArrivals(limit: $limit, storeId: $storeId) {
      product_id
      title
      handle
      price
      compare_at_price
      thumbnail_url
      rating
      review_count
      in_stock
    }
  }
`;

const GET_BEST_SELLING = gql`
  query GetBestSelling($limit: Int, $storeId: Int) {
    bestSelling(limit: $limit, storeId: $storeId) {
      product_id
      title
      handle
      price
      compare_at_price
      thumbnail_url
      rating
      review_count
      in_stock
    }
  }
`;

const GET_TRENDING = gql`
  query GetTrending($limit: Int, $storeId: Int) {
    trending(limit: $limit, storeId: $storeId) {
      product_id
      title
      handle
      price
      compare_at_price
      thumbnail_url
      rating
      review_count
      in_stock
    }
  }
`;

const GET_AVAILABLE_COUNTRIES = gql`
  query GetAvailableCountries($storeId: Int!) {
    availableCountries(storeId: $storeId)
  }
`;

function hasMissingMediaUrlsFieldError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes('Cannot query field "media_urls"')
    || error.message.includes("Cannot query field 'media_urls'");
}

function hasUnknownCountryCodeArgumentError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes('Unknown argument "countryCode"')
    || error.message.includes("Unknown argument 'countryCode'");
}

export const storefrontService = {
  async getPublicStoreBySlug(slug: string, productLimit = 12, countryCode?: string): Promise<StorefrontPublicStore | null> {
    const normalizedSlug = slugifyStoreName(slug || '');
    if (!normalizedSlug) {
      return null;
    }

    const normalizedCountryCode = countryCode?.trim().toUpperCase() || '';
    const cacheKey = `${normalizedSlug}:${productLimit}:${normalizedCountryCode}`;
    const cached = readCache(publicStoreBySlugCache, cacheKey);
    if (cached !== null) {
      return cached;
    }

    const client = getGraphQLClient();
    try {
      const response = await client.request<GetPublicStoreBySlugResponse>(GET_PUBLIC_STORE_BY_SLUG, {
        slug: normalizedSlug,
        productLimit,
        countryCode: normalizedCountryCode || undefined,
      });

      const result = response.publicStoreBySlug ?? null;
      writeCache(publicStoreBySlugCache, cacheKey, result);
      return result;
    } catch {
      const stores = await this.getPublicStores(30, productLimit, normalizedCountryCode || undefined).catch(() => []);
      const result = stores.find((store) => slugifyStoreName(store.name) === normalizedSlug) ?? null;
      writeCache(publicStoreBySlugCache, cacheKey, result);
      return result;
    }
  },

  async getPublicStores(storeLimit = 6, productLimit = 8, countryCode?: string): Promise<StorefrontPublicStore[]> {
    const normalizedCountryCode = countryCode?.trim().toUpperCase() || '';
    const cacheKey = `${storeLimit}:${productLimit}:${normalizedCountryCode}`;
    const cached = readCache(publicStoresCache, cacheKey);
    if (cached) {
      return cached;
    }

    const client = getGraphQLClient();
    try {
      const response = await client.request<GetPublicStoresResponse>(GET_PUBLIC_STORES, {
        storeLimit,
        productLimit,
        countryCode: normalizedCountryCode || undefined,
      });
      const result = response.publicStores ?? [];
      writeCache(publicStoresCache, cacheKey, result);
      return result;
    } catch (error) {
      try {
        const responseNoMediaWithCountry = await client.request<GetPublicStoresResponse>(GET_PUBLIC_STORES_WITH_COUNTRY_NO_MEDIA, {
          storeLimit,
          productLimit,
          countryCode: normalizedCountryCode || undefined,
        });
        const resultNoMediaWithCountry = responseNoMediaWithCountry.publicStores ?? [];
        writeCache(publicStoresCache, cacheKey, resultNoMediaWithCountry);
        return resultNoMediaWithCountry;
      } catch {
        // Ignore and continue to compatibility fallbacks below.
      }

      if (!hasMissingMediaUrlsFieldError(error) && !hasUnknownCountryCodeArgumentError(error)) {
        throw error;
      }

      try {
        const responseNoCountry = await client.request<GetPublicStoresResponse>(GET_PUBLIC_STORES_NO_COUNTRY, {
          storeLimit,
          productLimit,
        });
        const resultNoCountry = responseNoCountry.publicStores ?? [];
        writeCache(publicStoresCache, cacheKey, resultNoCountry);
        return resultNoCountry;
      } catch {
        // Ignore and continue to legacy fallback.
      }

      const fallbackResponse = await client.request<GetPublicStoresResponse>(GET_PUBLIC_STORES_LEGACY, {
        storeLimit,
        productLimit,
      });
      const fallback = fallbackResponse.publicStores ?? [];
      writeCache(publicStoresCache, cacheKey, fallback);
      return fallback;
    }
  },

  async getPublicProductByHandle(handle: string, countryCode?: string): Promise<StorefrontPublicProduct | null> {
    const normalizedCountryCode = countryCode?.trim().toUpperCase() || '';
    const cacheKey = `${handle.trim().toLowerCase()}:${normalizedCountryCode}`;
    const cached = readCache(publicProductCache, cacheKey);
    if (cached !== null) {
      return cached;
    }

    const client = getGraphQLClient();
    try {
      const response = await client.request<GetPublicProductByHandleResponse>(GET_PUBLIC_PRODUCT_BY_HANDLE, {
        handle,
        countryCode: normalizedCountryCode || undefined,
      });
      const result = response.publicProductByHandle;
      writeCache(publicProductCache, cacheKey, result);
      return result;
    } catch (error) {
      try {
        const responseNoMediaWithCountry = await client.request<GetPublicProductByHandleResponse>(GET_PUBLIC_PRODUCT_BY_HANDLE_WITH_COUNTRY_NO_MEDIA, {
          handle,
          countryCode: normalizedCountryCode || undefined,
        });
        const resultNoMediaWithCountry = responseNoMediaWithCountry.publicProductByHandle;
        writeCache(publicProductCache, cacheKey, resultNoMediaWithCountry);
        return resultNoMediaWithCountry;
      } catch {
        // Ignore and continue to compatibility fallbacks below.
      }

      if (!hasMissingMediaUrlsFieldError(error) && !hasUnknownCountryCodeArgumentError(error)) {
        throw error;
      }

      try {
        const responseNoCountry = await client.request<GetPublicProductByHandleResponse>(GET_PUBLIC_PRODUCT_BY_HANDLE_NO_COUNTRY, {
          handle,
        });
        const resultNoCountry = responseNoCountry.publicProductByHandle;
        writeCache(publicProductCache, cacheKey, resultNoCountry);
        return resultNoCountry;
      } catch {
        // Ignore and continue to legacy fallback.
      }

      const fallbackResponse = await client.request<GetPublicProductByHandleResponse>(GET_PUBLIC_PRODUCT_BY_HANDLE_LEGACY, {
        handle,
      });
      const fallback = fallbackResponse.publicProductByHandle;
      writeCache(publicProductCache, cacheKey, fallback);
      return fallback;
    }
  },

  async getAvailableCountries(storeId: number): Promise<string[]> {
    const cacheKey = String(storeId);
    const cached = readCache(availableCountriesCache, cacheKey);
    if (cached) {
      return cached;
    }

    const client = getGraphQLClient();
    const response = await client.request<GetAvailableCountriesResponse>(GET_AVAILABLE_COUNTRIES, {
      storeId,
    });

    const result = [...new Set((response.availableCountries ?? []).map((code) => code.toUpperCase()))].sort();
    writeCache(availableCountriesCache, cacheKey, result);
    return result;
  },

  async getNewArrivals(limit = 12, storeId?: number): Promise<CarouselProduct[]> {
    try {
      const client = getGraphQLClient();
      const response = await client.request<CarouselResponse>(GET_NEW_ARRIVALS, {
        limit,
        storeId,
      });
      return response.newArrivals ?? [];
    } catch (error) {
      console.error('Error fetching new arrivals:', error);
      return [];
    }
  },

  async getBestSelling(limit = 12, storeId?: number): Promise<CarouselProduct[]> {
    try {
      const client = getGraphQLClient();
      const response = await client.request<CarouselResponse>(GET_BEST_SELLING, {
        limit,
        storeId,
      });
      return response.bestSelling ?? [];
    } catch (error) {
      console.error('Error fetching best sellers:', error);
      return [];
    }
  },

  async getTrending(limit = 12, storeId?: number): Promise<CarouselProduct[]> {
    try {
      const client = getGraphQLClient();
      const response = await client.request<CarouselResponse>(GET_TRENDING, {
        limit,
        storeId,
      });
      return response.trending ?? [];
    } catch (error) {
      console.error('Error fetching trending products:', error);
      return [];
    }
  },
};
