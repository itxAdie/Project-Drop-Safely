"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const benefits = [
  {
    text: "More predictable than daily ride-hailing",
    icon: "calendar",
  },
  {
    text: "More comfortable than crowded public transport",
    icon: "seat",
  },
  {
    text: "Travel with other female students",
    icon: "users",
  },
  {
    text: "Reduce daily commute anxiety",
    icon: "heart",
  },
  {
    text: "Save time every morning",
    icon: "timer",
  },
];

const benefitIcons = {
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M12 14h4M12 18h4" />
    </svg>
  ),
  seat: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 9V6a2 2 0 00-2-2H7a2 2 0 00-2 2v3" />
      <path d="M3 16a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2z" />
      <path d="M6 12v4M18 12v4" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  heart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z" />
    </svg>
  ),
  timer: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2h4" />
      <path d="M12 14l3-3" />
      <circle cx="12" cy="14" r="8" />
    </svg>
  ),
};

const peaceItems = [
  "Verified drivers",
  "Planned routes",
  "Regular pick-up coordination",
  "Student-focused transport network",
];

export default function BenefitsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative overflow-hidden bg-dark py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.03)_0%,transparent_70%)]" />

      <div ref={ref} className="relative z-10 mx-auto max-w-7xl px-6">
        {/* ── Why Female Students ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-20 text-center"
        >
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Why Female Students Choose{" "}
            <span className="text-green-500">Drop Safely</span>
          </h2>
        </motion.div>

        <div className="mb-24 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {benefits.map((item, i) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.08, ease: "easeOut" }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5 text-center transition-all duration-300 hover:border-green-500/15 hover:bg-green-500/[0.03] hover:shadow-[0_0_30px_rgba(34,197,94,0.06)]"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 transition-transform duration-300 group-hover:scale-110">
                {benefitIcons[item.icon as keyof typeof benefitIcons]}
              </div>
              <p className="text-sm leading-relaxed text-gray-300">{item.text}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Peace of Mind for Parents ── */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
              className="font-display text-2xl font-bold text-white sm:text-3xl lg:text-4xl"
            >
              Peace of Mind{" "}
              <span className="text-green-500">for Parents</span>
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" }}
              className="mt-4 text-lg leading-relaxed text-gray-400"
            >
              Because parents worry too. Drop Safely is built to make daily university travel more organised and dependable.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="grid gap-3 sm:grid-cols-2"
          >
            {peaceItems.map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.08, ease: "easeOut" }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 transition-all duration-300 hover:border-green-500/15 hover:bg-green-500/[0.03]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="text-sm text-gray-300">{item}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ── Premium Trust Callout ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
          className="relative mx-auto mt-28 max-w-[960px]"
        >
          {/* Animated glow behind card */}
          <div className="pointer-events-none absolute -inset-20">
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/10 blur-[100px]"
            />
          </div>

          {/* Card */}
          <motion.div
            whileHover={{ y: -4, boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(34,197,94,0.05)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative rounded-[28px] border border-white/[0.06] bg-white/[0.02] px-8 py-16 text-center shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:px-16 sm:py-20"
          >
            {/* Animated accent line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
              style={{ transformOrigin: "left" }}
              className="mx-auto mb-6 h-0.5 w-16 rounded-full bg-gradient-to-r from-transparent via-green-400 to-transparent"
            />

            <p className="mx-auto mb-4 max-w-lg text-base leading-relaxed text-gray-400 sm:text-lg">
              Because the question is not just <span className="text-white/80">&ldquo;Did she reach?&rdquo;</span>
            </p>
            <h3 className="font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              It&rsquo;s <span className="text-green-500">&ldquo;Did she travel with peace of mind?&rdquo;</span>
            </h3>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
