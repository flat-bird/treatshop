import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export const runtime = 'edge';

export async function GET() {
  try {
    const shippingProductId = process.env.NEXT_PUBLIC_SHIPPING_PRODUCT_ID;
    
    if (!shippingProductId) {
      return NextResponse.json(
        { error: 'Shipping product ID not configured' },
        { status: 400 }
      );
    }

    const prices = await stripe.prices.list({
      product: shippingProductId,
      active: true,
      limit: 1,
    });

    if (prices.data.length === 0) {
      return NextResponse.json(
        { error: 'Shipping product price not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ priceId: prices.data[0].id });
  } catch (error) {
    console.error('Error fetching shipping price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping price' },
      { status: 500 }
    );
  }
}

