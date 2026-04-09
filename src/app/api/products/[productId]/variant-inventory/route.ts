import { NextResponse } from 'next/server';
import { storefrontService } from '@/services/storefront.service';

interface RouteContext {
  params: Promise<{ productId: string }>;
}

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: RouteContext) {
  const { productId } = await context.params;
  const parsedProductId = Number(productId);

  if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
    return NextResponse.json({ error: 'Invalid productId' }, { status: 400 });
  }

  try {
    const inventory = await storefrontService.getProductVariantInventory(parsedProductId);
    return NextResponse.json({ inventory });
  } catch {
    return NextResponse.json({ error: 'Failed to load variant inventory' }, { status: 500 });
  }
}
