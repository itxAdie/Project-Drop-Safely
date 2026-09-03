"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowLeft, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { fadeUp, stagger } from "@/lib/animations";

export default function AdminLoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};

    if (!email) nextErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      nextErrors.email = "Enter a valid email address";

    if (!password) nextErrors.password = "Password is required";
    else if (password.length < 8)
      nextErrors.password = "Password must be at least 8 characters";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Invalid credentials");
        return;
      }

      login(
        { accessToken: data.accessToken, refreshToken: data.refreshToken },
        data.user,
      );

      toast.success("Welcome back, admin!");
      router.push("/admin");
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
      {/* Back link */}
      <motion.div variants={fadeUp} className="mb-6 w-full">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-light/40 transition-colors hover:text-light/70"
        >
          <ArrowLeft size={14} />
          Back to main login
        </Link>
      </motion.div>

      {/* Card */}
      <motion.div variants={fadeUp} className="w-full">
        <div className="glass-card glow-green p-8">
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 ring-1 ring-green-500/20">
              <Lock size={20} className="text-green-500" />
            </div>
            <h2 className="font-display text-lg font-semibold text-light">
              Admin Login
            </h2>
            <p className="mt-1 text-sm text-light/40">
              Sign in with your admin credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="admin@dropsafely.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              error={errors.email}
              leftIcon={<Mail size={16} />}
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password)
                  setErrors((p) => ({ ...p, password: undefined }));
              }}
              error={errors.password}
              leftIcon={<Lock size={16} />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              leftIcon={<LogIn size={16} />}
            >
              Sign In
            </Button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
