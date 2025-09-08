// app/admin/inventory/page.tsx (or wherever your InventoryPage lives)
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  minStockLevel: number;
  image?: string;
};

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showOnlyLow, setShowOnlyLow] = useState(false);

  // modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);

  // form states
  const [newItem, setNewItem] = useState<Omit<InventoryItem, "id">>({
    name: "",
    category: "",
    stock: 0,
    price: 0,
    minStockLevel: 0,
    image: "",
  });
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  // load from mock storage
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchInventoryMock();
        setInventory(data);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load inventory.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // counters
  const { lowCount, outCount } = useMemo(() => {
    let low = 0;
    let out = 0;
    for (const it of inventory) {
      if (it.stock === 0) out++;
      else if (it.stock <= it.minStockLevel) low++;
    }
    return { lowCount: low, outCount: out };
  }, [inventory]);

  useEffect(() => {
    if (!loading && (lowCount > 0 || outCount > 0)) {
      toast.warning(`${outCount} out of stock, ${lowCount} low stock.`);
    }
  }, [loading, lowCount, outCount]);

  const categories = useMemo(
    () => Array.from(new Set(inventory.map((i) => i.category))).sort(),
    [inventory]
  );

  const filtered = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesLow = !showOnlyLow || item.stock === 0 || item.stock <= item.minStockLevel;
      return matchesSearch && matchesCategory && matchesLow;
    });
  }, [inventory, searchTerm, categoryFilter, showOnlyLow]);

  const getBadge = (stock: number, min: number) => {
    if (stock === 0)
      return "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20";
    if (stock <= min)
      return "bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/20";
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20";
  };

  // add item
  const onAdd = async () => {
    if (!newItem.name.trim()) return toast.warning("Name is required.");
    if (!newItem.category.trim()) return toast.warning("Category is required.");
    if (newItem.price < 0) return toast.warning("Price cannot be negative.");
    if (newItem.stock < 0) return toast.warning("Stock cannot be negative.");
    if (newItem.minStockLevel < 0) return toast.warning("Min stock cannot be negative.");

    try {
      const created = await toast.promise(addInventoryItemMock(newItem), {
        loading: "Adding item...",
        success: "Item added.",
        error: "Failed to add item.",
      });
      setInventory((prev) => [created, ...prev]);
      setIsAddOpen(false);
      setNewItem({ name: "", category: "", stock: 0, price: 0, minStockLevel: 0, image: "" });
    } catch (e) {
      console.error(e);
    }
  };

  // open edit
  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setEditItem({ ...item });
    setIsEditOpen(true);
  };

  // save edit
  const onSaveEdit = async () => {
    if (!editItem || !editing) return;
    if (!editItem.name.trim()) return toast.warning("Name is required.");
    if (!editItem.category.trim()) return toast.warning("Category is required.");
    if (editItem.price < 0 || editItem.stock < 0 || editItem.minStockLevel < 0)
      return toast.warning("Values cannot be negative.");

    try {
      await toast.promise(updateInventoryItemMock(editing.id, editItem), {
        loading: "Saving changes...",
        success: "Item updated.",
        error: "Failed to update item.",
      });
      setInventory((prev) =>
        prev.map((p) => (p.id === editing.id ? { ...p, ...editItem } : p))
      );
      setIsEditOpen(false);
      setEditing(null);
      setEditItem(null);
    } catch (e) {
      console.error(e);
    }
  };

  // file -> base64
  const onPickImage = (file: File, setFn: (url: string) => void) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      return toast.warning("Only JPG, PNG, GIF, WebP allowed.");
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setFn(ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  // reset demo data (optional, handy)
  const onResetDemo = async () => {
    await resetDemoDataMock();
    const fresh = await fetchInventoryMock();
    setInventory(fresh);
    toast.success("Demo data reset.");
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="h-10 bg-muted rounded mb-4" />
        <div className="h-48 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground">
          Inventory
        </h3>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20">
              {outCount} out
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              {lowCount} low
            </span>
          </span>

          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 sm:px-4 py-2 rounded-lg font-medium hover:opacity-90 transition text-sm shadow-sm"
          >
            ➕ Add Item
          </button>

          <button
            onClick={onResetDemo}
            className="inline-flex items-center gap-2 bg-muted text-foreground border border-border px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-muted/80 transition text-sm"
            title="Re-seed local demo data"
          >
            Reset Demo Data
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card shadow rounded-lg p-4 border border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={showOnlyLow}
              onChange={(e) => setShowOnlyLow(e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            Show low/out-of-stock only
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card shadow rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent">
          <table className="min-w-full w-full table-fixed">
            <thead className="bg-muted/60">
              <tr className="text-muted-foreground">
                <th className="w-2/5 px-3 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Product
                </th>
                <th className="w-1/5 px-3 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Stock
                </th>
                <th className="w-1/5 px-3 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Min
                </th>
                <th className="w-1/5 px-3 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Price
                </th>
                <th className="w-[140px] px-3 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((it) => {
                const badge = getBadge(it.stock, it.minStockLevel);
                return (
                  <tr key={it.id} className="hover:bg-muted/40">
                    <td className="px-3 lg:px-6 py-4">
                      <div className="flex items-center gap-3">
                        {it.image ? (
                          <img
                            src={it.image}
                            alt={it.name}
                            className="h-8 w-8 lg:h-10 lg:w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-muted" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-foreground">{it.name}</div>
                          <div className="text-xs text-muted-foreground">{it.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-foreground">{it.stock}</td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-foreground">{it.minStockLevel}</td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-foreground">₹{it.price.toLocaleString()}</td>
                    <td className="px-3 lg:px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(it)}
                          className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="mt-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badge}`}>
                          {it.stock === 0 ? "Out of Stock" : it.stock <= it.minStockLevel ? "Low Stock" : "In Stock"}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">No matching items</div>
        )}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
          <div className="bg-card text-card-foreground border border-border rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-5 border-b border-border">
              <h4 className="text-lg font-semibold">Add Item</h4>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Name">
                  <input
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:ring-2 focus:ring-primary outline-none"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                </Field>
                <Field label="Category">
                  <input
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:ring-2 focus:ring-primary outline-none"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  />
                </Field>
                <Field label="Price (₹)">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:ring-2 focus:ring-primary outline-none"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Stock">
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:ring-2 focus:ring-primary outline-none"
                    value={newItem.stock}
                    onChange={(e) => setNewItem({ ...newItem, stock: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Min Stock">
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:ring-2 focus:ring-primary outline-none"
                    value={newItem.minStockLevel}
                    onChange={(e) => setNewItem({ ...newItem, minStockLevel: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Image (optional)">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onPickImage(f, (url) => setNewItem((p) => ({ ...p, image: url })));
                    }}
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-muted file:text-foreground hover:file:opacity-90"
                  />
                </Field>
              </div>
            </div>
            <div className="p-5 flex justify-end gap-3 border-t border-border">
              <button
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 rounded-md bg-muted text-foreground border border-border hover:bg-muted/80 transition"
              >
                Cancel
              </button>
              <button
                onClick={onAdd}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && editItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
          <div className="bg-card text-card-foreground border border-border rounded-xl shadow-xl w-full max-w-xl">
            <div className="p-5 border-b border-border">
              <h4 className="text-lg font-semibold">Edit Item</h4>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Name">
                  <input
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:ring-2 focus:ring-primary outline-none"
                    value={editItem.name}
                    onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                  />
                </Field>
                <Field label="Category">
                  <input
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:ring-2 focus:ring-primary outline-none"
                    value={editItem.category}
                    onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                  />
                </Field>
                <Field label="Price (₹)">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:ring-2 focus:ring-primary outline-none"
                    value={editItem.price}
                    onChange={(e) => setEditItem({ ...editItem, price: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Min Stock">
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:ring-2 focus:ring-primary outline-none"
                    value={editItem.minStockLevel}
                    onChange={(e) => setEditItem({ ...editItem, minStockLevel: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Image (optional)">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onPickImage(f, (url) => setEditItem((p) => (p ? { ...p, image: url } : p)));
                    }}
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-muted file:text-foreground hover:file:opacity-90"
                  />
                </Field>
              </div>

              {/* Quick Adjust */}
              <div className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Stock</span>
                  <span className="text-base font-semibold">{editItem.stock}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() =>
                      setEditItem((p) => (p ? { ...p, stock: Math.max(0, p.stock - 1) } : p))
                    }
                    className="px-3 py-2 rounded-md bg-muted text-foreground border border-border hover:bg-muted/80 transition text-sm"
                  >
                    – 1
                  </button>
                  <button
                    onClick={() => setEditItem((p) => (p ? { ...p, stock: p.stock + 1 } : p))}
                    className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition text-sm"
                  >
                    + 1
                  </button>
                  <input
                    type="number"
                    placeholder="Adjust by..."
                    className="ml-2 w-32 px-3 py-2 bg-background text-foreground border border-border rounded-md focus:ring-2 focus:ring-primary outline-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const v = Number((e.target as HTMLInputElement).value);
                        if (!Number.isFinite(v)) return;
                        setEditItem((p) =>
                          p ? { ...p, stock: Math.max(0, p.stock + Math.trunc(v)) } : p
                        );
                        (e.target as HTMLInputElement).value = "";
                        toast.success("Stock adjusted (not saved yet).");
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="p-5 flex justify-end gap-3 border-t border-border">
              <button
                onClick={() => {
                  setIsEditOpen(false);
                  setEditing(null);
                  setEditItem(null);
                }}
                className="px-4 py-2 rounded-md bg-muted text-foreground border border-border hover:bg-muted/80 transition"
              >
                Cancel
              </button>
              <button
                onClick={onSaveEdit}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- small helper ---------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}

/* ============================================================
   MOCK STORAGE (localStorage) — duplicate seed data included
   Replace with real API later. Everything returns Promises.
   ============================================================ */

const STORAGE_KEY = "inventory_demo_data_v1";

async function simulateDelay(ms = 250) {
  await new Promise((r) => setTimeout(r, ms));
}

function uid() {
  try {
    // @ts-ignore
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return String(Date.now()) + Math.random().toString(16).slice(2);
}

const SEED: InventoryItem[] = [
  // duplicates on purpose (same name different ids)
  {
    id: uid(),
    name: "Organic Almond Butter",
    category: "Grocery",
    stock: 8,
    minStockLevel: 10,
    price: 425,
    image: "",
  },
  {
    id: uid(),
    name: "Organic Almond Butter", // duplicate name
    category: "Grocery",
    stock: 0, // out of stock
    minStockLevel: 6,
    price: 435,
    image: "",
  },
  {
    id: uid(),
    name: "Cold Pressed Coconut Oil",
    category: "Grocery",
    stock: 4, // low
    minStockLevel: 5,
    price: 299,
    image: "",
  },
  {
    id: uid(),
    name: "Herbal Green Tea",
    category: "Beverages",
    stock: 22,
    minStockLevel: 8,
    price: 199,
    image: "",
  },
  {
    id: uid(),
    name: "Granola Clusters",
    category: "Snacks",
    stock: 1, // low
    minStockLevel: 3,
    price: 159,
    image: "",
  },
  {
    id: uid(),
    name: "Wild Honey",
    category: "Grocery",
    stock: 14,
    minStockLevel: 6,
    price: 349,
    image: "",
  },
  {
    id: uid(),
    name: "Reusable Glass Bottle",
    category: "Accessories",
    stock: 0, // out
    minStockLevel: 2,
    price: 249,
    image: "",
  },
  {
    id: uid(),
    name: "Protein Trail Mix",
    category: "Snacks",
    stock: 9,
    minStockLevel: 7,
    price: 279,
    image: "",
  },
];

function readStore(): InventoryItem[] {
  if (typeof window === "undefined") return [...SEED];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
      return [...SEED];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Bad data");
    return parsed;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
    return [...SEED];
  }
}

function writeStore(data: InventoryItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function fetchInventoryMock(): Promise<InventoryItem[]> {
  await simulateDelay();
  return readStore();
}

export async function addInventoryItemMock(
  item: Omit<InventoryItem, "id">
): Promise<InventoryItem> {
  await simulateDelay();
  const store = readStore();
  const created: InventoryItem = { ...item, id: uid() };
  store.unshift(created);
  writeStore(store);
  return created;
}

export async function updateInventoryItemMock(
  id: string,
  patch: Partial<InventoryItem>
): Promise<void> {
  await simulateDelay();
  const store = readStore();
  const idx = store.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error("Not found");
  store[idx] = { ...store[idx], ...patch };
  writeStore(store);
}

export async function resetDemoDataMock(): Promise<void> {
  await simulateDelay(150);
  writeStore([...SEED]);
}
