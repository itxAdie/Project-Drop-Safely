"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

const formVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 10,
    transition: { duration: 0.2, ease: "easeIn" as const },
  },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const fieldVariants = {
  hidden: { y: 12, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" as const, delay: 0.1 + i * 0.06 },
  }),
};

type FormData = {
  name: string;
  phone: string;
  city: string;
  institute: string;
  address: string;
  rent: string;
  transportMode: string;
};

const transportOptions = [
  "Public Transport (Bus / Metro / Minibus)",
  "University Buses",
  "Private Vans",
  "InDrive",
  "Yango",
  "Bykea",
  "Private Car (Self / Carpool)",
  "Other",
];

const SCRIPT_URLS: Record<string, string> = {
  Lahore: "https://script.google.com/macros/s/AKfycbwvnBWKTTC72ZiZladgs2rBk0YGBuPd4J_sdC59RYFHgEjQqzYriunuIbsosXankRA7dg/exec",
  Okara: "https://script.google.com/macros/s/AKfycbyyDYWQLq_MC5daN7GJhNbcJ9B9_9_ww1ggf4z270FUWE-TcU8cn2lCRCvU6m0dYJB7/exec",
  default: "https://script.google.com/macros/s/AKfycbzFmJwlROBlEx_nI9JqLxFWZia8un3oe5UHb-YQQRbseQgLozpVYv6DezDzdqsbnofgKA/exec",

};

