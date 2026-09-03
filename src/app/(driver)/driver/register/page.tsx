"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Car, FileText, MapPin, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FileUpload } from "@/components/ui/FileUpload";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { stagger, fadeUp } from "@/lib/animations";

const STEPS = [
  { label: "Personal Info", icon: User },
  { label: "Vehicle", icon: Car },
  { label: "Documents", icon: FileText },
  { label: "Location", icon: MapPin },
];

const VEHICLE_OPTIONS = [
  { value: "van", label: "Van (AC/Non-AC)" },
  { value: "mini_bus", label: "Mini Bus" },
  { value: "bus", label: "Bus" },
  { value: "car", label: "Car" },
];

const CITY_OPTIONS = [
  { value: "Lahore", label: "Lahore" },
  { value: "Okara", label: "Okara" },
];

export default function DriverRegisterPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedLicense, setUploadedLicense] = useState<string>("");
  const [uploadedVerification, setUploadedVerification] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    vehicleType: "",
    vehicleCapacity: "",
    vehicleRegNumber: "",
    cnic: "",
    city: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};

    if (s === 0 && !form.name.trim()) errs.name = "Name is required";
    if (s === 1) {
      if (!form.vehicleType) errs.vehicleType = "Select vehicle type";
      if (!form.vehicleCapacity || parseInt(form.vehicleCapacity) < 1)
        errs.vehicleCapacity = "Capacity must be at least 1";
      if (!form.vehicleRegNumber.trim())
        errs.vehicleRegNumber = "Registration number is required";
    }
    if (s === 2) {
      if (!uploadedLicense) errs.license = "License photo is required";
      if (!uploadedVerification)
        errs.verification = "Police verification is required";
    }
    if (s === 3) {
      if (!form.cnic.trim()) errs.cnic = "CNIC is required";
      else if (!/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/.test(form.cnic))
        errs.cnic = "Format: XXXXX-XXXXXXX-X";
      if (!form.city) errs.city = "Select a city";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUpload = async (files: File[], field: "license" | "verification") => {
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("folder", `drivers/${field}`);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const url = data.url || data.data?.url;

      if (field === "license") setUploadedLicense(url);
      else setUploadedVerification(url);

      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });

      toast.success("File uploaded successfully");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          phone: user?.phone || "",
          cnic: form.cnic,
          vehicleType: form.vehicleType,
          vehicleCapacity: parseInt(form.vehicleCapacity) || 1,
          vehicleRegNumber: form.vehicleRegNumber,
          city: form.city,
          licenseUrl: uploadedLicense,
          policeVerificationUrl: uploadedVerification,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      toast.success("Registration submitted! Pending admin approval.");
      router.push("/driver/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="mx-auto max-w-lg py-6">
      <motion.div variants={stagger} initial="hidden" animate="visible">
        {/* Header */}
        <motion.div variants={fadeUp} className="mb-8">
          <h1 className="text-2xl font-bold text-gray-100 font-display">
            Driver Registration
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete all steps to register your profile
          </p>
        </motion.div>

        {/* Progress indicator */}
        <motion.div variants={fadeUp} className="mb-8">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all shrink-0 ${
                      isDone
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-green-500/20 text-green-400 border border-green-500/40"
                        : "bg-white/[0.04] text-gray-600"
                    }`}
                  >
                    {isDone ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-px ${
                        i < step ? "bg-green-500/40" : "bg-white/[0.06]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Step {step + 1}: {STEPS[step].label}
          </p>
        </motion.div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <Card variant="elevated" padding="lg">
              {/* Step 1: Personal Info */}
              {step === 0 && (
                <div className="flex flex-col gap-5">
                  <Input
                    label="Full Name"
                    required
                    placeholder="e.g. Muhammad Ali"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    error={errors.name}
                    leftIcon={<User size={15} />}
                  />
                  <Input
                    label="Phone Number"
                    disabled
                    value={user?.phone || ""}
                    type="tel"
                  />
                  <p className="text-xs text-gray-500">
                    Phone number is linked to your account and cannot be changed here.
                  </p>
                </div>
              )}

              {/* Step 2: Vehicle Details */}
              {step === 1 && (
                <div className="flex flex-col gap-5">
                  <Select
                    label="Vehicle Type"
                    required
                    options={VEHICLE_OPTIONS}
                    placeholder="Select vehicle type"
                    value={form.vehicleType}
                    onChange={(e) => updateField("vehicleType", e.target.value)}
                    error={errors.vehicleType}
                  />
                  <Input
                    label="Vehicle Capacity (seats)"
                    required
                    type="number"
                    placeholder="e.g. 14"
                    value={form.vehicleCapacity}
                    onChange={(e) => updateField("vehicleCapacity", e.target.value)}
                    error={errors.vehicleCapacity}
                  />
                  <Input
                    label="Vehicle Registration Number"
                    required
                    placeholder="e.g. LEA-2024-1234"
                    value={form.vehicleRegNumber}
                    onChange={(e) => updateField("vehicleRegNumber", e.target.value)}
                    error={errors.vehicleRegNumber}
                  />
                </div>
              )}

              {/* Step 3: Documents */}
              {step === 2 && (
                <div className="flex flex-col gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2">
                      Driving License Photo <span className="text-green-500">*</span>
                    </p>
                    <FileUpload
                      accept="image/*"
                      maxSize={5}
                      label="Upload license photo"
                      onUpload={(files) => handleUpload(files, "license")}
                      error={errors.license}
                    />
                    {uploadedLicense && (
                      <p className="text-xs text-green-400 mt-1">✓ License uploaded</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2">
                      Police Verification Photo <span className="text-green-500">*</span>
                    </p>
                    <FileUpload
                      accept="image/*"
                      maxSize={5}
                      label="Upload verification document"
                      onUpload={(files) => handleUpload(files, "verification")}
                      error={errors.verification}
                    />
                    {uploadedVerification && (
                      <p className="text-xs text-green-400 mt-1">✓ Verification uploaded</p>
                    )}
                  </div>

                  {uploading && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Spinner size="sm" />
                      Uploading...
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Location */}
              {step === 3 && (
                <div className="flex flex-col gap-5">
                  <Input
                    label="CNIC Number"
                    required
                    placeholder="XXXXX-XXXXXXX-X"
                    value={form.cnic}
                    onChange={(e) => updateField("cnic", e.target.value)}
                    error={errors.cnic}
                    leftIcon={<FileText size={15} />}
                  />
                  <Select
                    label="City"
                    required
                    options={CITY_OPTIONS}
                    placeholder="Select your city"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    error={errors.city}
                  />
                  <p className="text-xs text-gray-500">
                    You will be assigned routes in your selected city once approved.
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="secondary"
            onClick={prevStep}
            disabled={step === 0}
            leftIcon={<ChevronLeft size={15} />}
          >
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              variant="primary"
              onClick={nextStep}
              rightIcon={<ChevronRight size={15} />}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={submitting}
            >
              Submit Registration
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
