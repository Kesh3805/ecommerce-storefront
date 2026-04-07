// ============================================================================
// CORE ECOMMERCE TYPES
// ============================================================================

// Product Types
export interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  shortDescription?: string;
  status: ProductStatus;
  vendor?: string;
  productType?: string;
  tags: string[];
  featuredImage?: ProductImage;
  images: ProductImage[];
  variants: ProductVariant[];
  options: ProductOption[];
  priceRange: PriceRange;
  compareAtPriceRange?: PriceRange;
  seo?: SEOData;
  createdAt: string;
  updatedAt: string;
}

export type ProductStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  width?: number;
  height?: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  title: string;
  price: Money;
  compareAtPrice?: Money;
  availableForSale: boolean;
  quantityAvailable: number;
  selectedOptions: SelectedOption[];
  image?: ProductImage;
  weight?: number;
  weightUnit?: string;
}

export interface ProductOption {
  id: string;
  name: string;
  values: string[];
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface PriceRange {
  minPrice: Money;
  maxPrice: Money;
}

export interface Money {
  amount: string;
  currencyCode: string;
}

export interface SEOData {
  title?: string;
  description?: string;
}

// Collection Types
export interface Collection {
  id: string;
  handle: string;
  title: string;
  description?: string;
  image?: ProductImage;
  products: ProductConnection;
  seo?: SEOData;
}

export interface ProductConnection {
  edges: ProductEdge[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface ProductEdge {
  cursor: string;
  node: Product;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

// Cart Types
export interface Cart {
  id: string;
  checkoutUrl?: string;
  lines: CartLine[];
  cost: CartCost;
  totalQuantity: number;
  buyerIdentity?: BuyerIdentity;
  attributes: CartAttribute[];
  discountCodes: CartDiscountCode[];
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartLine {
  id: string;
  quantity: number;
  variant: ProductVariant;
  product: Pick<Product, 'id' | 'handle' | 'title' | 'featuredImage'>;
  cost: CartLineCost;
  attributes: CartAttribute[];
}

export interface CartLineCost {
  totalAmount: Money;
  amountPerQuantity: Money;
  compareAtAmountPerQuantity?: Money;
}

export interface CartCost {
  subtotalAmount: Money;
  totalAmount: Money;
  totalTaxAmount?: Money;
  totalDutyAmount?: Money;
}

export interface CartAttribute {
  key: string;
  value: string;
}

export interface CartDiscountCode {
  code: string;
  applicable: boolean;
}

export interface BuyerIdentity {
  email?: string;
  phone?: string;
  customerId?: string;
  countryCode?: string;
}

// Checkout Types
export interface CheckoutState {
  step: CheckoutStep;
  shippingAddress?: Address;
  billingAddress?: Address;
  shippingMethod?: ShippingMethod;
  paymentMethod?: PaymentMethod;
  email?: string;
  phone?: string;
}

export type CheckoutStep = 'shipping' | 'delivery' | 'payment' | 'confirmation';

export interface Address {
  id?: string;
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  provinceCode?: string;
  country: string;
  countryCode: string;
  zip: string;
  phone?: string;
}

export interface ShippingMethod {
  id: string;
  title: string;
  description?: string;
  price: Money;
  estimatedDelivery?: string;
}

export interface PaymentMethod {
  type: 'card' | 'paypal' | 'applepay' | 'googlepay';
  last4?: string;
  brand?: string;
}

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  email: string;
  phone?: string;
  financialStatus: OrderFinancialStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  lineItems: OrderLineItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  shippingMethod: ShippingMethod;
  subtotalPrice: Money;
  totalShippingPrice: Money;
  totalTaxPrice: Money;
  totalPrice: Money;
  currencyCode: string;
  processedAt: string;
  createdAt: string;
}

export type OrderFinancialStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'VOIDED';
export type OrderFulfillmentStatus = 'UNFULFILLED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'RESTOCKED';

export interface OrderLineItem {
  id: string;
  title: string;
  variantTitle?: string;
  quantity: number;
  originalPrice: Money;
  discountedPrice: Money;
  image?: ProductImage;
}

// Search Types
export interface SearchResult {
  products: ProductConnection;
  collections?: Collection[];
  suggestions?: string[];
  filters: SearchFilter[];
}

export interface SearchFilter {
  id: string;
  label: string;
  type: 'list' | 'price_range' | 'boolean';
  values: SearchFilterValue[];
}

export interface SearchFilterValue {
  id: string;
  label: string;
  count: number;
  input: string;
}

export interface SearchParams {
  query?: string;
  sortKey?: ProductSortKey;
  reverse?: boolean;
  filters?: FilterInput[];
  first?: number;
  after?: string;
}

export type ProductSortKey = 'RELEVANCE' | 'BEST_SELLING' | 'CREATED_AT' | 'PRICE' | 'TITLE';

export interface FilterInput {
  productType?: string;
  vendor?: string;
  category?: string;
  available?: boolean;
  price?: PriceRangeFilter;
  tag?: string;
  variantOption?: VariantOptionFilter;
}

export interface PriceRangeFilter {
  min?: number;
  max?: number;
}

export interface VariantOptionFilter {
  name: string;
  value: string;
}

// Customer Types
export interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptsMarketing: boolean;
  addresses: Address[];
  defaultAddress?: Address;
  orders: OrderConnection;
  createdAt: string;
}

export interface OrderConnection {
  edges: OrderEdge[];
  pageInfo: PageInfo;
}

export interface OrderEdge {
  cursor: string;
  node: Order;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  errors?: ApiError[];
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string[];
}

// Menu/Navigation Types
export interface Menu {
  id: string;
  handle: string;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  title: string;
  url: string;
  type: 'LINK' | 'COLLECTION' | 'PRODUCT' | 'PAGE';
  items: MenuItem[];
}
