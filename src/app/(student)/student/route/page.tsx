"use client";

import useSWR from "swr";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { MatchingProgress } from "@/components/student/MatchingProgress";
import { fadeUp, stagger } from "@/lib/animations";
import { Map, User, Car, Users, Clock, GraduationCap, MapPin } from "lucide-react";

interface StudentData {
  _id: string;
  name: string;
  institute: string;
  city: string;
  status: string;
  classStartTime: string;
  classEndTime: string;
  pickupAddress: string;
  assignedRouteId?: string;
  route?: {
    _id: string;
    name: string;
    city: string;
    institutes: string[];
    status: string;
    vans: Array<{
      driverId?: string;
      studentIds: string[];
      capacity: number;
    }>;
  };
}

interface CoPassenger {
  name: string;
}

export default function RoutePage() {
  const { data: meData, isLoading } = useSWR<{ data: StudentData | null }>("/api/students/me");
  const student = meData?.data;

  const studentId = student?._id;
  const coPassengersKey = studentId ? `/api/students/${studentId}/co-passengers` : null;
  const { data: coPassengersData } = useSWR<{ data: CoPassenger[] }>(coPassengersKey);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton variant="rect" height={180} />
        <Skeleton variant="rect" height={140} />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">No profile found</p>
      </div>
    );
  }

  const isActive = student.status === "active";
  const hasRoute = isActive && student.route;
  const coPassengers = coPassengersData?.data ?? [];

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-bold text-gray-100">Route Details</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your assigned route and travel info</p>
      </motion.div>

      {!hasRoute ? (
        /* Waiting pool state */
        <motion.div variants={fadeUp} className="space-y-6">
          <Card padding="lg" className="text-center">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
                <Map size={28} className="text-yellow-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-200">You're in the Waiting Pool</h2>
                <p className="text-sm text-gray-500 mt-1">
                  We're finding enough students in your area to create a route.
                </p>
              </div>
            </div>
          </Card>
          <MatchingProgress studentId={student._id} pollInterval={15000} />
        </motion.div>
      ) : (
        /* Active route */
        <>
          {/* Route info */}
          <motion.div variants={fadeUp}>
            <Card padding="md" className="relative overflow-hidden">
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-green-500/5 blur-3xl" />
              <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Map size={16} className="text-green-400" />
                    <h2 className="text-sm font-semibold text-gray-200">Route Information</h2>
                  </div>
                  <Badge variant="success" size="sm" dot>Active</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Route Name</p>
                    <p className="text-sm font-medium text-gray-200">{student.route?.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Institute</p>
                    <p className="text-sm font-medium text-gray-200">{student.route?.institutes?.[0] || student.institute}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Pickup Time</p>
                    <p className="text-sm font-medium text-gray-200 flex items-center gap-1">
                      <Clock size={12} className="text-gray-500" />
                      {student.classStartTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Drop Time</p>
                    <p className="text-sm font-medium text-gray-200 flex items-center gap-1">
                      <Clock size={12} className="text-gray-500" />
                      {student.classEndTime}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Pickup Address</p>
                  <p className="text-sm text-gray-300 flex items-start gap-1.5">
                    <MapPin size={12} className="text-gray-500 mt-0.5 shrink-0" />
                    {student.pickupAddress}
                  </p>
                </div>

                {/* Map placeholder */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] h-32 flex flex-col items-center justify-center gap-2">
                  <Map size={20} className="text-gray-600" />
                  <p className="text-xs text-gray-600">Route map coming in Phase 7</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Driver info */}
          <motion.div variants={fadeUp}>
            <Card padding="md">
              <div className="flex items-center gap-2 mb-4">
                <User size={16} className="text-blue-400" />
                <h2 className="text-sm font-semibold text-gray-200">Driver Information</h2>
              </div>
              {student.route?.vans?.[0]?.driverId ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                      <Car size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-200">Driver assigned</p>
                      <p className="text-xs text-gray-500">Contact via platform only (privacy protected)</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-0.5">Vehicle</p>
                      <p className="text-xs text-gray-400">Van</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-0.5">Capacity</p>
                      <p className="text-xs text-gray-400">{student.route.vans[0].capacity} seats</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">Driver not yet assigned</p>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Co-passengers */}
          <motion.div variants={fadeUp}>
            <Card padding="md">
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} className="text-purple-400" />
                <h2 className="text-sm font-semibold text-gray-200">Co-Passengers</h2>
                <Badge variant="default" size="sm">{coPassengers.length}</Badge>
              </div>
              {coPassengers.length > 0 ? (
                <div className="space-y-2">
                  {coPassengers.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.01] px-3 py-2.5"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-300">{p.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users size={20} className="mx-auto text-gray-700 mb-2" />
                  <p className="text-sm text-gray-600">No co-passengers yet</p>
                </div>
              )}
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
