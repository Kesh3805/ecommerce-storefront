import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { storefrontService } from '@/services/storefront.service';
import { collectionService } from '@/services/collection.service';
import { CollectionContent } from '@/app/collections/[slug]/collection-content';
import { normalizeCountryCode } from '@/lib/countries';

interface StoreCollectionPageProps {
  params: Promise<{ slug: string; collectionSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: StoreCollectionPageProps): Promise<Metadata> {
  const { slug, collectionSlug } = await params;
  const collectionTitle = collectionSlug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  const storeTitle = slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return {
    title: collectionTitle ? `${collectionTitle} | ${storeTitle || 'Store'}` : 'Collection',
    description: collectionTitle ? `Browse ${collectionTitle} products.` : 'Browse this collection.',
  };
}

export const revalidate = 300;

export default async function StoreCollectionPage({ params, searchParams }: StoreCollectionPageProps) {
  const { slug, collectionSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const country = normalizeCountryCode(resolvedSearchParams.country as string | undefined);
  const countryQuery = country ? `?country=${country}` : '';

  const sort = (resolvedSearchParams.sort as string) || 'BEST_SELLING';
  const page = parseInt((resolvedSearchParams.page as string) || '1', 10);
  const vendor = resolvedSearchParams.vendor as string | undefined;
  const category = resolvedSearchParams.category as string | undefined;
  const minPrice = resolvedSearchParams.minPrice as string | undefined;
  const maxPrice = resolvedSearchParams.maxPrice as string | undefined;

  const hasDirection = sort.endsWith('_ASC') || sort.endsWith('_DESC');
  const sortKey = hasDirection ? sort.replace(/_(ASC|DESC)$/, '') : sort;
  const reverse = hasDirection ? sort.endsWith('_DESC') : false;

  const store = await storefrontService.getPublicStoreBySlug(slug, 1, country).catch(() => null);

  if (!store) {
    notFound();
  }

  const collection = await collectionService.getCollectionByHandle({
    handle: collectionSlug,
    storeId: store.store_id,
    countryCode: country,
    first: 24,
    page,
    sortKey: sortKey as 'BEST_SELLING' | 'CREATED_AT' | 'PRICE' | 'TITLE',
    reverse,
    filters: [
      ...(vendor ? [{ vendor }] : []),
      ...(category ? [{ category }] : []),
      ...(minPrice || maxPrice
        ? [{ price: { min: minPrice ? Number(minPrice) : undefined, max: maxPrice ? Number(maxPrice) : undefined } }]
        : []),
    ],
  }).catch(() => null);

  if (!collection) {
    notFound();
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href={`/stores/${slug}${countryQuery}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Store
          </Link>
        </Button>
      </div>

      <div className="relative mb-10 overflow-hidden rounded-2xl border bg-linear-to-r from-amber-50 via-orange-50 to-rose-50 p-7 md:p-10">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-200/40 blur-2xl" />
        <div className="absolute -bottom-20 left-1/3 h-52 w-52 rounded-full bg-amber-200/40 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Collection</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">{collection.title}</h1>
          {collection.description ? <p className="mt-4 max-w-2xl text-muted-foreground">{collection.description}</p> : null}
        </div>
      </div>

      <CollectionContent collection={collection} initialSort={sort} storeSlug={slug} initialCountryCode={country} />
    </div>
  );
}


