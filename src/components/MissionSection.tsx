"use client";

import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";

const fadeIn = (delay: number) => ({
  hidden: { y: 24, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" as const, delay },
  },
});

export default function MissionSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="our-mission" className="relative overflow-hidden bg-dark py-20 sm:py-28">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(34, 197, 94, 0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none absolute -right-40 -top-40 h-80 w-80 rounded-full bg-green-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-green-500/5 blur-[120px]" />

      <div ref={ref} className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
          {/* Left — Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full lg:w-[45%]"
          >
            <div className="group relative overflow-hidden rounded-3xl">
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-tl from-green-500/10 via-transparent to-transparent" />
              <Image
                src="/image.png"
                alt="Students commuting with Drop Safely"
                width={368}
                height={506}
                className="h-auto w-[70%] mx-auto object-cover"
                priority
                unoptimized
              />
            </div>
          </motion.div>

          {/* Right — Glass card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
            className="w-full lg:w-[55%]"
          >
            <div className="rounded-3xl bg-white/[0.03] p-8 shadow-2xl shadow-green-500/[0.02] backdrop-blur-2xl sm:p-10">
              {/* Badge */}
              <motion.span
                initial={{ opacity: 0, y: -8 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[11px] font-medium tracking-wide text-green-500 uppercase"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Our Mission
              </motion.span>

              {/* Heading */}
              <motion.h2
                variants={fadeIn(0.3)}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl"
              >
                Making every student&rsquo;s journey{" "}
                <span className="text-green-500">safe and stress-free</span>.
              </motion.h2>

              {/* Description */}
              <motion.p
                variants={fadeIn(0.4)}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                className="mt-4 text-sm leading-relaxed text-gray-400 sm:text-base"
              >
                At DropSafely, our mission is to make student transportation
                safer, more reliable, and more transparent for every family.
              </motion.p>

              <motion.p
                variants={fadeIn(0.45)}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                className="mt-3 text-sm leading-relaxed text-gray-400 sm:text-base"
              >
                We believe parents should never have to wonder where their child
                is during their daily commute, and students should never have to
                rely on unreliable transportation to reach their destination.
              </motion.p>

              <motion.p
                variants={fadeIn(0.5)}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                className="mt-3 text-sm leading-relaxed text-gray-400 sm:text-base"
              >
                By combining technology, trusted transportation partners, and a
                student-first approach, we&rsquo;re building a future where every
                journey is safe, every arrival is expected, and every parent has
                peace of mind.
              </motion.p>

              <motion.p
                variants={fadeIn(0.55)}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                className="mt-4 text-sm font-semibold leading-relaxed text-green-400 sm:text-base"
              >
                Because getting to school safely shouldn&rsquo;t be a
                privilege&mdash;it should be the standard.
              </motion.p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
