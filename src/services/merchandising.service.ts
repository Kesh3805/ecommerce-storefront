/**
 * Merchandising Service
 * Handles product discovery, collections, and carousels
 */

import { getGraphQLClient } from '@/lib/graphql/client';
import {
  GET_NEW_ARRIVALS,
  GET_BEST_SELLING,
  GET_TRENDING,
  GET_RELATED_PRODUCTS,
  GET_FREQUENTLY_BOUGHT_TOGETHER,
  GET_COLLECTION_CAROUSEL,
  GET_COLLECTION_BY_SLUG,
  GET_COLLECTIONS_LIST,
  GET_HOMEPAGE,
  RECORD_PRODUCT_EVENT,
} from '@/lib/graphql/merchandising-queries';

export interface CarouselProduct {
  product_id: number;
  title: string;
  handle?: string;
  thumbnail_url?: string;
  price?: number;
  compare_at_price?: number;
  in_stock: boolean;
}

export interface Collection {
  collection_id: number;
  store_id: number;
  name: string;
  slug: string;
  description?: string;
  collection_type: 'MANUAL' | 'AUTOMATED';
  image_url?: string;
  is_visible: boolean;
  product_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface HeroBanner {
  banner_id: number;
  title?: string;
  subtitle?: string;
  cta_text?: string;
  cta_link?: string;
  desktop_image_url: string;
  mobile_image_url?: string;
  video_url?: string;
  position: number;
  text_color: string;
  overlay_opacity: number;
  text_position: string;
}

export interface CategoryGridItem {
  category_id: number;
  name: string;
  slug: string;
  image_url?: string;
  product_count: number;
}

export interface CollectionSummary {
  collection_id: number;
  name: string;
  slug: string;
  image_url?: string;
  description?: string;
}

export interface ResolvedSection {
  section_id: number;
  section_type: string;
  title?: string;
  subtitle?: string;
  position: number;
  is_visible: boolean;
  config?: string;
  products?: CarouselProduct[];
  banners?: HeroBanner[];
  collections?: CollectionSummary[];
  categories?: CategoryGridItem[];
}

export interface Homepage {
  page_id: number;
  name: string;
  meta_title?: string;
  meta_description?: string;
  sections: ResolvedSection[];
}

interface GetNewArrivalsResponse {
  newArrivals: CarouselProduct[];
}

interface GetBestSellingResponse {
  bestSelling: CarouselProduct[];
}

interface GetTrendingResponse {
  trending: CarouselProduct[];
}

interface GetRelatedProductsResponse {
  relatedProducts: CarouselProduct[];
}

interface GetFrequentlyBoughtTogetherResponse {
  frequentlyBoughtTogether: CarouselProduct[];
}

interface GetCollectionCarouselResponse {
  collectionCarousel: CarouselProduct[];
}

interface GetCollectionBySlugResponse {
  collectionBySlug: Collection | null;
}

interface GetCollectionsListResponse {
  collections: Collection[];
}

interface GetHomepageResponse {
  homepage: Homepage | null;
}

export const merchandisingService = {
  /**
   * Get new arrivals carousel
   */
  async getNewArrivals(storeId?: number, limit = 12): Promise<CarouselProduct[]> {
    const client = getGraphQLClient();
    const response = await client.request<GetNewArrivalsResponse>(GET_NEW_ARRIVALS, {
      storeId,
      limit,
    });
    return response.newArrivals;
  },

  /**
   * Get best selling products carousel
   */
  async getBestSelling(storeId?: number, limit = 12): Promise<CarouselProduct[]> {
    const client = getGraphQLClient();
    const response = await client.request<GetBestSellingResponse>(GET_BEST_SELLING, {
      storeId,
      limit,
    });
    return response.bestSelling;
  },

  /**
   * Get trending products carousel
   */
  async getTrending(storeId?: number, limit = 12): Promise<CarouselProduct[]> {
    const client = getGraphQLClient();
    const response = await client.request<GetTrendingResponse>(GET_TRENDING, {
      storeId,
      limit,
    });
    return response.trending;
  },

  /**
   * Get related products for a product
   */
  async getRelatedProducts(productId: number, limit = 12): Promise<CarouselProduct[]> {
    const client = getGraphQLClient();
    const response = await client.request<GetRelatedProductsResponse>(GET_RELATED_PRODUCTS, {
      productId,
      limit,
    });
    return response.relatedProducts;
  },

  /**
   * Get frequently bought together products
   */
  async getFrequentlyBoughtTogether(productId: number, limit = 6): Promise<CarouselProduct[]> {
    const client = getGraphQLClient();
    const response = await client.request<GetFrequentlyBoughtTogetherResponse>(
      GET_FREQUENTLY_BOUGHT_TOGETHER,
      {
        productId,
        limit,
      }
    );
    return response.frequentlyBoughtTogether;
  },

  /**
   * Get collection carousel products
   */
  async getCollectionCarousel(collectionId: number, limit = 12): Promise<CarouselProduct[]> {
    const client = getGraphQLClient();
    const response = await client.request<GetCollectionCarouselResponse>(GET_COLLECTION_CAROUSEL, {
      collectionId,
      limit,
    });
    return response.collectionCarousel;
  },

  /**
   * Get collection by slug
   */
  async getCollectionBySlug(storeId: number, slug: string): Promise<Collection | null> {
    const client = getGraphQLClient();
    const response = await client.request<GetCollectionBySlugResponse>(GET_COLLECTION_BY_SLUG, {
      storeId,
      slug,
    });
    return response.collectionBySlug;
  },

  /**
   * Get all collections
   */
  async getCollections(filter?: { storeId?: number; isVisible?: boolean }): Promise<Collection[]> {
    const client = getGraphQLClient();
    const response = await client.request<GetCollectionsListResponse>(GET_COLLECTIONS_LIST, {
      filter,
    });
    return response.collections;
  },

  /**
   * Get homepage with resolved sections
   */
  async getHomepage(storeId: number): Promise<Homepage | null> {
    const client = getGraphQLClient();
    const response = await client.request<GetHomepageResponse>(GET_HOMEPAGE, {
      storeId,
    });
    return response.homepage;
  },

  /**
   * Record a product event (view, add_to_cart, purchase)
   */
  async recordEvent(productId: number, eventType: 'view' | 'add_to_cart' | 'purchase', count = 1): Promise<void> {
    const client = getGraphQLClient();
    await client.request(RECORD_PRODUCT_EVENT, {
      productId,
      eventType,
      count,
    });
  },
};
