"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { fadeUp, stagger } from "@/lib/animations";
import type { UserRole } from "@/types/enums";

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 5 * 60; // 5 minutes

function dashboardPath(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "driver":
      return "/driver";
    case "student":
    default:
      return "/student";
  }
}

export default function VerifyOtpPage() {
  const router = useRouter();
  const toast = useToast();
  const { login } = useAuth();

  const [phone] = useState(() =>
    typeof window !== "undefined"
      ? sessionStorage.getItem("ds_otp_phone") || ""
      : "",
  );
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRY_SECONDS);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const submitInFlight = useRef(false);

  // Redirect to login if no phone stored
  useEffect(() => {
    if (!phone) {
      router.replace("/login");
    }
  }, [phone, router]);

  // ── Countdown timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  // ── Auto-focus first box ────────────────────────────────────────────────
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ── OTP input handlers ─────────────────────────────────────────────────

  const handleChange = (index: number, value: string) => {
    // Only accept single digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    // Move focus to next box
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (pasted.length === 0) return;
    const next = [...digits];
    for (let i = 0; i < OTP_LENGTH; i++) {
      next[i] = pasted[i] || "";
    }
    setDigits(next);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  // ── Submit ─────────────────────────────────────────────────────────────

  const code = digits.join("");

  const handleVerify = useCallback(async () => {
    if (code.length !== OTP_LENGTH) {
      toast.warning("Please enter the complete 6-digit code.");
      return;
    }
    if (submitInFlight.current) return;
    submitInFlight.current = true;

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Verification failed");
        return;
      }

      // Store auth
      login(
        { accessToken: data.accessToken, refreshToken: data.refreshToken },
        data.user,
      );

      // Clean up session
      sessionStorage.removeItem("ds_otp_phone");

      if (data.isNewUser) {
        router.push("/register");
      } else {
        router.push(dashboardPath(data.user.role));
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      submitInFlight.current = false;
      setIsLoading(false);
    }
  }, [code, phone, login, router, toast]);

  // Auto-submit when all digits entered
  useEffect(() => {
    if (code.length === OTP_LENGTH && !isLoading) {
      handleVerify();
    }
  }, [code, isLoading, handleVerify]);

  // ── Resend OTP ─────────────────────────────────────────────────────────

  const handleResend = async () => {
    if (secondsLeft > 0) return;
    setIsResending(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to resend OTP");
        return;
      }
      toast.success("New OTP sent to your WhatsApp!");
      setDigits(Array(OTP_LENGTH).fill(""));
      setSecondsLeft(OTP_EXPIRY_SECONDS);
      inputRefs.current[0]?.focus();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (!phone) return null;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center"
    >
      {/* Back link */}
      <motion.div variants={fadeUp} className="mb-6 w-full">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-light/40 transition-colors hover:text-light/70"
        >
          <ArrowLeft size={14} />
          Back to login
        </Link>
      </motion.div>

      {/* Card */}
      <motion.div variants={fadeUp} className="w-full">
        <div className="glass-card glow-green p-8">
          <div className="mb-7 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 ring-1 ring-green-500/20">
              <span className="text-xl">🔐</span>
            </div>
            <h2 className="font-display text-lg font-semibold text-light">
              Verify your phone
            </h2>
            <p className="mt-1.5 text-sm text-light/45">
              Enter the 6-digit code sent to{" "}
              <span className="text-light/70">{phone}</span>
            </p>
          </div>

          {/* OTP Boxes */}
          <div className="mb-6 flex justify-center gap-2.5" onPaste={handlePaste}>
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digits[i]}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                aria-label={`Digit ${i + 1}`}
                className="h-14 w-11 rounded-xl border border-white/[0.08] bg-white/[0.03] text-center font-display text-xl font-semibold text-light outline-none transition-all duration-150 focus:border-green-500 focus:bg-white/[0.05] focus:ring-2 focus:ring-green-500/20"
              />
            ))}
          </div>

          {/* Timer & Resend */}
          <div className="mb-6 flex flex-col items-center gap-3">
            {secondsLeft > 0 ? (
              <p className="text-xs text-light/30">
                Code expires in{" "}
                <span className="font-mono text-light/50">{formatTime(secondsLeft)}</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-green-500 transition-colors hover:text-green-400 disabled:opacity-50"
              >
                <RotateCcw size={13} />
                {isResending ? "Sending..." : "Resend OTP"}
              </button>
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            onClick={handleVerify}
            disabled={code.length !== OTP_LENGTH}
          >
            Verify & Continue
          </Button>
        </div>
      </motion.div>

      <motion.p
        variants={fadeUp}
        className="mt-5 text-center text-xs text-light/20"
      >
        Didn&apos;t receive the code? Check your WhatsApp or request a new one.
      </motion.p>
    </motion.div>
  );
}
