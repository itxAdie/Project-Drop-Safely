"use client";

import React, { useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { pageTransition } from "@/lib/animations";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, MapPin, Users, Clock, Car, AlertTriangle } from "lucide-react";

interface VanRow {
  driverId?: string | { _id: string; name: string; phone: string };
  studentIds: string[];
  capacity: number;
}

interface RouteDetail {
  _id: string;
  name: string;
  city: string;
  status: string;
  totalStudents: number;
  minStudents: number;
  radiusKm: number;
  institutes: string[];
  timeSlots: string[];
  vans: VanRow[];
  createdAt: string;
}

interface DriverRow {
  _id: string;
  name: string;
  phone: string;
  vehicleCapacity: number;
}

function stringId(id: string | { _id: string } | null | undefined): string {
  if (!id) return "";
  return typeof id === "string" ? id : id._id;
}

export default function RouteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { token } = useAuth();
  const id = params.id as string;

  const { data, isLoading } = useSWR<{ data: RouteDetail }>(`/api/routes/${id}`);
  const { data: driversData } = useSWR<{ data: DriverRow[] }>(
    "/api/drivers?isApproved=true&pageSize=100",
  );
  const drivers = useMemo(() => driversData?.data || [], [driversData]);

  const [actionLoading, setActionLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState<number | null>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<Record<number, string>>({});

  const route = data?.data;

  const driversById = useMemo(() => {
    const map: Record<string, DriverRow> = {};
    for (const d of drivers) map[d._id] = d;
    return map;
  }, [drivers]);

  const driverOptions = useMemo(
    () => drivers.map((d) => ({ value: d._id, label: `${d.name} (${d.phone}) — seats ${d.vehicleCapacity}` })),
    [drivers],
  );

  const handleToggleStatus = async () => {
    if (!route) return;
    setActionLoading(true);
    try {
      const newStatus = route.status === "active" ? "inactive" : "active";
      const res = await fetch(`/api/routes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      mutate(`/api/routes/${id}`);
      toast.success(`Route ${newStatus === "active" ? "activated" : "suspended"}`);
    } catch {
      toast.error("Failed to update route");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignDriver = async (vanIndex: number, driverId: string) => {
    if (!driverId) {
      toast.warning("Select a driver first");
      return;
    }
    setAssignLoading(vanIndex);
    try {
      const res = await fetch(`/api/routes/${id}/assign-driver`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ driverId, vanIndex }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to assign driver");
      setSelectedDrivers((prev) => ({ ...prev, [vanIndex]: "" }));
      mutate(`/api/routes/${id}`);
      toast.success("Driver assigned");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign driver");
    } finally {
      setAssignLoading(null);
    }
  };

  const vanTargets: Array<{ van?: VanRow; idx: number }> = route
    ? route.vans.length > 0
      ? route.vans.map((van, idx) => ({ van, idx }))
      : [{ idx: 0 }]
    : [];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton variant="text" width="30%" height={28} />
        <Skeleton variant="rect" height={200} />
      </div>
    );
  }

  if (!route) {
    return <p className="text-gray-500 text-center py-12">Route not found</p>;
  }

  const isAtRisk = route.totalStudents < route.minStudents;

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-4xl mx-auto"
    >
      {/* Back + Actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Routes
        </button>
        <Button
          variant={route.status === "active" ? "outline" : "primary"}
          size="sm"
          isLoading={actionLoading}
          onClick={handleToggleStatus}
        >
          {route.status === "active" ? "Suspend" : "Activate"} Route
        </Button>
      </div>

      {/* Route Info */}
      <Card variant="elevated" padding="md" className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-100">{route.name}</h1>
              <Badge
                variant={route.status === "active" ? (isAtRisk ? "danger" : "success") : "default"}
                dot
              >
                {route.status}{isAtRisk && " (at-risk)"}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1.5"><MapPin size={13} /> {route.city}</span>
              <span className="flex items-center gap-1.5"><Users size={13} /> {route.totalStudents} students ({route.minStudents} min)</span>
              <span className="flex items-center gap-1.5"><Clock size={13} /> {route.timeSlots.join(", ")}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-white/[0.04]">
          <div>
            <p className="text-xs text-gray-600 mb-0.5">Institutes</p>
            <p className="text-sm text-gray-300">{route.institutes.join(", ") || "N/A"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-0.5">Radius</p>
            <p className="text-sm text-gray-300">{route.radiusKm} km</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-0.5">Created</p>
            <p className="text-sm text-gray-300">{new Date(route.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </Card>

      {/* Van Assignments */}
      <Card variant="default" padding="sm" className="mb-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Van Assignments</h3>
        <p className="text-xs text-gray-600 mb-4">
          Assigning a driver caps the van at the driver&apos;s capacity — the oldest students get seats
          first, overflow stays in the waiting pool.
        </p>
        {vanTargets.length > 0 ? (
          <div className="space-y-3">
            {vanTargets.map(({ van, idx }) => {
              const assignedDriverId = stringId(van?.driverId);
              const populatedDriver =
                van && typeof van.driverId === "object" && van.driverId !== null
                  ? van.driverId
                  : null;
              const assigned = populatedDriver || driversById[assignedDriverId] || null;
              const overCapacity = van ? van.studentIds.length > van.capacity : false;

              return (
                <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">Van #{idx + 1}</span>
                    <span className="text-xs text-gray-500">Capacity: {van?.capacity ?? "—"}</span>
                  </div>

                  {assigned ? (
                    <button
                      onClick={() => router.push(`/admin/drivers/${assigned._id}`)}
                      className="text-sm text-green-400 hover:text-green-300 transition-colors"
                    >
                      Driver: {assigned.name} ({assigned.phone})
                    </button>
                  ) : (
                    <p className="text-sm text-gray-600">No driver assigned</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {van
                      ? `${van.studentIds.length} / ${van.capacity ?? "?"} students on van`
                      : `${route.totalStudents} students on route — assigning a driver creates the first van`}
                  </p>
                  {van && overCapacity && (
                    <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                      <AlertTriangle size={12} /> Van is over the listed capacity — assign a larger vehicle.
                    </p>
                  )}

                  <div className="mt-3 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <Select
                      options={driverOptions}
                      placeholder="Assign / change driver..."
                      value={selectedDrivers[idx] || ""}
                      onChange={(e) => setSelectedDrivers((prev) => ({ ...prev, [idx]: e.target.value }))}
                      wrapperClassName="w-full sm:flex-1"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      isLoading={assignLoading === idx}
                      onClick={() => handleAssignDriver(idx, selectedDrivers[idx] || "")}
                      leftIcon={<Car size={14} />}
                    >
                      Assign
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No van assignments</p>
        )}
      </Card>

      {/* Map Placeholder */}
      <div
        id="route-map-placeholder"
        className="rounded-3xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl flex items-center justify-center min-h-[200px]"
      >
        <p className="text-gray-600 text-sm">Route Map (coming soon)</p>
      </div>
    </motion.div>
  );
}