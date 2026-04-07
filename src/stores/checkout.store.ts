import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CheckoutState, Address, ShippingMethod, PaymentMethod, CheckoutStep } from '@/types';

// ============================================================================
// CHECKOUT STORE STATE
// ============================================================================

interface CheckoutStoreState {
  // Checkout State
  currentStep: CheckoutStep;
  email: string;
  phone: string;
  shippingAddress: Address | null;
  billingAddress: Address | null;
  billingAddressSameAsShipping: boolean;
  shippingMethod: ShippingMethod | null;
  paymentMethod: PaymentMethod | null;
  
  // Available Options
  availableShippingMethods: ShippingMethod[];
  
  // Order Result
  orderId: string | null;
  orderNumber: string | null;
  
  // UI State
  isProcessing: boolean;
  error: string | null;
  
  // Actions
  setStep: (step: CheckoutStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  setEmail: (email: string) => void;
  setPhone: (phone: string) => void;
  setShippingAddress: (address: Address) => void;
  setBillingAddress: (address: Address | null) => void;
  setBillingAddressSameAsShipping: (same: boolean) => void;
  setShippingMethod: (method: ShippingMethod) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setAvailableShippingMethods: (methods: ShippingMethod[]) => void;
  
  setOrderResult: (orderId: string, orderNumber: string) => void;
  setProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;
  
  reset: () => void;
  
  // Validation
  canProceedToDelivery: () => boolean;
  canProceedToPayment: () => boolean;
  canPlaceOrder: () => boolean;
}

const CHECKOUT_STEPS: CheckoutStep[] = ['shipping', 'delivery', 'payment', 'confirmation'];

const initialState = {
  currentStep: 'shipping' as CheckoutStep,
  email: '',
  phone: '',
  shippingAddress: null,
  billingAddress: null,
  billingAddressSameAsShipping: true,
  shippingMethod: null,
  paymentMethod: null,
  availableShippingMethods: [],
  orderId: null,
  orderNumber: null,
  isProcessing: false,
  error: null,
};

// ============================================================================
// CHECKOUT STORE IMPLEMENTATION
// ============================================================================

export const useCheckoutStore = create<CheckoutStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Step Navigation
      setStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const { currentStep } = get();
        const currentIndex = CHECKOUT_STEPS.indexOf(currentStep);
        if (currentIndex < CHECKOUT_STEPS.length - 1) {
          set({ currentStep: CHECKOUT_STEPS[currentIndex + 1] });
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        const currentIndex = CHECKOUT_STEPS.indexOf(currentStep);
        if (currentIndex > 0) {
          set({ currentStep: CHECKOUT_STEPS[currentIndex - 1] });
        }
      },

      // Form Data
      setEmail: (email) => set({ email }),
      setPhone: (phone) => set({ phone }),
      setShippingAddress: (address) => set({ shippingAddress: address }),
      setBillingAddress: (address) => set({ billingAddress: address }),
      setBillingAddressSameAsShipping: (same) => set({ billingAddressSameAsShipping: same }),
      setShippingMethod: (method) => set({ shippingMethod: method }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      setAvailableShippingMethods: (methods) => set({ availableShippingMethods: methods }),

      // Order Result
      setOrderResult: (orderId, orderNumber) => set({ orderId, orderNumber }),
      setProcessing: (processing) => set({ isProcessing: processing }),
      setError: (error) => set({ error }),

      // Reset
      reset: () => set(initialState),

      // Validation
      canProceedToDelivery: () => {
        const { email, shippingAddress } = get();
        return !!(
          email &&
          shippingAddress?.firstName &&
          shippingAddress?.lastName &&
          shippingAddress?.address1 &&
          shippingAddress?.city &&
          shippingAddress?.province &&
          shippingAddress?.country &&
          shippingAddress?.zip
        );
      },

      canProceedToPayment: () => {
        const { shippingMethod } = get();
        return get().canProceedToDelivery() && !!shippingMethod;
      },

      canPlaceOrder: () => {
        const { paymentMethod } = get();
        return get().canProceedToPayment() && !!paymentMethod;
      },
    }),
    {
      name: 'storefront-checkout',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        email: state.email,
        phone: state.phone,
        shippingAddress: state.shippingAddress,
        billingAddress: state.billingAddress,
        billingAddressSameAsShipping: state.billingAddressSameAsShipping,
      }),
    }
  )
);

// ============================================================================
// CHECKOUT HOOKS
// ============================================================================

export const useCheckoutStep = () => useCheckoutStore((state) => state.currentStep);
export const useCheckoutEmail = () => useCheckoutStore((state) => state.email);
export const useShippingAddress = () => useCheckoutStore((state) => state.shippingAddress);
export const useBillingAddress = () => useCheckoutStore((state) => state.billingAddress);
export const useShippingMethod = () => useCheckoutStore((state) => state.shippingMethod);
export const usePaymentMethod = () => useCheckoutStore((state) => state.paymentMethod);
export const useCheckoutProcessing = () => useCheckoutStore((state) => state.isProcessing);
export const useCheckoutError = () => useCheckoutStore((state) => state.error);

export const useCheckoutActions = () =>
  useCheckoutStore((state) => ({
    setStep: state.setStep,
    nextStep: state.nextStep,
    prevStep: state.prevStep,
    setEmail: state.setEmail,
    setPhone: state.setPhone,
    setShippingAddress: state.setShippingAddress,
    setBillingAddress: state.setBillingAddress,
    setBillingAddressSameAsShipping: state.setBillingAddressSameAsShipping,
    setShippingMethod: state.setShippingMethod,
    setPaymentMethod: state.setPaymentMethod,
    setAvailableShippingMethods: state.setAvailableShippingMethods,
    setOrderResult: state.setOrderResult,
    setProcessing: state.setProcessing,
    setError: state.setError,
    reset: state.reset,
  }));

export const useCheckoutValidation = () =>
  useCheckoutStore((state) => ({
    canProceedToDelivery: state.canProceedToDelivery,
    canProceedToPayment: state.canProceedToPayment,
    canPlaceOrder: state.canPlaceOrder,
  }));
