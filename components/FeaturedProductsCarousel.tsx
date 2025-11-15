'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

interface Product {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  price: {
    id: string;
    amount: number;
    currency: string;
  } | null;
}

interface FeaturedProductsCarouselProps {
  products: Product[];
}

export default function FeaturedProductsCarousel({ products }: FeaturedProductsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const { addItem } = useCart();

  const itemsPerView = 3;
  const maxIndex = Math.max(0, products.length - itemsPerView);

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const handleAddToCart = async (product: Product) => {
    if (!product.price) return;
    
    const price = product.price;
    setIsAdding(product.id);
    await addItem({
      id: product.id,
      name: product.name,
      priceId: price.id,
      price: price.amount / 100,
      currency: price.currency,
      image: product.images[0],
    });
    setIsAdding(null);
  };

  const visibleProducts = products.slice(currentIndex, currentIndex + itemsPerView);

  return (
    <section className="container mx-auto px-4 pt-10 pb-20">
      <h2 className="text-4xl font-bold mb-12 text-center text-[var(--foreground)]">
        Featured Items
      </h2>
      
      <div className="relative">
        {products.length > itemsPerView && (
          <>
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[var(--pink-accent)] text-white p-3 rounded-full hover:bg-[var(--pink-accent-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed -translate-x-4"
              aria-label="Previous products"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToNext}
              disabled={currentIndex >= maxIndex}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[var(--pink-accent)] text-white p-3 rounded-full hover:bg-[var(--pink-accent-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed translate-x-4"
              aria-label="Next products"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleProducts.map((product) => {
            if (!product.price) return null;

            const price = product.price;
            const formattedPrice = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: price.currency.toUpperCase(),
            }).format(price.amount / 100);

            return (
              <div
                key={product.id}
                className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-[var(--pink-accent)] transition-colors"
              >
                <Link href={`/shop/${product.id}`} className="block">
                  <div className="relative w-full h-80 bg-gray-800">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        No Image
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-6">
                  <Link href={`/shop/${product.id}`}>
                    <h3 className="text-2xl font-semibold mb-3 text-[var(--foreground)] hover:text-[var(--pink-accent)] transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  {product.description && (
                    <p className="text-gray-400 mb-4 line-clamp-3">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-[var(--pink-accent)]">
                      {formattedPrice}
                    </span>
                    <Button
                      onClick={() => {
                        handleAddToCart(product);
                      }}
                      variant="primary"
                      className="text-xs px-3 py-1.5"
                      disabled={isAdding === product.id}
                    >
                      {isAdding === product.id ? (
                        <LoadingSpinner size="sm" className="inline-block" />
                      ) : (
                        'Add to Cart'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center mt-12">
        <Button href="/shop" variant="primary" className="text-lg px-8 py-4">
          View All Products
        </Button>
      </div>
    </section>
  );
}

