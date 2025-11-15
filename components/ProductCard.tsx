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

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  if (!product.price) {
    return null;
  }

  const price = product.price;

  const handleAddToCart = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsAdding(true);
    await addItem({
      id: product.id,
      name: product.name,
      priceId: price.id,
      price: price.amount / 100,
      currency: price.currency,
      image: product.images[0],
    });
    setIsAdding(false);
  };

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currency.toUpperCase(),
  }).format(price.amount / 100);

  return (
    <Link href={`/shop/${product.id}`} className="block">
      <div className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-[var(--pink-accent)] transition-colors cursor-pointer">
        <div className="relative w-full h-64 bg-gray-800">
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
        <div className="p-4">
          <h3 className="text-xl font-semibold mb-2 text-[var(--foreground)]">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-gray-400 mb-4 line-clamp-2">{product.description}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-[var(--pink-accent)]">
              {formattedPrice}
            </span>
            <Button 
              onClick={handleAddToCart} 
              variant="primary" 
              className="text-sm"
              disabled={isAdding}
            >
              {isAdding ? (
                <LoadingSpinner size="sm" className="inline-block" />
              ) : (
                'Add to Cart'
              )}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