const cityOptions = ["Lahore", "Okara", "Other"];
export default function WaitlistModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormData>({
    name: "",
    phone: "",
    city: "",
    institute: "",
    address: "",
    rent: "",
    transportMode: "",
  });
  const [focused, setFocused] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstInput = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setForm({ name: "", phone: "", city: "", institute: "", address: "", rent: "", transportMode: "" });
    setSubmitted(false);
    setError(false);
    setSending(false);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => firstInput.current?.focus(), 350);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
        resetForm();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
      resetForm();
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.city || !form.institute || !form.address || !form.rent || !form.transportMode) return;
    setSending(true);
    setError(false);
    const scriptUrl = SCRIPT_URLS[form.city] ?? SCRIPT_URLS.default;
    try {
      await fetch(scriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setError(false);
        setForm({ name: "", phone: "", city: "", institute: "", address: "", rent: "", transportMode: "" });
      }, 2200);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  const fields: {
    key: keyof FormData;
    label: string;
    placeholder: string;
    type: string;
    required?: boolean;
  }[] = [
      {
        key: "name",
        label: "Full Name",
        placeholder: "e.g. Ayesha Khan",
        type: "text",
        required: true,
      },
      {
        key: "phone",
        label: "Phone Number",
        placeholder: "e.g. 0300-1234567",
        type: "tel",
        required: true,
      },
      {
        key: "city",
        label: "City",
        placeholder: "Select your city",
        type: "city-select",
        required: true,
      },
      {
        key: "institute",
        label: "Institute",
        placeholder: "e.g. FAST NUCES, Lahore",
        type: "text",
      },
      {
        key: "address",
        label: "Home Address",
        placeholder: "e.g. Nizami Road, Lahore",
        type: "text",
      },
      {
        key: "rent",
        label: "Current Rent / Fare per Month (PKR)",
        placeholder: "e.g. 5,000",
        type: "text",
      },
      {
        key: "transportMode",
        label: "How Do You Currently Travel?",
        placeholder: "Select your commute mode",
        type: "select",
      },
    ];

  const isComplete = fields.every((f) => form[f.key].trim().length > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleOverlayClick}
          className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
        >
          <div className="pointer-events-none flex min-h-full items-center justify-center">
            <motion.div
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0a0f0a]/95 shadow-2xl shadow-green-500/5 backdrop-blur-2xl"
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>

              {submitted ? (
                /* Success state */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center px-8 py-16 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 12 }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20"
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                  </motion.div>
                  <h3 className="mt-5 font-display text-xl font-bold text-white">
                    You&rsquo;re on the list!
                  </h3>
                  <p className="mt-2 text-sm text-gray-400">
                    We&rsquo;ll notify you as soon as Drop Safely launches in your area.
                  </p>
                </motion.div>
              ) : (
                /* Form */
                <>
                  {/* Header */}
                  <div className="px-6 pb-2 pt-8 sm:px-8">
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span className="text-[10px] font-semibold tracking-wide text-green-500 uppercase">
                        Limited Spots
                      </span>
                    </div>
                    <h2 className="font-display text-2xl font-bold text-white">
                      Join the Waitlist
                    </h2>
                    <p className="mt-1 text-sm text-gray-400">
                      Be the first to get access when Drop Safely arrives at your campus.
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-3 px-6 pb-6 pt-3 sm:px-8 sm:pb-8">
                    {fields.map((field, i) => (
                      <motion.div
                        key={field.key}
                        custom={i}
                        variants={fieldVariants}
                        initial="hidden"
                        animate="visible"
                        className="group relative"
                      >
                        <label className="mb-1.5 block text-xs font-medium text-gray-400">
                          {field.label}
                          {field.required && <span className="ml-0.5 text-green-500">*</span>}
                        </label>
                        <div
                          className={`flex items-center rounded-xl border bg-white/[0.02] transition-all duration-300 ${focused === field.key
                            ? "border-green-500/50 shadow-[0_0_16px_rgba(34,197,94,0.08)]"
                            : "border-white/[0.06] hover:border-white/[0.12]"
                            }`}
                        >
                          {field.type === "city-select" ? (
                            <select
                              value={form[field.key]}
                              onChange={(e) => update(field.key, e.target.value)}
                              onFocus={() => setFocused(field.key)}
                              onBlur={() => setFocused(null)}
                              className={`w-full appearance-none bg-transparent px-3.5 py-2.5 text-sm outline-none ${form[field.key] ? "text-white" : "text-gray-600"}`}
                            >
                              <option value="" disabled className="bg-[#0a0f0a] text-gray-500">
                                {field.placeholder}
                              </option>
                              {cityOptions.map((opt) => (
                                <option key={opt} value={opt} className="bg-[#0a0f0a] text-white">
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : field.type === "select" ? (
                            <select
                              value={form[field.key]}
                              onChange={(e) => update(field.key, e.target.value)}
                              onFocus={() => setFocused(field.key)}
                              onBlur={() => setFocused(null)}
                              className={`w-full appearance-none bg-transparent px-3.5 py-2.5 text-sm outline-none ${form[field.key] ? "text-white" : "text-gray-600"}`}
                            >
                              <option value="" disabled className="bg-[#0a0f0a] text-gray-500">
                                {field.placeholder}
                              </option>
                              {transportOptions.map((opt) => (
                                <option key={opt} value={opt} className="bg-[#0a0f0a] text-white">
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              ref={i === 0 ? firstInput : undefined}
                              type={field.type}
                              value={form[field.key]}
                              onChange={(e) => update(field.key, e.target.value)}
                              onFocus={() => setFocused(field.key)}
                              onBlur={() => setFocused(null)}
                              placeholder={field.placeholder}
                              className="w-full bg-transparent px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none"
                            />
                          )}
                          {field.type !== "select" && field.type !== "city-select" && form[field.key].length > 0 && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              type="button"
                              onClick={() => update(field.key, "")}
                              className="mr-2 text-gray-500 hover:text-white"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </motion.button>
                          )}
                          {(field.type === "select" || field.type === "city-select") && (
                            <div className="pointer-events-none mr-3">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500"><path d="M6 9l6 6 6-6" /></svg>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.45 }}
                      className="flex items-center gap-2 rounded-lg bg-green-500/[0.03] px-3 py-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                      <span className="text-xs text-gray-500">Your data is kept private and never shared.</span>
                    </motion.div>

                    <motion.button
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      type="submit"
                      disabled={!isComplete || sending}
                      className={`mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all ${isComplete && !sending
                        ? "bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3),0_0_40px_rgba(34,197,94,0.1)] hover:bg-green-500/90"
                        : "cursor-not-allowed bg-white/5 text-gray-500"
                        }`}
                    >
                      {sending ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          Join the Waitlist
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </>
                      )}
                    </motion.button>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 text-center text-xs text-red-400"
                      >
                        Something went wrong.{" "}
                        <button
                          type="button"
                          onClick={handleSubmit}
                          className="underline hover:text-red-300"
                        >
                          Try again
                        </button>
                      </motion.p>
                    )}
                  </form>
                </>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
