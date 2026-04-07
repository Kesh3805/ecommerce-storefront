import { GraphQLClient } from 'graphql-request';
import { siteConfig } from '@/config';

// GraphQL Client for server-side requests
export function createGraphQLClient(headers?: Record<string, string>) {
  return new GraphQLClient(siteConfig.api.graphqlEndpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

// Singleton client for client-side requests
let clientInstance: GraphQLClient | null = null;

export function getGraphQLClient(): GraphQLClient {
  if (typeof window === 'undefined') {
    // Server-side: create new instance each time
    return createGraphQLClient();
  }
  
  // Client-side: use singleton
  if (!clientInstance) {
    clientInstance = createGraphQLClient();
  }
  
  return clientInstance;
}

// Set auth token for authenticated requests
export function setClientAuthToken(token: string) {
  clientInstance = new GraphQLClient(siteConfig.api.graphqlEndpoint, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

// Clear auth token
export function clearClientAuthToken() {
  clientInstance = createGraphQLClient();
}
