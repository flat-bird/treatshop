import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[var(--background)] border-t border-zinc-800 mt-auto">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="flex flex-col md:flex-row md:justify-evenly gap-8 mb-8">
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/shop" className="text-gray-400 hover:text-[var(--pink-accent)] transition-colors">
                  All Products
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">Information</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-[var(--pink-accent)] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-[var(--pink-accent)] transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold mb-4 text-[var(--foreground)]">Contact</h3>
            <ul className="space-y-2">
              <li>
                <a href="tel:780-510-0040" className="text-gray-400 hover:text-[var(--pink-accent)] transition-colors">
                  780-510-0040
                </a>
              </li> 
              <li>
              <a href="mailto:maggiestreatsadm@gmail.com" className="text-gray-400 hover:text-[var(--pink-accent)] transition-colors">
                  Email
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-zinc-800 pt-8 text-center">
          <p className="text-gray-400 mb-2">
            Made with Love in Campbell River BC
          </p>
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Maggie&apos;s Treats. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

