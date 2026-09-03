"use client";

import React from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface EarningsCardProps {
  totalEarnings: number;
  tripCount: number;
  month?: string;
  className?: string;
}

function formatPkr(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function EarningsCard({
  totalEarnings,
  tripCount,
  month,
  className,
}: EarningsCardProps) {
  const displayMonth =
    month ||
    new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl",
        className
      )}
    >
      {/* Decorative glow */}
      <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-green-500/10 blur-3xl" />

      <div className="relative flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
            {displayMonth}
          </p>
          <p className="text-3xl font-bold text-green-400 tabular-nums">
            {formatPkr(totalEarnings)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Gross earnings (no commission breakdown)</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500/10 border border-green-500/20">
          <Wallet size={18} className="text-green-400" />
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <TrendingUp size={14} className="text-gray-400" />
        <span className="text-gray-300">
          <span className="font-semibold text-gray-100">{tripCount}</span>{" "}
          {tripCount === 1 ? "trip" : "trips"} completed
        </span>
      </div>
    </motion.div>
  );
}
