"use client";

import { useCallback } from "react";
import useSWR, { mutate } from "swr";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { fadeUp, stagger } from "@/lib/animations";
import {
  Bell,
  CreditCard,
  Map,
  Bus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";

interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  sentAt: string;
  channel: string;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "trip_started":
      return <Bus size={16} className="text-green-400" />;
    case "trip_completed":
      return <CheckCircle size={16} className="text-blue-400" />;
    case "trip_delayed":
      return <AlertTriangle size={16} className="text-yellow-400" />;
    case "payment_reminder":
      return <CreditCard size={16} className="text-amber-400" />;
    case "payment_verified":
      return <CheckCircle size={16} className="text-green-400" />;
    case "payment_rejected":
      return <XCircle size={16} className="text-red-400" />;
    case "route_assigned":
      return <Map size={16} className="text-blue-400" />;
    default:
      return <Info size={16} className="text-gray-400" />;
  }
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}

export default function NotificationsPage() {
  const { data, isLoading } = useSWR<{
    data: Notification[];
    pagination: { page: number; totalPages: number; totalItems: number };
  }>("/api/notifications");

  const notifications = data?.data ?? [];

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      const token = JSON.parse(localStorage.getItem("ds_auth") || "{}").accessToken;
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      mutate("/api/notifications");
    } catch {
      // Silent fail for mark-as-read
    }
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton variant="rect" height={60} />
        <Skeleton variant="rect" height={60} />
        <Skeleton variant="rect" height={60} />
        <Skeleton variant="rect" height={60} />
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-100">Notifications</h1>
            <p className="text-sm text-gray-500 mt-0.5">Stay updated with your route and payments</p>
          </div>
          {unreadCount > 0 && (
            <Badge variant="info" size="sm" dot>
              {unreadCount} unread
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Notification list */}
      {notifications.length === 0 ? (
        <motion.div variants={fadeUp}>
          <Card padding="lg" className="text-center">
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.03]">
                <Bell size={28} className="text-gray-700" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-400">No Notifications</h2>
                <p className="text-xs text-gray-600 mt-1">
                  You'll see updates about your route, payments, and trips here.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp}>
          <div className="space-y-2">
            {notifications.map((notification) => (
              <motion.div
                key={notification._id}
                variants={fadeUp}
                onClick={() => !notification.isRead && handleMarkRead(notification._id)}
                className={`group cursor-pointer rounded-2xl border px-4 py-3.5 transition-all duration-200 ${
                  notification.isRead
                    ? "border-white/[0.04] bg-white/[0.01] opacity-60 hover:opacity-80"
                    : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    notification.isRead ? "bg-white/[0.03]" : "bg-white/[0.06]"
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className={`text-sm font-medium truncate ${
                        notification.isRead ? "text-gray-500" : "text-gray-200"
                      }`}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-green-500 shrink-0 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                      )}
                    </div>
                    <p className={`text-xs leading-relaxed ${
                      notification.isRead ? "text-gray-600" : "text-gray-400"
                    }`}>
                      {notification.body}
                    </p>
                    <p className="text-[10px] text-gray-700 mt-1.5">
                      {formatTimeAgo(notification.sentAt)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
