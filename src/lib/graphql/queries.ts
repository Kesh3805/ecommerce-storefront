import { gql } from 'graphql-request';

// ============================================================================
// PRODUCT FRAGMENTS
// ============================================================================

export const MONEY_FRAGMENT = gql`
  fragment MoneyFragment on Money {
    amount
    currencyCode
  }
`;

export const IMAGE_FRAGMENT = gql`
  fragment ImageFragment on ProductImage {
    id
    url
    altText
    width
    height
  }
`;

export const VARIANT_FRAGMENT = gql`
  fragment VariantFragment on ProductVariant {
    id
    sku
    title
    price {
      ...MoneyFragment
    }
    compareAtPrice {
      ...MoneyFragment
    }
    availableForSale
    quantityAvailable
    selectedOptions {
      name
      value
    }
    image {
      ...ImageFragment
    }
  }
  ${MONEY_FRAGMENT}
  ${IMAGE_FRAGMENT}
`;

export const PRODUCT_CARD_FRAGMENT = gql`
  fragment ProductCardFragment on Product {
    id
    handle
    title
    vendor
    featuredImage {
      ...ImageFragment
    }
    priceRange {
      minPrice {
        ...MoneyFragment
      }
      maxPrice {
        ...MoneyFragment
      }
    }
    compareAtPriceRange {
      minPrice {
        ...MoneyFragment
      }
      maxPrice {
        ...MoneyFragment
      }
    }
    variants {
      id
      availableForSale
    }
  }
  ${MONEY_FRAGMENT}
  ${IMAGE_FRAGMENT}
`;

export const PRODUCT_DETAIL_FRAGMENT = gql`
  fragment ProductDetailFragment on Product {
    id
    handle
    title
    description
    shortDescription
    vendor
    productType
    tags
    status
    featuredImage {
      ...ImageFragment
    }
    images {
      ...ImageFragment
    }
    options {
      id
      name
      values
    }
    variants {
      ...VariantFragment
    }
    priceRange {
      minPrice {
        ...MoneyFragment
      }
      maxPrice {
        ...MoneyFragment
      }
    }
    compareAtPriceRange {
      minPrice {
        ...MoneyFragment
      }
      maxPrice {
        ...MoneyFragment
      }
    }
    seo {
      title
      description
    }
    createdAt
    updatedAt
  }
  ${MONEY_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${VARIANT_FRAGMENT}
`;

// ============================================================================
// PRODUCT QUERIES
// ============================================================================

export const GET_PRODUCT_BY_HANDLE = gql`
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      ...ProductDetailFragment
    }
  }
  ${PRODUCT_DETAIL_FRAGMENT}
`;

