"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

export interface SkeletonProps {
  variant?: "text" | "circle" | "rect";
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

const shimmer = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.06] before:to-transparent";

function SkeletonItem({
  variant = "text",
  width,
  height,
  className,
}: Omit<SkeletonProps, "count">) {
  const base = cn("bg-white/[0.04] rounded", shimmer);

  if (variant === "circle") {
    const size = width ?? height ?? 40;
    return (
      <div
        className={cn(base, "rounded-full shrink-0", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  if (variant === "rect") {
    return (
      <div
        className={cn(base, "rounded-xl", className)}
        style={{ width: width ?? "100%", height: height ?? 120 }}
      />
    );
  }

  // text
  return (
    <div
      className={cn(base, "h-4 rounded", className)}
      style={{ width: width ?? "100%", height }}
    />
  );
}

export function Skeleton({ count = 1, ...props }: SkeletonProps) {
  if (count === 1) return <SkeletonItem {...props} />;
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonItem
          key={i}
          {...props}
          width={
            props.variant === "text" && i === count - 1
              ? "60%"
              : props.width
          }
        />
      ))}
    </div>
  );
}
