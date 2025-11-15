'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CartIcon from './CartIcon';

export default function Header() {

  return (
    <header className="bg-[var(--background)] border-b border-zinc-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <nav className="grid grid-cols-3 items-center">
          <Link href="/" className="flex items-center gap-3 justify-start">
            <Image
              src="/logo.webp"
              alt="Maggie's Treats Logo"
              width={40}
              height={40}
              className="rounded"
            />
            <span className="text-2xl font-bold text-[var(--pink-accent)]">
              Maggie&apos;s Treats
            </span>
          </Link>

          <div className="flex items-center gap-6 justify-center">
            <Link href="/" className="text-[var(--foreground)] hover:text-[var(--pink-accent)] transition-colors font-medium">
              HOME
            </Link>
            <Link href="/shop" className="text-[var(--foreground)] hover:text-[var(--pink-accent)] transition-colors font-medium whitespace-nowrap">
              SHOP TREATS
            </Link>
            <Link href="/about" className="text-[var(--foreground)] hover:text-[var(--pink-accent)] transition-colors font-medium">
              ABOUT
            </Link>
            <Link href="/faq" className="text-[var(--foreground)] hover:text-[var(--pink-accent)] transition-colors font-medium">
              FAQ
            </Link>
            <Link href="/contact" className="text-[var(--foreground)] hover:text-[var(--pink-accent)] transition-colors font-medium">
              CONTACT
            </Link>
          </div>

          <div className="flex justify-end">
            <CartIcon />
          </div>
        </nav>
      </div>
    </header>
  );
}

