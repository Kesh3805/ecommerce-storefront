import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import type { Cart, CartLine, ProductVariant, Product } from '@/types';
import { siteConfig } from '@/config';

// ============================================================================
// LOCAL CART ITEM (for guest users before server sync)
// ============================================================================

export interface LocalCartItem {
  id: string; // local ID
  variantId: string;
  variant: ProductVariant;
  product: Pick<Product, 'id' | 'handle' | 'title' | 'featuredImage'>;
  quantity: number;
  addedAt: number;
}

// ============================================================================
// CART STORE STATE
// ============================================================================

interface CartState {
  // Server cart (when synced)
  cart: Cart | null;
  cartId: string | null;
  
  // Local cart (for offline/guest)
  localItems: LocalCartItem[];
  
  // UI State
  isOpen: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  
  // Cart Actions
  setCart: (cart: Cart) => void;
  setCartId: (cartId: string) => void;
  clearCart: () => void;
  
  // Local Cart Actions (for guest users)
  addLocalItem: (item: Omit<LocalCartItem, 'id' | 'addedAt'>) => void;
  updateLocalItemQuantity: (variantId: string, quantity: number) => void;
  removeLocalItem: (variantId: string) => void;
  clearLocalItems: () => void;
  
  // UI Actions
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setLoading: (loading: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
  getCartItems: () => (CartLine | LocalCartItem)[];
}

// ============================================================================
// CART STORE IMPLEMENTATION
// ============================================================================

export const useCartStore = create<CartState>()(
  persist(
    immer((set, get) => ({
      // Initial State
      cart: null,
      cartId: null,
      localItems: [],
      isOpen: false,
      isLoading: false,
      isSyncing: false,
      error: null,

      // Server Cart Actions
      setCart: (cart) =>
        set((state) => {
          state.cart = cart;
          state.cartId = cart.id;
        }),

      setCartId: (cartId) =>
        set((state) => {
          state.cartId = cartId;
        }),

      clearCart: () =>
        set((state) => {
          state.cart = null;
          state.cartId = null;
          state.localItems = [];
        }),

      // Local Cart Actions
      addLocalItem: (item) =>
        set((state) => {
          const existingIndex = state.localItems.findIndex(
            (i) => i.variantId === item.variantId
          );

          if (existingIndex >= 0) {
            // Update quantity if item exists
            const newQuantity = state.localItems[existingIndex].quantity + item.quantity;
            state.localItems[existingIndex].quantity = Math.min(
              newQuantity,
              siteConfig.cart.maxQuantity
            );
          } else {
            // Add new item
            state.localItems.push({
              ...item,
              id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              addedAt: Date.now(),
            });
          }
        }),

      updateLocalItemQuantity: (variantId, quantity) =>
        set((state) => {
          const index = state.localItems.findIndex((i) => i.variantId === variantId);
          if (index >= 0) {
            if (quantity <= 0) {
              state.localItems.splice(index, 1);
            } else {
              state.localItems[index].quantity = Math.min(
                quantity,
                siteConfig.cart.maxQuantity
              );
            }
          }
        }),

      removeLocalItem: (variantId) =>
        set((state) => {
          state.localItems = state.localItems.filter((i) => i.variantId !== variantId);
        }),

      clearLocalItems: () =>
        set((state) => {
          state.localItems = [];
        }),

      // UI Actions
      openCart: () =>
        set((state) => {
          state.isOpen = true;
        }),

      closeCart: () =>
        set((state) => {
          state.isOpen = false;
        }),

      toggleCart: () =>
        set((state) => {
          state.isOpen = !state.isOpen;
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      setSyncing: (syncing) =>
        set((state) => {
          state.isSyncing = syncing;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      // Computed Values
      getItemCount: () => {
        const state = get();
        
        // Prefer server cart if available
        if (state.cart) {
          return state.cart.totalQuantity;
        }
        
        // Fall back to local items
        return state.localItems.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        const state = get();
        
        // Prefer server cart if available
        if (state.cart) {
          return parseFloat(state.cart.cost.subtotalAmount.amount);
        }
        
        // Calculate from local items
        return state.localItems.reduce((sum, item) => {
          const price = parseFloat(item.variant.price.amount);
          return sum + price * item.quantity;
        }, 0);
      },

      getCartItems: () => {
        const state = get();
        
        // Prefer server cart if available
        if (state.cart) {
          return state.cart.lines;
        }
        
        // Return local items
        return state.localItems;
      },
    })),
    {
      name: siteConfig.cart.storageKey,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cartId: state.cartId,
        localItems: state.localItems,
      }),
    }
  )
);

// ============================================================================
// CART HOOKS
// ============================================================================

export const useCart = () => useCartStore((state) => state.cart);
export const useCartId = () => useCartStore((state) => state.cartId);
export const useLocalItems = () => useCartStore((state) => state.localItems);
export const useCartOpen = () => useCartStore((state) => state.isOpen);
export const useCartLoading = () => useCartStore((state) => state.isLoading);
export const useCartError = () => useCartStore((state) => state.error);

// Computed hooks - these use primitive values to avoid reference issues
export const useCartItemCount = () =>
  useCartStore((state) => {
    // Prefer server cart if available
    if (state.cart) {
      return state.cart.totalQuantity;
    }
    // Fall back to local items
    return state.localItems.reduce((sum, item) => sum + item.quantity, 0);
  });

export const useCartSubtotal = () =>
  useCartStore((state) => {
    // Prefer server cart if available
    if (state.cart) {
      return parseFloat(state.cart.cost.subtotalAmount.amount);
    }
    // Calculate from local items
    return state.localItems.reduce((sum, item) => {
      const price = parseFloat(item.variant.price.amount);
      return sum + price * item.quantity;
    }, 0);
  });

// For cart items, use useShallow since it returns an array
export const useCartItems = () =>
  useCartStore(
    useShallow((state) => {
      // Prefer server cart if available
      if (state.cart) {
        return state.cart.lines;
      }
      // Return local items
      return state.localItems;
    })
  );

export const useCartActions = () =>
  useCartStore(
    useShallow((state) => ({
      setCart: state.setCart,
      setCartId: state.setCartId,
      clearCart: state.clearCart,
      addLocalItem: state.addLocalItem,
      updateLocalItemQuantity: state.updateLocalItemQuantity,
      removeLocalItem: state.removeLocalItem,
      clearLocalItems: state.clearLocalItems,
      openCart: state.openCart,
      closeCart: state.closeCart,
      toggleCart: state.toggleCart,
      setLoading: state.setLoading,
      setSyncing: state.setSyncing,
      setError: state.setError,
    }))
  );
