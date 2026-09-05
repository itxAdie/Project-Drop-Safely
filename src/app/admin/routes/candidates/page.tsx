"use client";

import React, { useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RouteClusterView, type DriverOption } from "@/components/admin/RouteClusterView";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { pageTransition } from "@/lib/animations";
import { ArrowLeft, RefreshCw } from "lucide-react";

interface CandidateItem {
  _id: string;
  city: string;
  institutes: string[];
  studentIds: string[];
  matchCount: number;
  timeSlot: string;
  departureTime: string;
  status: string;
  centroid?: { coordinates: [number, number] };
  createdAt: string;
}

interface DriverRow {
  _id: string;
  name: string;
  phone: string;
  vehicleCapacity: number;
}

export default function RouteCandidatesPage() {
  const router = useRouter();
  const toast = useToast();
  const { token } = useAuth();
  const [generateCity, setGenerateCity] = useState("");
  const [generating, setGenerating] = useState(false);

  const { data, isLoading } = useSWR<{ data: CandidateItem[] }>(
    "/api/routes/candidates?status=pending",
  );
  const candidates = data?.data || [];

  const { data: driversData } = useSWR<{ data: DriverRow[] }>(
    "/api/drivers?isApproved=true&pageSize=100",
  );
  const driverOptions: DriverOption[] = useMemo(
    () =>
      (driversData?.data || []).map((d) => ({
        value: d._id,
        label: `${d.name} (${d.phone})`,
        vehicleCapacity: d.vehicleCapacity,
      })),
    [driversData],
  );

  const { data: citiesData } = useSWR<{ data: Array<{ _id: string; name: string }> }>("/api/cities");
  const cityOptions = (citiesData?.data || []).map((c) => ({ value: c.name, label: c.name }));

  const handleGenerate = async () => {
    if (!generateCity) {
      toast.warning("Select a city to generate candidates for");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/routes/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ city: generateCity }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      toast.success(
        `Clustering done for ${generateCity}: ${json.clustersGenerated || 0} candidate${json.clustersGenerated === 1 ? "" : "s"}`,
      );
      mutate(
        (key: string) => typeof key === "string" && key.startsWith("/api/routes/candidates"),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate candidates");
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (candidateId: string, routeName: string, driverId: string) => {
    const res = await fetch(`/api/routes/${candidateId}/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: routeName, driverId: driverId || undefined }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.error || "Failed");
    }
    mutate(
      (key: string) =>
        typeof key === "string" &&
        (key.startsWith("/api/routes/candidates") || key.startsWith("/api/routes?")),
    );
  };

  const handleReject = async (candidateId: string) => {
    const res = await fetch(`/api/routes/${candidateId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.error || "Failed");
    }
    mutate(
      (key: string) =>
        typeof key === "string" && key.startsWith("/api/routes/candidates"),
    );
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
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/routes")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={16} />
            Routes
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Route Candidates</h1>
            <p className="text-sm text-gray-500 mt-1">Review, assign a driver, and activate auto-generated route clusters</p>
          </div>
        </div>
      </div>

      {/* Generate candidates */}
      <div className="flex flex-col sm:flex-row gap-3 items-end mb-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4">
        <Select
          label="City"
          options={cityOptions}
          placeholder="Select a city..."
          value={generateCity}
          onChange={(e) => setGenerateCity(e.target.value)}
          wrapperClassName="w-full sm:w-64"
        />
        <Button
          variant="primary"
          size="sm"
          isLoading={generating}
          onClick={handleGenerate}
          leftIcon={<RefreshCw size={14} />}
        >
          Generate Candidates
        </Button>
      </div>

      <RouteClusterView
        candidates={candidates}
        driverOptions={driverOptions}
        isLoading={isLoading}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </motion.div>
  );
}