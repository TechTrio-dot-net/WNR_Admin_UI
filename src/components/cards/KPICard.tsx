// src/components/cards/KPICard.tsx
"use client";

import React from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

export default function KPICard({
  title,
  value,
  icon,
  trend,
  loading,
}: KPICardProps) {
  if (loading) {
    return (
      <div className="h-28 rounded-2xl animate-pulse bg-muted" />
    );
  }

  return (
    <div
      className="
        rounded-2xl p-4 shadow-md transition hover:shadow-lg
        bg-card border border-border text-card-foreground
      "
      role="group"
      aria-label={title}
    >
      <div className="flex items-center gap-4">
        {/* Icon chip (brand-aware) */}
        <div
          className="
            flex items-center justify-center p-3 rounded-lg
            text-primary bg-primary/10
          "
          aria-hidden="true"
        >
          {icon}
        </div>

        {/* Metrics */}
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>

          {trend && (
            <p
              className={[
                "text-sm mt-1 font-medium",
                trend.isPositive ? "text-success" : "text-destructive",
              ].join(" ")}
            >
              {trend.isPositive ? "▲" : "▼"} {trend.value}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
