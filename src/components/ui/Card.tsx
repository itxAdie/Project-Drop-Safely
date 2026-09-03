"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

const variants = {
  default: "bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl",
  elevated:
    "bg-white/[0.05] border border-white/[0.08] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
  outlined: "bg-transparent border border-white/[0.12]",
} as const;

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
} as const;

export interface CardProps {
  variant?: keyof typeof variants;
  hover?: boolean;
  padding?: keyof typeof paddingMap;
  className?: string;
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
}

export function Card({
  variant = "default",
  hover = false,
  padding = "md",
  className,
  children,
  header,
  footer,
  onClick,
}: CardProps) {
  const content = (
    <>
      {header && (
        <div className="px-6 pt-5 pb-3 border-b border-white/[0.06]">
          {header}
        </div>
      )}
      <div className={cn(paddingMap[padding])}>{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-white/[0.06] bg-white/[0.01] rounded-b-3xl">
          {footer}
        </div>
      )}
    </>
  );

  const baseClass = cn(
    "rounded-3xl overflow-hidden",
    variants[variant],
    hover && "transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.05]",
    onClick && "cursor-pointer",
    className
  );

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onClick={onClick}
        className={baseClass}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div onClick={onClick} className={baseClass}>
      {content}
    </div>
  );
}
