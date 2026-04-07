import { getGraphQLClient } from '@/lib/graphql/client';
import { SEARCH_PRODUCTS, GET_SEARCH_SUGGESTIONS } from '@/lib/graphql/queries';
import type { ProductConnection } from '@/types';

interface SearchProductsParams {
  query: string;
  first?: number;
  after?: string;
}

interface SearchResponse {
  search: {
    products: ProductConnection;
    suggestions: string[];
  };
}

interface SuggestionsResponse {
  searchSuggestions: string[];
}

export const searchService = {
  /**
   * Search products by query
   */
  async searchProducts(params: SearchProductsParams): Promise<SearchResponse['search']> {
    const { query, first = 24, after } = params;
    
    if (!query || query.length < 2) {
      return {
        products: {
          edges: [],
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
          totalCount: 0,
        },
        suggestions: [],
      };
    }
    
    const client = getGraphQLClient();
    const response = await client.request<SearchResponse>(SEARCH_PRODUCTS, {
      query,
      first,
      after,
    });
    
    return response.search;
  },

  /**
   * Get search suggestions/autocomplete
   */
  async getSearchSuggestions(query: string, first: number = 8): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }
    
    const client = getGraphQLClient();
    const response = await client.request<SuggestionsResponse>(GET_SEARCH_SUGGESTIONS, {
      query,
      first,
    });
    
    return response.searchSuggestions;
  },
};
