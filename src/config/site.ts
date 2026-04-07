export const siteConfig = {
  name: 'Storefront',
  description: 'Modern ecommerce storefront built with Next.js',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  ogImage: '/og-image.jpg',
  
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4100',
    graphqlEndpoint: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4100/graphql',
  },
  
  // Cart Configuration
  cart: {
    storageKey: 'storefront-cart',
    maxQuantity: 99,
    minQuantity: 1,
  },
  
  // Search Configuration
  search: {
    debounceMs: 300,
    minQueryLength: 2,
    maxSuggestions: 8,
  },
  
  // Product Listing
  products: {
    perPage: 24,
    sortOptions: [
      { label: 'Best Selling', value: 'BEST_SELLING' },
      { label: 'Newest', value: 'CREATED_AT' },
      { label: 'Price: Low to High', value: 'PRICE_ASC' },
      { label: 'Price: High to Low', value: 'PRICE_DESC' },
      { label: 'A-Z', value: 'TITLE_ASC' },
      { label: 'Z-A', value: 'TITLE_DESC' },
    ],
  },
  
  // Currency
  currency: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US',
  },
  
  // Social Links
  social: {
    twitter: 'https://twitter.com/storefront',
    facebook: 'https://facebook.com/storefront',
    instagram: 'https://instagram.com/storefront',
  },
  
  // Contact
  contact: {
    email: 'support@storefront.com',
    phone: '+1 (555) 123-4567',
  },
  
  // Footer Links
  footerLinks: {
    shop: [
      { label: 'All Products', href: '/collections/all' },
      { label: 'New Arrivals', href: '/collections/new-arrivals' },
      { label: 'Best Sellers', href: '/collections/best-sellers' },
      { label: 'Sale', href: '/collections/sale' },
    ],
    support: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'FAQs', href: '/faq' },
      { label: 'Shipping', href: '/shipping' },
      { label: 'Returns', href: '/returns' },
    ],
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  },
} as const;

export type SiteConfig = typeof siteConfig;
