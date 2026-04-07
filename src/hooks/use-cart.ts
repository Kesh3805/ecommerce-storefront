import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartService } from '@/services/cart.service';
import { useCartStore, useCartActions } from '@/stores/cart.store';
import { useCallback, useEffect } from 'react';
import type { ProductVariant, Product, Cart } from '@/types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const cartKeys = {
  all: ['cart'] as const,
  detail: (id: string) => [...cartKeys.all, id] as const,
};

// ============================================================================
// CART SYNC HOOK
// ============================================================================

/**
 * Hook to sync cart state with server
 */
export function useCartSync() {
  const cartId = useCartStore((state) => state.cartId);
  const localItems = useCartStore((state) => state.localItems);
  const { setCart, setCartId, setSyncing, setError, clearLocalItems } = useCartActions();
  const queryClient = useQueryClient();

  // Fetch existing cart if we have a cartId
  const { data: serverCart, isLoading } = useQuery({
    queryKey: cartKeys.detail(cartId ?? ''),
    queryFn: () => cartService.getCart(cartId!),
    enabled: !!cartId,
    staleTime: 1000 * 60, // 1 minute
  });

  // Update store when server cart is fetched
  useEffect(() => {
    if (serverCart) {
      setCart(serverCart);
    }
  }, [serverCart, setCart]);

  // Create cart mutation
  const createCartMutation = useMutation({
    mutationFn: cartService.createCart,
    onSuccess: (cart) => {
      setCart(cart);
      setCartId(cart.id);
      queryClient.setQueryData(cartKeys.detail(cart.id), cart);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to create cart');
    },
  });

  // Sync local items to server
  const syncLocalItems = useCallback(async () => {
    if (localItems.length === 0) return;

    setSyncing(true);
    try {
      const lines = localItems.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      let cart: Cart;

      if (cartId) {
        // Add to existing cart
        cart = await cartService.addToCart(cartId, lines);
      } else {
        // Create new cart with items
        cart = await cartService.createCart({ lines });
      }

      setCart(cart);
      setCartId(cart.id);
      clearLocalItems();
      queryClient.setQueryData(cartKeys.detail(cart.id), cart);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sync cart');
    } finally {
      setSyncing(false);
    }
  }, [cartId, localItems, setCart, setCartId, clearLocalItems, setSyncing, setError, queryClient]);

  return {
    cart: serverCart,
    isLoading,
    syncLocalItems,
    createCart: createCartMutation.mutate,
  };
}

// ============================================================================
// ADD TO CART HOOK
// ============================================================================

interface AddToCartParams {
  variant: ProductVariant;
  product: Pick<Product, 'id' | 'handle' | 'title' | 'featuredImage'>;
  quantity: number;
}

/**
 * Hook for adding items to cart
 */
export function useAddToCart() {
  const cartId = useCartStore((state) => state.cartId);
  const { setCart, addLocalItem, openCart, setLoading, setError } = useCartActions();
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: async ({ variant, quantity }: { variant: ProductVariant; quantity: number }) => {
      if (!cartId) {
        // Create new cart with this item
        return cartService.createCart({
          lines: [{ variantId: variant.id, quantity }],
        });
      }
      return cartService.addToCart(cartId, [{ variantId: variant.id, quantity }]);
    },
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (cart) => {
      setCart(cart);
      queryClient.setQueryData(cartKeys.detail(cart.id), cart);
      openCart();
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to add to cart');
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const addToCart = useCallback(
    ({ variant, product, quantity }: AddToCartParams) => {
      // Optimistically add to local cart for immediate UI feedback
      addLocalItem({
        variantId: variant.id,
        variant,
        product,
        quantity,
      });

      // Then sync with server
      addToCartMutation.mutate({ variant, quantity });
    },
    [addLocalItem, addToCartMutation]
  );

  return {
    addToCart,
    isLoading: addToCartMutation.isPending,
    error: addToCartMutation.error,
  };
}

// ============================================================================
// UPDATE CART ITEM HOOK
// ============================================================================

/**
 * Hook for updating cart item quantities
 */
export function useUpdateCartItem() {
  const cartId = useCartStore((state) => state.cartId);
  const { setCart, updateLocalItemQuantity, setLoading, setError } = useCartActions();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ lineId, quantity }: { lineId: string; quantity: number }) => {
      if (!cartId) throw new Error('No cart found');
      return cartService.updateCartLine(cartId, [{ id: lineId, quantity }]);
    },
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (cart) => {
      setCart(cart);
      queryClient.setQueryData(cartKeys.detail(cart.id), cart);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to update cart');
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const updateItem = useCallback(
    (lineId: string, quantity: number, variantId?: string) => {
      // Update local state immediately
      if (variantId) {
        updateLocalItemQuantity(variantId, quantity);
      }

      // Sync with server
      updateMutation.mutate({ lineId, quantity });
    },
    [updateLocalItemQuantity, updateMutation]
  );

  return {
    updateItem,
    isLoading: updateMutation.isPending,
    error: updateMutation.error,
  };
}

// ============================================================================
// REMOVE FROM CART HOOK
// ============================================================================

/**
 * Hook for removing items from cart
 */
export function useRemoveFromCart() {
  const cartId = useCartStore((state) => state.cartId);
  const { setCart, removeLocalItem, setLoading, setError } = useCartActions();
  const queryClient = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: async (lineId: string) => {
      if (!cartId) throw new Error('No cart found');
      return cartService.removeFromCart(cartId, [lineId]);
    },
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (cart) => {
      setCart(cart);
      queryClient.setQueryData(cartKeys.detail(cart.id), cart);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to remove from cart');
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const removeItem = useCallback(
    (lineId: string, variantId?: string) => {
      // Remove from local state immediately
      if (variantId) {
        removeLocalItem(variantId);
      }

      // Sync with server
      removeMutation.mutate(lineId);
    },
    [removeLocalItem, removeMutation]
  );

  return {
    removeItem,
    isLoading: removeMutation.isPending,
    error: removeMutation.error,
  };
}

// ============================================================================
// APPLY DISCOUNT HOOK
// ============================================================================

/**
 * Hook for applying discount codes
 */
export function useApplyDiscount() {
  const cartId = useCartStore((state) => state.cartId);
  const { setCart, setLoading, setError } = useCartActions();
  const queryClient = useQueryClient();

  const discountMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!cartId) throw new Error('No cart found');
      return cartService.applyDiscount(cartId, [code]);
    },
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (cart) => {
      setCart(cart);
      queryClient.setQueryData(cartKeys.detail(cart.id), cart);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to apply discount');
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  return {
    applyDiscount: discountMutation.mutate,
    isLoading: discountMutation.isPending,
    error: discountMutation.error,
  };
}
