"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CreditCard, Calendar, AlertTriangle } from "lucide-react";

interface PaymentData {
  status: string;
  amount: number;
  dueDate: string | null;
  current: {
    billingPeriodStart?: string;
    billingPeriodEnd?: string;
  } | null;
}

interface Props {
  payment: PaymentData | null;
  className?: string;
}

function formatPKR(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
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
    case "verified": return "Paid";
    case "submitted": return "Under Review";
    case "pending": return "Pending";
    case "overdue": return "Overdue";
    case "rejected": return "Rejected";
    case "no_billing": return "No Billing";
    default: return status;
  }
}

export function PaymentStatusCard({ payment, className }: Props) {
  const status = payment?.status ?? "no_billing";
  const amount = payment?.amount ?? 0;
  const dueDate = payment?.dueDate ?? null;
  const isOverdue = status === "overdue";
  const isPending = status === "pending" || status === "submitted";

  return (
    <Card padding="md" className={className}>
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
          isOverdue ? "bg-red-500/10" : "bg-blue-500/10"
        }`}>
          {isOverdue ? (
            <AlertTriangle size={22} className="text-red-400" />
          ) : (
            <CreditCard size={22} className="text-blue-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-200">Payment Status</h3>
            <Badge variant={getStatusVariant(status)} size="sm" dot>
              {getStatusLabel(status)}
            </Badge>
          </div>

          {amount > 0 && (
            <p className="text-lg font-bold text-gray-100 tabular-nums">
              {formatPKR(amount)}
            </p>
          )}

          {dueDate && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar size={12} />
              <span>Due: {formatDate(dueDate)}</span>
            </div>
          )}

          {status === "no_billing" && (
            <p className="text-xs text-gray-600 mt-1">
              No billing cycle active yet
            </p>
          )}

          {(isPending || isOverdue) && (
            <Link href="/student/payments" className="mt-3 block">
              <Button variant="secondary" size="sm">
                Upload Receipt
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
