"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { LocationPicker } from "@/components/maps/LocationPicker";
import type { LocationPickerResult } from "@/components/maps/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { fadeUp, stagger } from "@/lib/animations";
import {
  User,
  MapPin,
  GraduationCap,
  Clock,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";

const STEPS = [
  { label: "Personal", icon: User },
  { label: "Location", icon: MapPin },
  { label: "Institute", icon: GraduationCap },
  { label: "Schedule", icon: Clock },
];

const DAYS = [
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
  { value: "friday", label: "Friday" },
];

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
  }),
};

export default function StudentRegisterPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [name, setName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [pickupLat, setPickupLat] = useState("");
  const [pickupLng, setPickupLng] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [institute, setInstitute] = useState("");
  const [city, setCity] = useState("");
  const [classStartTime, setClassStartTime] = useState("");
  const [classEndTime, setClassEndTime] = useState("");
  const [permanentOffDays, setPermanentOffDays] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!name.trim() || name.length < 2) newErrors.name = "Name is required (min 2 characters)";
      if (parentPhone && !/^(\+92|0)?[0-9]{10,11}$/.test(parentPhone))
        newErrors.parentPhone = "Invalid Pakistani phone number";
    }

    if (step === 1) {
      if (!pickupLat || isNaN(Number(pickupLat))) newErrors.pickupLat = "Latitude is required";
      if (!pickupLng || isNaN(Number(pickupLng))) newErrors.pickupLng = "Longitude is required";
      if (!pickupAddress.trim() || pickupAddress.length < 5)
        newErrors.pickupAddress = "Address is required (min 5 characters)";
    }

    if (step === 2) {
      if (!institute.trim() || institute.length < 2) newErrors.institute = "Institute name is required";
      if (!city) newErrors.city = "City is required";
    }

    if (step === 3) {
      if (!classStartTime || !/^\d{2}:\d{2}$/.test(classStartTime))
        newErrors.classStartTime = "Use HH:MM format";
      if (!classEndTime || !/^\d{2}:\d{2}$/.test(classEndTime))
        newErrors.classEndTime = "Use HH:MM format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [step, name, parentPhone, pickupLat, pickupLng, pickupAddress, institute, city, classStartTime, classEndTime]);

  const handleNext = () => {
    if (!validateStep()) return;
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handlePrev = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const toggleDay = (day: string) => {
    setPermanentOffDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          phone: user?.phone || "",
          parentPhone: parentPhone || undefined,
          pickupAddress,
          pickupLat: Number(pickupLat),
          pickupLng: Number(pickupLng),
          institute,
          city,
          classStartTime,
          classEndTime,
          permanentOffDays: permanentOffDays.length > 0 ? permanentOffDays : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      toast.success("Registration successful! Welcome to Drop Safely.");
      router.push("/student");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 py-8">
      {/* Background texture */}
      <div className="fixed inset-0 dot-grid opacity-30 pointer-events-none" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-[#22c55e]">
            Drop Safely
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Complete your registration to get started
          </p>
        </motion.div>

        {/* Progress indicator */}
        <motion.div variants={fadeUp} className="mb-6">
          <div className="flex items-center justify-between px-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <div key={s.label} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 ${
                      isActive
                        ? "border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_16px_rgba(34,197,94,0.2)]"
                        : isDone
                        ? "border-green-500/40 bg-green-500/5 text-green-500"
                        : "border-white/[0.08] bg-white/[0.02] text-gray-600"
                    }`}
                  >
                    {isDone ? <Check size={16} /> : <Icon size={16} />}
                  </div>
                  <span
                    className={`text-[10px] font-medium ${
                      isActive ? "text-green-400" : isDone ? "text-green-500/70" : "text-gray-600"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Progress line */}
          <div className="mt-2 h-0.5 rounded-full bg-white/[0.04] mx-8">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400"
              animate={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
        </motion.div>

        {/* Step content */}
        <Card padding="lg" className="glass-card glow-green">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {step === 0 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-100">Personal Information</h2>
                    <p className="text-xs text-gray-500 mt-1">Tell us about yourself</p>
                  </div>
                  <Input
                    label="Full Name"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={errors.name}
                    required
                    leftIcon={<User size={15} />}
                  />
                  <Input
                    label="Parent's WhatsApp Number"
                    placeholder="03XX-XXXXXXX"
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    error={errors.parentPhone}
                  />
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-100">Pickup Location</h2>
                    <p className="text-xs text-gray-500 mt-1">Where should the van pick you up?</p>
                  </div>

                  <LocationPicker
                    onSelect={(result: LocationPickerResult) => {
                      setPickupLat(result.coordinates[1].toString());
                      setPickupLng(result.coordinates[0].toString());
                      setPickupAddress(result.address);
                    }}
                  />

                  <Input
                    label="Street Address"
                    placeholder="House #, Street, Area"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    error={errors.pickupAddress}
                    required
                    leftIcon={<MapPin size={15} />}
                  />

                  {/* Hidden coordinate fields for validation */}
                  <input type="hidden" value={pickupLat} readOnly />
                  <input type="hidden" value={pickupLng} readOnly />
                  {errors.pickupLat && (
                    <p className="text-xs text-red-400">Please select a location on the map</p>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-100">Institute</h2>
                    <p className="text-xs text-gray-500 mt-1">Where do you study?</p>
                  </div>
                  <Input
                    label="Institute Name"
                    placeholder="e.g. FAST-NUCES, LUMS, UET"
                    value={institute}
                    onChange={(e) => setInstitute(e.target.value)}
                    error={errors.institute}
                    required
                    leftIcon={<GraduationCap size={15} />}
                  />
                  <Select
                    label="City"
                    options={[
                      { value: "Lahore", label: "Lahore" },
                      { value: "Okara", label: "Okara" },
                    ]}
                    placeholder="Select your city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    error={errors.city}
                    required
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-100">Schedule</h2>
                    <p className="text-xs text-gray-500 mt-1">Your class timings and off days</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Class Start Time"
                      placeholder="08:00"
                      value={classStartTime}
                      onChange={(e) => setClassStartTime(e.target.value)}
                      error={errors.classStartTime}
                      required
                      leftIcon={<Clock size={15} />}
                    />
                    <Input
                      label="Class End Time"
                      placeholder="16:00"
                      value={classEndTime}
                      onChange={(e) => setClassEndTime(e.target.value)}
                      error={errors.classEndTime}
                      required
                      leftIcon={<Clock size={15} />}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Permanent Weekly Off Days
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map((day) => {
                        const isSelected = permanentOffDays.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleDay(day.value)}
                            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 border ${
                              isSelected
                                ? "bg-green-500/10 border-green-500/30 text-green-400"
                                : "bg-white/[0.02] border-white/[0.06] text-gray-500 hover:border-white/[0.12] hover:text-gray-400"
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <Button variant="ghost" onClick={handlePrev} leftIcon={<ArrowLeft size={16} />}>
                Back
              </Button>
            ) : (
              <div />
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={handleNext} rightIcon={<ArrowRight size={16} />}>
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                isLoading={isSubmitting}
                rightIcon={<Check size={16} />}
              >
                Complete Registration
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
