"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchProducts, addProduct, deleteProduct, Product } from "@/lib/api";
import { toast } from "sonner"; // ⬅️ toasts

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        toast.error("Failed to fetch products.");
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Omit<Product, "id">>({
    name: "",
    price: 0,
    category: "",
    stock: 0,
    status: "active",
    images: [],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    let rejected = 0;
    Array.from(files).forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        rejected++;
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewProduct((prev) => ({
            ...prev,
            images: [...prev.images, event.target!.result as string],
          }));
        }
      };
      reader.readAsDataURL(file);
    });

    if (rejected > 0) {
      toast.warning(`${rejected} file(s) skipped — only JPG, PNG, GIF, WebP allowed.`);
    } else {
      toast.success(`${files.length} image(s) selected.`);
    }
  };

  const handleAddProduct = async () => {
    try {
      // (Optional) quick validations
      if (!newProduct.name.trim()) return toast.warning("Please enter a product name.");
      if (!newProduct.category.trim()) return toast.warning("Please select a category.");
      if (newProduct.price <= 0) return toast.warning("Price must be greater than 0.");

      const addedProduct = await addProduct(newProduct);
      setProducts((prev) => [...prev, addedProduct]);
      setIsAddModalOpen(false);
      setNewProduct({ name: "", price: 0, category: "", stock: 0, status: "active", images: [] });
      toast.success("Product added successfully.");
    } catch (error) {
      console.error("Failed to add product:", error);
      toast.error("Failed to add product. Please try again.");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    // keeping confirm for safety; if you want a toast-based confirm, say the word.
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(productId);
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        toast.success("Product deleted.");
      } catch (error) {
        console.error("Failed to delete product:", error);
        toast.error("Failed to delete product. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 sm:h-8 bg-muted rounded w-1/3"></div>
          <div className="h-10 sm:h-12 bg-muted rounded"></div>
          <div className="h-48 sm:h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 space-y-4 sm:space-y-5 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground">
            Products
          </h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto bg-primary text-primary-foreground px-3 sm:px-4 md:px-5 lg:px-6 py-2 rounded-lg font-medium hover:opacity-90 transition text-sm sm:text-base shadow-sm"
          >
            Add Product
          </button>
        </div>

        {/* Filters */}
        <div className="bg-card shadow rounded-lg p-3 sm:p-4 border border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="hidden sm:block bg-card shadow rounded-lg border border-border overflow-x-auto">
          <div className="w-full">
            <table className="w-full table-auto text-sm">
              <thead className="bg-muted/60">
                <tr className="text-muted-foreground">
                  <th className="px-3 sm:px-4 py-2 text-left font-medium uppercase tracking-wider whitespace-nowrap">Product</th>
                  <th className="px-3 sm:px-4 py-2 text-left font-medium uppercase tracking-wider whitespace-nowrap">Price</th>
                  <th className="hidden md:table-cell px-3 sm:px-4 py-2 text-left font-medium uppercase tracking-wider whitespace-nowrap">Category</th>
                  <th className="hidden md:table-cell px-3 sm:px-4 py-2 text-left font-medium uppercase tracking-wider whitespace-nowrap">Stock</th>
                  <th className="px-3 sm:px-4 py-2 text-left font-medium uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-3 sm:px-4 py-2 text-left font-medium uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted-foreground">No products found</td>
                  </tr>
                )}
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/40">
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm sm:text-base font-medium text-foreground">{product.name}</td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm sm:text-base text-foreground">₹{product.price.toLocaleString()}</td>
                    <td className="hidden md:table-cell px-3 sm:px-4 py-3 whitespace-nowrap text-sm sm:text-base text-foreground">{product.category}</td>
                    <td className="hidden md:table-cell px-3 sm:px-4 py-3 whitespace-nowrap text-sm sm:text-base text-foreground">
                      <span className={product.stock < 10 ? "text-red-600 dark:text-red-400 font-medium" : ""}>{product.stock}</span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                          product.status === "active"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                        <Link href={`/products/${product.id}`} className="text-primary hover:opacity-90 text-sm sm:text-base font-medium">
                          Edit
                        </Link>
                        <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 dark:text-red-400 hover:opacity-90 text-sm sm:text-base font-medium">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cards (mobile) */}
        <div className="sm:hidden space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="bg-card shadow rounded-lg border border-border p-6 text-center text-muted-foreground">No products found</div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="bg-card shadow rounded-lg border border-border p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-sm font-medium text-foreground">{product.name}</h3>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                      product.status === "active"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {product.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong className="text-foreground">Price:</strong> ₹{product.price.toLocaleString()}</p>
                  <p><strong className="text-foreground">Category:</strong> {product.category}</p>
                  <p>
                    <strong className="text-foreground">Stock:</strong>{" "}
                    <span className={product.stock < 10 ? "text-red-600 dark:text-red-400 font-medium" : ""}>{product.stock}</span>
                  </p>
                </div>
                <div className="flex gap-3 mt-4">
                  <Link href={`/products/${product.id}`} className="flex-1 bg-primary text-primary-foreground px-3 py-2 rounded-md font-medium hover:opacity-90 text-center text-sm">
                    Edit
                  </Link>
                  <button onClick={() => handleDeleteProduct(product.id)} className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md font-medium hover:bg-red-700 text-sm">
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-card text-card-foreground rounded-lg p-4 sm:p-5 md:p-6 w-full max-w-sm sm:max-w-md md:max-w-lg max-h-[90vh] overflow-auto border border-border shadow-lg">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4">Add Product</h2>
            <div className="space-y-3 sm:space-y-4">
              {["name", "price", "category", "stock"].map((field, i) => (
                <div key={i}>
                  <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <input
                    type={field === "price" || field === "stock" ? "number" : "text"}
                    value={(newProduct as any)[field]}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        [field]: field === "price" || field === "stock" ? Number(e.target.value) : e.target.value,
                      })
                    }
                    className="w-full px-2 sm:px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">Status</label>
                <select
                  value={newProduct.status}
                  onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value as "active" | "inactive" })}
                  className="w-full px-2 sm:px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-2 sm:px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                />
                {newProduct.images.length > 0 && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{newProduct.images.length} image(s) selected</p>
                )}
              </div>
            </div>
            <div className="mt-4 sm:mt-5 md:mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 md:gap-4">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded bg-muted text-foreground hover:bg-muted/80 border border-border text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded bg-primary text-primary-foreground hover:opacity-90 text-sm sm:text-base"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



