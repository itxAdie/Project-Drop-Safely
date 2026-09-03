"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Navigation, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils/cn";

interface TripTrackerProps {
  pickedUpCount: number;
  totalCount: number;
  direction: "pickup" | "dropoff";
  timeSlot: string;
  routeName?: string;
  isGpsActive?: boolean;
  className?: string;
}

const timeSlotLabel: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

const timeSlotEmoji: Record<string, string> = {
  morning: "🌅",
  afternoon: "☀️",
  evening: "🌆",
};

export function TripTracker({
  pickedUpCount,
  totalCount,
  direction,
  timeSlot,
  routeName,
  isGpsActive = false,
  className,
}: TripTrackerProps) {
  const progress = totalCount > 0 ? (pickedUpCount / totalCount) * 100 : 0;

  return (
    <div
      className={cn(
        "rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl",
        className
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {direction === "pickup" ? (
            <ArrowRight size={16} className="text-green-400" />
          ) : (
            <ArrowLeft size={16} className="text-blue-400" />
          )}
          <span className="text-sm font-medium text-gray-200">
            {direction === "pickup" ? "To Institute" : "From Institute"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="default" size="sm">
            <span className="mr-1">{timeSlotEmoji[timeSlot] || "🕐"}</span>
            {timeSlotLabel[timeSlot] || timeSlot}
          </Badge>

          {/* GPS indicator */}
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              isGpsActive
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-white/[0.04] text-gray-500 border border-white/[0.06]"
            )}
          >
            {isGpsActive ? <Wifi size={11} /> : <WifiOff size={11} />}
            <span className="hidden sm:inline">{isGpsActive ? "GPS" : "Off"}</span>
          </div>
        </div>
      </div>

      {/* Route name */}
      {routeName && (
        <p className="text-xs text-gray-500 mb-3 truncate">{routeName}</p>
      )}

      {/* Progress */}
      <div className="flex items-center gap-3 mb-2">
        <ProgressBar progress={progress} size="md" className="flex-1" />
        <span className="text-sm font-bold text-gray-200 tabular-nums whitespace-nowrap">
          <span className="text-green-400">{pickedUpCount}</span>
          <span className="text-gray-600"> / </span>
          <span>{totalCount}</span>
        </span>
      </div>

      <p className="text-xs text-gray-500">
        {totalCount - pickedUpCount} student{totalCount - pickedUpCount !== 1 ? "s" : ""} remaining
      </p>
    </div>
  );
}
