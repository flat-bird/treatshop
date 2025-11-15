'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  marketing_features: Array<{
    name: string;
    type: string;
  }>;
  isUnavailable: boolean;
  price: {
    id: string;
    amount: number;
    currency: string;
  } | null;
}

interface EditingState {
  [productId: string]: {
    name: string;
    description: string;
    price: string;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingState>({});
  const [saving, setSaving] = useState<{ [productId: string]: boolean }>({});
  const [toggling, setToggling] = useState<{ [productId: string]: boolean }>({});
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/admin/auth');
        const data = await response.json();
        if (!data.authenticated) {
          router.push('/admin');
          return;
        }
      } catch (err) {
        console.error('Auth check error:', err);
        router.push('/admin');
        return;
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (checkingAuth) return;

    async function fetchProducts() {
      try {
        const response = await fetch('/api/admin/products');
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/admin');
            return;
          }
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error('Error fetching products:', err);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [checkingAuth, router]);

  const handleEdit = (product: Product) => {
    setEditing({
      ...editing,
      [product.id]: {
        name: product.name,
        description: product.description || '',
        price: product.price
          ? (product.price.amount / 100).toFixed(2)
          : '0.00',
      },
    });
  };

  const handleCancelEdit = (productId: string) => {
    const newEditing = { ...editing };
    delete newEditing[productId];
    setEditing(newEditing);
  };

  const handleSave = async (product: Product) => {
    const editState = editing[product.id];
    if (!editState) return;

    setSaving({ ...saving, [product.id]: true });

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editState.name,
          description: editState.description,
          price: editState.price ? Math.round(parseFloat(editState.price) * 100) : undefined,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin');
          return;
        }
        const data = await response.json();
        throw new Error(data.error || 'Failed to update product');
      }

      const updatedProduct = await response.json();
      setProducts(
        products.map((p) =>
          p.id === product.id
            ? {
                ...p,
                name: updatedProduct.name,
                description: updatedProduct.description,
                price: updatedProduct.price || p.price,
              }
            : p
        )
      );

      handleCancelEdit(product.id);
      toast.success('Product updated successfully');
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setSaving({ ...saving, [product.id]: false });
    }
  };

  const handleToggleUnavailable = async (product: Product) => {
    setToggling({ ...toggling, [product.id]: true });

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isUnavailable: !product.isUnavailable,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin');
          return;
        }
        const data = await response.json();
        throw new Error(data.error || 'Failed to update product');
      }

      const updatedProduct = await response.json();
      setProducts(
        products.map((p) =>
          p.id === product.id
            ? {
                ...p,
                isUnavailable: updatedProduct.isUnavailable,
                marketing_features: updatedProduct.marketing_features,
              }
            : p
        )
      );

      toast.success(
        updatedProduct.isUnavailable
          ? 'Product unlisted successfully'
          : 'Product listed successfully'
      );
    } catch (err) {
      console.error('Error toggling product availability:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setToggling({ ...toggling, [product.id]: false });
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'logout' }),
      });
      router.push('/admin');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (checkingAuth || loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-[var(--foreground)]">
            {checkingAuth ? 'Checking authentication...' : 'Loading products...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-[var(--foreground)]">Admin Dashboard</h1>
        <Button onClick={handleLogout} variant="secondary">
          Logout
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400">No products found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {products.map((product) => {
            const isEditing = !!editing[product.id];
            const editState = editing[product.id];

            return (
              <div
                key={product.id}
                className="bg-zinc-900 rounded-lg p-6 border border-zinc-800"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">
                            Product Name
                          </label>
                          <input
                            type="text"
                            value={editState.name}
                            onChange={(e) =>
                              setEditing({
                                ...editing,
                                [product.id]: {
                                  ...editState,
                                  name: e.target.value,
                                },
                              })
                            }
                            className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-zinc-700 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--pink-accent)] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">
                            Description
                          </label>
                          <textarea
                            value={editState.description}
                            onChange={(e) =>
                              setEditing({
                                ...editing,
                                [product.id]: {
                                  ...editState,
                                  description: e.target.value,
                                },
                              })
                            }
                            rows={4}
                            className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-zinc-700 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--pink-accent)] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">
                            Price ({product.price?.currency.toUpperCase() || 'USD'})
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editState.price}
                            onChange={(e) =>
                              setEditing({
                                ...editing,
                                [product.id]: {
                                  ...editState,
                                  price: e.target.value,
                                },
                              })
                            }
                            className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-zinc-700 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--pink-accent)] focus:border-transparent"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSave(product)}
                            variant="primary"
                            disabled={saving[product.id]}
                          >
                            {saving[product.id] ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            onClick={() => handleCancelEdit(product.id)}
                            variant="secondary"
                            disabled={saving[product.id]}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-2xl font-bold text-[var(--foreground)]">
                            {product.name}
                          </h2>
                          {product.isUnavailable && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-900/30 text-red-400 border border-red-800">
                              Unlisted
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 mb-4">
                          {product.description || 'No description'}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEdit(product)}
                            variant="secondary"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleToggleUnavailable(product)}
                            variant={product.isUnavailable ? 'primary' : 'secondary'}
                            disabled={toggling[product.id]}
                          >
                            {toggling[product.id]
                              ? 'Updating...'
                              : product.isUnavailable
                              ? 'List Product'
                              : 'Unlist Product'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    {product.images && product.images.length > 0 && (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border border-zinc-800">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {product.price && (
                      <div className="mt-4 text-center">
                        <p className="text-lg font-semibold text-[var(--foreground)]">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: product.price.currency.toUpperCase(),
                          }).format(product.price.amount / 100)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

