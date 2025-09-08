"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { fetchOrders, updateOrder, Order } from "@/lib/api";

export default function ShippingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    courier: "",
    trackingNumber: "",
  });

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

  const filteredOrders = useMemo(
    () => orders.filter(o => statusFilter === "all" || o.status === (statusFilter as any)),
    [orders, statusFilter]
  );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const getStatusBadge = (status: string) => {
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

  const handleEditShipping = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setEditingOrder(orderId);
      setShippingForm({
        courier: (order as any).courier || "",
        trackingNumber: (order as any).trackingNumber || "",
      });
      toast.info(`Editing shipping for #${orderId}`);
    }
  };

  const handleSaveShipping = async (orderId: string) => {
    if (!shippingForm.courier?.trim() || !shippingForm.trackingNumber?.trim()) {
      toast.warning("Please fill both courier and tracking number.");
      return;
    }

    try {
      setSaving(true);
      const updatedOrder = await updateOrder(orderId, {
        courier: shippingForm.courier.trim(),
        trackingNumber: shippingForm.trackingNumber.trim(),
      });
      setOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o)));
      setEditingOrder(null);
      setShippingForm({ courier: "", trackingNumber: "" });
      toast.success(`Shipping info saved for #${orderId}`);
    } catch (error) {
      console.error("Failed to update order:", error);
      toast.error("Failed to update shipping information.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingOrder(null);
    setShippingForm({ courier: "", trackingNumber: "" });
    toast("Changes discarded.");
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
          <div className="h-12 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
          Shipping Management
        </h3>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={orders.length} />
        <StatCard
          label="Pending"
          value={orders.filter(o => o.status === "pending").length}
          tone="amber"
        />
        <StatCard
          label="Shipped"
          value={orders.filter(o => o.status === "shipped").length}
          tone="blue"
        />
        <StatCard
          label="Completed"
          value={orders.filter(o => o.status === "completed").length}
          tone="emerald"
        />
      </div>

      {/* Filters */}
      <div className="bg-card shadow rounded-2xl p-4 sm:p-6 border border-border">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label className="text-sm font-medium text-muted-foreground">
            Filter by Status:
          </label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="shipped">Shipped</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-card shadow rounded-2xl border border-border overflow-hidden">
        {/* Desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-muted/60">
              <tr className="text-muted-foreground">
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Courier
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Tracking
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-muted/40">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {order.id}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{order.customerName}</div>
                    <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {formatDate(order.date)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {editingOrder === order.id ? (
                      <input
                        type="text"
                        value={shippingForm.courier}
                        onChange={e => setShippingForm({ ...shippingForm, courier: e.target.value })}
                        className="w-full px-2 py-1 bg-background text-foreground border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Courier name"
                      />
                    ) : (
                      ((order as any).courier || "-")
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {editingOrder === order.id ? (
                      <input
                        type="text"
                        value={shippingForm.trackingNumber}
                        onChange={e => setShippingForm({ ...shippingForm, trackingNumber: e.target.value })}
                        className="w-full px-2 py-1 bg-background text-foreground border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Tracking number"
                      />
                    ) : (
                      ((order as any).trackingNumber || "-")
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingOrder === order.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveShipping(order.id)}
                          disabled={saving}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs hover:opacity-90 disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-md bg-muted text-foreground border border-border text-xs hover:bg-muted/80"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        {order.status === "shipped" && !(order as any).courier && (
                          <button
                            onClick={() => handleEditShipping(order.id)}
                            className="text-primary hover:opacity-90"
                          >
                            Add Shipping Info
                          </button>
                        )}
                        {order.status === "completed" && (order as any).courier && (
                          <span className="text-emerald-600 dark:text-emerald-400">✓ Shipped</span>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-3 p-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-card rounded-xl p-3 sm:p-4 border border-border flex flex-col space-y-3">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-sm sm:text-base text-foreground block truncate">
                    #{order.id}
                  </span>
                  <span className="text-xs text-muted-foreground block">{order.customerEmail}</span>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusBadge(order.status)} flex-shrink-0`}>
                  {order.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium truncate text-foreground">{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium text-foreground">{formatDate(order.date)}</span>
                </div>

                <div className="flex justify-between col-span-2">
                  <span className="text-muted-foreground">Courier:</span>
                  <span className="font-medium truncate text-foreground">
                    {editingOrder === order.id ? (
                      <input
                        type="text"
                        value={shippingForm.courier}
                        onChange={e => setShippingForm({ ...shippingForm, courier: e.target.value })}
                        className="w-full px-2 py-1 bg-background text-foreground border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Courier name"
                      />
                    ) : (
                      ((order as any).courier || "-")
                    )}
                  </span>
                </div>

                <div className="flex justify-between col-span-2">
                  <span className="text-muted-foreground">Tracking:</span>
                  <span className="font-medium truncate text-foreground">
                    {editingOrder === order.id ? (
                      <input
                        type="text"
                        value={shippingForm.trackingNumber}
                        onChange={e => setShippingForm({ ...shippingForm, trackingNumber: e.target.value })}
                        className="w-full px-2 py-1 bg-background text-foreground border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Tracking number"
                      />
                    ) : (
                      ((order as any).trackingNumber || "-")
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                {editingOrder === order.id ? (
                  <>
                    <button
                      onClick={() => handleSaveShipping(order.id)}
                      disabled={saving}
                      className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded hover:opacity-90 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-muted text-foreground border border-border text-xs rounded hover:bg-muted/80"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {order.status === "shipped" && !(order as any).courier && (
                      <button
                        onClick={() => handleEditShipping(order.id)}
                        className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded hover:opacity-90"
                      >
                        Add Shipping Info
                      </button>
                    )}
                    {order.status === "completed" && (order as any).courier && (
                      <span className="text-emerald-600 dark:text-emerald-400 text-sm">✓ Shipped</span>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <div className="text-muted-foreground text-4xl sm:text-6xl mb-4">📦</div>
          <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No orders found</h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            {statusFilter !== "all"
              ? `No orders with status "${statusFilter}"`
              : "No orders available"}
          </p>
        </div>
      )}
    </div>
  );
}

/* Tiny stat card */
function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "amber" | "blue" | "emerald";
}) {
  const color =
    tone === "amber"
      ? "text-amber-600"
      : tone === "blue"
      ? "text-blue-600"
      : tone === "emerald"
      ? "text-emerald-600"
      : "text-primary";

  const bubble =
    tone === "amber"
      ? "bg-amber-500/10"
      : tone === "blue"
      ? "bg-blue-500/10"
      : tone === "emerald"
      ? "bg-emerald-500/10"
      : "bg-primary/10";

  return (
    <div className="bg-card shadow rounded-2xl p-6 border border-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`text-3xl font-bold text-foreground ${color ? "" : "text-primary"}`}>
            {value}
          </p>
        </div>
        <div className={`w-10 h-10 ${bubble} rounded-full`} />
      </div>
    </div>
  );
}
