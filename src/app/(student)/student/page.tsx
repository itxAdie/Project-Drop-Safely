"use client";

import useSWR from "swr";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { MatchingProgress } from "@/components/student/MatchingProgress";
import { RouteCard } from "@/components/student/RouteCard";
import { PaymentStatusCard } from "@/components/student/PaymentStatusCard";
import { fadeUp, stagger } from "@/lib/animations";
import { CalendarOff, Map, Upload, Bell, GraduationCap, Clock } from "lucide-react";

interface StudentData {
  _id: string;
  name: string;
  institute: string;
  city: string;
  status: string;
  classStartTime: string;
  classEndTime: string;
  route?: {
    _id: string;
    name: string;
    institutes: string[];
    status: string;
  };
  matchingProgress: { matched: number; required: number };
  paymentStatus: {
    status: string;
    amount: number;
    dueDate: string | null;
    current: Record<string, unknown> | null;
  };
}

export default function StudentDashboard() {
  const { data, isLoading } = useSWR<{ data: StudentData | null }>("/api/students/me");

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton variant="rect" height={120} />
        <Skeleton variant="rect" height={160} />
        <Skeleton variant="rect" height={160} />
      </div>
    );
  }

  const student = data?.data;

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
          <GraduationCap size={28} className="text-yellow-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-200">No Profile Found</h2>
        <p className="mt-1 text-sm text-gray-500">Please complete your registration first.</p>
        <Link href="/student/register" className="mt-4">
          <Button>Register Now</Button>
        </Link>
      </div>
    );
  }

  const isActive = student.status === "active";
  const isWaiting = student.status === "pending";

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="mx-auto max-w-2xl space-y-5">
      {/* Welcome card */}
      <motion.div variants={fadeUp}>
        <Card padding="lg" className="relative overflow-hidden">
          <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-green-500/5 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-500/10 text-green-400 font-bold text-lg">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-100">
                  Welcome, {student.name.split(" ")[0]}
                </h1>
                <p className="text-xs text-gray-500">{student.institute} · {student.city}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={isActive ? "success" : isWaiting ? "warning" : "default"} size="sm" dot>
                {isActive ? "Route Active" : isWaiting ? "Waiting for Route" : student.status}
              </Badge>
              <span className="text-xs text-gray-600">
                <Clock size={11} className="inline mr-1" />
                {student.classStartTime} – {student.classEndTime}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Route status */}
      <motion.div variants={fadeUp}>
        {isActive && student.route ? (
          <RouteCard
            route={{
              name: student.route.name,
              institute: student.route.institutes?.[0],
              pickupTime: student.classStartTime,
              status: student.route.status,
            }}
          />
        ) : (
          <MatchingProgress studentId={student._id} />
        )}
      </motion.div>

      {/* Payment status */}
      <motion.div variants={fadeUp}>
        <PaymentStatusCard payment={student.paymentStatus} />
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={fadeUp}>
        <h2 className="text-sm font-semibold text-gray-400 mb-3 px-1">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: "/student/schedule", icon: CalendarOff, label: "Mark Day Off", color: "text-purple-400", bg: "bg-purple-500/10" },
            { href: "/student/route", icon: Map, label: "View Route", color: "text-blue-400", bg: "bg-blue-500/10" },
            { href: "/student/payments", icon: Upload, label: "Upload Receipt", color: "text-amber-400", bg: "bg-amber-500/10" },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-white/[0.12] hover:bg-white/[0.04] cursor-pointer"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.bg}`}>
                  <action.icon size={18} className={action.color} />
                </div>
                <span className="text-[11px] font-medium text-gray-400 text-center">{action.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Notifications link */}
      <motion.div variants={fadeUp}>
        <Link href="/student/notifications">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.01] px-4 py-3 transition-colors hover:border-white/[0.08] hover:bg-white/[0.02]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
              <Bell size={15} className="text-green-400" />
            </div>
            <span className="text-xs text-gray-500">View notifications</span>
            <span className="ml-auto text-gray-700">→</span>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
