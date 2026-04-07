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
  options: StorefrontPublicOption[];
  variants: StorefrontPublicVariant[];
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

interface GetPublicStoresResponse {
  publicStores: StorefrontPublicStore[];
}

interface GetPublicProductByHandleResponse {
  publicProductByHandle: StorefrontPublicProduct | null;
}

const GET_PUBLIC_STORES = gql`
  query GetPublicStores($storeLimit: Int, $productLimit: Int) {
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
  }
`;

const GET_PUBLIC_PRODUCT_BY_HANDLE = gql`
  query GetPublicProductByHandle($handle: String!) {
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

function hasMissingMediaUrlsFieldError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes('Cannot query field "media_urls"')
    || error.message.includes("Cannot query field 'media_urls'");
}

export const storefrontService = {
  async getPublicStores(storeLimit = 6, productLimit = 8): Promise<StorefrontPublicStore[]> {
    const client = getGraphQLClient();
    try {
      const response = await client.request<GetPublicStoresResponse>(GET_PUBLIC_STORES, {
        storeLimit,
        productLimit,
      });
      return response.publicStores ?? [];
    } catch (error) {
      if (!hasMissingMediaUrlsFieldError(error)) {
        throw error;
      }

      const fallbackResponse = await client.request<GetPublicStoresResponse>(GET_PUBLIC_STORES_LEGACY, {
        storeLimit,
        productLimit,
      });
      return fallbackResponse.publicStores ?? [];
    }
  },

  async getPublicProductByHandle(handle: string): Promise<StorefrontPublicProduct | null> {
    const client = getGraphQLClient();
    try {
      const response = await client.request<GetPublicProductByHandleResponse>(GET_PUBLIC_PRODUCT_BY_HANDLE, {
        handle,
      });
      return response.publicProductByHandle;
    } catch (error) {
      if (!hasMissingMediaUrlsFieldError(error)) {
        throw error;
      }

      const fallbackResponse = await client.request<GetPublicProductByHandleResponse>(GET_PUBLIC_PRODUCT_BY_HANDLE_LEGACY, {
        handle,
      });
      return fallbackResponse.publicProductByHandle;
    }
  },
};
