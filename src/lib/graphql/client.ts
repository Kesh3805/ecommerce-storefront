import { GraphQLClient } from 'graphql-request';
import { siteConfig } from '@/config';

function normalizeGraphQLEndpoint(endpoint: string): string {
  if (typeof window !== 'undefined') {
    return endpoint;
  }

  // Node on Windows can incur significant localhost resolution delays.
  // Prefer explicit loopback for server-side requests.
  return endpoint.replace('://localhost', '://127.0.0.1');
}

// GraphQL Client for server-side requests
export function createGraphQLClient(headers?: Record<string, string>) {
  const endpoint = normalizeGraphQLEndpoint(siteConfig.api.graphqlEndpoint);

  const uncachedFetch: typeof fetch = (input, init) => {
    if (typeof window !== 'undefined') {
      return fetch(input, init);
    }

    return fetch(input, {
      ...(init ?? {}),
      cache: 'no-store',
      next: { revalidate: 0 },
    } as RequestInit & { next?: { revalidate: number } });
  };

  return new GraphQLClient(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    fetch: uncachedFetch,
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
  const endpoint = normalizeGraphQLEndpoint(siteConfig.api.graphqlEndpoint);
  clientInstance = new GraphQLClient(endpoint, {
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
