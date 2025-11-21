'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import Button from '@/components/Button';

function ThanksContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const success = searchParams.get('success');

  useEffect(() => {
    if (success === 'true') {
      clearCart();
    }
  }, [success, clearCart]);

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-2xl mx-auto">
        {success === 'true' ? (
          <>
            <div className="mb-8">
              <svg
                className="w-24 h-24 mx-auto text-[var(--pink-accent)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4 text-[var(--foreground)]">
              Thank You!
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Your order has been received. We appreciate your business!
            </p>
            <p className="text-gray-400 mb-8">
              You will receive an email shortly with your order details and receipt.
            </p>
            <div className="flex gap-4 justify-center">
              <Button href="/shop" variant="primary">
                Continue Shopping
              </Button>
              <Button href="/" variant="secondary">
                Back to Home
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold mb-4 text-[var(--foreground)]">
              Payment Status
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              We&apos;re processing your payment. Please check your email for confirmation.
            </p>
            <Button href="/" variant="primary">
              Back to Home
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ThanksPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-[var(--foreground)]">Loading...</p>
      </div>
    }>
      <ThanksContent />
    </Suspense>
  );
}

