import { notFound, redirect } from 'next/navigation';
import { normalizeCountryCode } from '@/lib/countries';
import { storefrontService } from '@/services/storefront.service';

export const revalidate = 5;

function slugifyStoreName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default async function RootPage({
  searchParams,
}: {
  searchParams?: Promise<{ country?: string }>;
}) {
  const query = searchParams ? await searchParams : undefined;
  const country = normalizeCountryCode(query?.country);
  const suffix = country ? `?country=${country}` : '';

  const stores = await storefrontService.getPublicStores(1, 1, country || undefined);
  const firstStoreName = stores[0]?.name || '';
  const firstStoreSlug = slugifyStoreName(firstStoreName);

  if (!firstStoreSlug) {
    notFound();
  }

  redirect(`/stores/${firstStoreSlug}${suffix}`);
}
