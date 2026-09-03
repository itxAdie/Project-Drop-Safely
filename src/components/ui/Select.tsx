"use client";

import React, {
  forwardRef,
  useId,
  useRef,
  useState,
  useLayoutEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  id?: string;
  name?: string;
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  wrapperClassName?: string;
}

interface PopoverRect {
  top: number;
  left: number;
  width: number;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
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
      onChange,
      name,
    },
    ref
  ) => {
    const autoId = useId();
    const id = propId ?? autoId;
    const errorId = `${id}-error`;
    const listboxId = `${id}-listbox`;

    const [isOpen, setIsOpen] = useState(false);
    const [rect, setRect] = useState<PopoverRect | null>(null);
    const [activeIndex, setActiveIndex] = useState(-1);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const listRef = useRef<HTMLUListElement | null>(null);

    const selected = options.find((o) => o.value === value);
    const display = selected ? selected.label : placeholder;
    const isEmpty = !selected;

    const recalcRect = useCallback(() => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.bottom + 6, left: r.left, width: r.width });
    }, []);

    const close = useCallback(() => {
      setIsOpen(false);
      setActiveIndex(-1);
    }, []);

    const commit = useCallback(
      (v: string) => {
        close();
        if (onChange) onChange({ target: { value: v } });
      },
      [close, onChange]
    );

    const open = useCallback(() => {
      if (disabled) return;
      recalcRect();
      setActiveIndex(options.findIndex((o) => o.value === value));
      setIsOpen(true);
    }, [disabled, recalcRect, options, value]);

    useLayoutEffect(() => {
      if (isOpen) recalcRect();
    }, [isOpen, recalcRect]);

    useLayoutEffect(() => {
      if (!isOpen) return;
      function onScroll(e: Event) {
        const trigger = triggerRef.current;
        const list = listRef.current;
        if (
          e.target instanceof Window ||
          (trigger && (e.target as Node).contains(trigger)) ||
          (list && (e.target as Node).contains(list))
        ) {
          recalcRect();
        }
      }
      window.addEventListener("scroll", onScroll, true);
      window.addEventListener("resize", recalcRect);
      return () => {
        window.removeEventListener("scroll", onScroll, true);
        window.removeEventListener("resize", recalcRect);
      };
    }, [isOpen, recalcRect]);

    useLayoutEffect(() => {
      if (!isOpen || activeIndex < 0) return;
      const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
    }, [activeIndex, isOpen]);

    useLayoutEffect(() => {
      if (!isOpen) return;
      function handlePointerDown(e: MouseEvent | TouchEvent) {
        const t = e.target as Node;
        if (triggerRef.current?.contains(t) || listRef.current?.contains(t)) return;
        close();
      }
      document.addEventListener("mousedown", handlePointerDown);
      document.addEventListener("touchstart", handlePointerDown);
      return () => {
        document.removeEventListener("mousedown", handlePointerDown);
        document.removeEventListener("touchstart", handlePointerDown);
      };
    }, [isOpen, close]);

    const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      switch (e.key) {
        case "ArrowDown":
        case "Enter":
        case " ":
          e.preventDefault();
          if (!isOpen) open();
          else if (e.key === "ArrowDown")
            setActiveIndex((prev) => Math.min(prev + 1, options.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          if (!isOpen) open();
          else setActiveIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Home":
          e.preventDefault();
          setActiveIndex(0);
          break;
        case "End":
          e.preventDefault();
          setActiveIndex(options.length - 1);
          break;
        case "Escape":
          e.preventDefault();
          close();
          break;
      }
    };

    const onListKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
      if (disabled) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) => Math.min(prev + 1, options.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Home":
          e.preventDefault();
          setActiveIndex(0);
          break;
        case "End":
          e.preventDefault();
          setActiveIndex(options.length - 1);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (activeIndex >= 0 && !options[activeIndex]?.disabled) {
            commit(options[activeIndex].value);
          }
          break;
        case "Tab":
          close();
          break;
        case "Escape":
          e.preventDefault();
          close();
          break;
      }
    };

    const trigger = (
      <button
        ref={(node) => {
          triggerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        id={id}
        name={name}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "w-full appearance-none rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none transition-all duration-150 cursor-pointer",
          "py-2.5 pl-4 pr-10 text-left whitespace-nowrap overflow-hidden text-ellipsis",
          "focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:bg-white/[0.04]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isEmpty ? "text-gray-500" : "text-gray-100",
          error && "border-red-500/60 focus:border-red-500 focus:ring-red-500/20",
          isOpen && "border-green-500/60",
          className
        )}
      >
        {display}
        <ChevronDown
          size={16}
          className={cn(
            "pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>
    );

    const popover =
      isOpen && rect && typeof document !== "undefined"
        ? createPortal(
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              tabIndex={-1}
              aria-label={label || placeholder}
              onKeyDown={onListKeyDown}
              style={{
                position: "fixed",
                top: rect.top,
                left: rect.left,
                width: rect.width,
                zIndex: 9999,
                maxHeight: 280,
                overflowY: "auto",
              }}
              className="my-0 rounded-xl border border-white/[0.1] bg-[#141914] p-1 shadow-2xl shadow-black/60 backdrop-blur-xl"
            >
              {options.map((opt, i) => {
                const isSel = opt.value === value;
                const isActive = i === activeIndex;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    id={`${listboxId}-option-${i}`}
                    aria-selected={isSel}
                    aria-disabled={opt.disabled}
                    data-active={isActive || undefined}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (!opt.disabled) commit(opt.value);
                    }}
                    onMouseEnter={() => !opt.disabled && setActiveIndex(i)}
                    className={cn(
                      "flex cursor-pointer select-none items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                      opt.disabled
                        ? "cursor-not-allowed text-gray-600"
                        : "text-gray-200",
                      isActive && !opt.disabled && "bg-white/[0.07] text-white",
                      isSel && "text-green-400"
                    )}
                  >
                    {opt.label}
                    {isSel && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="shrink-0"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </li>
                );
              })}
            </ul>,
            document.body
          )
        : null;

    return (
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-gray-300">
            {label}
            {required && <span className="ml-0.5 text-green-500">*</span>}
          </label>
        )}
        <div className="relative">{trigger}</div>
        {error && (
          <p id={errorId} className="text-xs text-red-400 pl-0.5" role="alert">
            {error}
          </p>
        )}
        {popover}
      </div>
    );
  }
);

Select.displayName = "Select";
