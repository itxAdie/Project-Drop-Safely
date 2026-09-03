"use client";

import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./Spinner";

const variants = {
  primary:
    "bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:bg-green-400 border border-green-500",
  secondary:
    "bg-white/[0.03] text-gray-100 backdrop-blur-xl border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.12]",
  outline:
    "bg-transparent text-gray-100 border border-white/[0.12] hover:bg-white/[0.04] hover:border-white/[0.20]",
  ghost:
    "bg-transparent text-gray-300 hover:bg-white/[0.04] hover:text-gray-100",
  danger:
    "bg-red-600 text-white shadow-[0_0_16px_rgba(220,38,38,0.35)] hover:bg-red-500 border border-red-600",
} as const;

const sizes = {
  sm: "px-3.5 py-1.5 text-sm gap-1.5 rounded-lg",
  md: "px-5 py-2.5 text-sm gap-2 rounded-xl",
  lg: "px-7 py-3.5 text-base gap-2.5 rounded-xl",
} as const;

const spinnerSizeMap = { sm: "sm", md: "sm", lg: "md" } as const;

export interface ButtonProps {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  id?: string;
  "aria-label"?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      children,
      type = "button",
      id,
      onClick,
      "aria-label": ariaLabel,
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        type={type}
        id={id}
        aria-label={ariaLabel}
        disabled={isDisabled}
        onClick={onClick}
        whileTap={!isDisabled ? { scale: 0.97 } : undefined}
        whileHover={!isDisabled ? { filter: "brightness(1.08)" } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={cn(
          "relative inline-flex items-center justify-center font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] select-none",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
          className
        )}
      >
        {isLoading ? (
          <>
            <Spinner
              size={spinnerSizeMap[size]}
              className="shrink-0"
            />
            <span className="opacity-70">{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
