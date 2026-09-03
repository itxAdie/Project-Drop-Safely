"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { Check, X, Image, RotateCcw } from "lucide-react";

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

interface DepositQueueProps {
  deposits: DepositItem[];
  isLoading?: boolean;
  onMutate: () => void;
}

function statusBadge(status: string) {
  switch (status) {
    case "submitted": return <Badge variant="warning" size="sm">Under Review</Badge>;
    case "verified": return <Badge variant="success" size="sm">Verified</Badge>;
    case "rejected": return <Badge variant="danger" size="sm">Rejected</Badge>;
    case "refunded": return <Badge variant="info" size="sm">Refunded</Badge>;
    default: return <Badge variant="default" size="sm">{status}</Badge>;
  }
}

export function DepositQueue({ deposits, isLoading, onMutate }: DepositQueueProps) {
  const { token } = useAuth();
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const toast = useToast();

  const runAction = async (studentId: string, action: "verify" | "reject" | "refund", reason?: string) => {
    setProcessing(studentId);
    try {
      const res = await fetch(`/api/students/${studentId}/deposit/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      toast.success(data.message || "Deposit updated");
      setRejectingId(null);
      setRejectionReason("");
      onMutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
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

  if (deposits.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500 text-sm">No deposits in this queue</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {deposits.map((d) => {
          const refundEligible = d.depositStatus === "verified" && !d.assignedRouteId;
          return (
            <motion.div
              key={d._id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card variant="default" padding="sm">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                    {d.depositReceiptUrl ? (
                      <a href={d.depositReceiptUrl} target="_blank" rel="noopener noreferrer" className="h-full w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={d.depositReceiptUrl} alt="Deposit Receipt" className="h-full w-full object-cover" />
                      </a>
                    ) : (
                      <Image size={20} className="text-gray-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-gray-200 truncate">{d.name || "Unknown"}</p>
                      {statusBadge(d.depositStatus)}
                      {refundEligible && <Badge variant="success" size="sm">Refund Eligible</Badge>}
                    </div>
                    <p className="text-xs text-gray-500">
                      {d.institute || "N/A"} &middot; {d.city || "N/A"} &middot; {d.phone}
                    </p>
                    <p className="text-sm font-bold text-green-400 mt-1.5">
                      Rs. {(d.depositAmount || 0).toLocaleString()}
                      {d.depositStatus === "submitted" && d.depositSubmittedAt && (
                        <span className="ml-2 text-xs font-normal text-gray-600">
                          Submitted {new Date(d.depositSubmittedAt).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                    {d.depositStatus === "rejected" && d.depositRejectionReason && (
                      <p className="text-xs text-red-400 mt-0.5">Reason: {d.depositRejectionReason}</p>
                    )}
                    {!d.assignedRouteId && d.assignedRouteId !== undefined && (
                      <p className="text-[10px] text-gray-600 mt-0.5">No van allocated — refundable</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {rejectingId === d._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Rejection reason..."
                          className="rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm px-3 py-1.5 text-gray-200 outline-none focus:border-red-500/50 w-44"
                        />
                        <Button size="sm" variant="danger" isLoading={processing === d._id} onClick={() => runAction(d._id, "reject", rejectionReason)}>
                          Confirm
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setRejectingId(null); setRejectionReason(""); }}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        {d.depositStatus === "submitted" && (
                          <>
                            <Button size="sm" variant="primary" isLoading={processing === d._id} onClick={() => runAction(d._id, "verify")} leftIcon={<Check size={14} />}>
                              Verify
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setRejectingId(d._id)} leftIcon={<X size={14} />}>
                              Reject
                            </Button>
                          </>
                        )}
                        {d.depositStatus === "verified" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!refundEligible}
                            isLoading={processing === d._id}
                            onClick={() => runAction(d._id, "refund")}
                            leftIcon={<RotateCcw size={14} />}
                          >
                            Refund
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
