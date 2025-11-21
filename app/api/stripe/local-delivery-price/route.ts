import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export const runtime = 'edge';

export async function GET() {
  try {
    const localDeliveryProductId = 'prod_TSgjj9alx4MKo3';
    
    const prices = await stripe.prices.list({
      product: localDeliveryProductId,
      active: true,
      limit: 1,
    });

    if (prices.data.length === 0) {
      return NextResponse.json(
        { error: 'Local delivery product price not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ priceId: prices.data[0].id });
  } catch (error) {
    console.error('Error fetching local delivery price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch local delivery price' },
      { status: 500 }
    );
  }
}

