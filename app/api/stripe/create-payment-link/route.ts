import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      );
    }

    const unavailableItems: string[] = [];

    await Promise.all(
      items.map(async (item: { priceId: string; quantity: number }) => {
        try {
          const price = await stripe.prices.retrieve(item.priceId);
          
          if (typeof price.product === 'string') {
            const product = await stripe.products.retrieve(price.product, {
              expand: ['marketing_features'],
            });
            
            const isArchived = !product.active || product.metadata?.archived === 'true';
            const isUnavailable = product.marketing_features?.some(
              (feature: { name?: string }) => feature.name === 'UNAVAILABLE'
            );
            
            if (isArchived || isUnavailable) {
              unavailableItems.push(product.name || price.product);
            }
          } else {
            if (price.product.deleted) {
              unavailableItems.push('Unknown product');
            } else {
              const product = await stripe.products.retrieve(price.product.id, {
                expand: ['marketing_features'],
              });
              
              const isArchived = !product.active || product.metadata?.archived === 'true';
              const isUnavailable = product.marketing_features?.some(
                (feature: { name?: string }) => feature.name === 'UNAVAILABLE'
              );
              
              if (isArchived || isUnavailable) {
                unavailableItems.push(product.name || 'Unknown product');
              }
            }
          }
        } catch (error) {
          console.error(`Error checking price ${item.priceId}:`, error);
          if (error instanceof Error) {
            console.error(`Error message: ${error.message}`);
            console.error(`Error stack: ${error.stack}`);
          }
          unavailableItems.push('Unknown product');
        }
      })
    );

    if (unavailableItems.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some items in your cart are no longer available',
          unavailableItems 
        },
        { status: 400 }
      );
    }

    const lineItems = items.map((item: { priceId: string; quantity: number }) => ({
      price: item.priceId,
      quantity: item.quantity,
    }));

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;
    const successUrl = `${baseUrl}/thanks?success=true`;

    const paymentLink = await stripe.paymentLinks.create({
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: ['CA'],
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: successUrl,
        },
      },
    });

    return NextResponse.json({ url: paymentLink.url });
  } catch (error) {
    console.error('Error creating payment link:', error);
    if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
    }
    if (error && typeof error === 'object' && 'type' in error) {
      console.error(`Stripe error type: ${error.type}`);
    }
    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 }
    );
  }
}

