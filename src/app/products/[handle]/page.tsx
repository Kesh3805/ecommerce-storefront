import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { productService } from '@/services/product.service';
import { ProductDetails } from './product-details';
import { RelatedProducts } from './related-products';
import { siteConfig } from '@/config';

interface ProductPageProps {
  params: Promise<{ handle: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { handle } = await params;
  
  try {
    const product = await productService.getProductByHandle(handle);

    if (!product) {
      return {
        title: 'Product Not Found',
      };
    }

    const price = product.priceRange.minPrice;

    return {
      title: product.seo?.title || product.title,
      description: product.seo?.description || product.shortDescription || product.description?.slice(0, 160),
      openGraph: {
        title: product.title,
        description: product.shortDescription || product.description?.slice(0, 160),
        images: product.images.map((img) => ({
          url: img.url,
          width: img.width,
          height: img.height,
          alt: img.altText || product.title,
        })),
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: product.title,
        description: product.shortDescription || product.description?.slice(0, 160),
        images: product.featuredImage ? [product.featuredImage.url] : undefined,
      },
      other: {
        // Product structured data hints
        'product:price:amount': price.amount,
        'product:price:currency': price.currencyCode,
        'og:availability': product.variants.some((v) => v.availableForSale)
          ? 'in stock'
          : 'out of stock',
      },
    };
  } catch {
    return {
      title: 'Product',
    };
  }
}

// Generate JSON-LD structured data
function generateProductJsonLd(product: NonNullable<Awaited<ReturnType<typeof productService.getProductByHandle>>>) {
  const minPrice = product.priceRange.minPrice;
  const maxPrice = product.priceRange.maxPrice;
  const isAvailable = product.variants.some((v) => v.availableForSale);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.images.map((img) => img.url),
    sku: product.variants[0]?.sku,
    brand: product.vendor
      ? {
          '@type': 'Brand',
          name: product.vendor,
        }
      : undefined,
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: minPrice.amount,
      highPrice: maxPrice.amount,
      priceCurrency: minPrice.currencyCode,
      availability: isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${siteConfig.url}/products/${product.handle}`,
    },
  };
}

// Enable ISR
export const revalidate = 3600; // 1 hour

export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params;
  
  const product = await productService.getProductByHandle(handle).catch(() => null);

  if (!product) {
    notFound();
  }

  const jsonLd = generateProductJsonLd(product);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container py-8 md:py-12">
        {/* Product Details */}
        <ProductDetails product={product} />

        {/* Related Products */}
        <section className="mt-16 md:mt-24">
          <h2 className="text-2xl font-bold tracking-tight mb-8">
            You May Also Like
          </h2>
          <RelatedProducts productId={product.id} />
        </section>
      </div>
    </>
  );
}
