"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { stagger, fadeUp } from "@/lib/animations";
import { Check, X, Users, Clock, MapPin, Car } from "lucide-react";
import { Select } from "@/components/ui/Select";

interface RouteCandidateItem {
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

export interface DriverOption {
  value: string;
  label: string;
  vehicleCapacity: number;
}

interface RouteClusterViewProps {
  candidates: RouteCandidateItem[];
  driverOptions: DriverOption[];
  isLoading?: boolean;
  onApprove: (candidateId: string, routeName: string, driverId: string) => Promise<void>;
  onReject: (candidateId: string) => Promise<void>;
}

export function RouteClusterView({
  candidates,
  driverOptions,
  isLoading,
  onApprove,
  onReject,
}: RouteClusterViewProps) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [namingId, setNamingId] = useState<string | null>(null);
  const [routeName, setRouteName] = useState("");
  const [driverId, setDriverId] = useState("");
  const toast = useToast();

  const handleApprove = async (id: string) => {
    if (!routeName.trim()) {
      toast.warning("Please provide a route name");
      return;
    }
    setProcessing(id);
    try {
      await onApprove(id, routeName.trim(), driverId);
      toast.success("Route activated successfully");
      setNamingId(null);
      setRouteName("");
      setDriverId("");
    } catch {
      toast.error("Failed to activate route");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    try {
      await onReject(id);
      toast.success("Candidate rejected");
    } catch {
      toast.error("Failed to reject candidate");
    } finally {
      setProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="rect" height={180} />
        ))}
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500 text-sm">No route candidates available</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      {candidates.map((candidate) => (
        <motion.div key={candidate._id} variants={fadeUp}>
          <Card variant="default" padding="sm" className="h-full">
            <div className="flex items-center justify-between mb-3">
              <Badge
                variant={
                  candidate.status === "pending"
                    ? "warning"
                    : candidate.status === "approved"
                      ? "success"
                      : "danger"
                }
                dot
              >
                {candidate.status}
              </Badge>
              <span className="text-xs text-gray-600">
                {new Date(candidate.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-gray-500" />
                <span className="text-sm text-gray-300">
                  {candidate.studentIds.length} students
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-500" />
                <span className="text-sm text-gray-300 capitalize">
                  {candidate.timeSlot} &middot; {candidate.departureTime}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gray-500" />
                <span className="text-sm text-gray-300 truncate">
                  {candidate.institutes.join(", ")}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                City: {candidate.city}
              </p>
            </div>

            {candidate.status === "pending" && (
              <div className="mt-auto pt-3 border-t border-white/[0.04]">
                {namingId === candidate._id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={routeName}
                      onChange={(e) => setRouteName(e.target.value)}
                      placeholder="Route name..."
                      className="w-full rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm px-3 py-2 text-gray-200 outline-none focus:border-green-500/50"
                    />
                    <Select
                      options={[
                        { value: "", label: "No driver (stays candidate)" },
                        ...driverOptions.map((d) => ({
                          value: d.value,
                          label: `${d.label} — seats ${d.vehicleCapacity}`,
                        })),
                      ]}
                      value={driverId}
                      onChange={(e) => setDriverId(e.target.value)}
                      placeholder="Assign a driver (optional)"
                      wrapperClassName="w-full"
                    />
                    {driverId && (
                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Car size={12} className="text-gray-600" />
                        Oldest students up to the driver&apos;s capacity get seats; overflow stays
                        in the waiting pool.
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        fullWidth
                        isLoading={processing === candidate._id}
                        onClick={() => handleApprove(candidate._id)}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setNamingId(null); setRouteName(""); setDriverId(""); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      fullWidth
                      onClick={() => setNamingId(candidate._id)}
                      leftIcon={<Check size={14} />}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      isLoading={processing === candidate._id}
                      onClick={() => handleReject(candidate._id)}
                      leftIcon={<X size={14} />}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
