import { useState, useCallback, useMemo } from 'react';
import type { ProductVariant, ProductOption, SelectedOption } from '@/types';

// ============================================================================
// VARIANT SELECTION HOOK
// ============================================================================

interface UseVariantSelectionParams {
  variants: ProductVariant[];
  options: ProductOption[];
  initialVariantId?: string;
}

interface UseVariantSelectionReturn {
  selectedOptions: Record<string, string>;
  selectedVariant: ProductVariant | null;
  availableOptions: Record<string, Set<string>>;
  selectOption: (optionName: string, value: string) => void;
  isOptionAvailable: (optionName: string, value: string) => boolean;
  isOptionSelected: (optionName: string, value: string) => boolean;
  reset: () => void;
}

/**
 * Hook for managing variant selection based on product options
 * 
 * This implements the variant resolution logic:
 * 1. User selects options (e.g., Color: Black, Size: M)
 * 2. Hook finds the matching variant based on selected options
 * 3. Available options are updated based on what variants exist
 * 
 * Example:
 * - Product has variants: Black/S, Black/M, White/S, White/L
 * - User selects Color: Black
 * - Available sizes become: S, M (White/L is excluded because Black/L doesn't exist)
 */
export function useVariantSelection({
  variants,
  options,
  initialVariantId,
}: UseVariantSelectionParams): UseVariantSelectionReturn {
  // Initialize selected options from initial variant or first available
  const initialOptions = useMemo(() => {
    if (initialVariantId) {
      const variant = variants.find((v) => v.id === initialVariantId);
      if (variant) {
        return variant.selectedOptions.reduce(
          (acc, opt) => ({ ...acc, [opt.name]: opt.value }),
          {} as Record<string, string>
        );
      }
    }
    
    // Default to first variant's options
    if (variants.length > 0) {
      return variants[0].selectedOptions.reduce(
        (acc, opt) => ({ ...acc, [opt.name]: opt.value }),
        {} as Record<string, string>
      );
    }
    
    return {};
  }, [variants, initialVariantId]);
  
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(initialOptions);
  
  // Find the variant that matches all selected options
  const selectedVariant = useMemo(() => {
    if (Object.keys(selectedOptions).length === 0) return null;
    
    return variants.find((variant) =>
      variant.selectedOptions.every(
        (opt) => selectedOptions[opt.name] === opt.value
      )
    ) ?? null;
  }, [variants, selectedOptions]);
  
  // Calculate which option values are available given current selections
  const availableOptions = useMemo(() => {
    const available: Record<string, Set<string>> = {};
    
    // Initialize with all options
    options.forEach((option) => {
      available[option.name] = new Set();
    });
    
    // For each variant, check if it's compatible with current selections
    variants.forEach((variant) => {
      // Check if this variant matches all currently selected options
      const isCompatible = variant.selectedOptions.every((opt) => {
        const selected = selectedOptions[opt.name];
        // If this option isn't selected yet, or matches, it's compatible
        return !selected || selected === opt.value;
      });
      
      // If compatible, add all its option values as available
      if (isCompatible) {
        variant.selectedOptions.forEach((opt) => {
          available[opt.name].add(opt.value);
        });
      }
    });
    
    return available;
  }, [variants, options, selectedOptions]);
  
  // Select an option value
  const selectOption = useCallback((optionName: string, value: string) => {
    setSelectedOptions((prev) => {
      const next = { ...prev, [optionName]: value };
      
      // Check if current selections are still valid with new selection
      // If not, reset other options that conflict
      const matchingVariants = variants.filter((variant) =>
        variant.selectedOptions.some(
          (opt) => opt.name === optionName && opt.value === value
        )
      );
      
      // Remove selections that don't exist in any matching variant
      Object.keys(next).forEach((key) => {
        if (key === optionName) return;
        
        const valueStillValid = matchingVariants.some((variant) =>
          variant.selectedOptions.some(
            (opt) => opt.name === key && opt.value === next[key]
          )
        );
        
        if (!valueStillValid) {
          // Find first available value for this option
          const firstAvailable = matchingVariants[0]?.selectedOptions.find(
            (opt) => opt.name === key
          )?.value;
          
          if (firstAvailable) {
            next[key] = firstAvailable;
          } else {
            delete next[key];
          }
        }
      });
      
      return next;
    });
  }, [variants]);
  
  // Check if an option value is available
  const isOptionAvailable = useCallback(
    (optionName: string, value: string) => {
      return availableOptions[optionName]?.has(value) ?? false;
    },
    [availableOptions]
  );
  
  // Check if an option value is selected
  const isOptionSelected = useCallback(
    (optionName: string, value: string) => {
      return selectedOptions[optionName] === value;
    },
    [selectedOptions]
  );
  
  // Reset to initial state
  const reset = useCallback(() => {
    setSelectedOptions(initialOptions);
  }, [initialOptions]);
  
  return {
    selectedOptions,
    selectedVariant,
    availableOptions,
    selectOption,
    isOptionAvailable,
    isOptionSelected,
    reset,
  };
}

// ============================================================================
// VARIANT LOOKUP UTILITY
// ============================================================================

/**
 * Find a variant by its selected options
 */
export function findVariantByOptions(
  variants: ProductVariant[],
  selectedOptions: Record<string, string>
): ProductVariant | null {
  const optionEntries = Object.entries(selectedOptions);
  
  if (optionEntries.length === 0) return null;
  
  return variants.find((variant) =>
    optionEntries.every(([name, value]) =>
      variant.selectedOptions.some(
        (opt) => opt.name === name && opt.value === value
      )
    )
  ) ?? null;
}

/**
 * Get all unique option values across variants
 */
export function getUniqueOptionValues(
  variants: ProductVariant[],
  optionName: string
): string[] {
  const values = new Set<string>();
  
  variants.forEach((variant) => {
    const option = variant.selectedOptions.find(
      (opt) => opt.name.toLowerCase() === optionName.toLowerCase()
    );
    if (option) {
      values.add(option.value);
    }
  });
  
  return Array.from(values);
}

/**
 * Check if all options have been selected
 */
export function areAllOptionsSelected(
  options: ProductOption[],
  selectedOptions: Record<string, string>
): boolean {
  return options.every((option) => selectedOptions[option.name] !== undefined);
}
