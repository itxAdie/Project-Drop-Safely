"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const benefits = [
  {
    title: "Early Access",
    desc: "Be among the first to register when DropSafely launches in your city.",
    icon: "rocket",
  },
  {
    title: "Exclusive Pricing",
    desc: "Early members get discounted rates and special introductory offers.",
    icon: "tag",
  },
  {
    title: "Priority Setup",
    desc: "Skip the queue with priority route setup and driver assignment.",
    icon: "star",
  },
  {
    title: "No Commitment",
    desc: "Join free with zero obligation. Cancel anytime before service starts.",
    icon: "check",
  },
];

const fadeUp = (delay: number) => ({
  hidden: { y: 24, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" as const, delay },
  },
});

export default function WaitlistSection({
  onWaitlistOpen,
}: {
  onWaitlistOpen?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="waitlist" className="relative overflow-hidden bg-dark px-6 py-24 text-white sm:py-32">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(34, 197, 94, 0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-green-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute -left-40 -bottom-40 h-80 w-80 rounded-full bg-green-500/5 blur-[120px]" />

      <div ref={ref} className="relative z-10 mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.span
            initial={{ opacity: 0, y: -8 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[11px] font-medium tracking-wide text-green-500 uppercase"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Limited Spots
          </motion.span>

          <h2 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            Check if DropSafely is launching{" "}
            <span className="text-green-500">in your area</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/60 sm:text-base">
            Register your details and be the first to know when we launch near
            you. Early access members get exclusive benefits.
          </p>
        </motion.div>

        {/* Benefits grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-green-500/30 hover:bg-green-500/[0.02]"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                {b.icon === "rocket" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M12 2s8 4 8 11c0 5-8 9-8 9s-8-4-8-9c0-7 8-11 8-11z" /><circle cx="12" cy="11" r="3" /></svg>
                ) : b.icon === "tag" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                ) : b.icon === "star" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                )}
              </div>
              <h3 className="text-sm font-semibold text-white">{b.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-400">
                {b.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA + Trust */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <button
            onClick={() => onWaitlistOpen?.()}
            className="group inline-flex items-center gap-2 rounded-full bg-green-500 px-10 py-4 text-base font-semibold text-white transition-all hover:bg-green-500/90 active:scale-95 shadow-[0_0_24px_rgba(34,197,94,0.35),0_0_48px_rgba(34,197,94,0.12),0_0_72px_rgba(34,197,94,0.06)]"
          >
            Check Availability Now
            <span className="transition-transform group-hover:translate-x-1">
              &rarr;
            </span>
          </button>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-10"
          >
            <div className="flex items-center gap-2">

              <span className="text-xs text-gray-500">
                Join <span className="text-white">1,000+</span> parents already
                registered
              </span>
            </div>

            <div className="hidden h-5 w-px bg-white/10 sm:block" />

            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              <span>  Unsubscribe anytime</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
