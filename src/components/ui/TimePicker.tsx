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
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface PopoverRect {
  top: number;
  left: number;
  width: number;
}

export interface TimePickerProps {
  id?: string;
  name?: string;
  label?: string;
  error?: string;
  placeholder?: string;
  /** 24-hour "HH:MM" string, e.g. "08:30" */
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  wrapperClassName?: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function parseValue(value?: string) {
  if (!value) return { hour12: 12, minutes: 0, period: "AM" as "AM" | "PM" };
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return { hour12: 12, minutes: 0, period: "AM" as "AM" | "PM" };
  let h = parseInt(m[1], 10);
  const minutes = Math.min(59, Math.round((parseInt(m[2], 10) || 0) / 5) * 5);
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return { hour12: h, minutes, period };
}

function to24({ hour12, minutes, period }: { hour12: number; minutes: number; period: "AM" | "PM" }) {
  let h = hour12 % 12;
  if (period === "PM") h += 12;
  return `${pad2(h)}:${pad2(minutes)}`;
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export const TimePicker = forwardRef<HTMLButtonElement, TimePickerProps>(
  (
    {
      label,
      error,
      placeholder = "Select time",
      id: propId,
      name,
      className,
      wrapperClassName,
      required,
      disabled,
      value,
      onChange,
    },
    ref
  ) => {
    const autoId = useId();
    const id = propId ?? autoId;
    const errorId = `${id}-error`;

    const [isOpen, setIsOpen] = useState(false);
    const [rect, setRect] = useState<PopoverRect | null>(null);
    const parsed = parseValue(value);
    const [draft, setDraft] = useState(parsed);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);

    const display = value
      ? `${String(parsed.hour12).padStart(2, "0")}:${pad2(parsed.minutes)} ${parsed.period}`
      : placeholder;

    const recalcRect = useCallback(() => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const panelW = Math.min(320, window.innerWidth - 24);
      const panelH = panelRef.current?.offsetHeight || 0;
      // Anchor below the field, clamped so the panel always stays on-screen.
      let left = r.left;
      if (left + panelW > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - panelW - 8);
      }
      let top = r.bottom + 6;
      if (panelH > 0 && top + panelH > window.innerHeight - 8) {
        top = Math.max(8, r.top - panelH - 6);
      }
      setRect({ top, left, width: panelW });
    }, []);

    const open = useCallback(() => {
      if (disabled) return;
      setDraft(parseValue(value));
      setIsOpen(true);
      recalcRect();
    }, [disabled, recalcRect, value]);

    const close = useCallback(() => setIsOpen(false), []);

    const commit = useCallback(() => {
      close();
      if (onChange) onChange(to24(draft));
    }, [close, draft, onChange]);

    useLayoutEffect(() => {
      if (!isOpen) return;
      // Re-measure after the panel is painted so we can flip it above the
      // trigger if it would overflow the bottom of the viewport.
      recalcRect();
    }, [isOpen, recalcRect, draft]);

    useLayoutEffect(() => {
      if (!isOpen) return;
      function onScroll(e: Event) {
        const trigger = triggerRef.current;
        const panel = panelRef.current;
        if (
          e.target instanceof Window ||
          (trigger && (e.target as Node).contains(trigger)) ||
          (panel && (e.target as Node).contains(panel))
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
      if (!isOpen) return;
      function handlePointerDown(e: MouseEvent | TouchEvent) {
        const t = e.target as Node;
        if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
        close();
      }
      document.addEventListener("mousedown", handlePointerDown);
      document.addEventListener("touchstart", handlePointerDown);
      return () => {
        document.removeEventListener("mousedown", handlePointerDown);
        document.removeEventListener("touchstart", handlePointerDown);
      };
    }, [isOpen, close]);

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
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? close() : open())}
        className={cn(
          "w-full appearance-none rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none transition-all duration-150 cursor-pointer",
          "py-2.5 pl-4 pr-10 text-left whitespace-nowrap overflow-hidden text-ellipsis",
          "focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:bg-white/[0.04]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          value ? "text-gray-100" : "text-gray-500",
          error && "border-red-500/60 focus:border-red-500 focus:ring-red-500/20",
          isOpen && "border-green-500/60",
          className
        )}
      >
        {display}
        <Clock
          size={16}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500"
        />
      </button>
    );

    const popover =
      isOpen && rect && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label={label || "Select time"}
              style={{
                position: "fixed",
                top: rect.top,
                left: rect.left,
                width: rect.width,
                maxHeight: "calc(100vh - 16px)",
                overflowY: "auto",
                zIndex: 9999,
              }}
              className="rounded-2xl border border-white/[0.1] bg-[#141914]/98 p-4 shadow-2xl shadow-black/60 backdrop-blur-xl"
            >
              {/* Live preview */}
              <div className="mb-4 flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/[0.06]">
                <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                  {label || "Time"}
                </span>
                <span className="font-mono text-lg font-bold tabular-nums text-green-400">
                  {String(draft.hour12).padStart(2, "0")}:{pad2(draft.minutes)}{" "}
                  <span className="text-xs text-gray-400">{draft.period}</span>
                </span>
              </div>

              <div className="flex gap-4">
                {/* Hour */}
                <div className="min-w-0 flex-1">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Hour
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {HOURS.map((h) => {
                      const sel = draft.hour12 === h;
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setDraft((d) => ({ ...d, hour12: h }))}
                          aria-pressed={sel}
                          className={cn(
                            "rounded-lg py-2 text-center text-base transition-colors",
                            sel
                              ? "bg-green-500 text-white font-bold shadow-[0_4px_14px_rgba(34,197,94,0.35)]"
                              : "bg-white/[0.03] text-gray-300 hover:bg-white/[0.09] hover:text-white"
                          )}
                        >
                          {String(h).padStart(2, "0")}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Minute (5-min steps) */}
                <div className="w-[132px] shrink-0">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Min
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {MINUTES.map((mi) => {
                      const sel = draft.minutes === mi;
                      return (
                        <button
                          key={mi}
                          type="button"
                          onClick={() => setDraft((d) => ({ ...d, minutes: mi }))}
                          aria-pressed={sel}
                          className={cn(
                            "rounded-lg py-2 text-center text-sm transition-colors",
                            sel
                              ? "bg-green-500 text-white font-bold shadow-[0_4px_14px_rgba(34,197,94,0.35)]"
                              : "bg-white/[0.03] text-gray-300 hover:bg-white/[0.09] hover:text-white"
                          )}
                        >
                          {pad2(mi)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* AM / PM */}
              <div className="mt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Period
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(["AM", "PM"] as const).map((p) => {
                    const sel = draft.period === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, period: p }))}
                        aria-pressed={sel}
                        className={cn(
                          "rounded-lg py-2 text-sm font-semibold transition-colors ring-1",
                          sel
                            ? "bg-green-500/15 text-green-400 ring-green-500/40"
                            : "bg-white/[0.03] text-gray-400 ring-transparent hover:bg-white/[0.08] hover:text-white"
                        )}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer actions */}
              <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/[0.06] pt-3">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={commit}
                  className="rounded-lg bg-green-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-400"
                >
                  Done
                </button>
              </div>
            </div>,
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

TimePicker.displayName = "TimePicker";
