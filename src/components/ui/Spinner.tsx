"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-3",
} as const;

export interface SpinnerProps {
  size?: keyof typeof sizeMap;
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "animate-spin rounded-full border-green-500 border-t-transparent",
        sizeMap[size],
        className
      )}
    />
  );
}
