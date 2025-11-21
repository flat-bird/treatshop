'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export interface CartItem {
  id: string;
  name: string;
  priceId: string;
  price: number;
  currency: string;
  image?: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

async function checkProductUnavailable(productId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/stripe/products/${productId}`);
    return !response.ok;
  } catch {
    return true;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const processingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const loadedItems = JSON.parse(savedCart);
        setItems(loadedItems);
        
        async function checkUnavailableItems() {
          const unavailableItems: string[] = [];
          
          await Promise.all(
            loadedItems.map(async (item: CartItem) => {
              const isUnavailable = await checkProductUnavailable(item.id);
              if (isUnavailable) {
                unavailableItems.push(item.id);
              }
            })
          );

          if (unavailableItems.length > 0) {
            setItems((prevItems) => {
              const removedItems = prevItems.filter((i) => unavailableItems.includes(i.id));
              removedItems.forEach((item) => {
                toast.error(`${item.name} is no longer available`, {
                  description: 'Item removed from cart',
                  id: `unavailable-${item.id}`,
                });
              });
              return prevItems.filter((i) => !unavailableItems.includes(i.id));
            });
          }
        }

        checkUnavailableItems();
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, mounted]);

  const addItem = async (item: Omit<CartItem, 'quantity'>) => {
    if (processingRef.current.has(item.id)) return;
    
    processingRef.current.add(item.id);
    
    const isUnavailable = await checkProductUnavailable(item.id);
    if (isUnavailable) {
      toast.error(`${item.name} is no longer available`, {
        description: 'This item cannot be added to cart',
        id: `unavailable-${item.id}`,
      });
      processingRef.current.delete(item.id);
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        toast.success(`${item.name} quantity updated!`, {
          description: `Now in cart: ${newQuantity}`,
          id: `add-${item.id}`,
        });
        processingRef.current.delete(item.id);
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: newQuantity } : i
        );
      }
      toast.success(`${item.name} added to cart!`, {
        description: 'Item successfully added',
        id: `add-${item.id}`,
      });
      processingRef.current.delete(item.id);
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  const removeItem = async (id: string) => {
    const item = items.find((i) => i.id === id);
    await new Promise(resolve => setTimeout(resolve, 500));
    if (item) {
      toast.success(`${item.name} removed from cart`, {
        description: 'Item removed successfully',
        id: `remove-${id}-${Date.now()}`,
      });
    }
    setItems((prevItems) => prevItems.filter((i) => i.id !== id));
  };

  const updateQuantity = async (id: string, quantity: number) => {
    const item = items.find((i) => i.id === id);
    if (quantity <= 0) {
      await removeItem(id);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    if (item) {
      toast.success(`Quantity updated`, {
        description: `${item.name}: ${quantity} in cart`,
        id: `update-${id}-${quantity}-${Date.now()}`,
      });
    }
    setItems((prevItems) =>
      prevItems.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  };

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem('cart');
  }, []);

  const getTotalItems = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

