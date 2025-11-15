'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/lib/cart-context';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Product {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  marketing_features: Array<{
    name: string;
    type: string;
  }>;
  price: {
    id: string;
    amount: number;
    currency: string;
  } | null;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/stripe/products/${params.id}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch product');
        }
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const handleAddToCart = async () => {
    if (!product || !product.price) return;

    setIsAdding(true);
    await addItem({
      id: product.id,
      name: product.name,
      priceId: product.price.id,
      price: product.price.amount / 100,
      currency: product.price.currency,
      image: product.images[0],
    });
    setIsAdding(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-[var(--foreground)]">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product || !product.price) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            {error || 'Product not found'}
          </p>
          <Button href="/shop" variant="primary">
            Back to Shop
          </Button>
        </div>
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: product.price.currency.toUpperCase(),
  }).format(product.price.amount / 100);

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <Button
        onClick={() => router.back()}
        variant="secondary"
        className="mb-8"
      >
        ← Back to Shop
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="relative w-full aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              No Image
            </div>
          )}
        </div>

        <div>
          <h1 className="text-4xl font-bold mb-4 text-[var(--foreground)]">
            {product.name}
          </h1>

          <div className="mb-6">
            <span className="text-3xl font-bold text-[var(--pink-accent)]">
              {formattedPrice}
            </span>
          </div>

          {product.description && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3 text-[var(--foreground)]">
                Description
              </h2>
              <p className="text-gray-400 whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          { /* product.marketing_features && product.marketing_features.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3 text-[var(--foreground)]">
                Features
              </h2>
              <ul className="space-y-2">
                {product.marketing_features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-gray-400"
                  >
                    <svg
                      className="w-5 h-5 text-[var(--pink-accent)] mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>{feature.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) */ }

          <Button
            onClick={handleAddToCart}
            variant="primary"
            className="w-full text-lg py-4"
            disabled={isAdding}
          >
            {isAdding ? (
              <>
                <LoadingSpinner size="sm" className="inline-block mr-2" />
                Adding to Cart...
              </>
            ) : (
              'Add to Cart'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

