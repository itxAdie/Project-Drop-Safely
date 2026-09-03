"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const faqs = [
  {
    question: "Is Drop Safely only for female students?",
    answer:
      "Yes. Our initial launch is focused on female university and college students.",
  },
  {
    question: "Which universities are supported?",
    answer:
      "We are starting with selected universities and colleges in Lahore and expanding based on student demand.",
  },
  {
    question: "How much will it cost?",
    answer:
      "Pricing will depend on your area and route distance. Students who register will receive early pricing information.",
  },
  {
    question: "Can students from the same area travel together?",
    answer:
      "Yes. Our goal is to create shared routes for female students living in nearby areas.",
  },
  {
    question: "When will routes start?",
    answer:
      "Routes are activated based on the number of interested students in a specific area.",
  },
  {
    question: "Is my personal information safe?",
    answer:
      "Yes. Your details are kept private and only used to coordinate your route. We never share your information with third parties.",
  },
  {
    question: "Can my parents track my route?",
    answer:
      "Absolutely. Every ride includes live GPS tracking and automated alerts so your parents know exactly when you leave and arrive safely.",
  },
  {
    question: "What happens if I miss my ride?",
    answer:
      "Our drivers and coordinators work with fixed pickup times. If you miss a ride, contact our support team and we will arrange the next available pickup for you.",
  },
];

const itemVariants = (i: number) => ({
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const, delay: 0.1 + i * 0.04 },
  },
});

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
  index,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <motion.div
      variants={itemVariants(index)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="border-b border-white/10"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-green-400"
      >
        <span className="text-sm font-medium text-white sm:text-base">
          {question}
        </span>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="shrink-0 text-gray-500"
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-gray-400">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQSection({ onRegisterOpen }: { onRegisterOpen?: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faqs" className="relative overflow-hidden bg-[#0a0a0a] py-20 sm:py-28">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(34, 197, 94, 0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-green-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 h-80 w-80 rounded-full bg-green-500/5 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            Frequently Asked{" "}
            <span className="text-green-500">Questions</span>
          </h2>
        </motion.div>

        <div className="mt-12 flex flex-col gap-12 lg:flex-row lg:gap-16">
          {/* Left — FAQ list */}
          <div className="w-full lg:w-3/5">
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                index={i}
              />
            ))}
          </div>

          {/* Right — Glass card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full lg:w-2/5"
          >
            <div className="sticky top-32 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 shadow-2xl shadow-green-500/[0.02] backdrop-blur-2xl sm:p-10">
              <motion.div
                animate={{
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10"
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </motion.div>

              <h3 className="mt-6 text-xl font-semibold text-white">
                Still have questions?
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">
                We&rsquo;re here to help. Reach out to our team and
                we&rsquo;ll get back to you as soon as possible.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 transition-colors hover:border-white/10">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">Email</p>
                    <p className="text-xs text-gray-500">support@dropsafely.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 transition-colors hover:border-white/10">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">Phone</p>
                    <p className="text-xs text-gray-500">03181646200</p>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onRegisterOpen}
                className="mt-6 w-full rounded-xl bg-green-500 py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/20 transition-all hover:bg-green-500/90"
              >
                Check Availability in your Area
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
