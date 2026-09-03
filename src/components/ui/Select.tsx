"use client";

import React, { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      options,
      placeholder = "Select...",
      id: propId,
      className,
      wrapperClassName,
      required,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const id = propId ?? autoId;
    const errorId = `${id}-error`;

    return (
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-gray-300"
          >
            {label}
            {required && <span className="ml-0.5 text-green-500">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={id}
            disabled={disabled}
            required={required}
            value={value}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "w-full appearance-none rounded-xl bg-white/[0.03] border border-white/[0.08] text-gray-100 text-sm outline-none transition-all duration-150 cursor-pointer",
              "py-2.5 pl-4 pr-10",
              "focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:bg-white/[0.04]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              !value && "text-gray-500",
              error && "border-red-500/60 focus:border-red-500 focus:ring-red-500/20",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden className="bg-[#111] text-gray-500">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="bg-[#111] text-gray-100"
              >
                {opt.label}
              </option>
            ))}
          </select>

          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500"
          />
        </div>

        {error && (
          <p id={errorId} className="text-xs text-red-400 pl-0.5" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
