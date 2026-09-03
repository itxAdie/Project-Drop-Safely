"use client";

import React, { useState, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { motion } from "framer-motion";
import { ReceiptQueue } from "@/components/admin/ReceiptQueue";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { pageTransition } from "@/lib/animations";

type TabKey = "pending" | "verified" | "rejected";

const tabs: { key: TabKey; label: string; status: string }[] = [
  { key: "pending", label: "Pending", status: "submitted" },
  { key: "verified", label: "Verified", status: "verified" },
  { key: "rejected", label: "Rejected", status: "rejected" },
];

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const toast = useToast();
  const { token } = useAuth();

  const activeStatus = tabs.find((t) => t.key === activeTab)?.status || "submitted";
  const { data, isLoading } = useSWR<{
    data: Array<{
      _id: string;
      studentId?: { name: string; phone: string; city: string; institute: string };
      routeId?: { name: string; city: string };
      amount: number;
      platformFee: number;
      receiptUrl?: string;
      status: string;
      rejectionReason?: string;
      billingPeriodStart: string;
      billingPeriodEnd: string;
      createdAt: string;
    }>;
    pagination: { page: number; totalPages: number; totalItems: number };
  }>(`/api/payments?status=${activeStatus}`);

  const handleAction = useCallback(async (paymentId: string, approved: boolean, reason?: string) => {
    const res = await fetch(`/api/payments/${paymentId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ approved, rejectionReason: reason }),
    });
    if (!res.ok) throw new Error("Failed");
    mutate((key: string) => typeof key === "string" && key.startsWith("/api/payments"), undefined, { revalidate: true });
  }, [token]);

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-5xl mx-auto"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Payment Verification</h1>
        <p className="text-sm text-gray-500 mt-1">Review and verify uploaded payment receipts</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/[0.02] border border-white/[0.04] w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.key
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <ReceiptQueue
        payments={data?.data || []}
        isLoading={isLoading}
        onAction={handleAction}
      />

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center mt-6">
          <p className="text-xs text-gray-600">
            {data.pagination.totalItems} total receipts
          </p>
        </div>
      )}
    </motion.div>
  );
}
