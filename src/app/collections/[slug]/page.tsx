import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import { collectionService } from '@/services/collection.service';
import { CollectionContent } from './collection-content';

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Generate static paths for popular collections
export async function generateStaticParams() {
  try {
    const collections = await collectionService.getCollections(20);
    return collections.map((collection) => ({
      slug: collection.handle,
    }));
  } catch {
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const collection = await collectionService.getCollectionByHandle({
      handle: slug,
      first: 1,
    });

    if (!collection) {
      return {
        title: 'Collection Not Found',
      };
    }

    return {
      title: collection.seo?.title || collection.title,
      description: collection.seo?.description || collection.description,
      openGraph: {
        title: collection.title,
        description: collection.description || undefined,
        images: collection.image ? [{ url: collection.image.url }] : undefined,
      },
    };
  } catch {
    return {
      title: 'Collection',
    };
  }
}

// Enable ISR
export const revalidate = 3600; // 1 hour

export default async function CollectionPage({
  params,
  searchParams,
}: CollectionPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  // Parse search params
  const sort = (resolvedSearchParams.sort as string) || 'BEST_SELLING';
  const page = parseInt((resolvedSearchParams.page as string) || '1', 10);
  const vendor = resolvedSearchParams.vendor as string | undefined;
  const category = resolvedSearchParams.category as string | undefined;
  const storeIdParam = resolvedSearchParams.storeId as string | undefined;
  const parsedStoreId = storeIdParam ? Number(storeIdParam) : undefined;
  const storeId = Number.isInteger(parsedStoreId) && (parsedStoreId as number) > 0 ? (parsedStoreId as number) : undefined;
  const minPrice = resolvedSearchParams.minPrice as string | undefined;
  const maxPrice = resolvedSearchParams.maxPrice as string | undefined;
  const perPage = 24;

  // Parse sort value
  const hasDirection = sort.endsWith('_ASC') || sort.endsWith('_DESC');
  const sortKey = hasDirection ? sort.replace(/_(ASC|DESC)$/, '') : sort;
  const direction = hasDirection ? (sort.endsWith('_DESC') ? 'DESC' : 'ASC') : 'ASC';
  const reverse = direction === 'DESC';

  // Fetch collection with products
  const collection = await collectionService
    .getCollectionByHandle({
      handle: slug,
      storeId,
      first: perPage,
      page,
      sortKey: sortKey as 'BEST_SELLING' | 'CREATED_AT' | 'PRICE' | 'TITLE',
      reverse,
      filters: [
        ...(vendor ? [{ vendor }] : []),
        ...(category ? [{ category }] : []),
        ...(minPrice || maxPrice
          ? [
              {
                price: {
                  min: minPrice ? Number(minPrice) : undefined,
                  max: maxPrice ? Number(maxPrice) : undefined,
                },
              },
            ]
          : []),
      ],
    })
    .catch(() => null);

  if (!collection) {
    notFound();
  }

  if (!storeId && collection.storeId) {
    const params = new URLSearchParams();
    params.set('storeId', String(collection.storeId));
    if (vendor) params.set('vendor', vendor);
    if (category) params.set('category', category);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (page > 1) params.set('page', String(page));
    if (sort) params.set('sort', sort);
    redirect(`/collections/${slug}?${params.toString()}`);
  }

  return (
    <div className="container py-8 md:py-12">
      {/* Collection Header */}
      <div className="relative mb-10 overflow-hidden rounded-2xl border bg-linear-to-r from-amber-50 via-orange-50 to-rose-50 p-7 md:p-10">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-200/40 blur-2xl" />
        <div className="absolute -bottom-20 left-1/3 h-52 w-52 rounded-full bg-amber-200/40 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Collection</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="mt-4 max-w-2xl text-muted-foreground">
              {collection.description}
            </p>
          )}
        </div>
      </div>

      {/* Products Grid with Filters */}
      <CollectionContent
        collection={collection}
        initialSort={sort}
      />
    </div>
  );
}