export const GET_PRODUCTS = gql`
  query GetProducts($first: Int, $after: String, $sortKey: ProductSortKey, $reverse: Boolean) {
    products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
      edges {
        cursor
        node {
          ...ProductCardFragment
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

export const GET_FEATURED_PRODUCTS = gql`
  query GetFeaturedProducts($first: Int) {
    products(first: $first, sortKey: BEST_SELLING) {
      edges {
        node {
          ...ProductCardFragment
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

export const GET_RELATED_PRODUCTS = gql`
  query GetRelatedProducts($productId: ID!, $first: Int) {
    relatedProducts(productId: $productId, first: $first) {
      ...ProductCardFragment
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

// ============================================================================
// COLLECTION QUERIES
// ============================================================================

export const COLLECTION_FRAGMENT = gql`
  fragment CollectionFragment on Collection {
    id
    handle
    title
    description
    image {
      ...ImageFragment
    }
    seo {
      title
      description
    }
  }
  ${IMAGE_FRAGMENT}
`;

export const GET_COLLECTION_BY_HANDLE = gql`
  query GetCollectionByHandle(
    $handle: String!
    $first: Int
    $after: String
    $sortKey: ProductSortKey
    $reverse: Boolean
    $filters: [ProductFilter!]
  ) {
    collection(handle: $handle) {
      ...CollectionFragment
      products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, filters: $filters) {
        edges {
          cursor
          node {
            ...ProductCardFragment
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        totalCount
        filters {
          id
          label
          type
          values {
            id
            label
            count
            input
          }
        }
      }
    }
  }
  ${COLLECTION_FRAGMENT}
  ${PRODUCT_CARD_FRAGMENT}
`;

export const GET_COLLECTIONS = gql`
  query GetCollections($first: Int) {
    collections(first: $first) {
      edges {
        node {
          ...CollectionFragment
        }
      }
    }
  }
  ${COLLECTION_FRAGMENT}
`;

// ============================================================================
// CART QUERIES & MUTATIONS
// ============================================================================

export const CART_LINE_FRAGMENT = gql`
  fragment CartLineFragment on CartLine {
    id
    quantity
    variant {
      ...VariantFragment
    }
    product {
      id
      handle
      title
      featuredImage {
        ...ImageFragment
      }
    }
    cost {
      totalAmount {
        ...MoneyFragment
      }
      amountPerQuantity {
        ...MoneyFragment
      }
    }
  }
  ${VARIANT_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
`;

export const CART_FRAGMENT = gql`
  fragment CartFragment on Cart {
    id
    checkoutUrl
    totalQuantity
    lines {
      ...CartLineFragment
    }
    cost {
      subtotalAmount {
        ...MoneyFragment
      }
      totalAmount {
        ...MoneyFragment
      }
      totalTaxAmount {
        ...MoneyFragment
      }
    }
    discountCodes {
      code
      applicable
    }
    buyerIdentity {
      email
      phone
      customerId
      countryCode
    }
  }
  ${CART_LINE_FRAGMENT}
  ${MONEY_FRAGMENT}
`;

export const CREATE_CART = gql`
  mutation CreateCart($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

export const GET_CART = gql`
  query GetCart($cartId: ID!) {
    cart(id: $cartId) {
      ...CartFragment
    }
  }
  ${CART_FRAGMENT}
`;

export const ADD_TO_CART = gql`
  mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

export const UPDATE_CART_LINE = gql`
  mutation UpdateCartLine($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

export const REMOVE_FROM_CART = gql`
  mutation RemoveFromCart($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

export const UPDATE_CART_DISCOUNT = gql`
  mutation UpdateCartDiscount($cartId: ID!, $discountCodes: [String!]!) {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

// ============================================================================
// SEARCH QUERIES
// ============================================================================

export const SEARCH_PRODUCTS = gql`
  query SearchProducts($query: String!, $first: Int, $after: String) {
    search(query: $query, first: $first, after: $after) {
      products {
        edges {
          cursor
          node {
            ...ProductCardFragment
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
      }
      suggestions
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

export const GET_SEARCH_SUGGESTIONS = gql`
  query GetSearchSuggestions($query: String!, $first: Int) {
    searchSuggestions(query: $query, first: $first)
  }
`;

// ============================================================================
// CUSTOMER QUERIES & MUTATIONS
// ============================================================================

export const CUSTOMER_FRAGMENT = gql`
  fragment CustomerFragment on Customer {
    id
    email
    firstName
    lastName
    phone
    acceptsMarketing
    defaultAddress {
      id
      firstName
      lastName
      address1
      address2
      city
      province
      provinceCode
      country
      countryCode
      zip
      phone
    }
  }
`;

export const CUSTOMER_LOGIN = gql`
  mutation CustomerLogin($email: String!, $password: String!) {
    customerAccessTokenCreate(input: { email: $email, password: $password }) {
      customerAccessToken {
        accessToken
        expiresAt
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CUSTOMER_REGISTER = gql`
  mutation CustomerRegister($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        ...CustomerFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CUSTOMER_FRAGMENT}
`;

export const GET_CUSTOMER = gql`
  query GetCustomer($accessToken: String!) {
    customer(accessToken: $accessToken) {
      ...CustomerFragment
      addresses {
        id
        firstName
        lastName
        address1
        address2
        city
        province
        provinceCode
        country
        countryCode
        zip
        phone
      }
      orders(first: 10) {
        edges {
          node {
            id
            orderNumber
            financialStatus
            fulfillmentStatus
            totalPrice {
              ...MoneyFragment
            }
            processedAt
          }
        }
      }
    }
  }
  ${CUSTOMER_FRAGMENT}
  ${MONEY_FRAGMENT}
`;

// ============================================================================
// ORDER QUERIES
// ============================================================================

export const CREATE_ORDER = gql`
  mutation CreateOrder($input: OrderInput!) {
    orderCreate(input: $input) {
      order {
        id
        orderNumber
        email
        financialStatus
        totalPrice {
          ...MoneyFragment
        }
      }
      userErrors {
        field
        message
      }
    }
  }
  ${MONEY_FRAGMENT}
`;

export const GET_ORDER = gql`
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      orderNumber
      email
      phone
      financialStatus
      fulfillmentStatus
      lineItems {
        id
        title
        variantTitle
        quantity
        originalPrice {
          ...MoneyFragment
        }
        discountedPrice {
          ...MoneyFragment
        }
        image {
          ...ImageFragment
        }
      }
      shippingAddress {
        firstName
        lastName
        address1
        address2
        city
        province
        country
        zip
        phone
      }
      subtotalPrice {
        ...MoneyFragment
      }
      totalShippingPrice {
        ...MoneyFragment
      }
      totalTaxPrice {
        ...MoneyFragment
      }
      totalPrice {
        ...MoneyFragment
      }
      processedAt
    }
  }
  ${MONEY_FRAGMENT}
  ${IMAGE_FRAGMENT}
`;
