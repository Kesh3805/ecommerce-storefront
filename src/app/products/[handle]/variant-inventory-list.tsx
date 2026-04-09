'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { StorefrontPublicVariant } from '@/services/storefront.service';

interface VariantInventoryListProps {
  productId: number;
  variants: StorefrontPublicVariant[];
}

function formatCurrency(value?: string): string {
  if (!value) {
    return 'Price unavailable';
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(parsed);
}

export function VariantInventoryList({ productId, variants }: VariantInventoryListProps) {
  const [inventoryByVariantId, setInventoryByVariantId] = useState<Record<number, number>>({});
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryLoadFailed, setInventoryLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadInventory = async () => {
      setInventoryLoading(true);
      setInventoryLoadFailed(false);
      setInventoryByVariantId({});

      try {
        const response = await fetch(`/api/products/${productId}/variant-inventory`, {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch inventory (${response.status})`);
        }

        const payload = (await response.json()) as {
          inventory?: Array<{ variant_id: number; inventory_available: number }>;
        };

        const nextByVariantId: Record<number, number> = {};
        for (const item of payload.inventory || []) {
          nextByVariantId[item.variant_id] = item.inventory_available;
        }

        if (!cancelled) {
          setInventoryByVariantId(nextByVariantId);
        }
      } catch {
        if (!cancelled) {
          setInventoryLoadFailed(true);
        }
      } finally {
        if (!cancelled) {
          setInventoryLoading(false);
        }
      }
    };

    void loadInventory();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const getVariantInventory = (variantId: number): number | null => {
    if (Object.prototype.hasOwnProperty.call(inventoryByVariantId, variantId)) {
      return inventoryByVariantId[variantId];
    }

    if (inventoryLoading || inventoryLoadFailed) {
      return null;
    }

    return 0;
  };

  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Variants</h2>
      <div className="space-y-2">
        {variants.map((variant) => {
          const variantPrice = formatCurrency(variant.price);
          const variantCompareAtPrice = variant.compare_at_price ? formatCurrency(variant.compare_at_price) : null;
          const variantInventory = getVariantInventory(variant.variant_id);
          const hasInventory = (variantInventory ?? 0) > 0;

          return (
            <div key={variant.variant_id} className="rounded-md border bg-background px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{variant.title}</p>
                {inventoryLoadFailed ? (
                  <p className="text-xs font-medium text-muted-foreground">Inventory unavailable</p>
                ) : variantInventory == null ? (
                  <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading inventory...
                  </p>
                ) : (
                  <p className={`text-xs font-medium ${hasInventory ? 'text-green-700' : 'text-amber-700'}`}>
                    {hasInventory ? 'In stock' : 'Out of stock'}
                  </p>
                )}
              </div>
              <p className="mt-1 text-sm text-foreground/80">
                {variantPrice}
                {variantCompareAtPrice ? <span className="ml-2 text-muted-foreground line-through">{variantCompareAtPrice}</span> : null}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
