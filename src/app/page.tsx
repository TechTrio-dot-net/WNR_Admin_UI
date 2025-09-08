// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import KPICard from "@/components/cards/KPICard";
import RevenueChart from "@/components/charts/RevenueChart";
import { fetchDashboardData } from "@/lib/api";

type DashboardData = {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  lowStockAlerts: number;
  salesTrend: { labels: string[]; data: number[] };
};

const EMPTY: DashboardData = {
  totalSales: 0,
  totalOrders: 0,
  totalCustomers: 0,
  lowStockAlerts: 0,
  salesTrend: { labels: [], data: [] },
};

export default function Home() {
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7");
  const [err, setErr] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false); // prevent hydration mismatch

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetchDashboardData();
        setData({
          totalSales: Number(res?.totalSales ?? 0),
          totalOrders: Number(res?.totalOrders ?? 0),
          totalCustomers: Number(res?.totalCustomers ?? 0),
          lowStockAlerts: Number(res?.lowStockAlerts ?? 0),
          salesTrend: {
            labels: res?.salesTrend?.labels ?? [],
            data: res?.salesTrend?.data ?? [],
          },
        });
      } catch {
        setErr("Could not fetch dashboard data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [range]);

  // Let RevenueChart theme itself; only supply labels+data
  const chartData = useMemo(
    () => ({
      labels: data.salesTrend.labels,
      datasets: [
        {
          label: "Revenue",
          data: data.salesTrend.data,
          // No border/background colors here; RevenueChart reads CSS vars.
        },
      ],
    }),
    [data.salesTrend]
  );

  if (!mounted) {
    // skeleton with theme tokens
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-44 rounded bg-muted animate-pulse" />
          <div className="h-10 w-36 rounded bg-muted animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-xl bg-muted animate-pulse" />
          <div className="h-80 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>

        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          Range
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="
              bg-card text-foreground border border-border
              rounded-lg px-4 py-2
              focus:outline-none focus:ring-2 focus:ring-primary
              shadow-sm
            "
          >
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
          </select>
        </label>
      </div>

      {/* Error */}
      {err && (
        <div className="bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 px-4 py-3 rounded-md">
          {err}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Sales"
          value={data.totalSales}
          icon="💰"
          trend={{ value: 12.5, isPositive: true }}
          loading={loading}
        />
        <KPICard
          title="Total Orders"
          value={data.totalOrders}
          icon="📦"
          trend={{ value: 8.2, isPositive: true }}
          loading={loading}
        />
        <KPICard
          title="Total Customers"
          value={data.totalCustomers}
          icon="👥"
          trend={{ value: 5.7, isPositive: true }}
          loading={loading}
        />
        <KPICard
          title="Low Stock Alerts"
          value={data.lowStockAlerts}
          icon="⚠️"
          trend={{ value: 3.1, isPositive: false }}
          loading={loading}
        />
      </div>

      {/* Charts + stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="bg-card text-card-foreground shadow-lg rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Revenue Trends</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Weekly</span>
              <span className="w-2 h-2 bg-primary rounded-full" />
            </div>
          </div>
          {loading ? (
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
          ) : data.salesTrend.labels.length ? (
            <RevenueChart data={chartData} />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              No data
            </div>
          )}
        </div>

        {/* Performance metrics */}
        <div className="bg-card text-card-foreground shadow-lg rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-semibold mb-6">Performance Metrics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Conversion Rate</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">4.8%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Average Order Value</span>
              <span className="font-semibold text-primary">₹2,450</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Customer Satisfaction</span>
              <span className="font-semibold text-yellow-600 dark:text-yellow-400">92%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Return Rate</span>
              <span className="font-semibold text-red-600 dark:text-red-400">2.1%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
