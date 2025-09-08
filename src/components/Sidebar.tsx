// components/Sidebar.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  FileText,
  CreditCard,
  Truck,
  BarChart3,
  Settings,
  Users,
  Tag,
  MessageSquareQuote,
  X,
} from "lucide-react";

type SidebarProps = {
  open: boolean;             // mobile
  collapsed: boolean;        // desktop
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
};

const MENU = [
  { name: "Dashboard", href: "/", Icon: LayoutDashboard },
  { name: "Products", href: "/products", Icon: Package },
  { name: "Inventory", href: "/inventory", Icon: Boxes },
  { name: "Orders", href: "/orders", Icon: ShoppingCart },
  { name: "Blogs", href: "/blogs", Icon: FileText },
  { name: "Sales & Payments", href: "/sales-payments", Icon: CreditCard },
  { name: "Shipping", href: "/shipping", Icon: Truck },
  { name: "Reports", href: "/reports", Icon: BarChart3 },
  { name: "Settings", href: "/settings", Icon: Settings },
  { name: "User Management", href: "/user-management", Icon: Users },
  { name: "Coupons", href: "/coupons", Icon: Tag },
  { name: "Testimonials", href: "/testimonials", Icon: MessageSquareQuote },
];

export default function Sidebar({
  open,
  collapsed,
  onCloseMobile,
  onToggleCollapse,
}: SidebarProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on ESC (mobile)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCloseMobile(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCloseMobile]);

  // Click outside (mobile)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onCloseMobile();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, onCloseMobile]);

  // Until mounted, avoid theme-dependent classes to prevent hydration mismatch
  const isDark = mounted ? resolvedTheme === "dark" : false;

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" aria-hidden="true" />}

      <aside
        ref={panelRef}
        className={[
          "fixed md:sticky top-0 left-0 h-screen z-50 md:z-30 border-r transition-[width,transform] duration-300",
          isDark ? "bg-gray-950 border-gray-800" : "bg-white border-gray-200",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "w-16" : "w-64",
        ].join(" ")}
        aria-label="Sidebar"
      >
        {/* Header */}
        <div className={["h-16 flex items-center justify-between px-3 border-b", isDark ? "border-gray-800" : "border-gray-200"].join(" ")}>
          <div className="flex items-center gap-3 overflow-hidden">
            <Image src="/wildnroot.jpg" alt="Wild n Root" width={36} height={36} className="rounded" priority />
            {!collapsed && (
              <div className="leading-tight">
                <p className="font-semibold">Wild n Root</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
              </div>
            )}
          </div>

          {/* Collapse (desktop) */}
          <button
            onClick={onToggleCollapse}
            className={["hidden md:inline-flex p-2 rounded-md transition-colors", isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"].join(" ")}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            <span className={`block w-0 h-0 border-y-8 border-y-transparent ${collapsed ? "border-l-8 border-l-gray-500" : "border-r-8 border-r-gray-500"}`} />
          </button>

          {/* Close (mobile) */}
          <button
            onClick={onCloseMobile}
            className={["md:hidden p-2 rounded-md transition-colors", isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"].join(" ")}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu */}
        <nav className="h-[calc(100vh-4rem)] overflow-y-auto py-3">
          {MENU.map(({ name, href, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "mx-2 my-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
                  active
                    ? "bg-primary text-white"
                    : isDark
                      ? "text-gray-300 hover:bg-gray-900"
                      : "text-gray-700 hover:bg-gray-100",
                ].join(" ")}
                title={collapsed ? name : undefined}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={`w-5 h-5 ${active ? "opacity-100" : "opacity-90"}`} />
                {!collapsed && <span className="truncate">{name}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
