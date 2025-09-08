// components/Shell.tsx
"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function Shell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // mobile drawer
  const [mobileOpen, setMobileOpen] = useState(false);
  // desktop collapse (hydrate from localStorage AFTER mount)
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const v = typeof window !== "undefined" ? localStorage.getItem("sidebar-collapsed") : null;
    if (v !== null) setCollapsed(v === "true");
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed, mounted]);

  const toggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileOpen((s) => !s);
    } else {
      setCollapsed((s) => !s);
    }
  };

  // Until mounted, render a consistent layout (expanded width)
  const marginClass = mounted ? (collapsed) : "md:ml-64";

  return (
    <div className="min-h-screen flex">
      {/* Sidebar uses mounted-safe theme and will not mismatch */}
      <Sidebar
        open={mobileOpen}
        collapsed={mounted ? collapsed : false}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((s) => !s)}
      />
      <div className={`flex-1 min-w-0 transition-[margin] duration-300 ${marginClass}`}>
        <Navbar onToggleSidebar={toggleSidebar} />
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}
