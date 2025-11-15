import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { stripe } from '@/lib/stripe';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) {
    return authError;
  }

  try {
    const products = await stripe.products.list({
      active: true,
      limit: 100,
      expand: ['data.marketing_features'],
    });

    const productsWithPrices = await Promise.all(
      products.data.map(async (product) => {
        const isShipping = product.id === process.env.NEXT_PUBLIC_SHIPPING_PRODUCT_ID;
        if (isShipping) {
          return null;
        }

        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
          limit: 1,
        });

        const isUnavailable = product.marketing_features?.some(
          (feature: { name?: string }) => feature.name === 'UNAVAILABLE'
        );

        const price = prices.data[0];
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          images: product.images,
          marketing_features: product.marketing_features || [],
          isUnavailable,
          price: price && price.unit_amount !== null ? {
            id: price.id,
            amount: price.unit_amount,
            currency: price.currency,
          } : null,
        };
      })
    );

    const filteredProducts = productsWithPrices.filter(p => p !== null);
    return NextResponse.json(filteredProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

