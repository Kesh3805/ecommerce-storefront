import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { storefrontService, type StorefrontPublicProduct } from '@/services/storefront.service';
import { StoreProductView } from '@/app/stores/[slug]/products/[handle]/store-product-view';
import { normalizeCountryCode } from '@/lib/countries';

interface StoreProductPageProps {
  params: Promise<{ slug: string; handle: string }>;
  searchParams?: Promise<{ country?: string }>;
}

function slugifyStoreName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function resolveStoreScopedProduct(slug: string, handle: string, countryCode?: string): Promise<StorefrontPublicProduct | null> {
  const product = await storefrontService.getPublicProductByHandle(handle, countryCode).catch(() => null);
  if (product && slugifyStoreName(product.store_name) === slug) {
    return product;
  }

  if (!countryCode) {
    return null;
  }

  const fallbackProduct = await storefrontService.getPublicProductByHandle(handle).catch(() => null);
  if (!fallbackProduct || slugifyStoreName(fallbackProduct.store_name) !== slug) {
    return null;
  }

  const activeStore = await storefrontService.getPublicStoreBySlug(slug, 80, countryCode).catch(() => null);
  if (!activeStore) {
    return null;
  }

  const existsInCountryListing = activeStore.products.some(
    (listedProduct) => listedProduct.handle === fallbackProduct.handle || listedProduct.product_id === fallbackProduct.product_id,
  );

  return existsInCountryListing ? fallbackProduct : null;
}

export async function generateMetadata({ params, searchParams }: StoreProductPageProps): Promise<Metadata> {
  const { slug, handle } = await params;
  const query = searchParams ? await searchParams : undefined;
  const countryCode = normalizeCountryCode(query?.country);

  const product = await resolveStoreScopedProduct(slug, handle, countryCode);
  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: product.title,
    description: product.description?.slice(0, 160) || product.title,
    openGraph: {
      title: product.title,
      description: product.description?.slice(0, 160) || product.title,
      images: product.image_url ? [product.image_url] : undefined,
    },
  };
}

export const revalidate = 5;

export default async function StoreProductPage({ params, searchParams }: StoreProductPageProps) {
  const { slug, handle } = await params;
  const query = searchParams ? await searchParams : undefined;
  const countryCode = normalizeCountryCode(query?.country);
  const product = await resolveStoreScopedProduct(slug, handle, countryCode);

  if (!product) {
    notFound();
  }

  return <StoreProductView slug={slug} product={product} countryCode={countryCode} />;
}
