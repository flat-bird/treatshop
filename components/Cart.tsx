'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/lib/cart-context';
import LoadingSpinner from './LoadingSpinner';

export default function Cart() {
  const { items, updateQuantity, removeItem, getTotalPrice } = useCart();
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-4 bg-zinc-900 rounded-lg p-4 border border-zinc-800"
        >
          {item.image && (
            <div className="relative w-20 h-20 bg-gray-800 rounded">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover rounded"
                sizes="80px"
              />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-[var(--foreground)]">{item.name}</h3>
            <p className="text-sm text-gray-400">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: item.currency.toUpperCase(),
              }).format(item.price)} each
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setLoadingItems(prev => new Set(prev).add(item.id));
                await updateQuantity(item.id, item.quantity - 1);
                setLoadingItems(prev => {
                  const next = new Set(prev);
                  next.delete(item.id);
                  return next;
                });
              }}
              disabled={loadingItems.has(item.id)}
              className="w-8 h-8 rounded bg-gray-800 hover:bg-gray-700 text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingItems.has(item.id) ? (
                <LoadingSpinner size="sm" className="inline-block" />
              ) : (
                '-'
              )}
            </button>
            <span className="w-8 text-center text-[var(--foreground)]">{item.quantity}</span>
            <button
              onClick={async () => {
                setLoadingItems(prev => new Set(prev).add(item.id));
                await updateQuantity(item.id, item.quantity + 1);
                setLoadingItems(prev => {
                  const next = new Set(prev);
                  next.delete(item.id);
                  return next;
                });
              }}
              disabled={loadingItems.has(item.id)}
              className="w-8 h-8 rounded bg-gray-800 hover:bg-gray-700 text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingItems.has(item.id) ? (
                <LoadingSpinner size="sm" className="inline-block" />
              ) : (
                '+'
              )}
            </button>
          </div>
          <div className="text-right">
            <p className="font-semibold text-[var(--pink-accent)]">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: item.currency.toUpperCase(),
              }).format(item.price * item.quantity)}
            </p>
            <button
              onClick={async () => {
                setLoadingItems(prev => new Set(prev).add(item.id));
                await removeItem(item.id);
                setLoadingItems(prev => {
                  const next = new Set(prev);
                  next.delete(item.id);
                  return next;
                });
              }}
              disabled={loadingItems.has(item.id)}
              className="text-xs text-red-400 hover:text-red-300 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingItems.has(item.id) ? (
                <LoadingSpinner size="sm" className="inline-block" />
              ) : (
                'Remove'
              )}
            </button>
          </div>
        </div>
      ))}
      <div className="border-t border-zinc-800 pt-4">
        <div className="flex justify-between items-center">
          <span className="text-xl font-semibold text-[var(--foreground)]">Total:</span>
          <span className="text-2xl font-bold text-[var(--pink-accent)]">
            {items.length > 0
              ? new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: items[0].currency.toUpperCase(),
                }).format(getTotalPrice())
              : '$0.00'}
          </span>
        </div>
      </div>
    </div>
  );
}

