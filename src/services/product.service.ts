import { getGraphQLClient } from '@/lib/graphql/client';
import {
  GET_PRODUCTS,
  GET_PRODUCT_BY_HANDLE,
  GET_FEATURED_PRODUCTS,
  GET_RELATED_PRODUCTS,
} from '@/lib/graphql/queries';
import type { Product, ProductConnection, ProductSortKey } from '@/types';

interface GetProductsParams {
  first?: number;
  after?: string;
  sortKey?: ProductSortKey;
  reverse?: boolean;
}

interface GetProductsResponse {
  products: ProductConnection;
}

interface GetProductResponse {
  product: Product | null;
}

interface GetFeaturedProductsResponse {
  products: {
    edges: Array<{ node: Product }>;
  };
}

interface GetRelatedProductsResponse {
  relatedProducts: Product[];
}

export const productService = {
  /**
   * Get paginated list of products
   */
  async getProducts(params: GetProductsParams = {}): Promise<ProductConnection> {
    const { first = 24, after, sortKey = 'BEST_SELLING', reverse = false } = params;
    
    const client = getGraphQLClient();
    const response = await client.request<GetProductsResponse>(GET_PRODUCTS, {
      first,
      after,
      sortKey,
      reverse,
    });
    
    return response.products;
  },

  /**
   * Get a single product by handle
   */
  async getProductByHandle(handle: string): Promise<Product | null> {
    const client = getGraphQLClient();
    const response = await client.request<GetProductResponse>(GET_PRODUCT_BY_HANDLE, {
      handle,
    });
    
    return response.product;
  },

  /**
   * Get featured/best-selling products
   */
  async getFeaturedProducts(first: number = 8): Promise<Product[]> {
    const client = getGraphQLClient();
    const response = await client.request<GetFeaturedProductsResponse>(GET_FEATURED_PRODUCTS, {
      first,
    });
    
    return response.products.edges.map((edge) => edge.node);
  },

  /**
   * Get related products for a given product
   */
  async getRelatedProducts(productId: string, first: number = 4): Promise<Product[]> {
    const client = getGraphQLClient();
    const response = await client.request<GetRelatedProductsResponse>(GET_RELATED_PRODUCTS, {
      productId,
      first,
    });
    
    return response.relatedProducts;
  },
};
