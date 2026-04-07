import { getGraphQLClient } from '@/lib/graphql/client';
import {
  GET_COLLECTION_BY_HANDLE,
  GET_COLLECTIONS,
} from '@/lib/graphql/queries';
import type { Collection, ProductConnection, ProductSortKey, FilterInput, SearchFilter } from '@/types';

interface GetCollectionParams {
  handle: string;
  first?: number;
  after?: string;
  sortKey?: ProductSortKey;
  reverse?: boolean;
  filters?: FilterInput[];
}

type CollectionWithProducts = Collection & {
  products: ProductConnection & {
    filters?: SearchFilter[];
  };
};

interface GetCollectionResponse {
  collection: CollectionWithProducts | null;
}

interface GetCollectionsResponse {
  collections: {
    edges: Array<{ node: Collection }>;
  };
}

export const collectionService = {
  /**
   * Get a collection by handle with its products
   */
  async getCollectionByHandle(params: GetCollectionParams): Promise<CollectionWithProducts | null> {
    const {
      handle,
      first = 24,
      after,
      sortKey = 'BEST_SELLING',
      reverse = false,
      filters,
    } = params;
    
    const client = getGraphQLClient();
    const response = await client.request<GetCollectionResponse>(GET_COLLECTION_BY_HANDLE, {
      handle,
      first,
      after,
      sortKey,
      reverse,
      filters,
    });
    
    return response.collection;
  },

  /**
   * Get all collections
   */
  async getCollections(first: number = 20): Promise<Collection[]> {
    const client = getGraphQLClient();
    const response = await client.request<GetCollectionsResponse>(GET_COLLECTIONS, {
      first,
    });
    
    return response.collections.edges.map((edge) => edge.node);
  },
};
