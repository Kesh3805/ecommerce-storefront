/**
 * Merchandising & Product Discovery GraphQL Queries
 * These queries use the new backend merchandising endpoints
 */

import { gql } from 'graphql-request';

// ============================================================================
// CAROUSEL PRODUCT FRAGMENT
// ============================================================================

export const CAROUSEL_PRODUCT_FRAGMENT = gql`
  fragment CarouselProductFragment on CarouselProduct {
    product_id
    title
    handle
    thumbnail_url
    price
    compare_at_price
    in_stock
  }
`;

// ============================================================================
// CAROUSEL QUERIES
// ============================================================================

export const GET_NEW_ARRIVALS = gql`
  query GetNewArrivals($storeId: Int, $limit: Int) {
    newArrivals(storeId: $storeId, limit: $limit) {
      ...CarouselProductFragment
    }
  }
  ${CAROUSEL_PRODUCT_FRAGMENT}
`;

export const GET_BEST_SELLING = gql`
  query GetBestSelling($storeId: Int, $limit: Int) {
    bestSelling(storeId: $storeId, limit: $limit) {
      ...CarouselProductFragment
    }
  }
  ${CAROUSEL_PRODUCT_FRAGMENT}
`;

export const GET_TRENDING = gql`
  query GetTrending($storeId: Int, $limit: Int) {
    trending(storeId: $storeId, limit: $limit) {
      ...CarouselProductFragment
    }
  }
  ${CAROUSEL_PRODUCT_FRAGMENT}
`;

export const GET_RELATED_PRODUCTS = gql`
  query GetRelatedProducts($productId: Int!, $limit: Int) {
    relatedProducts(productId: $productId, limit: $limit) {
      ...CarouselProductFragment
    }
  }
  ${CAROUSEL_PRODUCT_FRAGMENT}
`;

export const GET_FREQUENTLY_BOUGHT_TOGETHER = gql`
  query GetFrequentlyBoughtTogether($productId: Int!, $limit: Int) {
    frequentlyBoughtTogether(productId: $productId, limit: $limit) {
      ...CarouselProductFragment
    }
  }
  ${CAROUSEL_PRODUCT_FRAGMENT}
`;

export const GET_COLLECTION_CAROUSEL = gql`
  query GetCollectionCarousel($collectionId: Int!, $limit: Int) {
    collectionCarousel(collectionId: $collectionId, limit: $limit) {
      ...CarouselProductFragment
    }
  }
  ${CAROUSEL_PRODUCT_FRAGMENT}
`;

// ============================================================================
// COLLECTION QUERIES
// ============================================================================

export const GET_COLLECTION_BY_ID = gql`
  query GetCollectionById($collectionId: Int!) {
    collection(collectionId: $collectionId) {
      collection_id
      store_id
      name
      slug
      description
      collection_type
      image_url
      is_visible
      product_count
      created_at
      updated_at
    }
  }
`;

export const GET_COLLECTION_BY_SLUG = gql`
  query GetCollectionBySlug($storeId: Int!, $slug: String!) {
    collectionBySlug(storeId: $storeId, slug: $slug) {
      collection_id
      store_id
      name
      slug
      description
      collection_type
      image_url
      is_visible
      product_count
      created_at
      updated_at
    }
  }
`;

export const GET_COLLECTIONS_LIST = gql`
  query GetCollectionsList($filter: CollectionFilterInput) {
    collections(filter: $filter) {
      collection_id
      store_id
      name
      slug
      description
      collection_type
      image_url
      is_visible
      product_count
      created_at
    }
  }
`;

// ============================================================================
// HOMEPAGE QUERY
// ============================================================================

export const GET_HOMEPAGE = gql`
  query GetHomepage($storeId: Int!) {
    homepage(storeId: $storeId) {
      page_id
      name
      meta_title
      meta_description
      sections {
        section_id
        section_type
        title
        subtitle
        position
        is_visible
        config
        products {
          product_id
          title
          handle
          thumbnail_url
          price
          compare_at_price
          in_stock
        }
        banners {
          banner_id
          title
          subtitle
          cta_text
          cta_link
          desktop_image_url
          mobile_image_url
          video_url
          position
          text_color
          overlay_opacity
          text_position
        }
        collections {
          collection_id
          name
          slug
          image_url
          description
        }
        categories {
          category_id
          name
          slug
          image_url
          product_count
        }
      }
    }
  }
`;

// ============================================================================
// EVENT TRACKING MUTATION
// ============================================================================

export const RECORD_PRODUCT_EVENT = gql`
  mutation RecordProductEvent($productId: Int!, $eventType: String!, $count: Int) {
    recordProductEvent(productId: $productId, eventType: $eventType, count: $count)
  }
`;
