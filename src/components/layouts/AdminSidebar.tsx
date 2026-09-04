"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const sidebarItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/students", label: "Students", icon: "🎓" },
  { href: "/admin/drivers", label: "Drivers", icon: "🚐" },
  { href: "/admin/routes", label: "Routes", icon: "🗺️" },
  { href: "/admin/payments", label: "Payments", icon: "💰" },
  { href: "/admin/cities", label: "Cities & Zones", icon: "🏙️" },
  { href: "/admin/faqs", label: "FAQs", icon: "❓" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-white/[0.04] bg-[#0a0a0a] p-4">
      <Link
        href="/admin/dashboard"
        className="mb-8 flex items-center gap-3 px-3"
      >
        <span className="text-2xl">🚐</span>
        <span className="font-display text-xl font-bold text-[#f5f5f5]">
          Drop Safely
        </span>
      </Link>

      <nav className="flex-1 space-y-1">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#22c55e]/10 text-[#22c55e]"
                  : "text-[#f5f5f5]/60 hover:bg-white/[0.03] hover:text-[#f5f5f5]"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.04] pt-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-[#f5f5f5]/60 transition-all hover:bg-white/[0.03] hover:text-red-400"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
