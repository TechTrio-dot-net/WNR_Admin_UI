"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getProduct, updateProduct, Product } from "@/lib/api";
import { toast } from "sonner";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = (params?.id as string) ?? "";

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    category: "",
    stock: 0,
    status: "active" as "active" | "inactive",
    images: [] as string[],
  });

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await getProduct(productId);
        setProduct(data);
        setFormData({
          name: data.name,
          price: data.price,
          category: data.category,
          stock: data.stock,
          status: data.status,
          images: data.images,
        });
      } catch (err) {
        setError("Failed to load product");
        toast.error("Failed to load product.");
        console.error("Failed to load product:", err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) loadProduct();
  }, [productId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    let added = 0;
    let rejected = 0;

    Array.from(files).forEach((file) => {
      if (!allowed.includes(file.type)) {
        rejected++;
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (!event.target?.result) return;
        added++;
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, event.target!.result as string],
        }));
      };
      reader.readAsDataURL(file);
    });

    if (added > 0) toast.success(`Added ${added} image(s).`);
    if (rejected > 0)
      toast.warning(`${rejected} file(s) skipped — only JPG, PNG, GIF, WebP allowed.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await toast.promise(updateProduct(productId, formData), {
        loading: "Saving changes...",
        success: "Product updated.",
        error: "Failed to update product.",
      });
      router.push("/products");
    } catch (err) {
      setError("Failed to update product");
      console.error("Failed to update product:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="p-6">
        <div className="text-center space-y-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={() => router.push("/products")}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 transition"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Edit Product</h1>
        <button
          onClick={() => router.push("/products")}
          className="px-4 py-2 rounded-lg bg-muted text-foreground border border-border hover:bg-muted/80 transition"
        >
          Back to Products
        </button>
      </div>

      <div className="bg-card text-card-foreground shadow rounded-lg p-6 border border-border">
        {error && (
          <div className="mb-4 p-4 rounded-md border border-red-500/20 bg-red-500/10">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Product Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Price (₹)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                min="0"
                required
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as "active" | "inactive" })
                }
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Images
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {formData.images.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.images.length} image(s) selected
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/products")}
              className="px-6 py-2 rounded bg-muted text-foreground border border-border hover:bg-muted/80 transition"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
