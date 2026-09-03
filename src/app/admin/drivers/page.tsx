"use client";

import React, { useState, useMemo, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { FileUpload } from "@/components/ui/FileUpload";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { pageTransition } from "@/lib/animations";
import { Plus, User, Phone, FileText, Car, UserPlus } from "lucide-react";

interface DriverRow {
  _id: string;
  name: string;
  phone: string;
  city: string;
  vehicleType: string;
  vehicleCapacity: number;
  isApproved: boolean;
  status: string;
  assignedRouteIds: string[];
  [key: string]: unknown;
}

const VEHICLE_OPTIONS = [
  { value: "van", label: "Van (AC/Non-AC)" },
  { value: "mini_bus", label: "Mini Bus" },
  { value: "bus", label: "Bus" },
  { value: "car", label: "Car" },
];

const EMPTY_FORM = {
  name: "",
  phone: "",
  cnic: "",
  vehicleType: "",
  vehicleCapacity: "",
  vehicleRegNumber: "",
  city: "",
};

export default function DriversPage() {
  const router = useRouter();
  const toast = useToast();
  const { token } = useAuth();
  const [cityFilter, setCityFilter] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedLicense, setUploadedLicense] = useState("");
  const [uploadedVerification, setUploadedVerification] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", "20");
  if (cityFilter) params.set("city", cityFilter);
  if (approvalFilter) params.set("isApproved", approvalFilter);

  const { data, isLoading } = useSWR<{
    data: DriverRow[];
    pagination: { page: number; totalPages: number; totalItems: number };
  }>(`/api/drivers?${params.toString()}`);

  const { data: citiesData } = useSWR<{ data: Array<{ _id: string; name: string }> }>("/api/cities");

  const cityOptions = useMemo(() => {
    const opts = [{ value: "", label: "All Cities" }];
    if (citiesData?.data) {
      opts.push(...citiesData.data.map((c) => ({ value: c.name, label: c.name })));
    }
    return opts;
  }, [citiesData]);

  const citySelectOptions = useMemo(
    () => citiesData?.data?.map((c) => ({ value: c.name, label: c.name })) || [],
    [citiesData],
  );

  const approvalOptions = [
    { value: "", label: "All Drivers" },
    { value: "true", label: "Approved" },
    { value: "false", label: "Pending Approval" },
  ];

  const columns: Column<DriverRow>[] = useMemo(
    () => [
      { header: "Name", accessor: "name", sortable: true },
      { header: "Phone", accessor: "phone" },
      { header: "City", accessor: "city", sortable: true },
      {
        header: "Vehicle",
        accessor: "vehicleType",
        render: (_, row) => (
          <span className="text-sm text-gray-300 capitalize">
            {row.vehicleType.replace("_", " ")} ({row.vehicleCapacity})
          </span>
        ),
      },
      {
        header: "Approved",
        accessor: "isApproved",
        render: (val) => (
          <Badge variant={val ? "success" : "warning"} size="sm" dot>
            {val ? "Yes" : "Pending"}
          </Badge>
        ),
      },
      {
        header: "Routes",
        accessor: "assignedRouteIds",
        render: (val) => (
          <span className="text-sm text-gray-400">
            {Array.isArray(val) ? val.length : 0} assigned
          </span>
        ),
      },
    ],
    [],
  );

  const handleRowClick = useCallback(
    (row: DriverRow) => router.push(`/admin/drivers/${row._id}`),
    [router],
  );

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!/^(\+92|0)?[0-9]{10,11}$/.test(form.phone.replace(/[\s\-\(\)]/g, "")))
      errs.phone = "Invalid phone number";
    if (!/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/.test(form.cnic))
      errs.cnic = "Format: XXXXX-XXXXXXX-X";
    if (!form.vehicleType) errs.vehicleType = "Select vehicle type";
    if (!form.vehicleCapacity || parseInt(form.vehicleCapacity) < 1)
      errs.vehicleCapacity = "Capacity must be at least 1";
    if (!form.vehicleRegNumber.trim())
      errs.vehicleRegNumber = "Registration number is required";
    if (!form.city) errs.city = "Select a city";
    if (!uploadedLicense) errs.license = "License photo is required";
    if (!uploadedVerification) errs.verification = "Police verification is required";
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

  const openModal = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setUploadedLicense("");
    setUploadedVerification("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting || uploading) return;
    setModalOpen(false);
  };

  const handleAddDriver = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/drivers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
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
      if (!res.ok) throw new Error(data.error || "Failed to add driver");

      toast.success("Driver added successfully");
      setModalOpen(false);
      mutate((key) => typeof key === "string" && key.startsWith("/api/drivers?"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add driver");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-7xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Drivers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage drivers and verification queue</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={openModal}
          leftIcon={<Plus size={15} />}
        >
          Add Driver
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Select
          options={cityOptions}
          value={cityFilter}
          onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
          wrapperClassName="w-full sm:w-40"
        />
        <Select
          options={approvalOptions}
          value={approvalFilter}
          onChange={(e) => { setApprovalFilter(e.target.value); setPage(1); }}
          wrapperClassName="w-full sm:w-44"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={(data?.data || []) as (DriverRow & Record<string, unknown>)[]}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        emptyMessage="No drivers found"
      />

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-600">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs rounded-lg bg-white/[0.03] border border-white/[0.06] text-gray-400 disabled:opacity-30 hover:bg-white/[0.06] transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page >= data.pagination.totalPages}
              className="px-3 py-1.5 text-xs rounded-lg bg-white/[0.03] border border-white/[0.06] text-gray-400 disabled:opacity-30 hover:bg-white/[0.06] transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title="Add Driver"
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={closeModal}
              disabled={submitting || uploading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddDriver}
              isLoading={submitting}
              leftIcon={<UserPlus size={15} />}
            >
              Add Driver
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
            required
            type="tel"
            placeholder="e.g. 03001234567"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            error={errors.phone}
            leftIcon={<Phone size={15} />}
          />
          <Input
            label="CNIC Number"
            required
            placeholder="XXXXX-XXXXXXX-X"
            value={form.cnic}
            onChange={(e) => updateField("cnic", e.target.value)}
            error={errors.cnic}
            leftIcon={<FileText size={15} />}
            wrapperClassName="sm:col-span-2"
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
          <Input
            label="Vehicle Capacity (seats)"
            required
            type="number"
            placeholder="e.g. 14"
            value={form.vehicleCapacity}
            onChange={(e) => updateField("vehicleCapacity", e.target.value)}
            error={errors.vehicleCapacity}
            leftIcon={<Car size={15} />}
          />
          <Input
            label="Vehicle Registration Number"
            required
            placeholder="e.g. LEA-2024-1234"
            value={form.vehicleRegNumber}
            onChange={(e) => updateField("vehicleRegNumber", e.target.value)}
            error={errors.vehicleRegNumber}
            wrapperClassName="sm:col-span-2"
          />
          <Select
            label="City"
            required
            options={citySelectOptions}
            placeholder="Select your city"
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
            error={errors.city}
            wrapperClassName="sm:col-span-2"
          />

          {/* Documents */}
          <div className="sm:col-span-2">
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

          <div className="sm:col-span-2">
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
            <div className="sm:col-span-2 flex items-center gap-2 text-sm text-gray-400">
              <Spinner size="sm" />
              Uploading...
            </div>
          )}
        </div>
      </Modal>
    </motion.div>
  );
}