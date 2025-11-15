import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const productId = resolvedParams.id;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const product = await stripe.products.retrieve(productId, {
      expand: ['marketing_features'],
    });

    if (product.metadata?.archived === 'true') {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const isUnavailable = product.marketing_features?.some(
      (feature: { name?: string }) => feature.name === 'UNAVAILABLE'
    );

    if (isUnavailable) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 1,
    });

    if (prices.data.length === 0) {
      return NextResponse.json(
        { error: 'Product price not found' },
        { status: 404 }
      );
    }

    const price = prices.data[0];
    if (!price.unit_amount) {
      return NextResponse.json(
        { error: 'Product price amount not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: product.id,
      name: product.name,
      description: product.description,
      images: product.images,
      marketing_features: product.marketing_features || [],
      price: {
        id: price.id,
        amount: price.unit_amount,
        currency: price.currency,
      },
    });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    if (error.type === 'StripeInvalidRequestError' && error.statusCode === 404) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

