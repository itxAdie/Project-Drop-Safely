"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GraduationCap, Car, ArrowRight } from "lucide-react";
import { fadeUp, stagger } from "@/lib/animations";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8 text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10 ring-1 ring-green-500/20">
          <span className="text-2xl" role="img" aria-label="bus">🚐</span>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-light">
          How will you use Drop Safely?
        </h1>
        <p className="mt-2 text-sm text-light/40">
          Choose your role to set up your account.
        </p>
      </motion.div>

      {/* Role cards */}
      <div className="flex w-full flex-col gap-4">
        {/* Student card */}
        <motion.button
          variants={fadeUp}
          onClick={() => router.push("/student/register")}
          className="glass-card group flex w-full items-center gap-5 p-6 text-left transition-all duration-200 hover:border-green-500/20 hover:bg-green-500/[0.03]"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-500/10 text-green-500 ring-1 ring-green-500/20 transition-colors group-hover:bg-green-500/20">
            <GraduationCap size={26} />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-base font-semibold text-light">
              I&apos;m a Student
            </h3>
            <p className="mt-0.5 text-sm text-light/40">
              Book your daily pick & drop, track your ride, manage payments.
            </p>
          </div>
          <ArrowRight
            size={18}
            className="shrink-0 text-light/20 transition-transform group-hover:translate-x-1 group-hover:text-green-500"
          />
        </motion.button>

        {/* Driver card */}
        <motion.button
          variants={fadeUp}
          onClick={() => router.push("/driver/register")}
          className="glass-card group flex w-full items-center gap-5 p-6 text-left transition-all duration-200 hover:border-green-500/20 hover:bg-green-500/[0.03]"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-500/10 text-green-500 ring-1 ring-green-500/20 transition-colors group-hover:bg-green-500/20">
            <Car size={26} />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-base font-semibold text-light">
              I&apos;m a Driver
            </h3>
            <p className="mt-0.5 text-sm text-light/40">
              Register your vehicle, manage trips, and earn with every ride.
            </p>
          </div>
          <ArrowRight
            size={18}
            className="shrink-0 text-light/20 transition-transform group-hover:translate-x-1 group-hover:text-green-500"
          />
        </motion.button>
      </div>
    </motion.div>
  );
}
