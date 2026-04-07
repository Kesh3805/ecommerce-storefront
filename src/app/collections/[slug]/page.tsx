import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
  const perPage = 24;

  // Parse sort value
  const [sortKey, direction] = sort.includes('_')
    ? sort.split('_')
    : [sort, 'ASC'];
  const reverse = direction === 'DESC';

  // Fetch collection with products
  const collection = await collectionService
    .getCollectionByHandle({
      handle: slug,
      first: perPage,
      sortKey: sortKey as 'BEST_SELLING' | 'CREATED_AT' | 'PRICE' | 'TITLE',
      reverse,
    })
    .catch(() => null);

  if (!collection) {
    notFound();
  }

  return (
    <div className="container py-8 md:py-12">
      {/* Collection Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {collection.title}
        </h1>
        {collection.description && (
          <p className="mt-4 text-muted-foreground max-w-2xl">
            {collection.description}
          </p>
        )}
      </div>

      {/* Products Grid with Filters */}
      <CollectionContent
        collection={collection}
        initialSort={sort}
      />
    </div>
  );
}
