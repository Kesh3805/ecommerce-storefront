import { getGraphQLClient } from '@/lib/graphql/client';
import {
  CREATE_CART,
  GET_CART,
  ADD_TO_CART,
  UPDATE_CART_LINE,
  REMOVE_FROM_CART,
  UPDATE_CART_DISCOUNT,
} from '@/lib/graphql/queries';
import type { Cart, CartAttribute } from '@/types';

interface CartInput {
  lines?: CartLineInput[];
  buyerIdentity?: {
    email?: string;
    phone?: string;
    countryCode?: string;
  };
  attributes?: CartAttribute[];
  note?: string;
}

interface CartLineInput {
  variantId: string;
  quantity: number;
  attributes?: CartAttribute[];
}

interface CartLineUpdateInput {
  id: string;
  quantity: number;
  attributes?: CartAttribute[];
}

interface CartMutationResponse {
  cart: Cart;
  userErrors: Array<{
    field: string[];
    message: string;
  }>;
}

export const cartService = {
  /**
   * Create a new cart
   */
  async createCart(input: CartInput = {}): Promise<Cart> {
    const client = getGraphQLClient();
    const response = await client.request<{ cartCreate: CartMutationResponse }>(CREATE_CART, {
      input,
    });
    
    if (response.cartCreate.userErrors.length > 0) {
      throw new Error(response.cartCreate.userErrors[0].message);
    }
    
    return response.cartCreate.cart;
  },

  /**
   * Get an existing cart by ID
   */
  async getCart(cartId: string): Promise<Cart | null> {
    const client = getGraphQLClient();
    const response = await client.request<{ cart: Cart | null }>(GET_CART, {
      cartId,
    });
    
    return response.cart;
  },

  /**
   * Add items to cart
   */
  async addToCart(cartId: string, lines: CartLineInput[]): Promise<Cart> {
    const client = getGraphQLClient();
    const response = await client.request<{ cartLinesAdd: CartMutationResponse }>(ADD_TO_CART, {
      cartId,
      lines,
    });
    
    if (response.cartLinesAdd.userErrors.length > 0) {
      throw new Error(response.cartLinesAdd.userErrors[0].message);
    }
    
    return response.cartLinesAdd.cart;
  },

  /**
   * Update cart line quantities
   */
  async updateCartLine(cartId: string, lines: CartLineUpdateInput[]): Promise<Cart> {
    const client = getGraphQLClient();
    const response = await client.request<{ cartLinesUpdate: CartMutationResponse }>(UPDATE_CART_LINE, {
      cartId,
      lines,
    });
    
    if (response.cartLinesUpdate.userErrors.length > 0) {
      throw new Error(response.cartLinesUpdate.userErrors[0].message);
    }
    
    return response.cartLinesUpdate.cart;
  },

  /**
   * Remove items from cart
   */
  async removeFromCart(cartId: string, lineIds: string[]): Promise<Cart> {
    const client = getGraphQLClient();
    const response = await client.request<{ cartLinesRemove: CartMutationResponse }>(REMOVE_FROM_CART, {
      cartId,
      lineIds,
    });
    
    if (response.cartLinesRemove.userErrors.length > 0) {
      throw new Error(response.cartLinesRemove.userErrors[0].message);
    }
    
    return response.cartLinesRemove.cart;
  },

  /**
   * Apply discount code to cart
   */
  async applyDiscount(cartId: string, discountCodes: string[]): Promise<Cart> {
    const client = getGraphQLClient();
    const response = await client.request<{ cartDiscountCodesUpdate: CartMutationResponse }>(
      UPDATE_CART_DISCOUNT,
      {
        cartId,
        discountCodes,
      }
    );
    
    if (response.cartDiscountCodesUpdate.userErrors.length > 0) {
      throw new Error(response.cartDiscountCodesUpdate.userErrors[0].message);
    }
    
    return response.cartDiscountCodesUpdate.cart;
  },
};
