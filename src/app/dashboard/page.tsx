// app/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import KPICard from "@/components/cards/KPICard";
import RevenueChart from "@/components/charts/RevenueChart";
import { fetchDashboardData } from "@/lib/api";
import { HiCash, HiShoppingCart, HiUsers, HiExclamationCircle } from "react-icons/hi";
import { useTheme } from "next-themes";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ---- theme-driven colors for charts (reads CSS vars) ----
  const chartData = useMemo(() => {
    // guard for SSR
    if (!mounted) {
      return { labels: [], datasets: [] };
    }
    const root = getComputedStyle(document.documentElement);
    // These come from your Tailwind/shadcn theme (see step #3)
    const primary = root.getPropertyValue("--primary").trim() || "#b34725";
    const isDark = (theme ?? "light") === "dark";
    const fill = isDark ? "0.25" : "0.12"; // alpha

    return {
      labels: dashboardData?.salesTrend?.labels || [],
      datasets: [
        {
          label: "Revenue",
          data: dashboardData?.salesTrend?.data || [],
          borderColor: primary,
          backgroundColor: `color-mix(in srgb, ${primary} ${isDark ? "30%" : "15%"}, transparent)`,
          // fallback if color-mix unsupported
          ...(CSS && "supports" in CSS && CSS.supports("color: color-mix(in srgb, red, blue)")
            ? {}
            : { backgroundColor: `${primary}1F` /* ~12% alpha hex */ }),
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }, [dashboardData, theme, mounted]);
  // ---------------------------------------------------------

  if (!mounted) {
    return (
      <div className="p-6">
        <div className="h-8 w-40 rounded bg-muted animate-pulse" />
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="mt-6 h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Page Title */}
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Sales"
          value={dashboardData?.totalSales ?? 0}
          icon={<HiCash className="w-6 h-6" />}
          trend={{ value: 12, isPositive: true }}
          loading={loading}
        />
        <KPICard
          title="Total Orders"
          value={dashboardData?.totalOrders ?? 0}
          icon={<HiShoppingCart className="w-6 h-6" />}
          trend={{ value: 8, isPositive: true }}
          loading={loading}
        />
        <KPICard
          title="Total Customers"
          value={dashboardData?.totalCustomers ?? 0}
          icon={<HiUsers className="w-6 h-6" />}
          trend={{ value: 5, isPositive: true }}
          loading={loading}
        />
        <KPICard
          title="Low Stock Alerts"
          value={dashboardData?.lowStockAlerts ?? 0}
          icon={<HiExclamationCircle className="w-6 h-6" />}
          trend={{ value: 3, isPositive: false }}
          loading={loading}
        />
      </div>
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link
          href="/admin/products/add"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition"
        >
          <span>➕</span> Add Product
        </Link>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition"
        >
          <span>📑</span> View Orders
        </Link>
        <Link
          href="/admin/inventory"
          className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition"
        >
          <span>📦</span> Check Inventory
        </Link>
      </div>

      {/* Sales Chart */}
      <div className="bg-card text-card-foreground shadow-xl rounded-2xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Sales Trends</h2>
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            Weekly <span className="w-2 h-2 rounded-full bg-primary" />
          </span>
        </div>
        {loading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : (
          <RevenueChart data={chartData} />
        )}
      </div>


    </div>
  );
}
