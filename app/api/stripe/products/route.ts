import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getCache, setCache } from '@/lib/cache';

export const runtime = 'edge';

async function fetchProductsData() {
  const products = await stripe.products.list({
    active: true,
    limit: 100,
    expand: ['data.marketing_features'],
  });

  const unarchivedProducts = products.data.filter(
    (product) => {
      const isArchived = product.metadata?.archived === 'true';
      const isShipping = product.id === process.env.NEXT_PUBLIC_SHIPPING_PRODUCT_ID;
      const isUnavailable = product.marketing_features?.some(
        (feature: { name?: string }) => feature.name === 'UNAVAILABLE'
      );
      return !isArchived && !isShipping && !isUnavailable;
    }
  );

  const productsWithPrices = await Promise.all(
    unarchivedProducts.map(async (product) => {
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 1,
      });

      const price = prices.data[0];
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        price: price && price.unit_amount !== null ? {
          id: price.id,
          amount: price.unit_amount,
          currency: price.currency,
        } : null,
      };
    })
  );

  return productsWithPrices.filter(p => p.price !== null);
}

async function getCachedProducts() {
  const cacheKey = 'stripe-products';
  const cached = getCache(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const data = await fetchProductsData();
  setCache(cacheKey, data);
  
  return data;
}

export async function GET() {
  try {
    const productsWithPrices = await getCachedProducts();
    return NextResponse.json(productsWithPrices);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

