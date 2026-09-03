"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ── Types ──────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastContextValue {
  show: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

// ── Context ────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ── Hook ────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ── Icon / colour map ──────────────────────────────────────────────────────

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

const colorMap = {
  success: "border-green-500/30 text-green-400",
  error: "border-red-500/30 text-red-400",
  warning: "border-yellow-500/30 text-yellow-400",
  info: "border-blue-500/30 text-blue-400",
} as const;

// ── Single toast ───────────────────────────────────────────────────────────

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const Icon = iconMap[item.type];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(item.id), item.duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item.id, item.duration, onDismiss]);

  return (
    <motion.li
      key={item.id}
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      role="alert"
      className={cn(
        "w-80 rounded-xl border backdrop-blur-xl shadow-xl bg-[#161616]/95 px-4 py-3 flex items-start gap-3",
        colorMap[item.type]
      )}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <p className="flex-1 text-sm text-gray-200 leading-snug">{item.message}</p>
      <button
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss"
        className="shrink-0 p-1 rounded-md text-gray-600 hover:text-gray-300 hover:bg-white/[0.06] transition-colors"
      >
        <X size={14} />
      </button>
    </motion.li>
  );
}

// ── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const counterRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (type: ToastType, message: string, duration = 4000) => {
      const id = `toast-${++counterRef.current}`;
      setToasts((prev) => [...prev, { id, type, message, duration }]);
    },
    []
  );

  const ctx: ToastContextValue = {
    show,
    success: (msg, d) => show("success", msg, d),
    error: (msg, d) => show("error", msg, d),
    warning: (msg, d) => show("warning", msg, d),
    info: (msg, d) => show("info", msg, d),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {mounted &&
        createPortal(
          <ul className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none">
            <AnimatePresence mode="popLayout">
              {toasts.map((item) => (
                <div key={item.id} className="pointer-events-auto">
                  <ToastCard item={item} onDismiss={dismiss} />
                </div>
              ))}
            </AnimatePresence>
          </ul>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

// ── Standalone Toast (for direct use without provider) ─────────────────────

export interface ToastProps {
  type?: ToastType;
  message: string;
  duration?: number;
  onClose?: () => void;
  className?: string;
}

export function Toast({
  type = "info",
  message,
  duration = 4000,
  onClose,
  className,
}: ToastProps) {
  const Icon = iconMap[type];

  useEffect(() => {
    if (onClose) {
      const t = setTimeout(onClose, duration);
      return () => clearTimeout(t);
    }
  }, [duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      role="alert"
      className={cn(
        "w-80 rounded-xl border backdrop-blur-xl shadow-xl bg-[#161616]/95 px-4 py-3 flex items-start gap-3",
        colorMap[type],
        className
      )}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <p className="flex-1 text-sm text-gray-200 leading-snug">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="shrink-0 p-1 rounded-md text-gray-600 hover:text-gray-300 hover:bg-white/[0.06] transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </motion.div>
  );
}
