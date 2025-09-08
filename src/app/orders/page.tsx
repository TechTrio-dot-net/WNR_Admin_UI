"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { HiEye, HiDownload, HiX } from "react-icons/hi";
import { fetchOrders } from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  date: string;
  status: "pending" | "shipped" | "completed" | "cancelled";
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number; // per item
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // modal state
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await fetchOrders();
        setOrders(data);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        toast.error("Failed to fetch orders.");
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  // keyboard close for modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const filteredOrders = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return orders.filter((order) => {
      const matchesSearch =
        order.customerName.toLowerCase().includes(q) || order.id.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20";
      case "shipped":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20";
      case "completed":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20";
      default:
        return "bg-muted text-muted-foreground border border-border";
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const openModal = (order: Order) => {
    setSelected(order);
    setOpen(true);
  };

  // Build a printable receipt without extra deps (user can "Save as PDF")
const downloadReceiptPDF = (order: Order) => {
  try {
    const doc = new jsPDF(); // A4 portrait
    const padL = 14;
    let y = 16;

    doc.setFontSize(16);
    doc.text(`Receipt #${order.id}`, padL, y);
    y += 8;

    const dateStr = new Date(order.date).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
    doc.setFontSize(11);
    doc.text(`Date: ${dateStr}`, padL, y); y += 6;
    doc.text(`Customer: ${order.customerName}`, padL, y); y += 6;
    doc.text(`Email: ${order.customerEmail}`, padL, y); y += 6;
    doc.text(`Payment: ${order.paymentMethod}`, padL, y); y += 10;

    autoTable(doc, {
      startY: y,
      head: [["Product", "Qty", "Price", "Subtotal"]],
      body: order.items.map((it) => [
        it.productName,
        String(it.quantity),
        `₹${it.price.toLocaleString()}`,
        `₹${(it.price * it.quantity).toLocaleString()}`
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [179, 71, 37] }, // optional brand color
      theme: "striped",
      margin: { left: padL, right: 14 }
    });

    const endY = (doc as any).lastAutoTable?.finalY ?? y + 6;
    const subtotal = order.items.reduce((s, it) => s + it.price * it.quantity, 0);

    doc.setFontSize(12);
    doc.text(`Items Subtotal: ₹${subtotal.toLocaleString()}`, padL, endY + 10);
    doc.text(`Discounts: ₹0`, padL, endY + 16);
    doc.text(`Taxes: ₹0`, padL, endY + 22);
    doc.text(`Shipping: ₹0`, padL, endY + 28);
    doc.setFont("arial", "bold");
    doc.text(`Total Paid: ₹${order.totalAmount.toLocaleString()}`, padL, endY + 38);

    doc.save(`receipt-${order.id}.pdf`);
    toast.success("Receipt downloaded.");
  } catch (e) {
    console.error(e);
    toast.error("Failed to download receipt.");
  }
};



  const subtotalOf = (o: Order) =>
    o.items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6" />
          <div className="h-12 bg-muted rounded mb-4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h3 className="text-2xl font-bold text-foreground">Orders</h3>

      {/* Order Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card shadow rounded-lg p-6 border border-border">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Total Orders</h3>
          <p className="text-3xl font-bold text-foreground">{orders.length}</p>
        </div>
        <div className="bg-card shadow rounded-lg p-6 border border-border">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Pending</h3>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
            {orders.filter((o) => o.status === "pending").length}
          </p>
        </div>
        <div className="bg-card shadow rounded-lg p-6 border border-border">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Shipped</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {orders.filter((o) => o.status === "shipped").length}
          </p>
        </div>
        <div className="bg-card shadow rounded-lg p-6 border border-border">
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Completed</h3>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {orders.filter((o) => o.status === "completed").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card shadow rounded-lg p-4 border border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Search Orders
            </label>
            <input
              type="text"
              placeholder="Search by customer name or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="shipped">Shipped</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table (desktop) */}
      <div className="hidden lg:block bg-card shadow rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent">
          <table className="min-w-full w-full table-fixed">
            <thead className="bg-muted/60">
              <tr className="text-muted-foreground">
                <th className="w-[120px] px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
                <th className="w-1/6 px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Order ID
                </th>
                <th className="w-1/4 px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Customer
                </th>
                <th className="w-1/6 px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="w-1/6 px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Date
                </th>
                <th className="w-1/6 px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/40">
                  <td className="px-3 sm:px-6 py-4">
                    <button
                      onClick={() => openModal(order)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition"
                      title="View details"
                    >
                      <HiEye className="h-4 w-4" />
                      View
                    </button>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    #{order.id}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="max-w-[220px]">
                      <div className="text-sm font-medium text-foreground truncate">
                        {order.customerName}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {order.customerEmail}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    ₹{order.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {formatDate(order.date)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No orders found</p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-card shadow rounded-lg p-3 sm:p-4 border border-border flex flex-col space-y-3"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-sm sm:text-base text-foreground block truncate">
                    #{order.id}
                  </span>
                  <span className="text-xs text-muted-foreground block">{order.customerName}</span>
                  <span className="text-xs text-muted-foreground block">{order.customerEmail}</span>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusBadge(
                  order.status
                )} flex-shrink-0`}
              >
                {order.status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium text-foreground">₹{order.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium text-foreground">{formatDate(order.date)}</span>
              </div>
              <div className="flex justify-between col-span-2">
                <span className="text-muted-foreground">Actions:</span>
                <button
                  onClick={() => openModal(order)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition"
                >
                  <HiEye className="h-4 w-4" />
                  View
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredOrders.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">No orders found</div>
        )}
      </div>



      {/* Details Modal */}
      {open && selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3">
          <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-xl w-full max-w-4xl">
            {/* Header */}
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold">
                  Order <span className="text-primary">#{selected.id}</span>
                </h4>
                <p className="text-sm text-muted-foreground">
                  Placed on {formatDate(selected.date)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selected.status)}`}>
                  {selected.status.toUpperCase()}
                </span>
                <button
                  onClick={() => downloadReceiptPDF(selected)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
                  title="Download receipt"
                >
                  <HiDownload className="h-4 w-4" />
                  Receipt
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="ml-1 inline-flex items-center justify-center h-9 w-9 rounded-md bg-muted text-foreground border border-border hover:bg-muted/80 transition"
                  aria-label="Close"
                >
                  <HiX className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left: customer & shipping */}
              <div className="lg:col-span-1 space-y-4">
                <section className="rounded-lg border border-border p-4">
                  <h5 className="text-sm font-semibold mb-2">Customer</h5>
                  <div className="text-sm">
                    <div className="font-medium">{selected.customerName}</div>
                    <div className="text-muted-foreground">{selected.customerEmail}</div>
                    <div className="mt-3 text-xs text-muted-foreground">Payment Method</div>
                    <div className="text-sm">{selected.paymentMethod}</div>
                  </div>
                </section>

                <section className="rounded-lg border border-border p-4">
                  <h5 className="text-sm font-semibold mb-2">Shipping Address</h5>
                  <div className="text-sm text-foreground">
                    {formatAddress(selected.shippingAddress)}
                  </div>
                </section>

                <section className="rounded-lg border border-border p-4">
                  <h5 className="text-sm font-semibold mb-2">Summary</h5>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Items Subtotal</span>
                      <span>₹{subtotalOf(selected).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discounts</span>
                      <span>₹0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxes</span>
                      <span>₹0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>₹0</span>
                    </div>
                    <div className="h-px bg-border my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total Paid</span>
                      <span>₹{selected.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right: items */}
              <div className="lg:col-span-2">
                <section className="rounded-lg border border-border overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <h5 className="text-sm font-semibold">Items</h5>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full w-full text-sm">
                      <thead className="bg-muted/60 text-muted-foreground">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium">Product</th>
                          <th className="text-left px-4 py-2 font-medium">Qty</th>
                          <th className="text-left px-4 py-2 font-medium">Price</th>
                          <th className="text-left px-4 py-2 font-medium">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selected.items.map((it) => (
                          <tr key={`${selected.id}-${it.productId}`}>
                            <td className="px-4 py-2">{it.productName}</td>
                            <td className="px-4 py-2">{it.quantity}</td>
                            <td className="px-4 py-2">₹{it.price.toLocaleString()}</td>
                            <td className="px-4 py-2">
                              ₹{(it.price * it.quantity).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Link to full page if needed */}
                <div className="mt-4">
                  <Link
                    href={`/orders/${selected.id}`}
                    className="inline-flex items-center px-3 py-2 rounded-md bg-background text-foreground border border-border text-sm font-medium hover:bg-muted/60 transition"
                  >
                    Open Full Page
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* helpers */
function formatAddress(a: ShippingAddress) {
  const parts = [a.street, a.city, a.state, a.zipCode, a.country].filter(Boolean);
  return parts.join(", ");
}

function buildReceiptHTML(order: Order) {
  const dateStr = new Date(order.date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const rows = order.items
    .map(
      (it, i) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${i + 1}. ${it.productName}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${it.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">₹${it.price.toLocaleString()}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">₹${(it.price * it.quantity).toLocaleString()}</td>
      </tr>`
    )
    .join("");

  const subtotal = order.items.reduce((s, it) => s + it.price * it.quantity, 0);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Receipt #${order.id}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial, sans-serif; margin: 24px; color: #111; }
  .header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
  .brand { font-size: 18px; font-weight: 700; }
  .muted { color:#555; }
  .card { border:1px solid #e5e7eb; border-radius:12px; padding:16px; }
  .grid { display:grid; grid-template-columns: 1fr 1fr; gap:16px; }
  table { width:100%; border-collapse: collapse; font-size: 14px; }
  @media print {
    .noprint { display:none; }
    body { margin: 0.5in; }
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Order Receipt</div>
      <div class="muted">Order #${order.id}</div>
      <div class="muted">Date: ${dateStr}</div>
    </div>
    <button class="noprint" onclick="window.print()" style="padding:8px 12px;border:1px solid #e5e7eb;border-radius:8px;background:#111;color:#fff;cursor:pointer;">Print</button>
  </div>

  <div style="height:16px;"></div>

  <div class="grid">
    <div class="card">
      <div style="font-weight:600;margin-bottom:8px;">Customer</div>
      <div>${order.customerName}</div>
      <div class="muted">${order.customerEmail}</div>
      <div style="margin-top:8px;font-size:13px;" class="muted">Payment Method</div>
      <div>${order.paymentMethod}</div>
    </div>
    <div class="card">
      <div style="font-weight:600;margin-bottom:8px;">Shipping Address</div>
      <div>${order.shippingAddress.street}</div>
      <div>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</div>
      <div>${order.shippingAddress.country}</div>
    </div>
  </div>

  <div style="height:16px;"></div>

  <div class="card">
    <div style="font-weight:600;margin-bottom:8px;">Items</div>
    <table>
      <thead>
        <tr>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">Product</th>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">Qty</th>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">Price</th>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div style="height:16px;"></div>

  <div class="card" style="max-width:420px;margin-left:auto;">
    <div style="display:flex;justify-content:space-between;margin:6px 0;">
      <span class="muted">Items Subtotal</span>
      <span>₹${subtotal.toLocaleString()}</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin:6px 0;">
      <span class="muted">Discounts</span>
      <span>₹0</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin:6px 0;">
      <span class="muted">Taxes</span>
      <span>₹0</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin:6px 0;">
      <span class="muted">Shipping</span>
      <span>₹0</span>
    </div>
    <div style="height:1px;background:#e5e7eb;margin:8px 0;"></div>
    <div style="display:flex;justify-content:space-between;margin:6px 0;font-weight:700;">
      <span>Total Paid</span>
      <span>₹${order.totalAmount.toLocaleString()}</span>
    </div>
  </div>

  <div style="height:24px;"></div>
  <div class="muted" style="font-size:12px;">This is a system-generated receipt for your records.</div>
</body>
</html>`;
}
