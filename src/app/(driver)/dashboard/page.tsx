"use client";

import React, { useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clock,
  Users,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Route,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/Skeleton";
import { stagger, fadeUp } from "@/lib/animations";

interface TripStudent {
  studentId: { _id: string; name: string } | string;
  status: string;
}

interface Trip {
  _id: string;
  timeSlot: string;
  direction: string;
  status: string;
  students: TripStudent[];
  routeId?: { _id: string; name: string } | string;
}

const timeSlotOrder = { morning: 0, afternoon: 1, evening: 2 };
const timeSlotLabel: Record<string, string> = {
  morning: "🌅 Morning",
  afternoon: "☀️ Afternoon",
  evening: "🌆 Evening",
};

export default function DriverDashboardPage() {
  const { user, token } = useAuth();

  // Fetch driver profile
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useSWR<{
    driver: {
      _id: string;
      name: string;
      phone: string;
      isApproved: boolean;
      status: string;
      assignedRouteIds: string[];
    };
    routes: Array<{ _id: string; name: string; city: string; timeSlots: string[] }>;
  }>(
    token && user
      ? `/api/drivers/profile?userId=${user.id}`
      : null
  );

  // We need the driver's _id to fetch trips. Use a second SWR that depends on profile.
  const driverId = profileData?.driver?._id;

  const {
    data: tripsData,
    isLoading: tripsLoading,
  } = useSWR<{ data: Trip[] }>(
    driverId ? `/api/drivers/${driverId}/trips` : null,
    { refreshInterval: 30_000 }
  );

  const trips = tripsData?.data || [];

  const activeTrip = useMemo(
    () => trips.find((t) => t.status === "in_progress") || null,
    [trips]
  );

  const scheduledTrips = useMemo(
    () => trips.filter((t) => t.status === "scheduled"),
    [trips]
  );

  const completedToday = useMemo(
    () => trips.filter((t) => t.status === "completed"),
    [trips]
  );

  const totalStudents = useMemo(
    () => trips.reduce((acc, t) => acc + t.students.length, 0),
    [trips]
  );

  const pickedUpCount = useMemo(
    () =>
      trips.reduce(
        (acc, t) =>
          acc +
          t.students.filter((s) => s.status === "picked_up" || s.status === "dropped_off").length,
        0
      ),
    [trips]
  );

  if (profileLoading) {
    return (
      <div className="mx-auto max-w-2xl py-6 space-y-6">
        <Skeleton variant="rect" height={40} />
        <Skeleton variant="rect" height={200} />
        <Skeleton variant="rect" height={150} />
      </div>
    );
  }

  // Driver not registered yet
  if (!profileData?.driver) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <motion.div variants={stagger} initial="hidden" animate="visible">
          <motion.div variants={fadeUp}>
            <AlertCircle size={48} className="mx-auto mb-4 text-yellow-400" />
            <h2 className="text-xl font-bold text-gray-100 mb-2">
              Register First
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              You need to complete your driver registration before accessing the dashboard.
            </p>
            <Link href="/driver/register">
              <Button variant="primary" fullWidth>
                Go to Registration
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const { driver, routes } = profileData;

  // Pending approval
  if (!driver.isApproved || driver.status === "pending") {
    return (
      <div className="mx-auto max-w-md py-12">
        <motion.div variants={stagger} initial="hidden" animate="visible">
          <Card variant="elevated">
            <motion.div variants={fadeUp} className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/20">
                <Clock size={28} className="text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-100 mb-2">
                Pending Approval
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                Your registration has been submitted and is awaiting admin review.
                You will be notified once your account is approved and routes are assigned.
              </p>
              <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-gray-500">
                  Status: <span className="text-yellow-400 font-medium">Under Review</span>
                </p>
              </div>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Approved but no route
  if (!routes || routes.length === 0) {
    return (
      <div className="mx-auto max-w-md py-12">
        <motion.div variants={stagger} initial="hidden" animate="visible">
          <Card variant="elevated">
            <motion.div variants={fadeUp} className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20">
                <Route size={28} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-100 mb-2">
                No Route Assigned
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                You are approved but haven&apos;t been assigned a route yet.
                The admin will assign you to a route soon.
              </p>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Active dashboard
  return (
    <div className="mx-auto max-w-2xl py-2">
      <motion.div variants={stagger} initial="hidden" animate="visible">
        {/* Welcome */}
        <motion.div variants={fadeUp} className="mb-6">
          <h1 className="text-2xl font-bold text-gray-100 font-display">
            Good day, {driver.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {routes[0]?.name} · {routes[0]?.city}
          </p>
        </motion.div>

        {/* Quick stats */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3 mb-6">
          {[
            {
              icon: Users,
              label: "Students",
              value: totalStudents,
              color: "text-blue-400",
              bg: "bg-blue-500/10",
            },
            {
              icon: CheckCircle2,
              label: "Picked Up",
              value: pickedUpCount,
              color: "text-green-400",
              bg: "bg-green-500/10",
            },
            {
              icon: Calendar,
              label: "Trips Today",
              value: trips.length,
              color: "text-purple-400",
              bg: "bg-purple-500/10",
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} variant="default" padding="sm">
                <div className="flex flex-col items-center gap-2 py-1">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.bg}`}>
                    <Icon size={16} className={stat.color} />
                  </div>
                  <p className="text-xl font-bold text-gray-100 tabular-nums">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </Card>
            );
          })}
        </motion.div>

        {/* Active trip card */}
        {activeTrip && (
          <motion.div variants={fadeUp} className="mb-6">
            <Card variant="elevated">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Active Trip
                  </p>
                  <p className="text-base font-semibold text-gray-100">
                    {timeSlotLabel[activeTrip.timeSlot]} ·{" "}
                    {activeTrip.direction === "pickup" ? "To Institute" : "From Institute"}
                  </p>
                </div>
                <Badge variant="success" dot>
                  In Progress
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                {activeTrip.students.filter((s) => s.status === "picked_up" || s.status === "dropped_off").length}{" "}
                of {activeTrip.students.length} students processed
              </p>
              <Link href="/driver/trip">
                <Button variant="primary" fullWidth>
                  Continue Trip
                </Button>
              </Link>
            </Card>
          </motion.div>
        )}

        {/* Today's schedule */}
        <motion.div variants={fadeUp} className="mb-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Today&apos;s Schedule</h2>
          {trips.length === 0 ? (
            <Card variant="default">
              <div className="text-center py-6">
                <Calendar size={32} className="mx-auto mb-2 text-gray-600" />
                <p className="text-sm text-gray-500">No trips scheduled today</p>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {[...trips]
                .sort((a, b) => (timeSlotOrder[a.timeSlot as keyof typeof timeSlotOrder] ?? 99) - (timeSlotOrder[b.timeSlot as keyof typeof timeSlotOrder] ?? 99))
                .map((trip) => (
                  <Card key={trip._id} variant="default" padding="sm" hover>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04]">
                          <MapPin
                            size={16}
                            className={
                              trip.status === "completed"
                                ? "text-green-400"
                                : trip.status === "in_progress"
                                ? "text-blue-400"
                                : "text-gray-500"
                            }
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200">
                            {timeSlotLabel[trip.timeSlot]}
                          </p>
                          <p className="text-xs text-gray-500">
                            {trip.direction === "pickup" ? "To Institute" : "From Institute"} ·{" "}
                            {trip.students.length} students
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          trip.status === "completed"
                            ? "success"
                            : trip.status === "in_progress"
                            ? "info"
                            : "default"
                        }
                        size="sm"
                      >
                        {trip.status === "completed"
                          ? "Done"
                          : trip.status === "in_progress"
                          ? "Active"
                          : "Scheduled"}
                      </Badge>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </motion.div>

        {/* Quick links */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
          <Link href="/driver/trip">
            <Card variant="default" padding="sm" hover>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/10">
                  <MapPin size={16} className="text-green-400" />
                </div>
                <span className="text-sm font-medium text-gray-200">Active Trip</span>
              </div>
            </Card>
          </Link>
          <Link href="/driver/earnings">
            <Card variant="default" padding="sm" hover>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/10">
                  <Users size={16} className="text-green-400" />
                </div>
                <span className="text-sm font-medium text-gray-200">Earnings</span>
              </div>
            </Card>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
