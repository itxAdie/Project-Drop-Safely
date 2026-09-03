"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/driver/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/driver/trip", label: "Trip", icon: "🗺️" },
  { href: "/driver/earnings", label: "Earnings", icon: "💰" },
  { href: "/driver/notifications", label: "Alerts", icon: "🔔" },
];

export function DriverNav() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl sm:static sm:border-b sm:border-white/[0.04]">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2 sm:py-3">
        <Link href="/driver" className="hidden font-display text-lg font-bold text-[#22c55e] sm:block">
          Drop Safely
        </Link>
        <div className="flex w-full items-center justify-around gap-1 sm:w-auto sm:gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-xs font-medium transition-all sm:flex-row sm:gap-2 sm:px-4 sm:py-2 sm:text-sm ${
                  isActive
                    ? "bg-[#22c55e]/10 text-[#22c55e]"
                    : "text-[#f5f5f5]/50 hover:bg-white/[0.03] hover:text-[#f5f5f5]/80"
                }`}
              >
                <span className="text-base sm:text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-xs font-medium text-[#f5f5f5]/50 transition-all hover:bg-white/[0.03] hover:text-red-400 sm:flex-row sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
          >
            <span className="text-base sm:text-sm">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
