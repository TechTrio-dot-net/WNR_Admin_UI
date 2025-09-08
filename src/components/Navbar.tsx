// components/layout/Navbar.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, User, LogOut, Sun, Moon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";

export default function Navbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { resolvedTheme, setTheme } = useTheme(); // ← use resolvedTheme
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Avoid SSR mismatch; show a neutral header until mounted
  if (!mounted) {
    return (
      <header className="h-16 flex items-center justify-between px-4 border-b bg-white dark:bg-black" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <header
      className={`h-16 flex items-center justify-between px-4 shadow-sm sticky top-0 z-40 border-b
      ${isDark ? "bg-black border-gray-800" : "bg-white border-gray-200"}`}
    >
      <button
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className={`md:hidden p-2 rounded-md ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* centered logo on mobile (uses /public path) */}
      <div className="absolute inset-x-0 mx-auto w-fit md:hidden pointer-events-none">
        <Image src="/wildnroot.jpg" alt="Wild n Root" width={40} height={40} className="h-10 w-auto rounded" />
      </div>

      <div className="flex items-center gap-2">
        {/* THEME TOGGLE — now uses resolvedTheme */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label="Toggle theme"
          className={`p-2 rounded-full ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
        >
          {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((s) => !s)}
            className={`p-2 rounded-full ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <User className="w-6 h-6" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 border
              ${isDark ? "bg-black border-gray-700" : "bg-white border-gray-200"}`}
            >
              <Link
                href="/editprofile"
                role="menuitem"
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setMenuOpen(false)}
              >
                <User className="w-4 h-4" /> Edit Profile
              </Link>
              <Link
                href="/logout"
                role="menuitem"
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setMenuOpen(false)}
              >
                <LogOut className="w-4 h-4" /> Logout
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
