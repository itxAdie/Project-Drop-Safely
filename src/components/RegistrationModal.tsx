"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Car, ArrowLeft, ArrowRight, Phone, ShieldCheck, User } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { TimePicker } from "./ui/TimePicker";
import { Spinner } from "./ui/Spinner";
import { LocationPicker } from "@/components/maps/LocationPicker";
import { useToast } from "./ui/Toast";
import { useAuth } from "@/hooks/useAuth";

type Role = "student" | "driver";
type Step = "role" | "phone" | "otp" | "profile" | "done";

const CITY_OPTIONS = [
  { value: "Lahore", label: "Lahore" },
  { value: "Okara", label: "Okara" },
];

const VEHICLE_OPTIONS = [
  { value: "van", label: "Van (AC/Non-AC)" },
  { value: "mini_bus", label: "Mini Bus" },
  { value: "bus", label: "Bus" },
  { value: "car", label: "Car" },
];

const OFF_DAYS = [
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
  { value: "friday", label: "Fri" },
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
];

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 5 * 60;
const MIN_SEND_LOADING_MS = 900;

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const panelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 28 },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: 12,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("+92")) return "0" + cleaned.slice(3);
  return cleaned;
}

const isValidPakistaniPhone = (p: string) => /^(\+92|0)?3[0-9]{9}$/.test(p.replace(/[\s\-\(\)]/g, ""));

