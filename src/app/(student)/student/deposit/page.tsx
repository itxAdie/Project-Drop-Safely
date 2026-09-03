"use client";

import { useState, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";
import { Skeleton } from "@/components/ui/Skeleton";
import { fadeUp, stagger } from "@/lib/animations";
import { ShieldCheck, CreditCard, Upload, CheckCircle, Clock, Ban, RotateCcw, FileText, Info } from "lucide-react";
import Link from "next/link";

interface StudentDepositData {
  _id: string;
  name?: string;
  depositStatus: string;
  depositAmount: number;
  depositReceiptUrl?: string;
  depositSubmittedAt?: string;
  depositVerifiedAt?: string;
  depositRefundedAt?: string;
  depositRejectionReason?: string;
  assignedRouteId?: string | null;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPKR(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function getStatusMeta(status: string) {
  switch (status) {
    case "submitted":
      return { label: "Under Review", variant: "info" as const, icon: <Clock size={16} /> };
    case "verified":
      return { label: "Verified", variant: "success" as const, icon: <CheckCircle size={16} /> };
    case "rejected":
      return { label: "Rejected", variant: "danger" as const, icon: <Ban size={16} /> };
    case "refunded":
      return { label: "Refunded", variant: "success" as const, icon: <RotateCcw size={16} /> };
    default:
      return { label: "Not Paid", variant: "warning" as const, icon: <CreditCard size={16} /> };
  }
}

export default function DepositPage() {
  const toast = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading } = useSWR<{ data: StudentDepositData | null }>("/api/students/me");
  const student = data?.data;

  const studentId = student?._id;

  const canSubmit =
    student &&
    studentId &&
    (student.depositStatus === "none" ||
      student.depositStatus === "rejected" ||
      student.depositStatus === "");
  const refundEligible = student?.depositStatus === "verified" && !student?.assignedRouteId;

  const handleSubmit = useCallback(async () => {
    if (!files[0] || !studentId) return;
    setIsSubmitting(true);
    try {
      const token = JSON.parse(localStorage.getItem("ds_auth") || "{}").accessToken;

      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("folder", "drop-safely/deposit");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      const receiptUrl = uploadData.data.url;

      const payRes = await fetch(`/api/students/${studentId}/deposit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receiptUrl }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.error || "Failed to submit deposit");

      toast.success("Deposit receipt submitted for review");
      mutate("/api/students/me");
      setFiles([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit deposit");
    } finally {
      setIsSubmitting(false);
    }
  }, [files, studentId, toast]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton variant="rect" height={140} />
        <Skeleton variant="rect" height={220} />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="mx-auto max-w-2xl text-center py-20">
        <h2 className="text-lg font-semibold text-gray-200">No Profile Found</h2>
        <Link href="/student/register" className="mt-4 inline-block">
          <Button>Complete Registration</Button>
        </Link>
      </div>
    );
  }

  const statusMeta = getStatusMeta(student.depositStatus);
  const amount = student.depositAmount || 1000;

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-100">Security Deposit</h1>
            <p className="text-sm text-gray-500 mt-0.5">One-time refundable deposit to confirm your seat</p>
          </div>
          <Badge variant={statusMeta.variant} size="md" dot>
            {statusMeta.label}
          </Badge>
        </div>
      </motion.div>

      {/* Status card */}
      <motion.div variants={fadeUp}>
        <Card padding="lg" className="relative overflow-hidden">
          <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-green-500/5 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-500/10">
                <ShieldCheck size={24} className="text-green-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-200">Refundable Security Deposit</h2>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  A one-time deposit of{" "}
                  <span className="font-semibold text-gray-300">{formatPKR(amount)}</span> secures your seat for
                  the upcoming commute term. This amount is <span className="text-green-400 font-medium">fully refundable</span> if
                  we are unable to allocate a van for your route.
                </p>
              </div>
            </div>
            <div className="shrink-0 text-left sm:text-right">
              <p className="text-2xl font-bold text-gray-100 tabular-nums">{formatPKR(amount)}</p>
              <p className="text-[10px] text-gray-600">Due once at registration</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Refund eligibility banner */}
      {student.depositStatus === "verified" && (
        <motion.div variants={fadeUp}>
          <Card padding="md" className={`${refundEligible ? "border-green-500/30" : ""}`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    refundEligible ? "bg-green-500/10" : "bg-blue-500/10"
                  }`}
                >
                  {refundEligible ? (
                    <RotateCcw size={18} className="text-green-400" />
                  ) : (
                    <ShieldCheck size={18} className="text-blue-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-200">
                    {refundEligible ? "Refund Pending on Route Allocation" : "Deposit Secured"}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {refundEligible
                      ? "No van has been allocated for your commute yet. Once route allocation is finalized, if you are not assigned a van, your 1000 PKR will be refunded to you."
                      : "A van has been allocated for your commute. Your deposit is held and will be refunded when you stop commuting with us."}
                  </p>
                </div>
              </div>
              {refundEligible && (
                <Badge variant="success" size="sm">Refund Eligible</Badge>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Action area based on status */}
      <motion.div variants={fadeUp}>
        {canSubmit ? (
          <Card padding="md">
            <div className="flex items-center gap-2 mb-1">
              <Info size={15} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-gray-200">Pay Your Deposit</h2>
            </div>

            {student.depositStatus === "rejected" && (
              <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                Your previous submission was rejected
                {student.depositRejectionReason ? `: ${student.depositRejectionReason}` : ""}. Please re-upload a valid receipt.
              </p>
            )}

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard size={14} className="text-green-400" />
                  <p className="text-sm font-medium text-gray-200">How to pay</p>
                </div>
                <ol className="list-decimal space-y-1 pl-5 text-xs text-gray-500">
                  <li>Transfer <span className="font-semibold text-gray-300">{formatPKR(amount)}</span> to the official Drop Safely account.</li>
                  <li>Take a clear screenshot of the successful transfer.</li>
                  <li>Upload the receipt below and submit for review.</li>
                </ol>
              </div>

              <FileUpload
                accept="image/jpeg,image/png,image/webp"
                maxSize={5}
                onUpload={(list) => setFiles(list)}
                label="Drop your deposit receipt here or click to browse"
                disabled={isSubmitting || files.length > 0}
              />

              <Button
                onClick={handleSubmit}
                isLoading={isSubmitting}
                disabled={!files[0]}
                fullWidth
                leftIcon={<Upload size={16} />}
              >
                Submit Deposit Receipt
              </Button>
              <p className="text-[10px] text-gray-600">
                Your deposit is verified manually by our team. Refunds are processed only if no van is allocated for your commute.
              </p>
            </div>
          </Card>
        ) : (
          <Card padding="md">
            <div className="flex flex-col items-center gap-3 text-center py-2">
              {student.depositStatus === "submitted" && (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
                    <Clock size={22} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200">Receipt Under Review</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Your deposit receipt was submitted on {formatDate(student.depositSubmittedAt)}. Our team will verify it shortly.
                    </p>
                  </div>
                </>
              )}
              {student.depositStatus === "verified" && (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10">
                    <CheckCircle size={22} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200">Deposit Confirmed</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Verified on {formatDate(student.depositVerifiedAt)}. Your seat is secured.
                    </p>
                  </div>
                </>
              )}
              {student.depositStatus === "refunded" && (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10">
                    <RotateCcw size={22} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200">Deposit Refunded</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Refunded on {formatDate(student.depositRefundedAt)}. Thank you for being part of Drop Safely.
                    </p>
                  </div>
                </>
              )}
              {student.depositReceiptUrl && (
                <a
                  href={student.depositReceiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 text-xs text-green-400 hover:underline"
                >
                  <FileText size={13} /> View submitted receipt
                </a>
              )}
            </div>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}
