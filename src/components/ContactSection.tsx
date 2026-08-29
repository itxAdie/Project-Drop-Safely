"use client";

import { motion } from "framer-motion";
import { useState } from "react";
// Deploy a separate Google Apps Script (Code.gs) in a new Sheet with headers:
// name | email | phone | subject | message
// Then paste the deployed web app URL here.
const CONTACT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx-uWISQqTswFSqItmQI4LUVrhdwBCybOxOFbNzf1QIl5MSNCIZi3Osi6Bd2B7kFvIq/exec";

type FormData = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const fieldVariants = {
  hidden: { y: 12, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" as const, delay: 0.1 + i * 0.06 },
  }),
};

export default function ContactSection() {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [focused, setFocused] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.message) return;
    setSending(true);
    setError(false);
    try {
      await fetch(CONTACT_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      }, 3000);
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
    multiline?: boolean;
  }[] = [
      { key: "name", label: "Full Name", placeholder: "e.g. Ayesha Khan", type: "text" },
      { key: "email", label: "Email", placeholder: "e.g. ayesha@example.com", type: "email" },
      { key: "phone", label: "Phone", placeholder: "e.g. +92 300 1234567", type: "tel" },
      { key: "subject", label: "Subject", placeholder: "e.g. Partnership Inquiry", type: "text" },
      {
        key: "message",
        label: "Message",
        placeholder: "Tell us how we can help...",
        type: "text",
        multiline: true,
      },
    ];

  const isComplete =
    form.name.trim().length > 0 &&
    form.email.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    form.message.trim().length > 0;

  return (
    <section className="relative min-h-screen overflow-hidden bg-dark pt-24 pb-20 sm:pt-32 sm:pb-28">
      <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-green-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 h-80 w-80 rounded-full bg-green-500/5 blur-[120px]" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(34, 197, 94, 0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-0 -mt-20">
        <motion.a
          href="/"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-green-400"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Home
        </motion.a>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            Get in <span className="text-green-500">Touch</span>
          </h1>
          <p className="mt-3 text-gray-400">
            Have a question, suggestion, or partnership idea? We&rsquo;d love to
            hear from you.
          </p>
        </motion.div>

        <div className="mt-12 flex flex-col gap-10 lg:flex-row lg:gap-16">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="w-full lg:w-3/5"
          >
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-2xl shadow-green-500/[0.02] backdrop-blur-2xl sm:p-8">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-12 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 12 }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20"
                  >
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </motion.div>
                  <h3 className="mt-5 font-display text-xl font-bold text-white">
                    Message Sent!
                  </h3>
                  <p className="mt-2 text-sm text-gray-400">
                    Thank you for reaching out. We&rsquo;ll get back to you
                    within 24 hours.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
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
                      </label>
                      {field.multiline ? (
                        <div
                          className={`flex rounded-xl border bg-white/[0.02] transition-all duration-300 ${focused === field.key
                            ? "border-green-500/50 shadow-[0_0_16px_rgba(34,197,94,0.08)]"
                            : "border-white/[0.06] hover:border-white/[0.12]"
                            }`}
                        >
                          <textarea
                            value={form[field.key]}
                            onChange={(e) => update(field.key, e.target.value)}
                            onFocus={() => setFocused(field.key)}
                            onBlur={() => setFocused(null)}
                            placeholder={field.placeholder}
                            rows={4}
                            className="w-full resize-none bg-transparent px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none"
                          />
                        </div>
                      ) : (
                        <div
                          className={`flex items-center rounded-xl border bg-white/[0.02] transition-all duration-300 ${focused === field.key
                            ? "border-green-500/50 shadow-[0_0_16px_rgba(34,197,94,0.08)]"
                            : "border-white/[0.06] hover:border-white/[0.12]"
                            }`}
                        >
                          <input
                            type={field.type}
                            value={form[field.key]}
                            onChange={(e) => update(field.key, e.target.value)}
                            onFocus={() => setFocused(field.key)}
                            onBlur={() => setFocused(null)}
                            placeholder={field.placeholder}
                            className="w-full bg-transparent px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none"
                          />
                          {form[field.key].length > 0 && !field.multiline && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              type="button"
                              onClick={() => update(field.key, "")}
                              className="mr-2 text-gray-500 hover:text-white"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </motion.button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                    className="flex items-center gap-2 rounded-lg bg-green-500/[0.03] px-3 py-2"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span className="text-xs text-gray-500">
                      Your data is kept private and never shared.
                    </span>
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
                        <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray="31.4 31.4"
                            strokeLinecap="round"
                          />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        >
                          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                        </svg>
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
              )}
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full lg:w-2/5"
          >
            <div className="sticky top-32 space-y-4">
              {[
                {
                  icon: (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  ),
                  label: "Email",
                  value: "support@dropsafely.com",
                  href: "mailto:support@dropsafely.com",
                },
                {
                  icon: (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                    </svg>
                  ),
                  label: "Phone",
                  value: "0318 1646200",
                  href: "tel:+923181646200",
                },
                {
                  icon: (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  ),
                  label: "Address",
                  value: "Lahore, Pakistan",
                  href: null,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-2xl shadow-green-500/[0.02] backdrop-blur-2xl transition-all hover:border-white/[0.12]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        {item.label}
                      </p>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-sm font-medium text-white transition-colors hover:text-green-400"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-white">
                          {item.value}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-2xl shadow-green-500/[0.02] backdrop-blur-2xl">
                <p className="text-xs font-medium text-gray-500">
                  Follow Us
                </p>
                <div className="mt-3 flex gap-3">
                  {[
                    { label: "Facebook", href: "https://web.facebook.com/profile.php?id=100086546385072" },
                    { label: "Instagram", href: "https://www.instagram.com/dropsafely.pk?igsh=MWt5bGxwank1Nms2YQ==" },
                    { label: "LinkedIn", href: "https://www.linkedin.com/company/drop-safely" },
                    { label: "WhatsApp", href: "https://wa.me/923181646200" },
                    { label: "TikTok", href: "https://www.tiktok.com/@dropsafely.pk?_r=1&_t=ZS-98Nklq6uqE0" },
                  ].map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/50 transition-all hover:border-green-500/40 hover:text-green-400"
                      aria-label={social.label}
                    >
                      {social.label === "Facebook" ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      ) : social.label === "Instagram" ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                        </svg>
                      ) : social.label === "WhatsApp" ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      ) : social.label === "TikTok" ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.43v-7.15a8.16 8.16 0 005.58 2.18v-3.45a4.85 4.85 0 01-5.59-4.52z" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
