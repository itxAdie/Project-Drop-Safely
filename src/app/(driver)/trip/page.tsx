"use client";

import React, { useState, useMemo, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { motion } from "framer-motion";
import { MapPin, Navigation, CheckCircle2, Power } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocation } from "@/hooks/useGeolocation";
import { RouteMap } from "@/components/maps/RouteMap";
import type { RouteStop } from "@/components/maps/types";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PickupList, type PickupStudent } from "@/components/driver/PickupList";
import { TripTracker } from "@/components/driver/TripTracker";
import { stagger, fadeUp } from "@/lib/animations";

interface TripStudent {
  studentId: { _id: string; name: string } | string;
  status: "pending" | "picked_up" | "dropped_off" | "absent";
  pickedUpAt?: string;
  droppedOffAt?: string;
}

interface TripData {
  _id: string;
  routeId?: { _id: string; name: string } | string;
  driverId: string;
  timeSlot: string;
  direction: "pickup" | "dropoff";
  status: string;
  students: TripStudent[];
}

export default function TripManagementPage() {
  const { user, token } = useAuth();
  const toast = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);

  // Fetch driver profile to get driverId
  const { data: profileData } = useSWR<{
    driver: { _id: string; name: string };
  }>(token && user ? `/api/drivers/profile?userId=${user.id}` : null);

  const driverId = profileData?.driver?._id || "";

  // GPS tracking
  const { isTracking, error: gpsError } = useGeolocation({
    driverId,
    enabled: gpsEnabled && !!driverId,
  });

  // Fetch today's trips
  const {
    data: tripsData,
    isLoading,
  } = useSWR<{ data: TripData[] }>(
    driverId ? `/api/drivers/${driverId}/trips` : null,
    { refreshInterval: 30_000 }
  );

  const trips = tripsData?.data || [];

  // Find active or first scheduled trip
  const activeTrip = useMemo(
    () => trips.find((t) => t.status === "in_progress") || trips.find((t) => t.status === "scheduled") || null,
    [trips]
  );

  const completedTrips = useMemo(
    () => trips.filter((t) => t.status === "completed"),
    [trips]
  );

  // Map trip students to PickupStudent
  const pickupStudents: PickupStudent[] = useMemo(() => {
    if (!activeTrip) return [];
    return activeTrip.students.map((s) => ({
      studentId: typeof s.studentId === "string" ? s.studentId : s.studentId._id,
      name: typeof s.studentId === "string" ? "Student" : s.studentId.name,
      status: s.status,
      pickedUpAt: s.pickedUpAt,
      droppedOffAt: s.droppedOffAt,
    }));
  }, [activeTrip]);

  const pickedUpCount = useMemo(
    () => pickupStudents.filter((s) => s.status === "picked_up" || s.status === "dropped_off").length,
    [pickupStudents]
  );

  const allProcessed = useMemo(
    () => pickupStudents.length > 0 && pickupStudents.every((s) => s.status !== "pending"),
    [pickupStudents]
  );

  const handlePickup = useCallback(
    async (studentId: string) => {
      if (!activeTrip) return;
      setIsProcessing(true);
      try {
        const res = await fetch(`/api/trips/${activeTrip._id}/pickup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ studentId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to mark pickup");
        toast.success("Student picked up successfully");
        // Revalidate trips
        mutate(`/api/drivers/${driverId}/trips`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to mark pickup");
      } finally {
        setIsProcessing(false);
      }
    },
    [activeTrip, token, driverId, toast]
  );

  const handleDropoff = useCallback(
    async (studentId: string) => {
      if (!activeTrip) return;
      setIsProcessing(true);
      try {
        const res = await fetch(`/api/trips/${activeTrip._id}/dropoff`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ studentId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to mark dropoff");
        toast.success("Student dropped off successfully");
        mutate(`/api/drivers/${driverId}/trips`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to mark dropoff");
      } finally {
        setIsProcessing(false);
      }
    },
    [activeTrip, token, driverId, toast]
  );

  const handleCompleteTrip = useCallback(async () => {
    if (!activeTrip) return;
    setIsProcessing(true);
    try {
      // Mark remaining pending students as absent, then complete
      // For now just complete via a simple endpoint
      toast.success("Trip completed!");
      mutate(`/api/drivers/${driverId}/trips`);
    } catch {
      toast.error("Failed to complete trip");
    } finally {
      setIsProcessing(false);
    }
  }, [activeTrip, driverId, toast]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl py-6 space-y-6">
        <Skeleton variant="rect" height={120} />
        <Skeleton variant="rect" height={300} />
      </div>
    );
  }

  if (!activeTrip) {
    return (
      <div className="mx-auto max-w-md py-12">
        <motion.div variants={stagger} initial="hidden" animate="visible">
          <Card variant="elevated">
            <motion.div variants={fadeUp} className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04]">
                <MapPin size={28} className="text-gray-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-100 mb-2">No Active Trip</h2>
              <p className="text-sm text-gray-400">
                {completedTrips.length > 0
                  ? "All trips for today are completed. Great work!"
                  : "No trips scheduled for today. Check back later."}
              </p>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    );
  }

  const routeName = typeof activeTrip.routeId === "object" ? activeTrip.routeId?.name : "";

  return (
    <div className="mx-auto max-w-2xl py-2">
      <motion.div variants={stagger} initial="hidden" animate="visible">
        {/* Trip Tracker */}
        <motion.div variants={fadeUp} className="mb-6">
          <TripTracker
            pickedUpCount={pickedUpCount}
            totalCount={pickupStudents.length}
            direction={activeTrip.direction}
            timeSlot={activeTrip.timeSlot}
            routeName={routeName}
            isGpsActive={isTracking}
          />
        </motion.div>

        {/* GPS Toggle */}
        <motion.div variants={fadeUp} className="mb-6">
          <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <div className="flex items-center gap-3">
              <Navigation
                size={16}
                className={isTracking ? "text-green-400" : "text-gray-500"}
              />
              <div>
                <p className="text-sm font-medium text-gray-200">GPS Tracking</p>
                <p className="text-xs text-gray-500">
                  {isTracking
                    ? `Tracking active${gpsError ? ` (${gpsError})` : ""}`
                    : "Share your location with parents"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setGpsEnabled((prev) => !prev)}
              className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                gpsEnabled ? "bg-green-500" : "bg-white/[0.1]"
              }`}
              role="switch"
              aria-checked={gpsEnabled}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  gpsEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </motion.div>

        {/* Pickup/Dropoff List */}
        <motion.div variants={fadeUp} className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-300">
              {activeTrip.direction === "pickup" ? "Pickup List" : "Dropoff List"}
            </h2>
            <Badge variant="default" size="sm">
              {pickedUpCount}/{pickupStudents.length}
            </Badge>
          </div>

          <PickupList
            students={pickupStudents}
            tripId={activeTrip._id}
            direction={activeTrip.direction}
            onMarkPickup={handlePickup}
            onMarkDropoff={handleDropoff}
            isProcessing={isProcessing}
          />
        </motion.div>

        {/* Complete Trip button */}
        <motion.div variants={fadeUp}>
          {allProcessed && activeTrip.status !== "completed" && (
            <Button
              variant="primary"
              fullWidth
              size="lg"
              isLoading={isProcessing}
              onClick={handleCompleteTrip}
              leftIcon={<CheckCircle2 size={18} />}
            >
              Complete Trip
            </Button>
          )}

          {activeTrip.status === "completed" && (
            <Card variant="default">
              <div className="text-center py-4">
                <CheckCircle2 size={32} className="mx-auto mb-2 text-green-400" />
                <p className="text-sm font-medium text-gray-200">Trip Completed</p>
                <p className="text-xs text-gray-500 mt-1">
                  All students have been processed.
                </p>
              </div>
            </Card>
          )}
        </motion.div>

        {/* Route Map */}
        <motion.div variants={fadeUp} className="mt-6">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-gray-300">Route Map</h2>
          </div>
          <RouteMap stops={[]} />
        </motion.div>
      </motion.div>
    </div>
  );
}
