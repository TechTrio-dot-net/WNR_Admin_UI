// app/coupons/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { toast } from "sonner";

type CouponType = "percent" | "flat";
type AppliesTo = "all" | "categories" | "products";

interface Coupon {
  id: string;
  code: string; // uppercase, unique
  type: CouponType; // percent or flat
  discount: number; // value (percent 1-100 or flat currency)
  active: boolean; // on/off
  startDate?: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD
  description?: string;

  minOrder?: number; // min cart total to apply
  maxDiscount?: number; // cap for percent coupons

  usageLimit?: number; // total allowed uses
  usageLimitPerUser?: number; // per user (demo only)
  usedCount?: number; // for display/demo

  appliesTo: AppliesTo;
  categories?: string[];
  products?: string[];

  createdAt: string;
  updatedAt?: string;
}

type CouponStatus = "Active" | "Scheduled" | "Expired" | "Inactive";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([
    {
      id: "1",
      code: "WELCOME10",
      type: "percent",
      discount: 10,
      active: true,
      startDate: "2024-01-01",
      expiryDate: "2026-12-31",
      description: "Welcome discount for new customers",
      minOrder: 0,
      maxDiscount: 500,
      usageLimit: 1000,
      usageLimitPerUser: 1,
      usedCount: 124,
      appliesTo: "all",
      createdAt: "2024-01-01T10:00:00Z",
    },
    {
      id: "2",
      code: "SUMMER25",
      type: "percent",
      discount: 25,
      active: true,
      startDate: "2024-05-01",
      expiryDate: "2024-08-31",
      description: "Summer sale discount",
      minOrder: 999,
      maxDiscount: 1000,
      usageLimit: 500,
      usageLimitPerUser: 2,
      usedCount: 487,
      appliesTo: "categories",
      categories: ["Apparel", "Footwear"],
      createdAt: "2024-05-01T10:00:00Z",
    },
    {
      id: "3",
      code: "BIGFLAT500",
      type: "flat",
      discount: 500,
      active: false,
      startDate: "2025-01-01",
      expiryDate: "2025-12-31",
      description: "Flat ₹500 off on selected products",
      minOrder: 1999,
      usageLimit: 200,
      usageLimitPerUser: 1,
      usedCount: 0,
      appliesTo: "products",
      products: ["SKU-RED-SHOE-42", "SKU-BAG-BLACK-15L"],
      createdAt: "2025-01-01T10:00:00Z",
    },
  ]);

  // Filters & search
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CouponStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | CouponType>("all");

  // Modal state (create/edit)
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<Omit<Coupon, "id" | "createdAt">>({
    code: "",
    type: "percent",
    discount: 10,
    active: true,
    startDate: "",
    expiryDate: "",
    description: "",
    minOrder: 0,
    maxDiscount: 0,
    usageLimit: 0,
    usageLimitPerUser: 1,
    usedCount: 0,
    appliesTo: "all",
    categories: [],
    products: [],
  });

  // Confirm modal
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    desc?: string;
    onConfirm?: () => void;
  }>({ open: false, title: "" });

  const INR = (v: number | undefined) =>
    `₹${(v ?? 0).toLocaleString("en-IN")}`;

  const todayISO = () => new Date().toISOString().slice(0, 10);

  const statusOf = (c: Coupon): CouponStatus => {
    if (!c.active) return "Inactive";
    const now = todayISO();
    const starts = c.startDate || now;
    const ends = c.expiryDate || now;
    if (now < starts) return "Scheduled";
    if (ends && now > ends) return "Expired";
    return "Active";
  };

  const statusBadge = (s: CouponStatus) => {
    switch (s) {
      case "Active":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20";
      case "Scheduled":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20";
      case "Expired":
        return "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20";
      case "Inactive":
      default:
        return "bg-muted text-muted-foreground border";
    }
  };

  const discountLabel = (c: Coupon) =>
    c.type === "percent" ? `${c.discount}% off` : `${INR(c.discount)} off`;

  const validityLabel = (c: Coupon) => {
    const s = c.startDate ? new Date(c.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
    const e = c.expiryDate ? new Date(c.expiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
    return `${s} → ${e}`;
  };

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return coupons.filter((c) => {
      const matchesQuery =
        !query ||
        c.code.toLowerCase().includes(query) ||
        (c.description || "").toLowerCase().includes(query);
      const matchesType = typeFilter === "all" || c.type === typeFilter;
      const s = statusOf(c);
      const matchesStatus = statusFilter === "all" || s === statusFilter;
      return matchesQuery && matchesType && matchesStatus;
    });
  }, [coupons, q, typeFilter, statusFilter]);

  // Actions
  const openCreate = () => {
    setEditing(null);
    setForm({
      code: "",
      type: "percent",
      discount: 10,
      active: true,
      startDate: "",
      expiryDate: "",
      description: "",
      minOrder: 0,
      maxDiscount: 0,
      usageLimit: 0,
      usageLimitPerUser: 1,
      usedCount: 0,
      appliesTo: "all",
      categories: [],
      products: [],
    });
    setOpenModal(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      type: c.type,
      discount: c.discount,
      active: c.active,
      startDate: c.startDate || "",
      expiryDate: c.expiryDate || "",
      description: c.description || "",
      minOrder: c.minOrder ?? 0,
      maxDiscount: c.maxDiscount ?? 0,
      usageLimit: c.usageLimit ?? 0,
      usageLimitPerUser: c.usageLimitPerUser ?? 1,
      usedCount: c.usedCount ?? 0,
      appliesTo: c.appliesTo,
      categories: c.categories ?? [],
      products: c.products ?? [],
    });
    setOpenModal(true);
  };

  const validateForm = (): boolean => {
    const code = form.code.trim().toUpperCase();
    if (!code) return toast.error("Coupon code is required."), false;
    if (!/^[A-Z0-9_-]+$/.test(code))
      return toast.error("Use A–Z, 0–9, _ or - for the code."), false;

    const dup = coupons.some(
      (c) => c.code.toUpperCase() === code && c.id !== editing?.id
    );
    if (dup) return toast.error("Coupon code already exists."), false;

    if (form.type === "percent") {
      if (form.discount <= 0 || form.discount > 100)
        return toast.error("Percent must be between 1 and 100."), false;
      if (form.maxDiscount && form.maxDiscount < 0)
        return toast.error("Max discount must be ≥ 0."), false;
    } else {
      if (form.discount <= 0)
        return toast.error("Flat amount must be greater than 0."), false;
    }

    const s = form.startDate ? new Date(form.startDate) : null;
    const e = form.expiryDate ? new Date(form.expiryDate) : null;
    if (s && e && s > e)
      return toast.error("Start date cannot be after expiry date."), false;

    if (form.minOrder && form.minOrder < 0)
      return toast.error("Minimum order cannot be negative."), false;

    if (form.usageLimit && form.usageLimit < 0)
      return toast.error("Usage limit cannot be negative."), false;

    if (form.usageLimitPerUser && form.usageLimitPerUser < 0)
      return toast.error("Per-user limit cannot be negative."), false;

    return true;
    // (Applicability validation is kept simple for demo)
  };

  const saveCoupon = () => {
    if (!validateForm()) return;

    const nowISO = new Date().toISOString();
    const payload: Coupon = {
      id: editing?.id ?? Date.now().toString(),
      ...form,
      code: form.code.trim().toUpperCase(),
      createdAt: editing?.createdAt ?? nowISO,
      updatedAt: nowISO,
    };

    if (editing) {
      setCoupons((prev) => prev.map((c) => (c.id === editing.id ? payload : c)));
      toast.success("Coupon updated.");
    } else {
      setCoupons((prev) => [payload, ...prev]);
      toast.success("Coupon created.");
    }
    setOpenModal(false);
    setEditing(null);
  };

  const toggleActive = (c: Coupon) => {
    setCoupons((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x))
    );
    toast.success(`${c.code} ${c.active ? "disabled" : "enabled"}.`);
  };

  const duplicate = (c: Coupon) => {
    const copy: Coupon = {
      ...c,
      id: Date.now().toString(),
      code: uniqueCopyCode(c.code, coupons),
      createdAt: new Date().toISOString(),
      updatedAt: undefined,
      usedCount: 0,
      active: false, // duplicated as inactive by default
    };
    setCoupons((prev) => [copy, ...prev]);
    toast.success(`Duplicated as ${copy.code}.`);
  };

  const uniqueCopyCode = (base: string, list: Coupon[]) => {
    let n = 2;
    let next = `${base}-COPY`;
    const existing = new Set(list.map((x) => x.code.toUpperCase()));
    while (existing.has(next.toUpperCase())) {
      next = `${base}-COPY-${n++}`;
    }
    return next;
  };

  const remove = (c: Coupon) => {
    setConfirm({
      open: true,
      title: `Delete ${c.code}?`,
      desc: "This will permanently remove the coupon.",
      onConfirm: () => {
        setCoupons((prev) => prev.filter((x) => x.id !== c.id));
        toast.success("Coupon deleted.");
      },
    });
  };

  const handleRowAction = (val: string, c: Coupon) => {
    switch (val) {
      case "edit":
        return openEdit(c);
      case "toggle":
        return toggleActive(c);
      case "duplicate":
        return duplicate(c);
      case "delete":
        return remove(c);
      default:
        return;
    }
  };

  // ======= UI =======

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-2xl font-bold text-foreground">Coupons</h3>
        <button
          onClick={openCreate}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90"
        >
          Create Coupon
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by code or description…"
            className="px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All types</option>
            <option value="percent">Percent</option>
            <option value="flat">Flat</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All status</option>
            <option value="Active">Active</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Expired">Expired</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide w-40">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide w-40">
                  Discount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                  Validity
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide w-44">
                  Usage
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide w-32">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide w-[280px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => {
                const s = statusOf(c);
                return (
                  <tr key={c.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-foreground">
                        {c.code}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[240px]">
                        {c.description || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div>{discountLabel(c)}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.type === "percent" && c.maxDiscount
                          ? `Max ${INR(c.maxDiscount)}`
                          : c.type === "flat"
                          ? `Min order ${INR(c.minOrder || 0)}`
                          : "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div>{validityLabel(c)}</div>
                      <div className="text-xs text-muted-foreground">
                        Applies to:{" "}
                        {c.appliesTo === "all"
                          ? "All items"
                          : c.appliesTo === "categories"
                          ? `Categories (${(c.categories || []).length})`
                          : `Products (${(c.products || []).length})`}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div>
                        Used {c.usedCount ?? 0}
                        {c.usageLimit ? ` / ${c.usageLimit}` : " / ∞"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Per user: {c.usageLimitPerUser ?? "∞"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${statusBadge(
                          s
                        )}`}
                      >
                        {s}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        aria-label="Row actions"
                        value=""
                        onChange={(e) => {
                          const val = e.target.value;
                          e.currentTarget.blur();
                          handleRowAction(val, c);
                        }}
                        className="px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="" disabled>
                          Actions…
                        </option>
                        <option value="edit">Edit</option>
                        <option value="toggle">
                          {c.active ? "Disable" : "Enable"}
                        </option>
                        <option value="duplicate">Duplicate</option>
                        <option value="delete">Delete</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No coupons match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {filtered.map((c) => {
          const s = statusOf(c);
          return (
            <div
              key={c.id}
              className="bg-card border border-border rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {c.code}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {discountLabel(c)} • {validityLabel(c)}
                  </div>
                </div>
                <span
                  className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${statusBadge(
                    s
                  )}`}
                >
                  {s}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Usage:</span>{" "}
                  <span className="font-medium text-foreground">
                    {c.usedCount ?? 0}
                    {c.usageLimit ? ` / ${c.usageLimit}` : " / ∞"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Per user:</span>{" "}
                  <span className="font-medium text-foreground">
                    {c.usageLimitPerUser ?? "∞"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Scope:</span>{" "}
                  <span className="font-medium text-foreground">
                    {c.appliesTo === "all"
                      ? "All items"
                      : c.appliesTo === "categories"
                      ? `Categories (${(c.categories || []).length})`
                      : `Products (${(c.products || []).length})`}
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <select
                  aria-label="Row actions"
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    e.currentTarget.blur();
                    handleRowAction(val, c);
                  }}
                  className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="" disabled>
                    Actions…
                  </option>
                  <option value="edit">Edit</option>
                  <option value="toggle">{c.active ? "Disable" : "Enable"}</option>
                  <option value="duplicate">Duplicate</option>
                  <option value="delete">Delete</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
          <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-xl w-full max-w-3xl">
            <div className="p-5 border-b border-border">
              <h4 className="text-lg font-semibold">
                {editing ? "Edit Coupon" : "Create Coupon"}
              </h4>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Code
                  </label>
                  <input
                    value={form.code}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value.toUpperCase() })
                    }
                    placeholder="WELCOME10"
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value as CouponType })
                    }
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="percent">Percent</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    {form.type === "percent" ? "Percent" : "Amount (₹)"}
                  </label>
                  <input
                    type="number"
                    min={form.type === "percent" ? 1 : 1}
                    max={form.type === "percent" ? 100 : undefined}
                    value={form.discount}
                    onChange={(e) =>
                      setForm({ ...form, discount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={form.startDate || ""}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={form.expiryDate || ""}
                    onChange={(e) =>
                      setForm({ ...form, expiryDate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <input
                    id="active"
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) =>
                      setForm({ ...form, active: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-border"
                  />
                  <label htmlFor="active" className="text-sm text-foreground">
                    Active
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Description (optional)
                </label>
                <input
                  value={form.description || ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Shown to the customer at checkout"
                  className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Min Order (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.minOrder ?? 0}
                    onChange={(e) =>
                      setForm({ ...form, minOrder: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                {form.type === "percent" && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Max Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.maxDiscount ?? 0}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          maxDiscount: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.usageLimit ?? 0}
                    onChange={(e) =>
                      setForm({ ...form, usageLimit: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Per-User Limit
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.usageLimitPerUser ?? 1}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        usageLimitPerUser: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Applies To
                  </label>
                  <select
                    value={form.appliesTo}
                    onChange={(e) =>
                      setForm({ ...form, appliesTo: e.target.value as AppliesTo })
                    }
                    className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All items</option>
                    <option value="categories">Specific categories</option>
                    <option value="products">Specific products</option>
                  </select>
                </div>

                {form.appliesTo === "categories" && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Categories (comma-separated)
                    </label>
                    <input
                      value={(form.categories || []).join(", ")}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          categories: csvToArray(e.target.value),
                        })
                      }
                      placeholder="e.g. Apparel, Footwear"
                      className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}

                {form.appliesTo === "products" && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Product IDs/SKUs (comma-separated)
                    </label>
                    <input
                      value={(form.products || []).join(", ")}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          products: csvToArray(e.target.value),
                        })
                      }
                      placeholder="e.g. SKU-RED-SHOE-42, SKU-BAG-15L"
                      className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-border flex flex-col sm:flex-row gap-2 justify-end">
              <button
                onClick={() => {
                  setOpenModal(false);
                  setEditing(null);
                }}
                className="px-4 py-2 rounded-md bg-muted border border-border hover:bg-muted/80"
              >
                Cancel
              </button>
              <button
                onClick={saveCoupon}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90"
              >
                {editing ? "Save Changes" : "Create Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirm.open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
          <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-border">
              <h4 className="text-lg font-semibold">{confirm.title}</h4>
              {confirm.desc && (
                <p className="text-sm text-muted-foreground mt-1">{confirm.desc}</p>
              )}
            </div>
            <div className="p-5 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                onClick={() => setConfirm({ open: false, title: "" })}
                className="px-4 py-2 rounded-md bg-muted border border-border hover:bg-muted/80"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirm.onConfirm?.();
                  setConfirm({ open: false, title: "" });
                }}
                className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:opacity-90"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* utils */
function csvToArray(v: string): string[] {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
