"use client";

import { motion, useMotionValue, useSpring, useTransform, useInView } from "framer-motion";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";

// ── Ride Card ──
const routePath = "M 0 24 Q 50 -10 100 24 T 200 24";

const dotKeyframes = {
  cx: [0, 30, 65, 100, 135, 170, 200],
  cy: [24, 5, 8, 24, 40, 43, 24],
};

function PulsingDot({ delay = 0 }: { delay?: number }) {
  return (
    <span className="relative flex h-2 w-2">
      <motion.span
        initial={{ scale: 1, opacity: 0.75 }}
        animate={{ scale: [1, 2.5], opacity: [0.75, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay }}
        className="absolute inline-flex h-full w-full rounded-full bg-green-500"
      />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
    </span>
  );
}

function TrackingCard() {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);

  const smoothX = useSpring(mx, { stiffness: 200, damping: 20 });
  const smoothY = useSpring(my, { stiffness: 200, damping: 20 });

  const rotateX = useTransform(smoothY, [0, 1], [10, -10]);
  const rotateY = useTransform(smoothX, [0, 1], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  const [countdown, setCountdown] = useState(5 * 60 + 12);
  const initialSeconds = 5 * 60 + 12;

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const stagger = (i: number) => ({
    hidden: { y: 12, opacity: 0 } as const,
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" as const, delay: 0.3 + i * 0.08 },
    } as const,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative w-full max-w-sm "
      style={{ perspective: "1000px" }}
    >
      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
      >
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          animate={{
            boxShadow: [
              "0 0 30px rgba(34, 197, 94, 0.08), 0 0 60px rgba(34, 197, 94, 0.02)",
              "0 0 50px rgba(34, 197, 94, 0.18), 0 0 80px rgba(34, 197, 94, 0.06)",
              "0 0 30px rgba(34, 197, 94, 0.08), 0 0 60px rgba(34, 197, 94, 0.02)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="rounded-3xl border border-white/10 bg-[#0a0f0a]/90 p-5 shadow-2xl backdrop-blur-sm"
        >
          {/* Header */}
          <motion.div
            variants={stagger(0)}
            initial="hidden"
            animate="visible"
            className="mb-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/10">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Your Ride</p>
                <p className="text-[10px] text-gray-500">On the way</p>
              </div>
            </div>
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-green-500 shadow-[0_0_12px_rgba(34,197,94,0.15)]"
            >
              12:30 PM
            </motion.span>
          </motion.div>

          {/* Countdown */}
          <motion.div
            variants={stagger(1)}
            initial="hidden"
            animate="visible"
            className="mb-3 rounded-xl bg-white/[0.03] p-3 text-center"
          >
            <p className="mb-1 text-[10px] font-medium tracking-wide text-gray-500 uppercase">
              Driver arriving in
            </p>
            <motion.p
              key={countdown}
              initial={{ y: -4, opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              className="font-display text-2xl font-bold leading-none tracking-tight text-white tabular-nums sm:text-3xl"
            >
              {formatTime(countdown)}
            </motion.p>
            <div className="mx-auto mt-2 h-0.5 w-full max-w-[160px] overflow-hidden rounded-full bg-white/[0.04]">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: initialSeconds, ease: "linear" }}
                className="h-full rounded-full bg-gradient-to-r from-green-500 via-emerald-400 to-green-500"
              />
            </div>
          </motion.div>

          {/* Driver */}
          <motion.div
            variants={stagger(2)}
            initial="hidden"
            animate="visible"
            className="group mb-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-2.5 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]"
          >
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-xs font-bold text-white shadow-lg">
                  AR
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring", stiffness: 300 }}
                  className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-500 ring-2 ring-[#0a0f0a]"
                >
                  <svg width="7" height="7" viewBox="0 0 24 24" fill="white"><path d="M20 6L9 17l-5-5" /></svg>
                </motion.div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-white">Ali R.</p>
                  <div className="flex shrink-0 items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    <span className="text-[11px] font-semibold text-yellow-500">4.9</span>
                  </div>
                </div>
                <p className="truncate text-[11px] text-gray-500">Your regular driver</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-500">🚐 White Hiace · LEM-1234</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Route */}
          <motion.div
            variants={stagger(3)}
            initial="hidden"
            animate="visible"
            className="mb-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3"
          >
            <div className="flex items-start gap-2">
              <div className="flex shrink-0 flex-col items-center pt-0.5">
                <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                <div className="my-0.5 h-6 w-0.5 bg-gradient-to-b from-green-500/40 to-green-500/5" />
                <div className="h-2 w-2 rounded-full border-2 border-green-500/60 bg-[#0a0f0a]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">Campus Gate</p>
                <p className="text-[10px] text-gray-500">FAST NUCES, Lahore</p>
                <div className="relative my-2 h-10">
                  <svg viewBox="0 0 200 48" className="h-full w-full" fill="none" preserveAspectRatio="none">
                    <path d={routePath} stroke="#22c55e" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
                    <motion.circle
                      r="4"
                      fill="#22c55e"
                      stroke="#0a0f0a"
                      strokeWidth="2"
                      animate={{ cx: dotKeyframes.cx, cy: dotKeyframes.cy }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear", times: [0, 0.15, 0.35, 0.5, 0.65, 0.85, 1] }}
                      style={{ filter: "drop-shadow(0 0 8px rgba(34, 197, 94, 0.7))" }}
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-white">Nizami Road</p>
                <p className="text-[10px] text-gray-500">Home pickup point</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-green-500/[0.04] px-2.5 py-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              <span className="text-[11px] text-gray-400">Approx. 15 min</span>
            </div>
          </motion.div>

          {/* Safety badges */}
          <motion.div
            variants={stagger(4)}
            initial="hidden"
            animate="visible"
            className="mb-3 flex gap-1.5"
          >
            {[
              { label: "Verified", icon: "check" },
              { label: "GPS Active", icon: "gps" },
              { label: "Safe Driver", icon: "shield" },
            ].map((badge, i) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1, duration: 0.35 }}
                className="flex items-center gap-1 rounded-full border border-white/[0.04] bg-white/[0.02] px-2 py-1 transition-colors hover:border-white/10"
              >
                {badge.icon === "check" ? (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                ) : badge.icon === "gps" ? (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
                ) : (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                )}
                <span className="text-[10px] font-medium text-gray-400">{badge.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.button
            variants={stagger(5)}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-500/20 transition-all hover:bg-green-500/90"
          >
            Track on Map
            <motion.span
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              &rarr;
            </motion.span>
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ── Navbar ──
function Navbar({ onWaitlistOpen }: { onWaitlistOpen: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const links = ["Home", "Our Solution", "Our Mission", "How It Works", "Our Partners", "FAQs",];

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.04] bg-dark/60 px-6 py-4 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a href="#" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Drop Safely"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </a>

          <div className="hidden items-center gap-8 md:flex">
            {links.map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(label.toLowerCase().replace(/\s+/g, "-"));
                }}
                className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
              >
                {label}
              </a>
            ))}
            <button
              onClick={onWaitlistOpen}
              className="rounded-full bg-green-500 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-green-500/90 active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3),0_0_40px_rgba(34,197,94,0.1)]"
            >
              Check Availability
            </button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden">
            <div className="flex flex-col gap-2 pt-4">
              {links.map((label) => (
                <button
                  key={label}
                  onClick={() => scrollTo(label.toLowerCase().replace(/\s+/g, "-"))}
                  className="w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onWaitlistOpen();
                }}
                className="mt-2 rounded-full bg-green-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-green-500/90 shadow-[0_0_20px_rgba(34,197,94,0.3),0_0_40px_rgba(34,197,94,0.1)]"
              >
                Check availability
              </button>
            </div>
          </div>
        )}
      </motion.nav>

      {/* Backdrop for mobile menu */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}
    </>
  );
}

// ── Variants ──
const fadeUp = (delay: number) => ({
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" as const, delay },
  },
});

// ── Main Hero Section ──
export default function HeroSection({ onWaitlistOpen }: { onWaitlistOpen?: () => void }) {
  const textRef = useRef<HTMLDivElement>(null);
  const isTextInView = useInView(textRef, { once: true });

  return (
    <section id="home" className="relative min-h-screen overflow-hidden bg-dark">
      {/* Background blurred glow orbs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-green-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-green-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute left-1/3 top-1/3 h-64 w-64 rounded-full bg-green-500/5 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-1/4 left-1/4 h-48 w-48 rounded-full bg-green-500/10 blur-[80px]" />

      {/* Grid-dot pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(34, 197, 94, 0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <Navbar onWaitlistOpen={() => onWaitlistOpen?.()} />

      <div className="relative mt-14 z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 pb-12">
        <div className="flex flex-1 flex-col items-center justify-center gap-16 pt-28 lg:flex-row lg:pt-0">
          {/* Left column */}
          <div ref={textRef} className="flex w-full flex-col justify-center lg:w-1/2">

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={isTextInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="font-display text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-6xl xl:text-7xl"
            >
              Safe rides for female students.
            </motion.h1>

            {/* Subtext */}
            <motion.p
              variants={fadeUp(0.3)}
              initial="hidden"
              animate={isTextInView ? "visible" : "hidden"}
              className="mt-6 max-w-lg text-base leading-relaxed text-gray-400 sm:text-lg"
            >
              Daily university transport that is reliable, affordable, and designed for female students in Lahore. <br />
              No more cancelled rides, unsafe commutes, or daily transport stress.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              variants={fadeUp(0.5)}
              initial="hidden"
              animate={isTextInView ? "visible" : "hidden"}
              className="mt-8 flex flex-wrap gap-4"
            >
              <button
                onClick={() => onWaitlistOpen?.()}
                className="group cursor-pointer flex items-center gap-2 rounded-full bg-green-500 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-green-500/90 active:scale-95 shadow-[0_0_24px_rgba(34,197,94,0.35),0_0_48px_rgba(34,197,94,0.12),0_0_72px_rgba(34,197,94,0.06)]"
              >
                Check availability in your area
                <span className="transition-transform group-hover:translate-x-1">
                  &rarr;
                </span>
              </button>
            </motion.div>
          </div>

          {/* Right column */}
          <div className="flex w-full items-center justify-center lg:w-1/2">
            <TrackingCard />
          </div>
        </div>
      </div>
    </section >
  );
}
