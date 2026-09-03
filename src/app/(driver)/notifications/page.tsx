"use client";

import React, { useState, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { motion } from "framer-motion";
import { Bell, BellOff, Check, CheckCheck, Info, AlertTriangle, CheckCircle2, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { stagger, fadeUp } from "@/lib/animations";
import { cn } from "@/lib/utils/cn";

interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  sentAt: string;
  channel: string;
  metadata?: Record<string, unknown>;
}

const typeIcon: Record<string, React.ElementType> = {
  trip_started: Bell,
  trip_completed: CheckCircle2,
  trip_delayed: AlertTriangle,
  route_assigned: Info,
  payment_verified: CreditCard,
  payment_rejected: AlertTriangle,
  system: Info,
};

const typeColor: Record<string, string> = {
  trip_started: "text-blue-400 bg-blue-500/10",
  trip_completed: "text-green-400 bg-green-500/10",
  trip_delayed: "text-yellow-400 bg-yellow-500/10",
  route_assigned: "text-purple-400 bg-purple-500/10",
  payment_verified: "text-green-400 bg-green-500/10",
  payment_rejected: "text-red-400 bg-red-500/10",
  system: "text-gray-400 bg-white/[0.06]",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const { user, token } = useAuth();
  const toast = useToast();

  const {
    data: notifData,
    isLoading,
  } = useSWR<{ data: Notification[] }>(
    token ? `/api/notifications` : null,
    { refreshInterval: 15_000 }
  );

  const notifications = notifData?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkRead = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/notifications/${id}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
        mutate(`/api/notifications`);
      } catch {
        toast.error("Failed to mark as read");
      }
    },
    [token, toast]
  );

  const handleMarkAllRead = useCallback(async () => {
    try {
      await fetch(`/api/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      mutate(`/api/notifications`);
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  }, [token, toast]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl py-6 space-y-4">
        <Skeleton variant="rect" height={40} />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rect" height={80} />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-2">
      <motion.div variants={stagger} initial="hidden" animate="visible">
        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-100 font-display">
              Notifications
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                : "All caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllRead}
              leftIcon={<CheckCheck size={14} />}
            >
              Mark All Read
            </Button>
          )}
        </motion.div>

        {/* Notification list */}
        {notifications.length === 0 ? (
          <motion.div variants={fadeUp}>
            <Card variant="elevated">
              <div className="text-center py-12">
                <BellOff size={40} className="mx-auto mb-3 text-gray-600" />
                <p className="text-sm text-gray-500">No notifications yet</p>
                <p className="text-xs text-gray-600 mt-1">
                  You&apos;ll be notified about trips, routes, and payments.
                </p>
              </div>
            </Card>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((notif, index) => {
              const Icon = typeIcon[notif.type] || Bell;
              const colorClass = typeColor[notif.type] || typeColor.system;

              return (
                <motion.div
                  key={notif._id}
                  variants={fadeUp}
                  className={cn(
                    "rounded-2xl border px-4 py-3.5 backdrop-blur-sm transition-all",
                    notif.isRead
                      ? "border-white/[0.04] bg-white/[0.01]"
                      : "border-white/[0.08] bg-white/[0.03]"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                        colorClass
                      )}
                    >
                      <Icon size={16} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p
                          className={cn(
                            "text-sm font-medium truncate",
                            notif.isRead ? "text-gray-400" : "text-gray-100"
                          )}
                        >
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                        {notif.body}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{timeAgo(notif.sentAt)}</p>
                    </div>

                    {/* Mark read button */}
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkRead(notif._id)}
                        className="shrink-0 p-1.5 rounded-lg text-gray-600 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                        aria-label="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
