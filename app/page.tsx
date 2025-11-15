'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/Button';
import ProductCard from '@/components/ProductCard';
import FeaturedProductsCarousel from '@/components/FeaturedProductsCarousel';

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

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedProducts() {
      try {
        const response = await fetch('/api/stripe/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const products = await response.json();

        // Shuffle and take 5 random products
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        setFeaturedProducts(shuffled.slice(0, 5));
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedProducts();
  }, []);

  return (
    <div className="min-h-screen">
      <section className="bg-[var(--pink-accent)] py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6 text-white">
                Welcome to <span className="text-white">Maggie&apos;s Treats</span>
              </h1>
              <p className="text-xl text-white/90 mb-8">
                Maggie&apos;s Treats was founded on the premise of feeding our Maggie and her pawed siblings only the best. We are an all natural pet treat company aimed at providing only the best available treats to the four-legged community.
              </p>
              <Button href="/shop" variant="secondary" className="text-lg px-8 py-4 bg-white text-[var(--pink-accent)] hover:bg-black-100 hover:text-[var(--pink-accent)] border-white">
                SHOP ONLINE
              </Button>
            </div>
            <div className="relative w-full h-96 rounded-lg overflow-hidden">
              <Image
                src="/dawg.webp"
                alt="Maggie's Treats"
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pt-20">
        <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800 mb-8">
          <p className="text-xl text-gray-400 text-center leading-relaxed">
            Questions or want to order? Call or text us at{' '}
            <a
              href="tel:7805100040"
              className="text-[var(--pink-accent)] hover:text-[var(--pink-accent-dark)] transition-colors font-semibold"
            >
              780-510-0040
            </a>
            {' '}
          </p>
        </div>
      </section>

      {!loading && featuredProducts.length > 0 && (
        <FeaturedProductsCarousel products={featuredProducts} />
      )}

      <section className="bg-zinc-900 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center text-[var(--foreground)]">
            Why Choose Maggie&apos;s Treats?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-[var(--background)] rounded-lg border border-zinc-800">
              <div className="w-16 h-16 mx-auto mb-4 bg-[var(--pink-accent)]/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[var(--pink-accent)]"
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
              <h3 className="text-xl font-semibold mb-2 text-[var(--foreground)]">
                All Natural
              </h3>
              <p className="text-gray-400">
                Made with only the finest natural ingredients
              </p>
            </div>
            <div className="text-center p-6 bg-[var(--background)] rounded-lg border border-zinc-800">
              <div className="w-16 h-16 mx-auto mb-4 bg-[var(--pink-accent)]/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[var(--pink-accent)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[var(--foreground)]">
                Hand Made
              </h3>
              <p className="text-gray-400">
                Crafted with love and care by our skilled bakers
              </p>
            </div>
            <div className="text-center p-6 bg-[var(--background)] rounded-lg border border-zinc-800">
              <div className="w-16 h-16 mx-auto mb-4 bg-[var(--pink-accent)]/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[var(--pink-accent)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[var(--foreground)]">
                Only the Best
              </h3>
              <p className="text-gray-400">
                Premium quality treats for your furry friends
              </p>
            </div>
          </div>
        </div>
      </section>

      { /* <section className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-[var(--foreground)]">
              Store Location
            </h2>
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <p className="text-lg text-[var(--foreground)] mb-2">
                Visit us at:
              </p>
              <p className="text-gray-400">
                123 Main Street<br />
                Anytown, ST 12345
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-6 text-[var(--foreground)]">
              Contact Us
            </h2>
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <p className="text-lg text-[var(--foreground)] mb-2">
                Get in touch:
              </p>
              <a
                href="tel:+1234567890"
                className="text-[var(--pink-accent)] hover:text-[var(--pink-accent-dark)] text-lg transition-colors"
              >
                (123) 456-7890
              </a>
            </div>
          </div>
        </div>
      </section> */ }
    </div>
  );
}
