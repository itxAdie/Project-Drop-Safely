"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const problems = [
  "Drivers cancelling at the last minute",
  "Expensive ride-hailing costs",
  "Long waits for public transport",
  "Parents worrying until they arrive safely",
  "Travelling alone with unknown drivers",
];

const solutions = [
  "Female-student focused routes",
  "Verified transport partners",
  "Fixed monthly transport planning",
  "Pick-up and drop-off coordination",
  "Designed for students and their families",
];

export default function ProblemsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="our-solution" className="relative overflow-hidden bg-dark py-20 sm:py-28">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(34, 197, 94, 0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-green-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-green-500/5 blur-[120px]" />

      <div ref={ref} className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="relative grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left Column — Problems */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              className="font-display mb-12 text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
            >
              University Should Be Stressful{" "}
              <span className="text-green-500">enough</span>.
            </motion.h2>

            <p className="mb-8 text-lg font-medium text-gray-400">
              Every day, thousands of female students face:
            </p>
            <div className="space-y-4">
              {problems.map((problem, i) => (
                <motion.div
                  key={problem}
                  initial={{ opacity: 0, x: -30 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                  className="group flex items-start gap-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all duration-300 hover:border-red-500/20 hover:bg-red-500/[0.03]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-sm transition-transform duration-300 group-hover:scale-110">
                    ❌
                  </span>
                  <p className="pt-1 text-base text-gray-300">{problem}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Divider (absolutely positioned, won't affect grid) */}
          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            <motion.div
              initial={{ scaleY: 0 }}
              animate={isInView ? { scaleY: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-green-500/30 to-transparent"
              style={{ transformOrigin: "top" }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.6, type: "spring", stiffness: 200 }}
              className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-green-500/30 bg-dark shadow-[0_0_30px_rgba(34,197,94,0.15)]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7-7 7 7" />
              </svg>
            </motion.div>
          </div>

          {/* Right Column — Solution */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          >
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
              className="mb-3 text-2xl font-bold text-green-500 sm:text-3xl"
            >
              The Solution
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
              className="mb-8 text-lg leading-relaxed text-gray-400"
            >
              Travel with students from your area. Drop Safely helps female students share a pre-planned daily route with other
              female students going to the same university or nearby campuses.
            </motion.p>
            <div className="space-y-4 mt-16">
              {solutions.map((solution, i) => (
                <motion.div
                  key={solution}
                  initial={{ opacity: 0, x: 30 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.7 + i * 0.1, ease: "easeOut" }}
                  className="  group flex items-start gap-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all duration-300 hover:border-green-500/20 hover:bg-green-500/[0.03]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-sm transition-transform duration-300 group-hover:scale-110">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <p className="pt-1 text-base text-gray-300">{solution}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Mobile divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="mt-10 h-px w-full bg-gradient-to-r from-transparent via-green-500/30 to-transparent lg:hidden"
          style={{ transformOrigin: "left" }}
        />
      </div>
    </section>
  );
}
