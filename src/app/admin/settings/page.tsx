"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { pageTransition } from "@/lib/animations";

interface SettingsData {
  _id: string;
  cityId: { _id: string; name: string } | string;
  clusterRadiusKm: number;
  minStudentsPerRoute: number;
  maxTimeSlots: number;
  defaultCommissionPercent: number;
  defaultPlatformFee: number;
  paymentReminderDaysBefore: number;
}

interface CityItem {
  _id: string;
  name: string;
}

export default function SettingsPage() {
  const toast = useToast();
  const { token } = useAuth();
  const [selectedCityId, setSelectedCityId] = useState("");
  const [form, setForm] = useState({
    clusterRadiusKm: "3",
    minStudentsPerRoute: "7",
    maxTimeSlots: "3",
    defaultCommissionPercent: "15",
    defaultPlatformFee: "100",
    paymentReminderDaysBefore: "3",
  });
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: citiesData } = useSWR<{ data: CityItem[] }>("/api/cities");
  const { data: settingsResponse, isLoading } = useSWR<{ data: SettingsData | null }>(
    selectedCityId ? `/api/settings?cityId=${selectedCityId}` : null,
  );

  const cityOptions = [
    { value: "", label: "Select a city" },
    ...(citiesData?.data?.map((c) => ({ value: c._id, label: c.name })) || []),
  ];

  useEffect(() => {
    if (settingsResponse?.data) {
      const s = settingsResponse.data;
      setForm({
        clusterRadiusKm: String(s.clusterRadiusKm),
        minStudentsPerRoute: String(s.minStudentsPerRoute),
        maxTimeSlots: String(s.maxTimeSlots),
        defaultCommissionPercent: String(s.defaultCommissionPercent),
        defaultPlatformFee: String(s.defaultPlatformFee),
        paymentReminderDaysBefore: String(s.paymentReminderDaysBefore),
      });
    } else {
      setForm({
        clusterRadiusKm: "3",
        minStudentsPerRoute: "7",
        maxTimeSlots: "3",
        defaultCommissionPercent: "15",
        defaultPlatformFee: "100",
        paymentReminderDaysBefore: "3",
      });
    }
  }, [settingsResponse]);

  const handleSave = async () => {
    if (!selectedCityId) {
      toast.warning("Please select a city");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          cityId: selectedCityId,
          clusterRadiusKm: Number(form.clusterRadiusKm),
          minStudentsPerRoute: Number(form.minStudentsPerRoute),
          maxTimeSlots: Number(form.maxTimeSlots),
          defaultCommissionPercent: Number(form.defaultCommissionPercent),
          defaultPlatformFee: Number(form.defaultPlatformFee),
          paymentReminderDaysBefore: Number(form.paymentReminderDaysBefore),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Settings saved successfully");
      setShowConfirm(false);
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-2xl mx-auto"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Platform configuration per city</p>
      </div>

      {/* City selector */}
      <div className="mb-6">
        <Select
          label="City"
          options={cityOptions}
          value={selectedCityId}
          onChange={(e) => setSelectedCityId(e.target.value)}
          required
        />
      </div>

      {selectedCityId && (
        <>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton variant="rect" height={300} />
            </div>
          ) : (
            <Card variant="elevated" padding="md">
              <div className="space-y-4">
                <Input
                  label="Cluster Radius (km)"
                  type="number"
                  value={form.clusterRadiusKm}
                  onChange={(e) => setForm({ ...form, clusterRadiusKm: e.target.value })}
                />
                <Input
                  label="Min Students Per Route"
                  type="number"
                  value={form.minStudentsPerRoute}
                  onChange={(e) => setForm({ ...form, minStudentsPerRoute: e.target.value })}
                />
                <Input
                  label="Max Time Slots"
                  type="number"
                  value={form.maxTimeSlots}
                  onChange={(e) => setForm({ ...form, maxTimeSlots: e.target.value })}
                />
                <Input
                  label="Default Commission (%)"
                  type="number"
                  value={form.defaultCommissionPercent}
                  onChange={(e) => setForm({ ...form, defaultCommissionPercent: e.target.value })}
                />
                <Input
                  label="Default Platform Fee (PKR)"
                  type="number"
                  value={form.defaultPlatformFee}
                  onChange={(e) => setForm({ ...form, defaultPlatformFee: e.target.value })}
                />
                <Input
                  label="Payment Reminder Days Before"
                  type="number"
                  value={form.paymentReminderDaysBefore}
                  onChange={(e) => setForm({ ...form, paymentReminderDaysBefore: e.target.value })}
                />

                <div className="pt-4 border-t border-white/[0.04]">
                  {showConfirm ? (
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-gray-400 flex-1">Are you sure you want to save these settings?</p>
                      <Button variant="primary" size="sm" isLoading={saving} onClick={handleSave}>
                        Confirm Save
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowConfirm(false)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button variant="primary" fullWidth onClick={() => setShowConfirm(true)}>
                      Save Settings
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </motion.div>
  );
}
