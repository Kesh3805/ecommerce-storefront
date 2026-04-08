/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');

function loadEnvFiles() {
  let dotenv;
  try {
    // Resolve from storefront or workspace parent node_modules.
    dotenv = require('dotenv');
  } catch {
    return;
  }

  const storefrontRoot = path.resolve(__dirname, '..');
  const workspaceRoot = path.resolve(storefrontRoot, '..');

  const candidates = [
    path.join(storefrontRoot, '.env.local'),
    path.join(storefrontRoot, '.env.development.local'),
    path.join(storefrontRoot, '.env'),
    path.join(workspaceRoot, '.env'),
  ];

  for (const envFile of candidates) {
    if (fs.existsSync(envFile)) {
      dotenv.config({ path: envFile });
    }
  }
}

loadEnvFiles();

const backendPort = process.env.API_PORT || process.env.BACKEND_PORT || '4100';
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${backendPort}`;
const graphqlEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_URL || `${apiBaseUrl}/graphql`;
const frontendPort =
  process.env.STOREFRONT_PORT ||
  process.env.NEXT_PUBLIC_PORT ||
  (process.env.PORT && process.env.PORT !== String(backendPort) ? process.env.PORT : '3000');
const explicitSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const normalizedExplicitSiteUrl = explicitSiteUrl ? explicitSiteUrl.replace(/\/+$/, '') : '';
const normalizedApiBaseUrl = apiBaseUrl.replace(/\/+$/, '');
const siteBaseUrl =
  normalizedExplicitSiteUrl && normalizedExplicitSiteUrl !== normalizedApiBaseUrl && !normalizedExplicitSiteUrl.includes(':4100')
    ? normalizedExplicitSiteUrl
    : `http://localhost:${frontendPort}`;

function slugifyStoreName(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fetchStoreSlugs() {
  const query = `
    query DevStoreUrls($storeLimit: Int, $productLimit: Int) {
      publicStores(storeLimit: $storeLimit, productLimit: $productLimit) {
        name
      }
    }
  `;

  const response = await fetch(graphqlEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        storeLimit: 100,
        productLimit: 1,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (payload?.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join('; '));
  }

  const stores = payload?.data?.publicStores || [];
  const slugs = stores
    .map((store) => slugifyStoreName(store?.name))
    .filter(Boolean);

  return [...new Set(slugs)];
}

async function main() {
  try {
    const slugs = await fetchStoreSlugs();

    console.log('Store URLs:');
    if (slugs.length === 0) {
      console.log('- no stores found');
      return;
    }

    for (const slug of slugs) {
      console.log(`- ${siteBaseUrl}/stores/${slug}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isFetchFailure = /fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(message);
    if (isFetchFailure) {
      console.log(`Store URLs: skipped (API unavailable at ${graphqlEndpoint})`);
      console.log('Tip: start the backend API first, then rerun storefront dev.');
      return;
    }

    console.log(`Store URLs: unavailable (${message})`);
  }
}

main();
