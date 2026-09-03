"use client";

import React, { useState, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { motion } from "framer-motion";
import { ReceiptQueue } from "@/components/admin/ReceiptQueue";
import { DepositQueue } from "@/components/admin/DepositQueue";
import { useAuth } from "@/hooks/useAuth";
import { pageTransition } from "@/lib/animations";
import { cn } from "@/lib/utils/cn";

type TabKey = "pending" | "verified" | "rejected";
type Mode = "receipts" | "deposits";

const tabs: { key: TabKey; label: string; status: string }[] = [
  { key: "pending", label: "Pending", status: "submitted" },
  { key: "verified", label: "Verified", status: "verified" },
  { key: "rejected", label: "Rejected", status: "rejected" },
];

const depositTabs: { key: TabKey; label: string; status: string }[] = [
  { key: "pending", label: "Pending", status: "submitted" },
  { key: "verified", label: "Verified", status: "verified" },
  { key: "rejected", label: "Rejected", status: "rejected" },
];

interface DepositItem {
  _id: string;
  name: string;
  phone: string;
  city: string;
  institute: string;
  assignedRouteId?: string | null;
  depositStatus: string;
  depositAmount: number;
  depositReceiptUrl?: string;
  depositSubmittedAt?: string;
  depositVerifiedAt?: string;
  depositRefundedAt?: string;
  depositRejectionReason?: string;
}

export default function PaymentsPage() {
  const [mode, setMode] = useState<Mode>("receipts");
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const { token } = useAuth();

  const activeStatus = tabs.find((t) => t.key === activeTab)?.status || "submitted";
  const depositStatus = depositTabs.find((t) => t.key === activeTab)?.status || "submitted";

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
  }>(mode === "receipts" ? `/api/payments?status=${activeStatus}` : null);

  const { data: depositData, isLoading: depositLoading } = useSWR<{
    data: DepositItem[];
    pagination: { page: number; totalPages: number; totalItems: number };
  }>(mode === "deposits" ? `/api/admin/deposits?status=${depositStatus}` : null);

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
        <p className="text-sm text-gray-500 mt-1">Review and verify receipts and security deposits</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/[0.02] border border-white/[0.04] w-fit">
        {[
          { key: "receipts" as Mode, label: "Billing Receipts" },
          { key: "deposits" as Mode, label: "Security Deposits" },
        ].map((m) => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); setActiveTab("pending"); }}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all",
              mode === m.key
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/[0.02] border border-white/[0.04] w-fit">
        {(mode === "receipts" ? tabs : depositTabs).map((tab) => (
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
      {mode === "receipts" ? (
        <ReceiptQueue
          payments={data?.data || []}
          isLoading={isLoading}
          onAction={handleAction}
        />
      ) : (
        <DepositQueue
          deposits={depositData?.data || []}
          isLoading={depositLoading}
          onMutate={() => {
            mutate("deposits", undefined);
          }}
        />
      )}

      {/* Pagination */}
      {mode === "receipts" && data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center mt-6">
          <p className="text-xs text-gray-600">{data.pagination.totalItems} total receipts</p>
        </div>
      )}
      {mode === "deposits" && depositData?.pagination && depositData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center mt-6">
          <p className="text-xs text-gray-600">{depositData.pagination.totalItems} total deposits</p>
        </div>
      )}
    </motion.div>
  );
}
