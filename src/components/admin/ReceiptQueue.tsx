"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { Check, X, Image } from "lucide-react";

interface PaymentItem {
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
}

interface ReceiptQueueProps {
  payments: PaymentItem[];
  isLoading?: boolean;
  onAction: (paymentId: string, approved: boolean, reason?: string) => Promise<void>;
}

export function ReceiptQueue({ payments, isLoading, onAction }: ReceiptQueueProps) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const toast = useToast();

  const handleVerify = async (id: string) => {
    setProcessing(id);
    try {
      await onAction(id, true);
      toast.success("Payment verified successfully");
    } catch {
      toast.error("Failed to verify payment");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      toast.warning("Please provide a rejection reason");
      return;
    }
    setProcessing(id);
    try {
      await onAction(id, false, rejectionReason);
      toast.success("Payment rejected");
      setRejectingId(null);
      setRejectionReason("");
    } catch {
      toast.error("Failed to reject payment");
    } finally {
      setProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="rect" height={100} />
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500 text-sm">No receipts pending verification</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {payments.map((payment) => (
          <motion.div
            key={payment._id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card variant="default" padding="sm">
              <div className="flex items-start gap-4">
                {/* Receipt thumbnail */}
                <div className="h-16 w-16 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                  {payment.receiptUrl ? (
                    <a
                      href={payment.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-full w-full"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={payment.receiptUrl}
                        alt="Receipt"
                        className="h-full w-full object-cover"
                      />
                    </a>
                  ) : (
                    <Image size={20} className="text-gray-600" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-200 truncate">
                      {payment.studentId?.name || "Unknown"}
                    </p>
                    <Badge variant={payment.status === "submitted" ? "warning" : "default"} size="sm">
                      {payment.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {payment.studentId?.institute || "N/A"} &middot; {payment.studentId?.city || "N/A"}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-sm font-bold text-green-400">
                      Rs. {payment.amount.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-600">
                      Fee: Rs. {payment.platformFee}
                    </span>
                    <span className="text-xs text-gray-600">
                      {new Date(payment.billingPeriodStart).toLocaleDateString()} - {new Date(payment.billingPeriodEnd).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {rejectingId === payment._id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Rejection reason..."
                        className="rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm px-3 py-1.5 text-gray-200 outline-none focus:border-red-500/50 w-48"
                      />
                      <Button
                        size="sm"
                        variant="danger"
                        isLoading={processing === payment._id}
                        onClick={() => handleReject(payment._id)}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setRejectingId(null); setRejectionReason(""); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        isLoading={processing === payment._id}
                        onClick={() => handleVerify(payment._id)}
                        leftIcon={<Check size={14} />}
                      >
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectingId(payment._id)}
                        leftIcon={<X size={14} />}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
