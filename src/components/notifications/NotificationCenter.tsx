"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils/cn";

// ── Types ──────────────────────────────────────────────────────────────────

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  sentAt: string;
  metadata?: Record<string, unknown>;
}

// ── Fetcher ────────────────────────────────────────────────────────────────

async function authFetcher(url: string, token: string | null) {
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

// ── Type-to-link mapping ───────────────────────────────────────────────────

function getNotificationLink(type: string, metadata?: Record<string, unknown>): string {
  switch (type) {
    case "pickup":
    case "dropoff":
    case "trip_started":
    case "trip_completed":
    case "delay":
    case "trip_delayed":
      return metadata?.tripId ? `/trip/${metadata.tripId}` : "/dashboard";
    case "payment_reminder":
    case "payment_verified":
    case "payment_rejected":
      return "/dashboard";
    case "route_activated":
    case "route_matched":
    case "route_assigned":
      return "/student/dashboard";
    case "driver_approved":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Component ──────────────────────────────────────────────────────────────

export function NotificationCenter() {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Unread count — polls every 30s
  const { data: countData } = useSWR<{ count: number }>(
    token ? "/api/notifications/unread-count" : null,
    (url: string) => authFetcher(url, token),
    { refreshInterval: 30_000 },
  );

  // Notification feed
  const { data: feedData, mutate: mutateFeed } = useSWR<{
    success: boolean;
    data: NotificationItem[];
  }>(
    token ? "/api/notifications?pageSize=20" : null,
    (url: string) => authFetcher(url, token),
    { refreshInterval: isOpen ? 10_000 : 30_000 },
  );

  const unreadCount = countData?.count ?? 0;
  const notifications = feedData?.data ?? [];

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Mark single notification as read
  const markRead = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/notifications/${id}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
        mutateFeed();
      } catch {
        // silent fail
      }
    },
    [token, mutateFeed],
  );

  // Mark all as read
  const markAllRead = useCallback(async () => {
    try {
      await fetch("/api/notifications/mark-all-read", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      mutateFeed();
    } catch {
      // silent fail
    }
  }, [token, mutateFeed]);

  return (
    <div className="relative">
      {/* Bell button */}
      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen((v) => !v)}
        whileTap={{ scale: 0.92 }}
        className="relative p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.12] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-300" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute right-0 top-full mt-2 w-[360px] max-h-[480px] z-50 flex flex-col overflow-hidden"
            style={{
              background: "rgba(10, 15, 10, 0.85)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "1.25rem",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(34,197,94,0.05)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-gray-100">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/[0.06] transition-colors"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Bell className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {notifications.map((n, i) => (
                    <motion.a
                      key={n._id}
                      href={getNotificationLink(n.type, n.metadata)}
                      onClick={() => {
                        if (!n.isRead) markRead(n._id);
                      }}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors",
                        !n.isRead && "bg-green-500/[0.03]",
                      )}
                    >
                      {/* Unread dot */}
                      <div className="pt-1.5 shrink-0">
                        {!n.isRead ? (
                          <span className="block w-2 h-2 rounded-full bg-green-500" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-gray-600" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm leading-tight",
                            !n.isRead
                              ? "text-gray-100 font-medium"
                              : "text-gray-400",
                          )}
                        >
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {n.body}
                        </p>
                        <p className="text-[10px] text-gray-600 mt-1">
                          {timeAgo(n.sentAt)}
                        </p>
                      </div>
                    </motion.a>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
