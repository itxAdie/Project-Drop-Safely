"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function FinalCTASection({ onWaitlistOpen }: { onWaitlistOpen?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.origin : "https://dropsafely.pk";
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Drop Safely",
          text: "Safe daily transport for female students in Lahore.",
          url,
        });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <section className="relative overflow-hidden bg-dark py-20 sm:py-28">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(34, 197, 94, 0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-green-500/10 blur-[150px]" />
      <div className="pointer-events-none absolute -right-40 bottom-1/3 h-96 w-96 rounded-full bg-green-500/10 blur-[150px]" />

      <div ref={ref} className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
        >
          Help us bring Drop Safely{" "}
          <span className="text-green-500">to your university</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400"
        >
          Join the waiting list and be among the first students to get access when routes open in your area.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <button
            onClick={() => onWaitlistOpen?.()}
            className="group cursor-pointer inline-flex items-center gap-2 rounded-full bg-green-500 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-green-500/90 active:scale-95 shadow-[0_0_24px_rgba(34,197,94,0.35)]"
          >
            Join the Early Access List
            <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </button>
          <button
            onClick={handleShare}
            className="group cursor-pointer inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-8 py-3.5 text-sm font-semibold text-white transition-all hover:border-green-500/30 hover:bg-green-500/[0.05] active:scale-95"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Share with a Friend
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
          className="mt-8 text-sm text-gray-500"
        >
          For female students &bull; Parents welcome &bull; No payment required
        </motion.p>
      </div>
    </section>
  );
}
