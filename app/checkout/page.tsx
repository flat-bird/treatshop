'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart-context';
import Cart from '@/components/Cart';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { items, addItem, clearCart } = useCart();
  const [deliveryMethod, setDeliveryMethod] = useState<'local' | 'shipping'>('local');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const shippingProductId = process.env.NEXT_PUBLIC_SHIPPING_PRODUCT_ID;

  useEffect(() => {
    if (items.length === 0) {
      router.push('/shop');
    }
  }, [items, router]);

  const handleCheckout = async () => {
    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let checkoutItems = items.map((item) => ({
        priceId: item.priceId,
        quantity: item.quantity,
      }));

      if (deliveryMethod === 'local') {
        try {
          const localDeliveryResponse = await fetch('/api/stripe/local-delivery-price');
          if (localDeliveryResponse.ok) {
            const localDeliveryData = await localDeliveryResponse.json();
            if (localDeliveryData.priceId) {
              checkoutItems.push({
                priceId: localDeliveryData.priceId,
                quantity: 1,
              });
            }
          }
        } catch (err) {
          console.error('Error fetching local delivery price:', err);
        }
      }

      if (deliveryMethod === 'shipping' && shippingProductId) {
        try {
          const shippingResponse = await fetch('/api/stripe/shipping-price');
          if (shippingResponse.ok) {
            const shippingData = await shippingResponse.json();
            if (shippingData.priceId) {
              checkoutItems.push({
                priceId: shippingData.priceId,
                quantity: 1,
              });
            }
          }
        } catch (err) {
          console.error('Error fetching shipping price:', err);
        }
      }

      const response = await fetch('/api/stripe/create-payment-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: checkoutItems, deliveryMethod }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Payment link creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          unavailableItems: data.unavailableItems,
        });
        throw new Error(data.error || 'Failed to create payment link');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      console.error('Error in checkout process:', err);
      if (err instanceof Error) {
        console.error(`Error message: ${err.message}`);
        console.error(`Error stack: ${err.stack}`);
      }
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };


  if (items.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center text-[var(--foreground)]">
        Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-[var(--foreground)]">
            Your Cart
          </h2>
          <Cart />
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4 text-[var(--foreground)]">
            Delivery Method
          </h2>
          <div className="space-y-4 mb-6">
            <label className="flex items-center p-4 bg-zinc-900 rounded-lg border border-zinc-800 cursor-pointer hover:border-[var(--pink-accent)] transition-colors">
              <input
                type="radio"
                name="delivery"
                value="local"
                checked={deliveryMethod === 'local'}
                onChange={(e) => setDeliveryMethod(e.target.value as 'local' | 'shipping')}
                className="mr-3 w-4 h-4 text-[var(--pink-accent)]"
              />
              <span className="text-[var(--foreground)]">Local Delivery (Campbell River Only)</span>
            </label>
            <label className="flex items-center p-4 bg-zinc-900 rounded-lg border border-zinc-800 cursor-pointer hover:border-[var(--pink-accent)] transition-colors">
              <input
                type="radio"
                name="delivery"
                value="shipping"
                checked={deliveryMethod === 'shipping'}
                onChange={(e) => setDeliveryMethod(e.target.value as 'local' | 'shipping')}
                className="mr-3 w-4 h-4 text-[var(--pink-accent)]"
              />
              <span className="text-[var(--foreground)]">Shipping</span>
            </label>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-400">
              {error}
            </div>
          )}

          <Button
            onClick={handleCheckout}
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </Button>
        </div>
      </div>
    </div>
  );
}

