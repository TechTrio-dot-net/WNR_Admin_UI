// app/settings/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type Gateway = "" | "razorpay" | "stripe" | "custom";

type Settings = {
  currency: string;
  currencySymbol: string;
  taxRate: number;
  categories: string[];
  company: {
    name: string;
    gstin: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
    email: string;
    website: string;
    invoiceNotes: string;
  };
  payments: {
    gateway: Gateway;
    razorpay: { keyId: string; keySecret: string; webhookSecret: string };
    stripe: { publishableKey: string; secretKey: string; webhookSecret: string };
    custom: { merchantId: string; secret: string; publicKey: string };
  };
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  };
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    uploadPreset: string;
    folder: string;
  };
};

const STORAGE_KEY = "admin.settings.v2";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  CAD: "C$",
  JPY: "¥",
};

const DEFAULT_SETTINGS: Settings = {
  currency: "INR",
  currencySymbol: "₹",
  taxRate: 18,
  categories: ["Beverages", "Snacks", "Groceries"],
  company: {
    name: "",
    gstin: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
    phone: "",
    email: "",
    website: "",
    invoiceNotes: "",
  },
  payments: {
    gateway: "",
    razorpay: { keyId: "", keySecret: "", webhookSecret: "" },
    stripe: { publishableKey: "", secretKey: "", webhookSecret: "" },
    custom: { merchantId: "", secret: "", publicKey: "" },
  },
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: "",
  },
  cloudinary: {
    cloudName: "",
    apiKey: "",
    apiSecret: "",
    uploadPreset: "",
    folder: "",
  },
};