export default function RegistrationModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const { login } = useAuth();
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role>("student");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRY_SECONDS);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Student profile
  const [sName, setSName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [sInstitute, setSInstitute] = useState("");
  const [sCity, setSCity] = useState("");
  const [address, setAddress] = useState("");
  const [sLat, setSLat] = useState<number | null>(null);
  const [sLng, setSLng] = useState<number | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [offDays, setOffDays] = useState<string[]>([]);

  // Driver profile
  const [dName, setDName] = useState("");
  const [cnic, setCnic] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [capacity, setCapacity] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [dCity, setDCity] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [profileError, setProfileError] = useState("");

  // ── Body scroll lock while open ─────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const resetAll = () => {
    setStep("role");
    setRole("student");
    setAccessToken(null);
    setDigits(Array(OTP_LENGTH).fill(""));
    setPhone("");
    setPhoneError("");
    setProfileError("");
    setOffDays([]);
    setSCity("");
    setAddress("");
    setSLat(null);
    setSLng(null);
    setStartTime("");
    setEndTime("");
    setSName("");
    setParentPhone("");
    setSInstitute("");
  };

  const handleClose = useCallback(() => {
    resetAll();
    onClose();
  }, [onClose]);

  // ESC close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, handleClose]);


  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleClose();
  };

  // ── OTP countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(s - 1, 0)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ── Phone → send OTP ─────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");
    if (!isValidPakistaniPhone(phone)) {
      setPhoneError("Enter a valid Pakistani phone (e.g. 0300-1234567)");
      return;
    }
    const normalized = normalizePhone(phone);
    setSendingOtp(true);
    const startedAt = Date.now();
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send OTP");
        return;
      }
      const elapsed = Date.now() - startedAt;
      const remain = Math.max(0, MIN_SEND_LOADING_MS - elapsed);
      if (remain > 0) await new Promise((r) => setTimeout(r, remain));
      setPhone(normalized);
      setDigits(Array(OTP_LENGTH).fill(""));
      setSecondsLeft(OTP_EXPIRY_SECONDS);
      setStep("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
      toast.success("OTP sent! Check your WhatsApp.");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  // ── OTP input handling ───────────────────────────────────────────────────
  const handleOtpChange = (i: number, value: string) => {
    const d = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < OTP_LENGTH - 1) otpRefs.current[i + 1]?.focus();
    if (!verifying && next.join("").length === OTP_LENGTH) {
      verifyOtpWithCode(next.join(""));
    }
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < OTP_LENGTH; i++) next[i] = pasted[i] || "";
    setDigits(next);
    otpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    if (!verifying && next.join("").length === OTP_LENGTH) {
      verifyOtpWithCode(next.join(""));
    }
  };

  const verifyOtpWithCode = async (code: string) => {
    if (verifying) return;
    setVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Verification failed");
        return;
      }
      setAccessToken(data.accessToken);
      login(
        { accessToken: data.accessToken, refreshToken: data.refreshToken },
        data.user,
      );
      setStep("profile");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const verifyOtp = () => {
    const code = digits.join("");
    if (code.length !== OTP_LENGTH) {
      toast.warning("Please enter the complete 6-digit code.");
      return;
    }
    verifyOtpWithCode(code);
  };

  const handleResend = async () => {
    if (secondsLeft > 0) return;
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to resend OTP");
        return;
      }
      setDigits(Array(OTP_LENGTH).fill(""));
      setSecondsLeft(OTP_EXPIRY_SECONDS);
      otpRefs.current[0]?.focus();
      toast.success("New OTP sent to your WhatsApp!");
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  // ── Toggle off days ──────────────────────────────────────────────────────
  const toggleDay = (d: string) => {
    setOffDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  // ── Profile submission ───────────────────────────────────────────────────
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");

    let body: Record<string, unknown>;
    let url: string;

    if (role === "student") {
      if (!sName.trim() || !sInstitute.trim() || !sCity || sLat == null || sLng == null || !startTime || !endTime) {
        setProfileError(sLat == null || sLng == null
          ? "Please select your pickup location on the map."
          : "Please fill all required fields.");
        return;
      }
      if (parentPhone && !/^(\+92|0)?[0-9]{10,11}$/.test(parentPhone.replace(/[\s\-\(\)]/g, ""))) {
        setProfileError("Parent phone is invalid.");
        return;
      }
      url = "/api/students";
      body = {
        name: sName,
        phone,
        parentPhone: parentPhone || undefined,
        pickupAddress: address,
        pickupLat: sLat,
        pickupLng: sLng,
        institute: sInstitute,
        city: sCity,
        classStartTime: startTime,
        classEndTime: endTime,
        permanentOffDays: offDays.length ? offDays : undefined,
      };
    } else {
      if (!dName.trim() || !cnic.trim() || !vehicleType || !capacity || !regNumber.trim() || !dCity) {
        setProfileError("Please fill all required fields.");
        return;
      }
      if (!/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/.test(cnic)) {
        setProfileError("CNIC format must be XXXXX-XXXXXXX-X");
        return;
      }
      url = "/api/drivers";
      body = {
        name: dName,
        phone,
        cnic,
        vehicleType,
        vehicleCapacity: parseInt(capacity) || 1,
        vehicleRegNumber: regNumber,
        city: dCity,
      };
    }

    setSubmitting(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      if (role === "student") {
        resetAll();
        onClose();
        router.push("/student/deposit");
      } else {
        setStep("done");
      }
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedOffDays = OFF_DAYS.filter((d) => offDays.includes(d.value));

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
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0a0f0a]/95 shadow-2xl shadow-green-500/5 backdrop-blur-2xl"
            >
              <button
                onClick={handleClose}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>

              <AnimatePresence mode="wait">
                {/* ── ROLE STEP ─────────────────────────────── */}
                {step === "role" && (
                  <motion.div
                    key="role"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="px-6 pb-8 pt-8 sm:px-8"
                  >
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span className="text-[10px] font-semibold tracking-wide text-green-500 uppercase">
                        Get Started
                      </span>
                    </div>
                    <h2 className="font-display text-2xl font-bold text-white">
                      How will you use Drop Safely?
                    </h2>
                    <p className="mt-1 text-sm text-gray-400">
                      Choose your role to set up your account.
                    </p>

                    <div className="mt-6 flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={() => { setRole("student"); setStep("phone"); }}
                        className="group flex w-full items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 text-left transition-all hover:border-green-500/30 hover:bg-green-500/[0.04]"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-500 ring-1 ring-green-500/20">
                          <GraduationCap size={22} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-display text-base font-semibold text-white">
                            I&apos;m a Student
                          </h3>
                          <p className="mt-0.5 text-xs text-gray-500">
                            Book your daily pick &amp; drop, track your ride, manage payments.
                          </p>
                        </div>
                        <ArrowRight size={18} className="shrink-0 text-gray-600 transition-transform group-hover:translate-x-1 group-hover:text-green-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => { setRole("driver"); setStep("phone"); }}
                        className="group flex w-full items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 text-left transition-all hover:border-green-500/30 hover:bg-green-500/[0.04]"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-500 ring-1 ring-green-500/20">
                          <Car size={22} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-display text-base font-semibold text-white">
                            I&apos;m a Driver
                          </h3>
                          <p className="mt-0.5 text-xs text-gray-500">
                            Register your vehicle, manage trips, and earn with every ride.
                          </p>
                        </div>
                        <ArrowRight size={18} className="shrink-0 text-gray-600 transition-transform group-hover:translate-x-1 group-hover:text-green-500" />
                      </button>
                    </div>

                    <div className="mt-6 flex items-center gap-2 rounded-lg bg-green-500/[0.03] px-3 py-2">
                      <ShieldCheck size={14} className="text-green-500" />
                      <span className="text-xs text-gray-500">
                        Your data is kept private and never shared.
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* ── PHONE STEP ────────────────────────────── */}
                {step === "phone" && (
                  <motion.form
                    key="phone"
                    onSubmit={handleSendOtp}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="px-6 pb-8 pt-8 sm:px-8"
                  >
                    <button
                      type="button"
                      onClick={() => setStep("role")}
                      className="mb-4 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-white"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span className="text-[10px] font-semibold tracking-wide text-green-500 uppercase">
                        Verify Your Number
                      </span>
                    </div>
                    <h2 className="font-display text-2xl font-bold text-white">
                      Enter your phone number
                    </h2>
                    <p className="mt-1 text-sm text-gray-400">
                      {role === "student"
                        ? "We&rsquo;ll send a one-time code to your WhatsApp."
                        : "We&rsquo;ll send a one-time code to verify your driver account."}
                    </p>

                    <div className="mt-6">
                      <Input
                        label="Phone Number"
                        placeholder="e.g. 0300-1234567"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        error={phoneError}
                        required
                        leftIcon={<Phone size={15} />}
                      />
                    </div>

                    <Button
                      type="submit"
                      fullWidth
                      className="mt-6"
                      size="lg"
                      isLoading={sendingOtp}
                      rightIcon={<ArrowRight size={16} />}
                    >
                      Send OTP
                    </Button>
                  </motion.form>
                )}

                {/* ── OTP STEP ──────────────────────────────── */}
                {step === "otp" && (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="px-6 pb-8 pt-8 sm:px-8"
                  >
                    <button
                      type="button"
                      onClick={() => { setStep("phone"); setDigits(Array(OTP_LENGTH).fill("")); }}
                      className="mb-4 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-white"
                    >
                      <ArrowLeft size={14} /> Change number
                    </button>
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span className="text-[10px] font-semibold tracking-wide text-green-500 uppercase">
                        OTP Verification
                      </span>
                    </div>
                    <h2 className="font-display text-2xl font-bold text-white">
                      Enter the 6-digit code
                    </h2>
                    <p className="mt-1 text-sm text-gray-400">
                      Sent to <span className="text-white">{phone}</span>
                    </p>

                    <div className="mt-6 flex justify-between" onPaste={handleOtpPaste}>
                      {digits.map((d, i) => (
                        <input
                          key={i}
                          ref={(el) => { otpRefs.current[i] = el; }}
                          inputMode="numeric"
                          maxLength={1}
                          value={d}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className="h-14 w-12 rounded-xl border border-white/[0.08] bg-white/[0.03] text-center text-xl font-semibold text-white outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        />
                      ))}
                    </div>

                    <div className="mt-5 flex flex-col items-center gap-3">
                      <Button
                        type="button"
                        fullWidth
                        size="lg"
                        isLoading={verifying}
                        onClick={verifyOtp}
                      >
                        Verify &amp; Continue
                      </Button>
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={secondsLeft > 0}
                        className="text-xs text-gray-500 transition-colors hover:text-white disabled:cursor-not-allowed"
                      >
                        {secondsLeft > 0
                          ? `Resend code in ${formatTime(secondsLeft)}`
                          : "Resend code"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── PROFILE STEP ──────────────────────────── */}
                {step === "profile" && (
                  <motion.form
                    key="profile"
                    onSubmit={handleProfileSubmit}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="px-6 pb-8 pt-8 sm:px-8"
                  >
                    <button
                      type="button"
                      onClick={() => { setStep("otp"); setDigits(Array(OTP_LENGTH).fill("")); }}
                      className="mb-4 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-white"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span className="text-[10px] font-semibold tracking-wide text-green-500 uppercase">
                        {role === "student" ? "Student" : "Driver"} Details
                      </span>
                    </div>
                    <h2 className="font-display text-2xl font-bold text-white">
                      Complete your profile
                    </h2>
                    <p className="mt-1 text-sm text-gray-400">
                      Tell us a bit more to create your account.
                    </p>

                    <div className="mt-6 space-y-4">
                      {role === "student" ? (
                        <>
                          <Input
                            label="Full Name"
                            placeholder="Your full name"
                            value={sName}
                            onChange={(e) => setSName(e.target.value)}
                            required
                            leftIcon={<User size={15} />}
                          />
                          <Input
                            label="Parent's WhatsApp Number"
                            placeholder="03XX-XXXXXXX (optional)"
                            type="tel"
                            value={parentPhone}
                            onChange={(e) => setParentPhone(e.target.value)}
                            leftIcon={<Phone size={15} />}
                          />
                          <Input
                            label="Institute Name"
                            placeholder="e.g. FAST-NUCES, LUMS, UET"
                            value={sInstitute}
                            onChange={(e) => setSInstitute(e.target.value)}
                            required
                          />
                          <Select
                            label="City"
                            options={CITY_OPTIONS}
                            placeholder="Select your city"
                            value={sCity}
                            onChange={(e) => setSCity(e.target.value)}
                            required
                          />
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-300">
                              Pickup Location
                              <span className="ml-0.5 text-green-500">*</span>
                            </label>
                            <LocationPicker
                              onSelect={({ coordinates, address: addr }) => {
                                setSLng(coordinates[0]);
                                setSLat(coordinates[1]);
                                setAddress(addr);
                              }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <TimePicker
                              label="PickUp Time"
                              value={startTime}
                              onChange={setStartTime}
                              required
                            />
                            <TimePicker
                              label="DropOff Time"
                              value={endTime}
                              onChange={setEndTime}
                              required
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-300">
                              Permanent Weekly Off Days
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {OFF_DAYS.map((day) => {
                                const isSel = offDays.includes(day.value);
                                return (
                                  <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => toggleDay(day.value)}
                                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                                      isSel
                                        ? "border-green-500/40 bg-green-500/10 text-green-400"
                                        : "border-white/[0.08] bg-white/[0.02] text-gray-500 hover:border-white/[0.15] hover:text-gray-300"
                                    }`}
                                  >
                                    {day.label}
                                  </button>
                                );
                              })}
                            </div>
                            {selectedOffDays.length > 0 && (
                              <p className="mt-1.5 text-xs text-gray-600">
                                Off: {selectedOffDays.map((d) => d.label).join(", ")}
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <Input
                            label="Full Name"
                            placeholder="Your full name"
                            value={dName}
                            onChange={(e) => setDName(e.target.value)}
                            required
                            leftIcon={<User size={15} />}
                          />
                          <Input
                            label="CNIC (National ID)"
                            placeholder="XXXXX-XXXXXXX-X"
                            value={cnic}
                            onChange={(e) => setCnic(e.target.value)}
                            required
                          />
                          <Select
                            label="Vehicle Type"
                            options={VEHICLE_OPTIONS}
                            placeholder="Select vehicle type"
                            value={vehicleType}
                            onChange={(e) => setVehicleType(e.target.value)}
                            required
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              label="Vehicle Capacity"
                              placeholder="e.g. 12"
                              type="number"
                              value={capacity}
                              onChange={(e) => setCapacity(e.target.value)}
                              required
                            />
                            <Input
                              label="Reg Number"
                              placeholder="LEA-1234"
                              value={regNumber}
                              onChange={(e) => setRegNumber(e.target.value)}
                              required
                            />
                          </div>
                          <Select
                            label="City"
                            options={CITY_OPTIONS}
                            placeholder="Select your city"
                            value={dCity}
                            onChange={(e) => setDCity(e.target.value)}
                            required
                          />
                        </>
                      )}
                    </div>

                    {profileError && (
                      <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                        {profileError}
                      </p>
                    )}

                    <Button
                      type="submit"
                      fullWidth
                      size="lg"
                      className="mt-6"
                      isLoading={submitting}
                    >
                      {role === "student" ? "Complete Student Registration" : "Submit Driver Registration"}
                    </Button>
                    <p className="mt-3 text-center text-[11px] text-gray-600">
                      {role === "student"
                        ? "Student registrations are active immediately."
                        : "Driver registrations are reviewed &amp; approved by our team."}
                    </p>
                  </motion.form>
                )}

                {/* ── DONE STEP ─────────────────────────────── */}
                {step === "done" && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
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
                      {role === "student" ? "Welcome aboard!" : "Submitted for review!"}
                    </h3>
                    <p className="mt-2 text-sm text-gray-400">
                      {role === "student"
                        ? "Your student account is ready. Head to your dashboard to get started."
                        : "Our team will review your driver application and contact you shortly."}
                    </p>
                    <Button className="mt-6" onClick={handleClose}>
                      Done
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
