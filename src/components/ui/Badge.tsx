"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

const variants = {
  success:
    "bg-green-500/10 text-green-400 border border-green-500/20",
  warning:
    "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  danger:
    "bg-red-500/10 text-red-400 border border-red-500/20",
  info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  default:
    "bg-white/[0.06] text-gray-400 border border-white/[0.08]",
} as const;

const dotColors = {
  success: "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]",
  warning: "bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.8)]",
  danger: "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]",
  info: "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]",
  default: "bg-gray-400",
} as const;

const sizeMap = {
  sm: "px-2 py-0.5 text-xs gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
} as const;

export interface BadgeProps {
  variant?: keyof typeof variants;
  size?: keyof typeof sizeMap;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = "default",
  size = "md",
  dot = false,
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full whitespace-nowrap",
        variants[variant],
        sizeMap[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "rounded-full shrink-0 animate-pulse",
            size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2",
            dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
}
