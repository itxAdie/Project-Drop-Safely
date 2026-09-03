"use client";

import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { pageTransition } from "@/lib/animations";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, MapPin, Users, Clock } from "lucide-react";

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
  vans: Array<{
    driverId?: { _id: string; name: string; phone: string };
    studentIds: string[];
    capacity: number;
  }>;
  createdAt: string;
}

export default function RouteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { token } = useAuth();
  const id = params.id as string;

  const { data, isLoading } = useSWR<{ data: RouteDetail }>(`/api/routes/${id}`);
  const [actionLoading, setActionLoading] = useState(false);

  const route = data?.data;

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
        {route.vans.length > 0 ? (
          <div className="space-y-3">
            {route.vans.map((van, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">Van #{idx + 1}</span>
                  <span className="text-xs text-gray-500">Capacity: {van.capacity}</span>
                </div>
                {van.driverId ? (
                  <button
                    onClick={() => router.push(`/admin/drivers/${van.driverId?._id}`)}
                    className="text-sm text-green-400 hover:text-green-300 transition-colors"
                  >
                    Driver: {van.driverId.name} ({van.driverId.phone})
                  </button>
                ) : (
                  <p className="text-sm text-gray-600">No driver assigned</p>
                )}
                <p className="text-xs text-gray-500 mt-1">{van.studentIds.length} students</p>
              </div>
            ))}
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
