import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/admin-auth';
import { stripe } from '@/lib/stripe';
import { clearCache } from '@/lib/cache';

export const runtime = 'edge';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const authError = await requireAuth();
  if (authError) {
    return authError;
  }

  try {
    const resolvedParams = await Promise.resolve(params);
    const productId = resolvedParams.id;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, isUnavailable, price } = body;

    const product = await stripe.products.retrieve(productId, {
      expand: ['marketing_features'],
    });

    const updateData: {
      name?: string;
      description?: string | null;
      marketing_features?: Array<{ name: string }> | null;
      default_price?: string;
    } = {};

    let newPrice = null;

    if (name !== undefined) {
      updateData.name = name;
    }

    if (description !== undefined) {
      updateData.description = description || null;
    }

    if (isUnavailable !== undefined) {
      const currentFeatures = product.marketing_features || [];
      const hasUnavailable = currentFeatures.some(
        (feature: { name?: string }) => feature.name === 'UNAVAILABLE'
      );

      if (isUnavailable && !hasUnavailable) {
        const otherFeatures = currentFeatures
          .filter((feature: { name?: string }): feature is { name: string } => 
            !!feature.name && feature.name !== 'UNAVAILABLE'
          )
          .map((feature) => ({ name: feature.name }));
        updateData.marketing_features = [
          ...otherFeatures,
          { name: 'UNAVAILABLE' },
        ];
      } else if (!isUnavailable && hasUnavailable) {
        const featuresWithoutUnavailable = currentFeatures
          .filter((feature: { name?: string }): feature is { name: string } => 
            !!feature.name && feature.name !== 'UNAVAILABLE'
          )
          .map((feature) => ({ name: feature.name }));
        
        if (featuresWithoutUnavailable.length === 0) {
          updateData.marketing_features = null;
        } else {
          updateData.marketing_features = featuresWithoutUnavailable;
        }
        console.log('Removing UNAVAILABLE, new features:', featuresWithoutUnavailable);
      }
    }

    if (price !== undefined && price !== null) {
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
        limit: 1,
      });

      const currency = prices.data.length > 0 ? prices.data[0].currency : 'usd';

      newPrice = await stripe.prices.create({
        product: productId,
        unit_amount: price,
        currency: currency,
      });

      updateData.default_price = newPrice.id;
    }

    if (Object.keys(updateData).length === 0 && !newPrice) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    console.log('Sending update to Stripe:', JSON.stringify(updateData, null, 2));
    const updatedProduct = await stripe.products.update(productId, updateData);
    console.log('Stripe response:', {
      id: updatedProduct.id,
      marketing_features: updatedProduct.marketing_features?.map((f: { name?: string }) => f.name),
    });

    clearCache('stripe-products');

    const responseData: {
      id: string;
      name: string;
      description: string | null;
      marketing_features: Array<{ name: string }>;
      isUnavailable: boolean;
      price?: {
        id: string;
        amount: number;
        currency: string;
      };
    } = {
      id: updatedProduct.id,
      name: updatedProduct.name,
      description: updatedProduct.description,
      marketing_features: (updatedProduct.marketing_features || [])
        .filter((feature: { name?: string }): feature is { name: string } => 
          !!feature.name
        )
        .map((feature) => ({ name: feature.name })),
      isUnavailable: updatedProduct.marketing_features?.some(
        (feature: { name?: string }) => feature.name === 'UNAVAILABLE'
      ) || false,
    };

    if (newPrice) {
      responseData.price = {
        id: newPrice.id,
        amount: newPrice.unit_amount || 0,
        currency: newPrice.currency,
      };
    }

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    console.error('Error updating product:', error);
    if (error && typeof error === 'object' && 'type' in error && 'statusCode' in error) {
      const stripeError = error as { type: string; statusCode: number };
      if (stripeError.type === 'StripeInvalidRequestError' && stripeError.statusCode === 404) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

