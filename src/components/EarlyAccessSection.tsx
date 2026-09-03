"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import ShareModal from "./ShareModal";

export default function EarlyAccessSection({ onRegisterOpen }: { onRegisterOpen?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <section className="relative overflow-hidden bg-dark py-20 sm:py-28">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(34, 197, 94, 0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none absolute -left-40 top-1/3 h-80 w-80 rounded-full bg-green-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-1/3 h-80 w-80 rounded-full bg-green-500/5 blur-[120px]" />

      <div ref={ref} className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
        >
          Early <span className="text-green-500">Access</span>
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400"
        >
          Help us launch routes in your area. We are currently collecting interest from female students in Lahore universities and colleges.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
          className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-500"
        >
          If enough students from your area register, we can activate a dedicated route.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
        >
          <button
            onClick={() => onRegisterOpen?.()}
            className="group cursor-pointer inline-flex items-center gap-2 rounded-full bg-green-500 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-green-500/90 active:scale-95 shadow-[0_0_24px_rgba(34,197,94,0.35)]"
          >
            Check Availability in your Area
            <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </button>

          <button
            onClick={() => setShareOpen(true)}
            className="group cursor-pointer mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-8 py-3.5 text-sm font-semibold text-white transition-all hover:border-green-500/30 hover:bg-green-500/[0.05] active:scale-95 sm:mt-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Share with Friends
          </button>
        </motion.div>

        <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} />

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          className="mt-16"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.55 }}
            className="text-sm font-medium tracking-widest text-gray-500 uppercase"
          >
            We&rsquo;re building this with students.
          </motion.p>

          <div className="mt-6 flex items-center justify-center gap-10 sm:gap-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
            >
              <p className="font-display text-4xl font-bold text-white sm:text-5xl">
                300<span className="text-green-500">+</span>
              </p>
              <p className="mt-1 text-sm text-gray-400">Students registered so far</p>
            </motion.div>

            <div className="hidden h-12 w-px bg-white/10 sm:block" />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
            >
              <p className="font-display text-4xl font-bold text-white sm:text-5xl">
                40<span className="text-green-500">+</span>
              </p>
              <p className="mt-1 text-sm text-gray-400">Drivers Applications Recieved</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
