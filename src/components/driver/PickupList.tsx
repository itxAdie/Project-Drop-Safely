"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, XCircle, Coffee } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

export interface PickupStudent {
  studentId: string;
  name?: string;
  status: "pending" | "picked_up" | "dropped_off" | "absent";
  pickedUpAt?: string;
  droppedOffAt?: string;
}

interface PickupListProps {
  students: PickupStudent[];
  tripId: string;
  direction: "pickup" | "dropoff";
  onMarkPickup?: (studentId: string) => void;
  onMarkDropoff?: (studentId: string) => void;
  isProcessing?: boolean;
  className?: string;
}

const statusIcon = {
  pending: Clock,
  picked_up: CheckCircle2,
  dropped_off: CheckCircle2,
  absent: XCircle,
};

const statusBadgeVariant = {
  pending: "default" as const,
  picked_up: "info" as const,
  dropped_off: "success" as const,
  absent: "danger" as const,
};

const statusLabel = {
  pending: "Pending",
  picked_up: "Picked Up",
  dropped_off: "Dropped Off",
  absent: "Absent",
};

export function PickupList({
  students,
  tripId: _tripId,
  direction,
  onMarkPickup,
  onMarkDropoff,
  isProcessing = false,
  className,
}: PickupListProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <AnimatePresence mode="popLayout">
        {students.map((student, index) => {
          const Icon = statusIcon[student.status];
          const isDisabled =
            student.status === "absent" ||
            (direction === "pickup" && student.status === "picked_up") ||
            (direction === "dropoff" && student.status === "dropped_off") ||
            (direction === "dropoff" && student.status !== "picked_up");

          return (
            <motion.div
              key={student.studentId}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className={cn(
                "flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 backdrop-blur-sm",
                student.status === "picked_up" && direction === "pickup" && "bg-green-500/[0.04] border-green-500/20",
                student.status === "dropped_off" && "bg-green-500/[0.06] border-green-500/20",
              )}
            >
              {/* Order number */}
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  student.status === "pending"
                    ? "bg-white/[0.06] text-gray-400"
                    : "bg-green-500/20 text-green-400"
                )}
              >
                {index + 1}
              </div>

              {/* Icon */}
              <div className="shrink-0">
                <Icon
                  size={18}
                  className={cn(
                    student.status === "pending" && "text-gray-500",
                    student.status === "picked_up" && "text-blue-400",
                    student.status === "dropped_off" && "text-green-400",
                    student.status === "absent" && "text-red-400",
                  )}
                />
              </div>

              {/* Name + status */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-100 truncate">
                  {student.name || "Student"}
                </p>
                <Badge variant={statusBadgeVariant[student.status]} size="sm">
                  {statusLabel[student.status]}
                </Badge>
              </div>

              {/* Action button */}
              {direction === "pickup" && student.status === "pending" && (
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isProcessing}
                  onClick={() => onMarkPickup?.(student.studentId)}
                  className="!py-3 !px-5 min-w-[110px]"
                >
                  Pick Up
                </Button>
              )}

              {direction === "dropoff" && student.status === "picked_up" && (
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isProcessing}
                  onClick={() => onMarkDropoff?.(student.studentId)}
                  className="!py-3 !px-5 min-w-[110px]"
                >
                  Drop Off
                </Button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
