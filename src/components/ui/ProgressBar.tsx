"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

const sizeMap = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
} as const;

export interface ProgressBarProps {
  progress: number; // 0–100
  label?: string;
  showPercentage?: boolean;
  size?: keyof typeof sizeMap;
  className?: string;
}

export function ProgressBar({
  progress,
  label,
  showPercentage = false,
  size = "md",
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-sm text-gray-300 font-medium">{label}</span>
          )}
          {showPercentage && (
            <span className="text-xs text-gray-500 font-medium tabular-nums">
              {Math.round(clamped)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-full bg-white/[0.06] overflow-hidden",
          sizeMap[size]
        )}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400 shadow-[0_0_12px_rgba(34,197,94,0.5)]"
        />
      </div>
    </div>
  );
}
