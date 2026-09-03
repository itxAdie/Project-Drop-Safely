"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { fadeUp, stagger } from "@/lib/animations";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");

    // Client-side phone validation
    const cleaned = phone.replace(/[\s\-\(\)]/g, "");
    if (!/^(\+92|0)?3[0-9]{9}$/.test(cleaned)) {
      setPhoneError("Enter a valid Pakistani phone (e.g. 0300-1234567)");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleaned }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to send OTP");
        return;
      }

      // Store phone for verify page
      sessionStorage.setItem("ds_otp_phone", cleaned);
      toast.success("OTP sent! Check your WhatsApp.");
      router.push("/verify-otp");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center"
    >
      {/* Logo */}
      <motion.div variants={fadeUp} className="mb-8 text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10 ring-1 ring-green-500/20">
          <span className="text-2xl" role="img" aria-label="bus">🚐</span>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-light">
          Drop Safely
        </h1>
        <p className="mt-1 text-sm text-light/40">Student Transportation Platform</p>
      </motion.div>

      {/* Card */}
      <motion.div variants={fadeUp} className="w-full">
        <div className="glass-card glow-green p-8">
          <div className="mb-6">
            <h2 className="font-display text-lg font-semibold text-light">
              Welcome back
            </h2>
            <p className="mt-1 text-sm text-light/50">
              Enter your phone number to receive a login code via WhatsApp.
            </p>
          </div>

          <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="0300-1234567"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (phoneError) setPhoneError("");
              }}
              error={phoneError}
              leftIcon={<Phone size={16} />}
              required
              autoFocus
            />

            <div className="flex items-start gap-2.5 rounded-xl bg-green-500/[0.06] px-3.5 py-2.5 ring-1 ring-green-500/10">
              <Shield size={14} className="mt-0.5 shrink-0 text-green-500" />
              <p className="text-xs leading-relaxed text-light/50">
                We&apos;ll send a 6-digit code to your WhatsApp. Standard messaging
                rates may apply.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              rightIcon={<ArrowRight size={16} />}
            >
              Send OTP
            </Button>
          </form>

          <div className="mt-6 border-t border-white/[0.06] pt-5 text-center">
            <p className="text-xs text-light/30">New to Drop Safely?</p>
            <Link
              href="/"
              className="mt-1 inline-block text-sm font-medium text-green-500 transition-colors hover:text-green-400"
            >
              Check Availability in your Area
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.p
        variants={fadeUp}
        className="mt-6 text-center text-xs text-light/20"
      >
        By continuing you agree to our Terms of Service & Privacy Policy.
      </motion.p>
    </motion.div>
  );
}
