"use client";

import { useState, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Skeleton } from "@/components/ui/Skeleton";
import { fadeUp, stagger } from "@/lib/animations";
import { CreditCard, Calendar, Upload, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

interface PaymentRecord {
  _id: string;
  amount: number;
  platformFee: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  receiptUrl?: string;
  status: string;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

interface PaymentsData {
  history: PaymentRecord[];
  current: {
    status: string;
    amount: number;
    dueDate: string | null;
    current: Record<string, unknown> | null;
  };
}

interface StudentData {
  _id: string;
}

function formatPKR(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusVariant(status: string): "success" | "warning" | "danger" | "info" | "default" {
  switch (status) {
    case "verified": return "success";
    case "submitted": return "info";
    case "pending": return "warning";
    case "overdue": return "danger";
    case "rejected": return "danger";
    default: return "default";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "verified": return "Verified";
    case "submitted": return "Under Review";
    case "pending": return "Pending";
    case "overdue": return "Overdue";
    case "rejected": return "Rejected";
    default: return status;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "verified": return <CheckCircle size={14} className="text-green-400" />;
    case "submitted": return <Clock size={14} className="text-blue-400" />;
    case "pending": return <Clock size={14} className="text-yellow-400" />;
    case "overdue": return <AlertTriangle size={14} className="text-red-400" />;
    case "rejected": return <XCircle size={14} className="text-red-400" />;
    default: return null;
  }
}

export default function PaymentsPage() {
  const toast = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const { data: meData } = useSWR<{ data: StudentData | null }>("/api/students/me");
  const studentId = meData?.data?._id;
  const paymentsKey = studentId ? `/api/students/${studentId}/payments` : null;
  const { data, isLoading } = useSWR<{ data: PaymentsData }>(paymentsKey);

  const handleFileUpload = useCallback(async (files: File[]) => {
    if (files.length === 0 || !studentId) return;
    setIsUploading(true);

    try {
      const token = JSON.parse(localStorage.getItem("ds_auth") || "{}").accessToken;

      // Step 1: Upload file to Cloudinary
      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("folder", "drop-safely/receipts");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      const receiptUrl = uploadData.data.url;

      // Step 2: Submit receipt to payment API
      const payRes = await fetch(`/api/students/${studentId}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receiptUrl }),
      });

      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.error || "Failed to submit receipt");

      toast.success("Receipt uploaded and submitted for review");
      mutate(paymentsKey);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, [studentId, toast, paymentsKey]);

  const columns: Column<PaymentRecord & Record<string, unknown>>[] = [
    {
      header: "Period",
      accessor: "billingPeriodStart",
      sortable: true,
      render: (_val, row) => (
        <span className="text-xs">
          {formatDate(row.billingPeriodStart)} – {formatDate(row.billingPeriodEnd)}
        </span>
      ),
    },
    {
      header: "Amount",
      accessor: "amount",
      sortable: true,
      render: (val) => (
        <span className="font-medium tabular-nums">{formatPKR(val as number)}</span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      sortable: true,
      render: (val) => (
        <div className="flex items-center gap-1.5">
          {getStatusIcon(val as string)}
          <Badge variant={getStatusVariant(val as string)} size="sm">
            {getStatusLabel(val as string)}
          </Badge>
        </div>
      ),
    },
    {
      header: "Receipt",
      accessor: "receiptUrl",
      render: (val) =>
        val ? (
          <a
            href={val as string}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 hover:underline text-xs"
          >
            View
          </a>
        ) : (
          <span className="text-xs text-gray-600">—</span>
        ),
    },
    {
      header: "Verified",
      accessor: "verifiedAt",
      render: (val) =>
        val ? (
          <span className="text-xs text-gray-400">{formatDate(val as string)}</span>
        ) : (
          <span className="text-xs text-gray-600">—</span>
        ),
    },
  ];

  const paymentStatus = data?.data?.current;
  const history = data?.data?.history ?? [];

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-bold text-gray-100">Payments</h1>
        <p className="text-sm text-gray-500 mt-0.5">Billing history and receipt uploads</p>
      </motion.div>

      {/* Current billing cycle */}
      <motion.div variants={fadeUp}>
        <Card padding="md" className="relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-blue-500/5 blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10">
              <CreditCard size={22} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-sm font-semibold text-gray-200">Current Billing Cycle</h2>
                {paymentStatus && (
                  <Badge variant={getStatusVariant(paymentStatus.status)} size="sm" dot>
                    {getStatusLabel(paymentStatus.status)}
                  </Badge>
                )}
              </div>
              {paymentStatus && paymentStatus.amount > 0 && (
                <p className="text-2xl font-bold text-gray-100 tabular-nums">
                  {formatPKR(paymentStatus.amount)}
                </p>
              )}
              {paymentStatus?.dueDate && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar size={12} />
                  <span>Due: {formatDate(paymentStatus.dueDate)}</span>
                </div>
              )}
              {(!paymentStatus || paymentStatus.status === "no_billing") && (
                <p className="text-sm text-gray-600">No active billing cycle yet</p>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Upload receipt */}
      <motion.div variants={fadeUp}>
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Upload size={16} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-gray-200">Upload Payment Receipt</h2>
          </div>
          <FileUpload
            accept="image/jpeg,image/png,image/webp"
            maxSize={5}
            onUpload={handleFileUpload}
            label="Drop your receipt image here or click to browse"
            disabled={isUploading}
          />
          {isUploading && (
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <span className="animate-spin">⟳</span> Uploading and processing...
            </div>
          )}
        </Card>
      </motion.div>

      {/* Payment history */}
      <motion.div variants={fadeUp}>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-gray-200">Payment History</h2>
        </div>
        <DataTable
          columns={columns}
          data={history as (PaymentRecord & Record<string, unknown>)[]}
          isLoading={isLoading}
          emptyMessage="No payment history yet"
          pageSize={5}
        />
      </motion.div>
    </motion.div>
  );
}
