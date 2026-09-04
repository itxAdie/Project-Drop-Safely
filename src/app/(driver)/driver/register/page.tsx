"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Car, FileText, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
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
  { label: "Basic Info", icon: User },
  { label: "Documents", icon: FileText },
];

const VEHICLE_OPTIONS = [
  { value: "ac_van", label: "AC-Van" },
  { value: "non_ac_van", label: "Non-AC Van" },
  { value: "mini_bus", label: "Mini-Bus" },
];

const CITY_OPTIONS = [
  { value: "Lahore", label: "Lahore" },
  { value: "Okara", label: "Okara" },
];

type DocField = "licenseFront" | "licenseBack" | "cnicFront" | "cnicBack";

const DOC_SECTION: Record<DocField, { label: string; hint: string }> = {
  licenseFront: { label: "Driving License — Front", hint: "Upload the front side of your license" },
  licenseBack: { label: "Driving License — Back", hint: "Upload the back side of your license" },
  cnicFront: { label: "CNIC — Front", hint: "Upload the front side of your CNIC" },
  cnicBack: { label: "CNIC — Back", hint: "Upload the back side of your CNIC" },
};

export default function DriverRegisterPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedLicenseFront, setUploadedLicenseFront] = useState<string>("");
  const [uploadedLicenseBack, setUploadedLicenseBack] = useState<string>("");
  const [uploadedCnicFront, setUploadedCnicFront] = useState<string>("");
  const [uploadedCnicBack, setUploadedCnicBack] = useState<string>("");
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

  const formatCnic = (raw: string): string => {
    const digits = raw.replace(/\D/g, "").slice(0, 13);
    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
  };

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};

    if (s === 0) {
      if (!form.name.trim()) errs.name = "Name is required";
      if (!form.vehicleType) errs.vehicleType = "Select vehicle type";
      if (!form.vehicleCapacity || parseInt(form.vehicleCapacity) < 1)
        errs.vehicleCapacity = "Capacity must be at least 1";
      if (!form.vehicleRegNumber.trim())
        errs.vehicleRegNumber = "Registration number is required";
      if (!form.cnic.trim()) errs.cnic = "CNIC is required";
      else if (!/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/.test(form.cnic))
        errs.cnic = "Format: XXXXX-XXXXXXX-X";
      if (!form.city) errs.city = "Select a city";
    }
    if (s === 1) {
      if (!uploadedLicenseFront) errs.licenseFront = "License front photo is required";
      if (!uploadedLicenseBack) errs.licenseBack = "License back photo is required";
      if (!uploadedCnicFront) errs.cnicFront = "CNIC front photo is required";
      if (!uploadedCnicBack) errs.cnicBack = "CNIC back photo is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUpload = async (files: File[], field: DocField) => {
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

      if (field === "licenseFront") setUploadedLicenseFront(url);
      else if (field === "licenseBack") setUploadedLicenseBack(url);
      else if (field === "cnicFront") setUploadedCnicFront(url);
      else if (field === "cnicBack") setUploadedCnicBack(url);

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
    if (!validateStep(1)) return;
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
          licenseFrontUrl: uploadedLicenseFront,
          licenseBackUrl: uploadedLicenseBack,
          cnicFrontUrl: uploadedCnicFront,
          cnicBackUrl: uploadedCnicBack,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const fieldMsgs = Object.entries(data.details || {})
          .flatMap(([, msgs]) => (Array.isArray(msgs) ? msgs : []))
          .join(" · ");
        throw new Error(fieldMsgs || data.error || "Registration failed");
      }

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
              {/* Step 1: Basic Info */}
              {step === 0 && (
                <div className="flex flex-col gap-5">
                  <Input
                    label="Full Name"
                    required
                    placeholder="e.g. Muhammad Ali"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    error={errors.name}
                    leftIcon={<Car size={15} />}
                  />
                  <Input
                    label="Phone Number"
                    disabled
                    value={user?.phone || ""}
                    type="tel"
                  />
                  <Select
                    label="Vehicle Type"
                    required
                    options={VEHICLE_OPTIONS}
                    placeholder="Select vehicle type"
                    value={form.vehicleType}
                    onChange={(e) => updateField("vehicleType", e.target.value)}
                    error={errors.vehicleType}
                  />
                  <div className="grid grid-cols-2 gap-3">
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
                      label="Vehicle Reg Number"
                      required
                      placeholder="e.g. LEA-2024"
                      value={form.vehicleRegNumber}
                      onChange={(e) => updateField("vehicleRegNumber", e.target.value)}
                      error={errors.vehicleRegNumber}
                    />
                  </div>
                  <Input
                    label="CNIC Number"
                    required
                    placeholder="XXXXX-XXXXXXX-X"
                    value={form.cnic}
                    onChange={(e) => updateField("cnic", formatCnic(e.target.value))}
                    error={errors.cnic}
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

              {/* Step 2: Documents */}
              {step === 1 && (
                <div className="flex flex-col gap-6">
                  <p className="text-sm text-gray-400">
                    Please upload clear photos of both sides of your license and CNIC.
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {(Object.keys(DOC_SECTION) as DocField[]).map((field) => {
                      const isUploaded =
                        (field === "licenseFront" && uploadedLicenseFront) ||
                        (field === "licenseBack" && uploadedLicenseBack) ||
                        (field === "cnicFront" && uploadedCnicFront) ||
                        (field === "cnicBack" && uploadedCnicBack);
                      return (
                        <div key={field}>
                          <p className="text-sm font-medium text-gray-300 mb-2">
                            {DOC_SECTION[field].label} <span className="text-green-500">*</span>
                          </p>
                          <FileUpload
                            accept="image/*"
                            maxSize={5}
                            label={DOC_SECTION[field].hint}
                            onUpload={(files) => handleUpload(files, field)}
                            error={errors[field]}
                          />
                          {isUploaded && (
                            <p className="text-xs text-green-400 mt-1">✓ Uploaded</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {uploading && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Spinner size="sm" />
                      Uploading...
                    </div>
                  )}
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