function load(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    // Merge to survive schema changes
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      company: { ...DEFAULT_SETTINGS.company, ...(parsed.company ?? {}) },
      payments: {
        ...DEFAULT_SETTINGS.payments,
        ...(parsed.payments ?? {}),
        razorpay: { ...DEFAULT_SETTINGS.payments.razorpay, ...(parsed.payments?.razorpay ?? {}) },
        stripe: { ...DEFAULT_SETTINGS.payments.stripe, ...(parsed.payments?.stripe ?? {}) },
        custom: { ...DEFAULT_SETTINGS.payments.custom, ...(parsed.payments?.custom ?? {}) },
      },
      firebase: { ...DEFAULT_SETTINGS.firebase, ...(parsed.firebase ?? {}) },
      cloudinary: { ...DEFAULT_SETTINGS.cloudinary, ...(parsed.cloudinary ?? {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
function save(s: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

const gstinRegex = /^[0-9]{2}[A-Z0-9]{10}[A-Z0-9]{3}$/i;

// Small helper to mask secrets
function SecretInput({
  value,
  onChange,
  placeholder,
  autoComplete = "off",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex gap-2">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <button
        type="button"
        className="px-3 py-2 rounded-md bg-muted border border-border hover:bg-muted/80 text-sm"
        onClick={() => setShow((s) => !s)}
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);

  // categories UI
  const [newCat, setNewCat] = useState("");
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState("");

  useEffect(() => setS(load()), []);

  // currency preview
  const pricePreview = useMemo(() => {
    const base = 2450;
    const gross = base * (1 + (s.taxRate || 0) / 100);
    const fmt = (n: number) => n.toLocaleString("en-IN");
    return `${s.currencySymbol}${fmt(base)} → with ${s.taxRate}% tax = ${s.currencySymbol}${fmt(gross)}`;
  }, [s.currencySymbol, s.taxRate]);

  // —— General handlers
  const setCurrency = (code: string) => {
    const symbol = CURRENCY_SYMBOLS[code] ?? s.currencySymbol;
    const next = { ...s, currency: code, currencySymbol: symbol };
    setS(next);
    save(next);
    toast.success(`Currency set to ${code}`);
  };
  const setSymbol = (sym: string) => {
    const next = { ...s, currencySymbol: sym || (CURRENCY_SYMBOLS[s.currency] ?? "₹") };
    setS(next);
    save(next);
  };
  const setTax = (n: number) => {
    const safe = Math.max(0, Math.min(100, isNaN(n) ? 0 : n));
    const next = { ...s, taxRate: safe };
    setS(next);
    save(next);
  };

  // —— Categories
  const addCat = () => {
    const name = newCat.trim();
    if (!name) return toast.error("Category name cannot be empty.");
    if (s.categories.find((c) => c.toLowerCase() === name.toLowerCase()))
      return toast.warning("Category already exists.");
    const next = { ...s, categories: [...s.categories, name] };
    setS(next);
    save(next);
    setNewCat("");
    toast.success("Category added.");
  };
  const beginEdit = (i: number) => {
    setEditIdx(i);
    setEditVal(s.categories[i]);
  };
  const saveEdit = (i: number) => {
    const name = editVal.trim();
    if (!name) return toast.error("Category cannot be empty.");
    if (s.categories.some((c, idx) => idx !== i && c.toLowerCase() === name.toLowerCase()))
      return toast.warning("Another category already has this name.");
    const cats = [...s.categories];
    cats[i] = name;
    const next = { ...s, categories: cats };
    setS(next);
    save(next);
    setEditIdx(null);
    setEditVal("");
    toast.success("Category updated.");
  };
  const delCat = (i: number) => {
    const cats = s.categories.filter((_, idx) => idx !== i);
    const next = { ...s, categories: cats };
    setS(next);
    save(next);
    toast.success("Category removed.");
  };
  const moveCat = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= s.categories.length) return;
    const cats = [...s.categories];
    [cats[i], cats[j]] = [cats[j], cats[i]];
    const next = { ...s, categories: cats };
    setS(next);
    save(next);
  };

  // —— Company save & validate GSTIN
  const saveCompany = () => {
    const gst = s.company.gstin?.trim().toUpperCase();
    if (gst && !gstinRegex.test(gst)) {
      return toast.warning("GSTIN looks invalid. Please double-check.");
    }
    const next = { ...s, company: { ...s.company, gstin: gst ?? "" } };
    setS(next);
    save(next);
    toast.success("Company details saved.");
  };

  // —— Credentials saves
  const savePayments = () => {
    save(s);
    toast.success("Payment gateway credentials saved.");
  };
  const saveFirebase = () => {
    save(s);
    toast.success("Firebase credentials saved.");
  };
  const saveCloudinary = () => {
    save(s);
    toast.success("Cloudinary credentials saved.");
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* General */}
      <section className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
        <h2 className="text-lg font-semibold">General</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Currency</label>
            <select
              value={s.currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {Object.keys(CURRENCY_SYMBOLS).map((c) => (
                <option key={c} value={c}>
                  {c} ({CURRENCY_SYMBOLS[c]})
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">Default: INR (₹)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Currency Symbol</label>
            <input
              type="text"
              value={s.currencySymbol}
              onChange={(e) => setSymbol(e.target.value)}
              maxLength={3}
              placeholder="₹"
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Tax Rate (%)</label>
            <input
              type="number"
              value={s.taxRate}
              onChange={(e) => setTax(Number(e.target.value))}
              min={0}
              max={100}
              step={0.1}
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">Preview: {pricePreview}</p>
          </div>
        </div>
      </section>

      {/* Company / Billing */}
      <section className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
        <h2 className="text-lg font-semibold">Company / Billing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* left */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Company Name</label>
              <input
                value={s.company.name}
                onChange={(e) => setS({ ...s, company: { ...s.company, name: e.target.value } })}
                placeholder="Acme Retail Pvt. Ltd."
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">GSTIN</label>
              <input
                value={s.company.gstin}
                onChange={(e) => setS({ ...s, company: { ...s.company, gstin: e.target.value.toUpperCase() } })}
                placeholder="22AAAAA0000A1Z5"
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Phone</label>
              <input
                value={s.company.phone}
                onChange={(e) => setS({ ...s, company: { ...s.company, phone: e.target.value } })}
                placeholder="+91 98xxxxxx90"
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                <input
                  value={s.company.email}
                  onChange={(e) => setS({ ...s, company: { ...s.company, email: e.target.value } })}
                  placeholder="billing@company.com"
                  className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Website</label>
                <input
                  value={s.company.website}
                  onChange={(e) => setS({ ...s, company: { ...s.company, website: e.target.value } })}
                  placeholder="https://company.com"
                  className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* right */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Address Line 1</label>
              <input
                value={s.company.address1}
                onChange={(e) => setS({ ...s, company: { ...s.company, address1: e.target.value } })}
                placeholder="Street address, building"
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Address Line 2</label>
              <input
                value={s.company.address2}
                onChange={(e) => setS({ ...s, company: { ...s.company, address2: e.target.value } })}
                placeholder="Area, landmark"
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                value={s.company.city}
                onChange={(e) => setS({ ...s, company: { ...s.company, city: e.target.value } })}
                placeholder="City"
                className="px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                value={s.company.state}
                onChange={(e) => setS({ ...s, company: { ...s.company, state: e.target.value } })}
                placeholder="State"
                className="px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                value={s.company.zip}
                onChange={(e) => setS({ ...s, company: { ...s.company, zip: e.target.value } })}
                placeholder="PIN"
                className="px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <input
              value={s.company.country}
              onChange={(e) => setS({ ...s, company: { ...s.company, country: e.target.value } })}
              placeholder="Country"
              className="px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Invoice Notes</label>
              <textarea
                rows={3}
                value={s.company.invoiceNotes}
                onChange={(e) => setS({ ...s, company: { ...s.company, invoiceNotes: e.target.value } })}
                placeholder="Thank you for your purchase!"
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
        <div>
          <button
            onClick={saveCompany}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90"
            type="button"
          >
            Save Company
          </button>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-card border border-border rounded-xl shadow-sm p-5">
        <h2 className="text-lg font-semibold mb-4">Categories</h2>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="New category name"
            className="flex-1 px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={addCat}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90"
            type="button"
          >
            Add
          </button>
        </div>

        {s.categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {s.categories.map((c, i) => (
              <li key={`${c}-${i}`} className="flex items-center gap-3 p-3 bg-card">
                {editIdx === i ? (
                  <>
                    <input
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      className="flex-1 px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={() => saveEdit(i)}
                      className="px-3 py-2 text-sm rounded-md bg-emerald-600 text-white hover:opacity-90"
                      type="button"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditIdx(null);
                        setEditVal("");
                      }}
                      className="px-3 py-2 text-sm rounded-md bg-muted border border-border hover:bg-muted/80"
                      type="button"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{c}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveCat(i, -1)}
                        className="px-2 py-1 text-xs rounded-md bg-muted border border-border hover:bg-muted/80"
                        type="button"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveCat(i, 1)}
                        className="px-2 py-1 text-xs rounded-md bg-muted border border-border hover:bg-muted/80"
                        type="button"
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => beginEdit(i)}
                        className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90"
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => delCat(i)}
                        className="px-3 py-1.5 text-sm rounded-md bg-red-600 text-white hover:opacity-90"
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Payment Gateway */}
      <section className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
        <h2 className="text-lg font-semibold">Payment Gateway</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Provider</label>
            <select
              value={s.payments.gateway}
              onChange={(e) => setS({ ...s, payments: { ...s.payments, gateway: e.target.value as Gateway } })}
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select</option>
              <option value="razorpay">Razorpay</option>
              <option value="stripe">Stripe</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Razorpay */}
          {s.payments.gateway === "razorpay" && (
            <>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-muted-foreground mb-2">Key ID</label>
                <input
                  value={s.payments.razorpay.keyId}
                  onChange={(e) =>
                    setS({ ...s, payments: { ...s.payments, razorpay: { ...s.payments.razorpay, keyId: e.target.value } } })
                  }
                  placeholder="rzp_test_XXXX"
                  className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-muted-foreground mb-2">Key Secret</label>
                <SecretInput
                  value={s.payments.razorpay.keySecret}
                  onChange={(v) =>
                    setS({ ...s, payments: { ...s.payments, razorpay: { ...s.payments.razorpay, keySecret: v } } })
                  }
                  placeholder="••••••••"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-muted-foreground mb-2">Webhook Secret</label>
                <SecretInput
                  value={s.payments.razorpay.webhookSecret}
                  onChange={(v) =>
                    setS({ ...s, payments: { ...s.payments, razorpay: { ...s.payments.razorpay, webhookSecret: v } } })
                  }
                  placeholder="••••••••"
                />
              </div>
            </>
          )}

          {/* Stripe */}
          {s.payments.gateway === "stripe" && (
            <>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-muted-foreground mb-2">Publishable Key</label>
                <input
                  value={s.payments.stripe.publishableKey}
                  onChange={(e) =>
                    setS({ ...s, payments: { ...s.payments, stripe: { ...s.payments.stripe, publishableKey: e.target.value } } })
                  }
                  placeholder="pk_test_XXXX"
                  className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-muted-foreground mb-2">Secret Key</label>
                <SecretInput
                  value={s.payments.stripe.secretKey}
                  onChange={(v) =>
                    setS({ ...s, payments: { ...s.payments, stripe: { ...s.payments.stripe, secretKey: v } } })
                  }
                  placeholder="sk_test_XXXX"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-muted-foreground mb-2">Webhook Secret</label>
                <SecretInput
                  value={s.payments.stripe.webhookSecret}
                  onChange={(v) =>
                    setS({ ...s, payments: { ...s.payments, stripe: { ...s.payments.stripe, webhookSecret: v } } })
                  }
                  placeholder="whsec_XXXX"
                />
              </div>
            </>
          )}

          {/* Custom */}
          {s.payments.gateway === "custom" && (
            <>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-muted-foreground mb-2">Merchant ID</label>
                <input
                  value={s.payments.custom.merchantId}
                  onChange={(e) =>
                    setS({ ...s, payments: { ...s.payments, custom: { ...s.payments.custom, merchantId: e.target.value } } })
                  }
                  placeholder="merchant_123"
                  className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-muted-foreground mb-2">Secret</label>
                <SecretInput
                  value={s.payments.custom.secret}
                  onChange={(v) =>
                    setS({ ...s, payments: { ...s.payments, custom: { ...s.payments.custom, secret: v } } })
                  }
                  placeholder="••••••••"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-muted-foreground mb-2">Public Key</label>
                <input
                  value={s.payments.custom.publicKey}
                  onChange={(e) =>
                    setS({ ...s, payments: { ...s.payments, custom: { ...s.payments.custom, publicKey: e.target.value } } })
                  }
                  placeholder="pub_XXXX"
                  className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </>
          )}
        </div>
        <button
          onClick={savePayments}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90"
          type="button"
        >
          Save Payment Credentials
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          ⚠️ Stored in localStorage for now — move to a secure server vault/DB for production.
        </p>
      </section>

      {/* Firebase */}
      <section className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
        <h2 className="text-lg font-semibold">Firebase</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(
            [
              ["apiKey", "API Key"],
              ["authDomain", "Auth Domain"],
              ["projectId", "Project ID"],
              ["storageBucket", "Storage Bucket"],
              ["messagingSenderId", "Messaging Sender ID"],
              ["appId", "App ID"],
              ["measurementId", "Measurement ID (optional)"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-muted-foreground mb-2">{label}</label>
              <input
                value={(s.firebase as any)[key] ?? ""}
                onChange={(e) => setS({ ...s, firebase: { ...s.firebase, [key]: e.target.value } })}
                placeholder={label}
                className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          ))}
        </div>
        <button
          onClick={saveFirebase}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90"
          type="button"
        >
          Save Firebase
        </button>
      </section>

      {/* Cloudinary */}
      <section className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
        <h2 className="text-lg font-semibold">Cloudinary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(
            [
              ["cloudName", "Cloud Name"],
              ["apiKey", "API Key"],
              ["apiSecret", "API Secret"],
              ["uploadPreset", "Upload Preset (unsigned)"],
              ["folder", "Default Folder"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-muted-foreground mb-2">{label}</label>
              {key === "apiSecret" ? (
                <SecretInput
                  value={(s.cloudinary as any)[key] ?? ""}
                  onChange={(v) => setS({ ...s, cloudinary: { ...s.cloudinary, [key]: v } })}
                  placeholder={label}
                />
              ) : (
                <input
                  value={(s.cloudinary as any)[key] ?? ""}
                  onChange={(e) => setS({ ...s, cloudinary: { ...s.cloudinary, [key]: e.target.value } })}
                  placeholder={label}
                  className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}
            </div>
          ))}
        </div>
        <button
          onClick={saveCloudinary}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90"
          type="button"
        >
          Save Cloudinary
        </button>
      </section>
    </div>
  );
}
