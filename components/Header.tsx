'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CartIcon from './CartIcon';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-[var(--background)] border-b border-zinc-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 justify-start" onClick={closeMenu}>
            <Image
              src="/logo.webp"
              alt="Maggie's Treats Logo"
              width={40}
              height={40}
              className="rounded"
            />
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--pink-accent)]">
              <span className="hidden sm:inline">Maggie&apos;s Treats</span>
              <span className="sm:hidden">Maggie&apos;s</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-6 justify-center">
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

          <div className="flex items-center gap-4">
            <div className="flex justify-end">
              <CartIcon />
            </div>
            
            <button
              onClick={toggleMenu}
              className="lg:hidden text-[var(--foreground)] hover:text-[var(--pink-accent)] transition-colors p-2"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              )}
            </button>
          </div>
        </nav>

        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-zinc-800 pt-4">
            <div className="flex flex-col gap-4">
              <Link
                href="/"
                className="text-[var(--foreground)] hover:text-[var(--pink-accent)] transition-colors font-medium py-2"
                onClick={closeMenu}
              >
                HOME
              </Link>
              <Link
                href="/shop"
                className="text-[var(--foreground)] hover:text-[var(--pink-accent)] transition-colors font-medium py-2"
                onClick={closeMenu}
              >
                SHOP TREATS
              </Link>
              <Link
                href="/about"
                className="text-[var(--foreground)] hover:text-[var(--pink-accent)] transition-colors font-medium py-2"
                onClick={closeMenu}
              >
                ABOUT
              </Link>
              <Link
                href="/faq"
                className="text-[var(--foreground)] hover:text-[var(--pink-accent)] transition-colors font-medium py-2"
                onClick={closeMenu}
              >
                FAQ
              </Link>
              <Link
                href="/contact"
                className="text-[var(--foreground)] hover:text-[var(--pink-accent)] transition-colors font-medium py-2"
                onClick={closeMenu}
              >
                CONTACT
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

